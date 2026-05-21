import { supabase } from '@/lib/supabase';
import type { ProfileData } from '../types/profile.types';

export type AuthOpCode = 'TIMEOUT' | 'AUTH' | 'NETWORK' | 'UNKNOWN';
export type AuthOpMode = 'direct' | 'fallback';

export interface AuthOpResult {
  ok: boolean;
  mode?: AuthOpMode;
  code?: AuthOpCode;
  message?: string;
}

const withTimeout = async <T>(promise: Promise<T>, ms = 15000): Promise<T> => {
  return await Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Tiempo de espera agotado. Intenta nuevamente.')), ms)
    ),
  ]);
};

const mapErrorToCode = (error: unknown): AuthOpCode => {
  if (!(error instanceof Error)) return 'UNKNOWN';
  const msg = error.message.toLowerCase();
  if (msg.includes('tiempo de espera')) return 'TIMEOUT';
  if (msg.includes('network') || msg.includes('fetch')) return 'NETWORK';
  if (msg.includes('auth') || msg.includes('session') || msg.includes('token')) return 'AUTH';
  return 'UNKNOWN';
};

const requestPasswordReset = async (): Promise<AuthOpResult> => {
  try {
    const { data: userData, error: userError } = await withTimeout(supabase.auth.getUser(), 10000);
    const email = userData.user?.email;
    if (userError || !email) {
      return { ok: false, code: 'AUTH', message: 'No se pudo resolver el correo del usuario.' };
    }

    const { error } = await withTimeout(
      supabase.auth.resetPasswordForEmail(email, { redirectTo: 'riovoleymovil://login' }),
      10000
    );

    if (error) {
      return { ok: false, code: 'AUTH', message: error.message || 'No se pudo enviar correo de restablecimiento.' };
    }

    return {
      ok: false,
      mode: 'fallback',
      code: 'TIMEOUT',
      message: 'No se pudo cambiar directamente; te enviamos un correo para restablecer la contrasena.',
    };
  } catch (error) {
    return {
      ok: false,
      code: mapErrorToCode(error),
      message: error instanceof Error ? error.message : 'No se pudo enviar correo de restablecimiento.',
    };
  }
};

const runAuthOperation = async (params: {
  op: () => Promise<{ error: { message?: string } | null }>;
  timeoutMs?: number;
  fallback?: () => Promise<AuthOpResult>;
}): Promise<AuthOpResult> => {
  try {
    const result = await withTimeout(params.op(), params.timeoutMs ?? 15000);

    if (!result.error) {
      return { ok: true, mode: 'direct' };
    }

    if (params.fallback) {
      const fallbackResult = await params.fallback();
      if (fallbackResult.mode === 'fallback' || fallbackResult.ok) return fallbackResult;
    }

    return {
      ok: false,
      code: 'AUTH',
      message: result.error.message || 'No se pudo completar la operacion de autenticacion.',
    };
  } catch (error) {
    if (params.fallback) {
      const fallbackResult = await params.fallback();
      if (fallbackResult.mode === 'fallback' || fallbackResult.ok) return fallbackResult;
    }

    return {
      ok: false,
      code: mapErrorToCode(error),
      message: error instanceof Error ? error.message : 'Error desconocido en autenticacion.',
    };
  }
};

export const profileService = {
  async fetchCurrentProfile(): Promise<ProfileData | null> {
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      return null;
    }

    const userId = userData.user.id;

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, full_name, role, created_at')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return {
        id: userId,
        fullName: null,
        email: userData.user.email ?? null,
        role: null,
        lastPasswordChangeAt: userData.user.updated_at ?? null,
      };
    }

    return {
      id: profile.id,
      fullName: profile.full_name,
      email: userData.user.email ?? null,
      role: profile.role,
      createdAt: profile.created_at,
      lastPasswordChangeAt: userData.user.updated_at ?? null,
    };
  },

  async changePassword(input: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<AuthOpResult> {
    try {
      const currentPassword = input.currentPassword.trim();
      const newPassword = input.newPassword.trim();
      const confirmPassword = input.confirmPassword.trim();

      if (!currentPassword || !newPassword || !confirmPassword) {
        return { ok: false, code: 'AUTH', message: 'Por favor completa todos los campos.' };
      }

      if (newPassword.length < 6) {
        return { ok: false, code: 'AUTH', message: 'La nueva contrasena debe tener al menos 6 caracteres.' };
      }

      if (newPassword !== confirmPassword) {
        return { ok: false, code: 'AUTH', message: 'Las contrasenas no coinciden.' };
      }

      if (currentPassword === newPassword) {
        return { ok: false, code: 'AUTH', message: 'La nueva contrasena debe ser diferente a la actual.' };
      }

      const { data: sessionData } = await withTimeout(supabase.auth.getSession(), 10000);
      if (!sessionData.session) {
        return { ok: false, code: 'AUTH', message: 'Sesion expirada. Inicia sesion nuevamente.' };
      }

      // En React Native Web, updateUser(password) puede quedarse pending por persistencia de sesión.
      // Escuchamos USER_UPDATED y no dependemos de que la promesa resuelva.
      return await new Promise<AuthOpResult>((resolve) => {
        let settled = false;
        let unsub = () => {};

        const finish = (result: AuthOpResult) => {
          if (settled) return;
          settled = true;
          clearTimeout(timeoutId);
          unsub();
          resolve(result);
        };

        const timeoutId = setTimeout(() => {
          supabase.auth.signOut().catch(() => {});
          finish({
            ok: false,
            code: 'TIMEOUT',
            mode: 'fallback',
            message:
              'La contrasena fue procesada y se cerrara la sesion automaticamente. Inicia sesion con tu nueva contrasena.',
          });
        }, 20000);

        const { data: listener } = supabase.auth.onAuthStateChange((event) => {
          if (event === 'USER_UPDATED') {
            supabase.auth.signOut().catch(() => {});
            finish({ ok: true, mode: 'direct' });
          }
        });
        unsub = () => listener.subscription.unsubscribe();

        // Disparamos updateUser sin esperar que resuelva para evitar bloqueo en web.
        supabase.auth.updateUser({ password: newPassword }).catch(async (error) => {
          if (settled) return;

          const fallbackResult = await requestPasswordReset();
          if (fallbackResult.mode === 'fallback') {
            finish(fallbackResult);
            return;
          }

          finish({
            ok: false,
            code: 'AUTH',
            message: error?.message || fallbackResult.message || 'No se pudo actualizar la contrasena.',
          });
        });
      });
    } catch (error) {
      return {
        ok: false,
        code: mapErrorToCode(error),
        message: error instanceof Error ? error.message : 'No se pudo cambiar la contrasena.',
      };
    }
  },

  async signOut(): Promise<AuthOpResult> {
    return await runAuthOperation({
      op: () => supabase.auth.signOut(),
      timeoutMs: 10000,
    });
  },
};


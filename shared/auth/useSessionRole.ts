import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { USER_ROLES } from '@/shared/constants/app.constants';

export type AppRole = 'administrador' | 'entrenador' | 'estudiante' | 'usuario' | null;

const withTimeout = async <T>(promise: Promise<T>, ms = 10000): Promise<T> => {
  return await Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Timeout resolving session role')), ms)
    ),
  ]);
};

export function normalizeRole(role?: string | null): AppRole {
  const normalized = (role || '').trim().toLowerCase();
  if (!normalized) return null;
  if (normalized === USER_ROLES.ADMIN) return 'administrador';
  if (normalized === USER_ROLES.COACH) return 'entrenador';
  if (normalized === 'estudiante' || normalized === USER_ROLES.ATHLETE) return 'estudiante';
  return 'usuario';
}

export function useSessionRole() {
  const [loading, setLoading] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRole] = useState<AppRole>(null);

  useEffect(() => {
    let mounted = true;
    let safetyTimer: ReturnType<typeof setTimeout> | null = setTimeout(() => {
      if (!mounted) return;
      // Failsafe: nunca quedar en loading infinito.
      setLoading(false);
    }, 12000);

    const resolveRole = async (nextUserId?: string) => {
      if (!nextUserId) {
        if (!mounted) return;
        setRole(null);
        return;
      }

      let data: { role?: string | null } | null = null;
      let error: unknown = null;
      try {
        const result = await withTimeout(
          supabase
            .from('user_profiles')
            .select('role')
            .eq('id', nextUserId)
            .single(),
          10000
        );
        data = result.data;
        error = result.error;
      } catch {
        error = new Error('resolveRole timeout');
      }

      if (!mounted) return;
      if (error) {
        setRole('usuario');
      } else {
        setRole(normalizeRole(data?.role));
      }
    };

    const load = async () => {
      try {
        const { data } = await withTimeout(supabase.auth.getSession(), 10000);
        if (!mounted) return;

        const nextUserId = data.session?.user?.id ?? null;
        setUserId(nextUserId);
        setHasSession(!!data.session);
        await resolveRole(nextUserId || undefined);
      } catch {
        if (!mounted) return;
        setUserId(null);
        setHasSession(false);
        setRole(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const nextUserId = session?.user?.id ?? null;
      setUserId(nextUserId);
      setHasSession(!!session);
      await resolveRole(nextUserId || undefined);
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
      if (safetyTimer) {
        clearTimeout(safetyTimer);
        safetyTimer = null;
      }
      authListener.subscription.unsubscribe();
    };
  }, []);

  return { loading, hasSession, userId, role };
}

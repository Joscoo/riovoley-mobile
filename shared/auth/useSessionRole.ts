import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { USER_ROLES } from '@/shared/constants/app.constants';

export type AppRole = 'administrador' | 'entrenador' | 'estudiante' | 'usuario' | null;

let cachedRole: AppRole = null;
let cachedUserId: string | null = null;

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
  const [userId, setUserId] = useState<string | null>(cachedUserId);
  const [role, setRole] = useState<AppRole>(cachedRole);
  const roleRef = useRef<AppRole>(cachedRole);

  useEffect(() => {
    roleRef.current = role;
  }, [role]);

  useEffect(() => {
    let mounted = true;
    let safetyTimer: ReturnType<typeof setTimeout> | null = setTimeout(() => {
      if (!mounted) return;
      setLoading(false);
    }, 15000);

    const setResolvedRole = (nextRole: AppRole) => {
      cachedRole = nextRole;
      setRole(nextRole);
    };

    const resolveRole = async (nextUserId?: string) => {
      if (!nextUserId) {
        if (!mounted) return;
        cachedUserId = null;
        setResolvedRole(null);
        return;
      }

      // 1) canonical mobile source
      try {
        const profileResult = await withTimeout(
          supabase
            .from('user_profiles')
            .select('role')
            .eq('id', nextUserId)
            .maybeSingle(),
          10000
        );

        if (profileResult.data?.role) {
          if (!mounted) return;
          setResolvedRole(normalizeRole(profileResult.data.role));
          return;
        }
      } catch {
        // Continue to fallback source
      }

      // 2) fallback source compatible with schema migrations
      try {
        const usersResult = await withTimeout(
          supabase
            .from('users')
            .select('role')
            .eq('id', nextUserId)
            .maybeSingle(),
          10000
        );

        if (usersResult.data?.role) {
          if (!mounted) return;
          setResolvedRole(normalizeRole(usersResult.data.role));
          return;
        }
      } catch {
        // Ignore and keep previous role
      }

      if (!mounted) return;

      // Never downgrade to "usuario" on transient failures.
      if (roleRef.current) {
        setRole(roleRef.current);
        return;
      }

      // Final safe default only if we truly have nothing cached.
      setResolvedRole('usuario');
    };

    const load = async () => {
      try {
        const { data } = await withTimeout(supabase.auth.getSession(), 10000);
        if (!mounted) return;

        const nextUserId = data.session?.user?.id ?? null;
        cachedUserId = nextUserId;
        setUserId(nextUserId);
        setHasSession(!!data.session);
        await resolveRole(nextUserId || undefined);
      } catch {
        if (!mounted) return;
        cachedUserId = null;
        setUserId(null);
        setHasSession(false);
        setResolvedRole(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void load();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const nextUserId = session?.user?.id ?? null;
      cachedUserId = nextUserId;
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

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { USER_ROLES } from '@/shared/constants/app.constants';

export type AppRole = 'administrador' | 'entrenador' | 'estudiante' | 'usuario' | null;

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

    const resolveRole = async (nextUserId?: string) => {
      if (!nextUserId) {
        if (!mounted) return;
        setRole(null);
        return;
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', nextUserId)
        .single();

      if (!mounted) return;
      if (error) {
        setRole('usuario');
      } else {
        setRole(normalizeRole(data?.role));
      }
    };

    const load = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;

      const nextUserId = data.session?.user?.id ?? null;
      setUserId(nextUserId);
      setHasSession(!!data.session);
      await resolveRole(nextUserId || undefined);
      if (mounted) setLoading(false);
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
      authListener.subscription.unsubscribe();
    };
  }, []);

  return { loading, hasSession, userId, role };
}

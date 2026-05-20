import { EmptyState, LoadingState } from '@/shared/components';
import type { AppRole } from '@/shared/auth/useSessionRole';

interface RoleGuardProps {
  loading: boolean;
  role: AppRole;
  allow: AppRole[];
  deniedMessage?: string;
  children: React.ReactNode;
}

export function RoleGuard({ loading, role, allow, deniedMessage, children }: RoleGuardProps) {
  if (loading) {
    return <LoadingState message="Validando permisos..." />;
  }

  if (!role || !allow.includes(role)) {
    return <EmptyState title="Acceso denegado" message={deniedMessage || 'No tienes permisos para acceder a este módulo.'} />;
  }

  return <>{children}</>;
}

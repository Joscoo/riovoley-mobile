import { EmptyState, LoadingState } from '@/shared/components';
import { useSessionRole } from '@/shared/auth/useSessionRole';
import { AdminHomeScreen, CoachHomeScreen, StudentHomeScreen } from '@/features/home';

export default function RoleHomeRoute() {
  const { loading, role } = useSessionRole();

  if (loading) {
    return <LoadingState message="Cargando panel..." />;
  }

  if (role === 'administrador') {
    return <AdminHomeScreen />;
  }

  if (role === 'entrenador') {
    return <CoachHomeScreen />;
  }

  if (role === 'estudiante' || role === 'usuario') {
    return <StudentHomeScreen />;
  }

  return <EmptyState title="Rol no definido" message="No se pudo resolver el rol del usuario." />;
}

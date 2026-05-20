import type { AppRole } from '@/shared/auth/useSessionRole';
import { canAccessAthletesPanel } from '@/shared/permissions/rolePermissions';

export interface RoleTabConfig {
  name: 'index' | 'announcements' | 'profile' | 'athletes';
  title: string;
  icon: 'home' | 'megaphone' | 'person' | 'people';
}

const BASE_TABS: RoleTabConfig[] = [
  { name: 'index', title: 'Inicio', icon: 'home' },
  { name: 'announcements', title: 'Anuncios', icon: 'megaphone' },
  { name: 'profile', title: 'Perfil', icon: 'person' },
];

export function buildTabsForRole(role: AppRole): RoleTabConfig[] {
  if (canAccessAthletesPanel(role)) {
    return [...BASE_TABS, { name: 'athletes', title: 'Atletas', icon: 'people' }];
  }

  return BASE_TABS;
}

export function canAccessAthletes(role: AppRole): boolean {
  return canAccessAthletesPanel(role);
}

export function isRoleResolved(role: AppRole): boolean {
  return role !== null;
}

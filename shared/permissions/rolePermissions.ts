/**
 * Role-based permissions for RioVoley Mobile App
 */

import type { UserRole } from '../types/common.types';
import { USER_ROLES } from '../constants/app.constants';
import type { AppRole } from '@/shared/auth/useSessionRole';

const normalizeToCoreRole = (role: string | null | undefined): 'administrador' | 'entrenador' | 'usuario' | null => {
  const normalized = (role || '').trim().toLowerCase();
  if (!normalized) return null;
  if (normalized === 'administrador') return 'administrador';
  if (normalized === 'entrenador') return 'entrenador';
  if (normalized === 'estudiante' || normalized === 'usuario') return 'usuario';
  return 'usuario';
};

export const canManageAthletes = (role: UserRole | string): boolean => {
  const r = normalizeToCoreRole(role);
  return r === USER_ROLES.ADMIN || r === USER_ROLES.COACH;
};

export const canManagePayments = (role: UserRole | string): boolean => {
  const r = normalizeToCoreRole(role);
  return r === USER_ROLES.ADMIN;
};

export const canRegisterAttendance = (role: UserRole | string): boolean => {
  const r = normalizeToCoreRole(role);
  return r === USER_ROLES.ADMIN || r === USER_ROLES.COACH;
};

export const canViewPayments = (role: UserRole | string): boolean => {
  const r = normalizeToCoreRole(role);
  return r === USER_ROLES.ADMIN || r === USER_ROLES.ATHLETE;
};

export const canEditProfile = (role: UserRole | string, isOwnProfile: boolean): boolean => {
  const r = normalizeToCoreRole(role);
  return r === USER_ROLES.ADMIN || isOwnProfile;
};

export const canCreateAnnouncements = (role: UserRole | string): boolean => {
  const r = normalizeToCoreRole(role);
  return r === USER_ROLES.ADMIN || r === USER_ROLES.COACH;
};

export const canAccessAthletesPanel = (role: AppRole): boolean => {
  if (!role) return false;
  return canManageAthletes(role);
};

export const getRoleLabel = (role: UserRole | string): string => {
  const r = normalizeToCoreRole(role);
  const labels = {
    [USER_ROLES.ADMIN]: 'Administrador',
    [USER_ROLES.COACH]: 'Entrenador',
    [USER_ROLES.ATHLETE]: 'Estudiante',
  };
  return (r && labels[r]) || 'Usuario';
};

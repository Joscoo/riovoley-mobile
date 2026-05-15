/**
 * Role-based permissions for RioVoley Mobile App
 */

import { UserRole } from '../types/user.types';
import { USER_ROLES } from '../constants/app.constants';

export const canManageAthletes = (role: UserRole): boolean => {
  return role === USER_ROLES.ADMIN || role === USER_ROLES.COACH;
};

export const canManagePayments = (role: UserRole): boolean => {
  return role === USER_ROLES.ADMIN;
};

export const canRegisterAttendance = (role: UserRole): boolean => {
  return role === USER_ROLES.ADMIN || role === USER_ROLES.COACH;
};

export const canViewPayments = (role: UserRole): boolean => {
  return role === USER_ROLES.ADMIN || role === USER_ROLES.ATHLETE;
};

export const canEditProfile = (role: UserRole, isOwnProfile: boolean): boolean => {
  return role === USER_ROLES.ADMIN || isOwnProfile;
};

export const canCreateAnnouncements = (role: UserRole): boolean => {
  return role === USER_ROLES.ADMIN || role === USER_ROLES.COACH;
};

export const getRoleLabel = (role: UserRole): string => {
  const labels = {
    [USER_ROLES.ADMIN]: 'Administrador',
    [USER_ROLES.COACH]: 'Entrenador',
    [USER_ROLES.ATHLETE]: 'Atleta',
  };
  return labels[role] || 'Usuario';
};

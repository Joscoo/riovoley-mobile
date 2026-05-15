/**
 * Global constants for RioVoley Mobile App
 */

export const USER_ROLES = {
  ADMIN: 'administrador',
  COACH: 'entrenador',
  ATHLETE: 'usuario',
} as const;

export const TABLES = {
  USERS: 'users',
  STUDENTS: 'students',
  ATHLETES: 'athletes',
  ANNOUNCEMENTS: 'announcements',
  PAYMENTS: 'payments',
  SCHEDULES: 'schedules',
  ATTENDANCES: 'attendances',
  USER_PROFILES: 'user_profiles',
} as const;

export const APP_CONFIG = {
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_SECONDS: 30,
  SESSION_TIMEOUT_MS: 30 * 60 * 1000, // 30 minutes
  REFRESH_INTERVAL_MS: 60000, // 1 minute
};

export const STORAGE_KEYS = {
  AUTH_TOKEN: '@riovoley_auth_token',
  USER_ID: '@riovoley_user_id',
  USER_ROLE: '@riovoley_user_role',
  LAST_SYNC: '@riovoley_last_sync',
};

export const ROUTES = {
  LOGIN: '/login',
  HOME: '/(tabs)',
  HOME_TAB: '/(tabs)/(home)',
  ATHLETES: '/(tabs)/athletes',
  EXPLORE: '/(tabs)/explore',
  MODAL: '/modal',
};

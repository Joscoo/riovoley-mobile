/**
 * Global type definitions for RioVoley Mobile App
 */

export type UserRole = 'administrador' | 'entrenador' | 'usuario';

export interface BaseEntity {
  id: string;
  created_at?: string;
  updated_at?: string;
}

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

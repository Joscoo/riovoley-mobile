/**
 * User-related types for RioVoley Mobile App
 */

import { BaseEntity, UserRole } from './common.types';

export interface UserProfile extends BaseEntity {
  user_id: string;
  full_name: string;
  role: UserRole;
  email?: string;
  phone?: string;
  avatar_url?: string;
  bio?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  user_metadata?: Record<string, any>;
  aud?: string;
  confirmation_sent_at?: string;
  confirmed_at?: string;
  created_at?: string;
  updated_at?: string;
}

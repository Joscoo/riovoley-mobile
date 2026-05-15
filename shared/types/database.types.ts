/**
 * Database table related types for RioVoley Mobile App
 */

import { BaseEntity } from './common.types';

export interface Announcement extends BaseEntity {
  title: string;
  content: string;
  is_active: boolean;
}

export interface Training extends BaseEntity {
  category: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  location: string;
  coach_id?: string;
}

export interface UserAttendance extends BaseEntity {
  user_id: string;
  training_id: string;
  attended: boolean;
  date: string;
}

export interface Payment extends BaseEntity {
  user_id: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  due_date: string;
  paid_date?: string;
  description?: string;
}

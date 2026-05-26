/**
 * Home feature types
 */

import { BaseEntity } from '@/shared/types/common.types';

export interface HomeUser {
  email: string | null;
  profileName: string | null;
  profileRole: string | null;
}

export interface HomeAnnouncement {
  id: string;
  title: string;
  content?: string;
  created_at?: string;
}

export interface HomeTraining {
  id: string;
  category: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  location: string;
}

export interface HomeAttendance {
  attended: boolean;
  percentage: number;
}

export interface HomePayment {
  pending: boolean;
  amount?: number;
  dueDate?: string;
}

export interface HomeUserPayment {
  id: string;
  amount: number;
  statusLabel: 'Activo' | 'Próximo a vencer' | 'Vencido';
  daysRemaining: number;
  paymentDate?: string;
  periodStart?: string;
  periodEnd?: string;
}

export interface HomeAlerts {
  paymentPending: boolean;
  attendancePending: boolean;
  newAnnouncements: number;
}

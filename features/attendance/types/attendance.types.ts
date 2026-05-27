export interface AttendanceStudentItem {
  id: string;
  user_id: string;
  categoria: string | null;
  full_name: string;
  email: string | null;
  attendance_id: string | null;
  present: boolean;
  payment_method: AttendancePaymentMethod;
}

export interface StudentAttendanceBreakdown {
  percentage: number;
  totalPresent: number;
  totalSessions: number;
  attendedDates: string[];
  missedDates: string[];
}

export interface AttendanceTrainingDateOption {
  key: 'yesterday' | 'today' | 'tomorrow';
  label: string;
  date: string;
  timeRange: string;
  trainingLabel: string;
}

export type AttendancePaymentMethod = 'mensual' | 'sesion_individual' | 'tarjeta_entrenamiento';

export interface AttendanceHistoryDay {
  date: string;
  count: number;
}

export interface AttendanceCategoryStat {
  category: string;
  present: number;
  total: number;
  percentage: number;
}

export interface AttendanceReportPayload {
  date: string;
  totalPresent: number;
  totalStudents: number;
  categoryStats: AttendanceCategoryStat[];
  rows: Array<{
    fullName: string;
    category: string;
    paymentMethod: AttendancePaymentMethod;
    present: boolean;
  }>;
}

export interface PersistedAttendanceReport {
  id: string;
  report_date: string;
  status: 'ready' | 'processing' | 'error';
  file_name: string;
  payload: AttendanceReportPayload;
  created_at?: string;
}

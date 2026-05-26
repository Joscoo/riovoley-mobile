export interface AttendanceStudentItem {
  id: string;
  user_id: string;
  categoria: string | null;
  full_name: string;
  email: string | null;
  attendance_id: string | null;
  present: boolean;
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

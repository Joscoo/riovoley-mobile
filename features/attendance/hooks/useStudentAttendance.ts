import { useEffect, useState } from 'react';
import { attendanceService } from '../services/attendanceService';
import type { StudentAttendanceBreakdown } from '../types/attendance.types';

export function useStudentAttendance(userId: string | null) {
  const [data, setData] = useState<StudentAttendanceBreakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const run = async () => {
      setLoading(true);
      try {
        const response = await attendanceService.fetchStudentBreakdown(userId);
        setData(response);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'No se pudo cargar tu desglose.');
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [userId]);

  return { data, loading, error };
}

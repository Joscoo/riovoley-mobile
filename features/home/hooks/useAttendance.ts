/**
 * Hook to fetch attendance status
 */

import { useEffect, useState } from 'react';
import { homeService } from '../services/homeService';
import type { HomeAttendance } from '../types/home.types';

export function useAttendance(userId: string | undefined) {
  const [attendance, setAttendance] = useState<HomeAttendance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchAttendance = async () => {
      setLoading(true);
      try {
        const data = await homeService.fetchAttendanceStatus(userId);
        setAttendance(data);
        setError(null);
      } catch {
        setError('No se pudo cargar la asistencia.');
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [userId]);

  return { attendance, loading, error };
}

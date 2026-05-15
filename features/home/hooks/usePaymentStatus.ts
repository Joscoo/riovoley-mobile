/**
 * Hook to fetch attendance status
 */

import { useEffect, useState } from 'react';
import { homeService } from '../services/homeService';
import { HomeAttendance } from '../types/home.types';

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
      } catch (err) {
        setError('Failed to load attendance');
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [userId]);

  return { attendance, loading, error };
}

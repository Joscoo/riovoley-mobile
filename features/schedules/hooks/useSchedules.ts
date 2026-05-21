import { useCallback, useEffect, useState } from 'react';
import { schedulesService } from '../services/schedulesService';
import type { ScheduleItem } from '../types/schedule.types';

export function useSchedules() {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const data = await schedulesService.fetchSchedules();
      setSchedules(data);
      setError(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudieron cargar los horarios.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  return { schedules, loading, error, reload: loadSchedules };
}

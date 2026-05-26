import { useEffect, useState } from 'react';
import { homeService } from '../services/homeService';
import type { HomeUserPayment } from '../types/home.types';

export function useUserPayments(userId: string | undefined, limit = 5) {
  const [payments, setPayments] = useState<HomeUserPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const run = async () => {
      if (!userId) {
        setPayments([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const data = await homeService.fetchUserPayments(userId, limit);
        if (!active) return;
        setPayments(data);
        setError(null);
      } catch {
        if (!active) return;
        setError('No se pudieron cargar tus pagos.');
      } finally {
        if (active) setLoading(false);
      }
    };

    void run();

    return () => {
      active = false;
    };
  }, [userId, limit]);

  return { payments, loading, error };
}

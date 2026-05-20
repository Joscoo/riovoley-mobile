import { useEffect, useState } from 'react';
import { homeService } from '../services/homeService';
import type { HomePayment } from '../types/home.types';

export function usePaymentStatus(userId: string | undefined) {
  const [paymentStatus, setPaymentStatus] = useState<HomePayment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchPaymentStatus = async () => {
      setLoading(true);

      try {
        const data = await homeService.fetchPaymentStatus(userId);
        setPaymentStatus(data);
        setError(null);
      } catch {
        setError('No se pudo cargar el estado de pago.');
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentStatus();
  }, [userId]);

  return { paymentStatus, loading, error };
}

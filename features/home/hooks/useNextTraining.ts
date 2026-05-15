/**
 * Hook to fetch next training
 */

import { useEffect, useState } from 'react';
import { homeService } from '../services/homeService';
import { HomeTraining } from '../types/home.types';

export function useNextTraining(userId: string | undefined) {
  const [training, setTraining] = useState<HomeTraining | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchTraining = async () => {
      setLoading(true);
      try {
        const data = await homeService.fetchNextTraining(userId);
        setTraining(data);
        setError(null);
      } catch (err) {
        setError('Failed to load next training');
      } finally {
        setLoading(false);
      }
    };

    fetchTraining();
  }, [userId]);

  return { training, loading, error };
}

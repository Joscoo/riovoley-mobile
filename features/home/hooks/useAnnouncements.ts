/**
 * Hook to fetch announcements
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { HomeAnnouncement } from '../types/home.types';

export function useAnnouncements(limit = 5) {
  const [announcements, setAnnouncements] = useState<HomeAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('announcements')
          .select('id, title, content, created_at')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (error) {
          setError(error.message);
          setAnnouncements([]);
        } else {
          setAnnouncements(data ?? []);
          setError(null);
        }
      } catch (err) {
        setError('Failed to load announcements');
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, [limit]);

  return { announcements, loading, error };
}

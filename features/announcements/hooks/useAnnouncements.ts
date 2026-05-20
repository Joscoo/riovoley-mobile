import { useEffect, useState } from 'react';
import { announcementsService } from '../services/announcementsService';
import type { AnnouncementItem } from '../types/announcement.types';

export function useAnnouncements(limit?: number) {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAnnouncements = async () => {
      setLoading(true);
      try {
        const data = await announcementsService.fetchActiveAnnouncements(limit);
        setAnnouncements(data);
        setError(null);
      } catch {
        setError('No se pudieron cargar los anuncios.');
        setAnnouncements([]);
      } finally {
        setLoading(false);
      }
    };

    loadAnnouncements();
  }, [limit]);

  return { announcements, loading, error };
}

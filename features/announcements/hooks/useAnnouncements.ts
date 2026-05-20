import { useEffect, useState } from 'react';
import { announcementsService } from '../services/announcementsService';
import type { AnnouncementItem } from '../types/announcement.types';
import type { AppRole } from '@/shared/auth/useSessionRole';

export function useAnnouncements(role: AppRole, limit?: number) {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!role) {
      setAnnouncements([]);
      setLoading(false);
      return;
    }

    const loadAnnouncements = async () => {
      setLoading(true);
      try {
        const data = await announcementsService.fetchActiveAnnouncements(role, limit);
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
  }, [role, limit]);

  return { announcements, loading, error };
}

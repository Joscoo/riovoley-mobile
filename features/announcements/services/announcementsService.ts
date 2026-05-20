import { supabase } from '@/lib/supabase';
import type { AnnouncementItem } from '../types/announcement.types';

export const announcementsService = {
  async fetchActiveAnnouncements(limit?: number): Promise<AnnouncementItem[]> {
    let query = supabase
      .from('announcements')
      .select('id, title, content, created_at, is_active')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((item) => ({
      id: item.id,
      title: item.title,
      content: item.content,
      createdAt: item.created_at,
      isActive: item.is_active,
    }));
  },
};

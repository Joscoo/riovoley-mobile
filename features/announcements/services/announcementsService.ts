import { supabase } from '@/lib/supabase';
import type { AppRole } from '@/shared/auth/useSessionRole';
import type { AnnouncementItem } from '../types/announcement.types';

const roleToAudience = (role: AppRole): 'all' | 'administradores' | 'entrenadores' | 'estudiantes' => {
  if (role === 'administrador') return 'administradores';
  if (role === 'entrenador') return 'entrenadores';
  return 'estudiantes';
};

export const announcementsService = {
  async fetchActiveAnnouncements(role: AppRole, limit?: number): Promise<AnnouncementItem[]> {
    const audience = roleToAudience(role);
    const nowIso = new Date().toISOString();

    let query = supabase
      .from('announcements')
      .select('id, title, content, created_at, is_active, target_audience, priority, expires_at')
      .eq('is_active', true)
      .or(`target_audience.cs.{all},target_audience.cs.{${audience}}`)
      .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
      .order('priority', { ascending: false })
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
      targetAudience: item.target_audience ?? [],
      priority: item.priority,
      expiresAt: item.expires_at,
    }));
  },
};

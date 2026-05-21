import { supabase } from '@/lib/supabase';
import type { AppRole } from '@/shared/auth/useSessionRole';
import { sendPushToAudience } from '@/shared/notifications/pushNotifications';
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

    if (limit) query = query.limit(limit);

    const { data, error } = await query;
    if (error) throw new Error(error.message);

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

  async createAnnouncement(input: {
    title: string;
    content: string;
    priority: 'low' | 'normal' | 'high' | 'urgent';
    targetAudience: string[];
    createdBy: string;
    expiresAt?: string | null;
    isActive?: boolean;
  }) {
    const { data, error } = await supabase
      .from('announcements')
      .insert({
        title: input.title,
        content: input.content,
        priority: input.priority,
        target_audience: input.targetAudience,
        is_active: input.isActive ?? true,
        expires_at: input.expiresAt || null,
        created_by: input.createdBy,
      })
      .select('id')
      .single();

    if (error) throw new Error(error.message);

    try {
      await sendPushToAudience({
        title: `Nuevo anuncio: ${input.title}`,
        body: input.content.slice(0, 120),
        audience: input.targetAudience,
        data: { type: 'announcement', announcementId: data.id, priority: input.priority },
      });
    } catch (pushError) {
      // El anuncio ya fue creado; la notificacion push no debe bloquear el flujo principal.
      console.warn('No se pudo enviar push del anuncio:', pushError);
    }

    return data;
  },
};

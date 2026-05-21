import { supabase } from '@/lib/supabase';
import type { ScheduleItem, ScheduleMutationInput } from '../types/schedule.types';

export const schedulesService = {
  async fetchSchedules(): Promise<ScheduleItem[]> {
    let data: any[] | null = null;
    let errorMessage = '';

    const publicResult = await supabase.from('schedules').select('*');
    if (!publicResult.error && publicResult.data) {
      data = publicResult.data;
    } else {
      errorMessage = publicResult.error?.message || '';
      const trainingResult = await supabase.schema('training').from('schedules').select('*');
      if (!trainingResult.error && trainingResult.data) {
        data = trainingResult.data;
      } else {
        throw new Error(trainingResult.error?.message || errorMessage || 'No se pudieron cargar horarios.');
      }
    }

    const normalized = (data ?? []).map((row) => ({
      id: row.id,
      day_of_week: row.dia_semana ?? row.day_of_week,
      category: row.categoria ?? row.category,
      start_time: row.hora_inicio ?? row.start_time,
      end_time: row.hora_fin ?? row.end_time,
      location: row.location,
      description: row.descripcion,
    }));

    return normalized.sort((a, b) => {
      const dayA = String(a.day_of_week || '');
      const dayB = String(b.day_of_week || '');
      if (dayA !== dayB) return dayA.localeCompare(dayB);
      return String(a.start_time || '').localeCompare(String(b.start_time || ''));
    });
  },

  async updateSchedule(scheduleId: string, payload: Partial<ScheduleMutationInput>) {
    const dbPayload = {
      ...payload,
      descripcion: payload.description,
    };
    delete (dbPayload as any).description;

    const { error } = await supabase.from('schedules').update(dbPayload).eq('id', scheduleId);
    if (error) throw new Error(error.message);
  },
};

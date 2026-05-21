import { supabase } from '@/lib/supabase';
import type { ScheduleItem, ScheduleMutationInput } from '../types/schedule.types';

type SchemaMode = 'public' | 'training';
type KeyMode = 'spanish' | 'english';

const normalizeRow = (row: any): ScheduleItem => ({
  id: row.id,
  day_of_week: row.dia_semana ?? row.day_of_week,
  category: row.categoria ?? row.category,
  start_time: row.hora_inicio ?? row.start_time,
  end_time: row.hora_fin ?? row.end_time,
  location: row.location,
  description: row.descripcion ?? row.description,
});

const toDbPayload = (payload: Partial<ScheduleMutationInput>, keyMode: KeyMode) => {
  if (keyMode === 'spanish') {
    return {
      dia_semana: payload.day_of_week,
      categoria: payload.category,
      hora_inicio: payload.start_time,
      hora_fin: payload.end_time,
      descripcion: payload.description,
      location: payload.location,
    };
  }

  return {
    day_of_week: payload.day_of_week,
    category: payload.category,
    start_time: payload.start_time,
    end_time: payload.end_time,
    description: payload.description,
    location: payload.location,
  };
};

const compact = (obj: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== undefined));

const sortSchedules = (data: ScheduleItem[]) => {
  const dayOrder: Record<string, number> = {
    lunes: 1,
    monday: 1,
    martes: 2,
    tuesday: 2,
    miercoles: 3,
    miércoles: 3,
    wednesday: 3,
    jueves: 4,
    thursday: 4,
    viernes: 5,
    friday: 5,
    sabado: 6,
    sábado: 6,
    saturday: 6,
    domingo: 7,
    sunday: 7,
  };

  return data.sort((a, b) => {
    const aCat = String(a.category || '').toLowerCase();
    const bCat = String(b.category || '').toLowerCase();
    if (aCat === 'open_gym' && bCat !== 'open_gym') return -1;
    if (aCat !== 'open_gym' && bCat === 'open_gym') return 1;

    const dayA = dayOrder[String(a.day_of_week || '').toLowerCase()] ?? 99;
    const dayB = dayOrder[String(b.day_of_week || '').toLowerCase()] ?? 99;
    if (dayA !== dayB) return dayA - dayB;

    return String(a.start_time || '').localeCompare(String(b.start_time || ''));
  });
};

async function updateInMode(mode: SchemaMode, scheduleId: string, payload: Partial<ScheduleMutationInput>, keyMode: KeyMode) {
  const dbPayload = compact(toDbPayload(payload, keyMode));
  const query = mode === 'training'
    ? supabase.schema('training').from('schedules')
    : supabase.from('schedules');

  const { error } = await query.update(dbPayload).eq('id', scheduleId);
  if (error) throw new Error(error.message);
}

async function insertInMode(mode: SchemaMode, payload: ScheduleMutationInput, keyMode: KeyMode) {
  const dbPayload = compact(toDbPayload(payload, keyMode));
  const query = mode === 'training'
    ? supabase.schema('training').from('schedules')
    : supabase.from('schedules');

  const { error } = await query.insert(dbPayload);
  if (error) throw new Error(error.message);
}

async function deleteInMode(mode: SchemaMode, scheduleId: string) {
  const query = mode === 'training'
    ? supabase.schema('training').from('schedules')
    : supabase.from('schedules');

  const { error } = await query.delete().eq('id', scheduleId);
  if (error) throw new Error(error.message);
}

const shouldTryFallback = (error: unknown) => {
  const msg = error instanceof Error ? error.message.toLowerCase() : '';
  return (
    msg.includes('column') ||
    msg.includes('schema') ||
    msg.includes('not acceptable') ||
    msg.includes('406')
  );
};

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

    const normalized = (data ?? []).map(normalizeRow);
    return sortSchedules(normalized);
  },

  async createSchedule(payload: ScheduleMutationInput) {
    try {
      await insertInMode('public', payload, 'spanish');
    } catch (error) {
      if (!shouldTryFallback(error)) throw error;
      try {
        await insertInMode('public', payload, 'english');
      } catch (errorSecond) {
        if (!shouldTryFallback(errorSecond)) throw errorSecond;
        await insertInMode('training', payload, 'spanish');
      }
    }
  },

  async updateSchedule(scheduleId: string, payload: Partial<ScheduleMutationInput>) {
    try {
      await updateInMode('public', scheduleId, payload, 'spanish');
    } catch (error) {
      if (!shouldTryFallback(error)) throw error;
      try {
        await updateInMode('public', scheduleId, payload, 'english');
      } catch (errorSecond) {
        if (!shouldTryFallback(errorSecond)) throw errorSecond;
        await updateInMode('training', scheduleId, payload, 'spanish');
      }
    }
  },

  async deleteSchedule(scheduleId: string) {
    try {
      await deleteInMode('public', scheduleId);
    } catch (error) {
      if (!shouldTryFallback(error)) throw error;
      await deleteInMode('training', scheduleId);
    }
  },
};

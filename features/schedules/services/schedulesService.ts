import { supabase } from '@/lib/supabase';
import type { ScheduleCategory, ScheduleItem, ScheduleMutationInput } from '../types/schedule.types';

type SchemaMode = 'public' | 'training';
type KeyMode = 'spanish' | 'english';
type CategoriesTableMode =
  | 'training_categories_public'
  | 'training_categories_training'
  | 'schedule_categories_public'
  | 'schedule_categories_training'
  | 'categories_public'
  | 'none';

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

const normalizeCategoryCode = (value?: string | null) => String(value || '').trim().toLowerCase();
let categoriesTableModeCache: CategoriesTableMode | null = null;

function normalizeCategoryRow(row: any): ScheduleCategory {
  const code = normalizeCategoryCode(row.code ?? row.codigo ?? row.category_code);
  return {
    id: String(row.id ?? code),
    code,
    label: String(row.label ?? row.etiqueta ?? row.name ?? code),
    defaultDescription: row.default_description ?? row.descripcion_default ?? row.description ?? undefined,
    appliesToSchedules: Boolean(row.applies_to_schedules ?? row.for_schedules ?? row.aplica_horarios ?? true),
    appliesToAthletes: Boolean(row.applies_to_athletes ?? row.for_students ?? row.aplica_atletas ?? true),
    isActive: Boolean(row.is_active ?? row.activa ?? true),
    source: 'table',
  };
}

async function resolveCategoriesTableMode(): Promise<CategoriesTableMode> {
  if (categoriesTableModeCache) return categoriesTableModeCache;

  const publicTrainingCategories = await supabase.from('training_categories').select('code').limit(1);
  if (!publicTrainingCategories.error) {
    categoriesTableModeCache = 'training_categories_public';
    return categoriesTableModeCache;
  }

  const trainingSchemaTrainingCategories = await supabase.schema('training').from('training_categories').select('code').limit(1);
  if (!trainingSchemaTrainingCategories.error) {
    categoriesTableModeCache = 'training_categories_training';
    return categoriesTableModeCache;
  }

  const publicScheduleCategories = await supabase.from('schedule_categories').select('id').limit(1);
  if (!publicScheduleCategories.error) {
    categoriesTableModeCache = 'schedule_categories_public';
    return categoriesTableModeCache;
  }

  const trainingScheduleCategories = await supabase.schema('training').from('schedule_categories').select('id').limit(1);
  if (!trainingScheduleCategories.error) {
    categoriesTableModeCache = 'schedule_categories_training';
    return categoriesTableModeCache;
  }

  const publicCategories = await supabase.from('categories').select('id').limit(1);
  if (!publicCategories.error) {
    categoriesTableModeCache = 'categories_public';
    return categoriesTableModeCache;
  }

  categoriesTableModeCache = 'none';
  return categoriesTableModeCache;
}

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

  async fetchScheduleCategories(): Promise<ScheduleCategory[]> {
    const mode = await resolveCategoriesTableMode();

    if (mode !== 'none') {
      let rows: any[] | null = null;
      if (mode === 'training_categories_public') {
        const { data, error } = await supabase.from('training_categories').select('*').order('label', { ascending: true });
        if (error) throw new Error(error.message || 'No se pudieron cargar categorías.');
        rows = data || [];
      } else if (mode === 'training_categories_training') {
        const { data, error } = await supabase.schema('training').from('training_categories').select('*').order('label', { ascending: true });
        if (error) throw new Error(error.message || 'No se pudieron cargar categorías.');
        rows = data || [];
      } else if (mode === 'schedule_categories_public') {
        const { data, error } = await supabase.from('schedule_categories').select('*').order('id', { ascending: true });
        if (error) throw new Error(error.message || 'No se pudieron cargar categorías.');
        rows = data || [];
      } else if (mode === 'schedule_categories_training') {
        const { data, error } = await supabase.schema('training').from('schedule_categories').select('*').order('id', { ascending: true });
        if (error) throw new Error(error.message || 'No se pudieron cargar categorías.');
        rows = data || [];
      } else {
        const { data, error } = await supabase.from('categories').select('*').order('id', { ascending: true });
        if (error) throw new Error(error.message || 'No se pudieron cargar categorías.');
        rows = data || [];
      }

      return rows.map(normalizeCategoryRow).sort((a, b) => a.label.localeCompare(b.label, 'es'));
    }

    const schedules = await this.fetchSchedules();
    const unique = new Map<string, ScheduleCategory>();
    schedules.forEach((item) => {
      const code = normalizeCategoryCode(item.category);
      if (!code || unique.has(code)) return;
      unique.set(code, {
        id: code,
        code,
        label: code.replaceAll('_', ' ').replace(/\b\w/g, (m) => m.toUpperCase()),
        appliesToSchedules: true,
        appliesToAthletes: true,
        isActive: true,
        source: 'derived',
      });
    });
    return [...unique.values()].sort((a, b) => a.label.localeCompare(b.label, 'es'));
  },

  async createScheduleCategory(input: {
    code: string;
    label: string;
    defaultDescription?: string;
    appliesToSchedules: boolean;
    appliesToAthletes: boolean;
    isActive: boolean;
  }) {
    const mode = await resolveCategoriesTableMode();
    if (mode === 'none') {
      throw new Error('No se encontró la tabla training_categories en la base de datos.');
    }

    const code = normalizeCategoryCode(input.code);
    const label = input.label.trim();
    const defaultDescription = input.defaultDescription?.trim() || null;

    if (mode === 'training_categories_public') {
      const payload = {
        code,
        label,
        default_description: defaultDescription,
        for_schedules: input.appliesToSchedules,
        for_students: input.appliesToAthletes,
        is_active: input.isActive,
      };
      const { error } = await supabase.from('training_categories').insert(payload);
      if (error) throw new Error(error.message || 'No se pudo crear la categoría.');
      return;
    }
    if (mode === 'training_categories_training') {
      const payload = {
        code,
        label,
        default_description: defaultDescription,
        for_schedules: input.appliesToSchedules,
        for_students: input.appliesToAthletes,
        is_active: input.isActive,
      };
      const { error } = await supabase.schema('training').from('training_categories').insert(payload);
      if (error) throw new Error(error.message || 'No se pudo crear la categoría.');
      return;
    }
    if (mode === 'schedule_categories_public') {
      const payload = {
        code,
        label,
        default_description: defaultDescription,
        applies_to_schedules: input.appliesToSchedules,
        applies_to_athletes: input.appliesToAthletes,
        is_active: input.isActive,
        codigo: code,
        etiqueta: label,
        descripcion_default: defaultDescription,
        aplica_horarios: input.appliesToSchedules,
        aplica_atletas: input.appliesToAthletes,
        activa: input.isActive,
      };
      const { error } = await supabase.from('schedule_categories').insert(payload);
      if (error) throw new Error(error.message || 'No se pudo crear la categoría.');
      return;
    }
    if (mode === 'schedule_categories_training') {
      const payload = {
        code,
        label,
        default_description: defaultDescription,
        applies_to_schedules: input.appliesToSchedules,
        applies_to_athletes: input.appliesToAthletes,
        is_active: input.isActive,
        codigo: code,
        etiqueta: label,
        descripcion_default: defaultDescription,
        aplica_horarios: input.appliesToSchedules,
        aplica_atletas: input.appliesToAthletes,
        activa: input.isActive,
      };
      const { error } = await supabase.schema('training').from('schedule_categories').insert(payload);
      if (error) throw new Error(error.message || 'No se pudo crear la categoría.');
      return;
    }

    const payload = {
      code,
      label,
      default_description: defaultDescription,
      applies_to_schedules: input.appliesToSchedules,
      applies_to_athletes: input.appliesToAthletes,
      is_active: input.isActive,
      codigo: code,
      etiqueta: label,
      descripcion_default: defaultDescription,
      aplica_horarios: input.appliesToSchedules,
      aplica_atletas: input.appliesToAthletes,
      activa: input.isActive,
    };
    const { error } = await supabase.from('categories').insert(payload);
    if (error) throw new Error(error.message || 'No se pudo crear la categoría.');
  },

  async updateScheduleCategoryActive(categoryId: string, isActive: boolean) {
    const mode = await resolveCategoriesTableMode();
    if (mode === 'none') {
      throw new Error('No se encontró la tabla training_categories en la base de datos.');
    }

    if (mode === 'training_categories_public') {
      const { error } = await supabase
        .from('training_categories')
        .update({ is_active: isActive })
        .eq('id', categoryId);
      if (error) throw new Error(error.message || 'No se pudo actualizar la categoría.');
      return;
    }
    if (mode === 'training_categories_training') {
      const { error } = await supabase
        .schema('training')
        .from('training_categories')
        .update({ is_active: isActive })
        .eq('id', categoryId);
      if (error) throw new Error(error.message || 'No se pudo actualizar la categoría.');
      return;
    }

    if (mode === 'schedule_categories_public') {
      const { error } = await supabase.from('schedule_categories').update({ is_active: isActive, activa: isActive }).eq('id', categoryId);
      if (error) throw new Error(error.message || 'No se pudo actualizar la categoría.');
      return;
    }
    if (mode === 'schedule_categories_training') {
      const { error } = await supabase.schema('training').from('schedule_categories').update({ is_active: isActive, activa: isActive }).eq('id', categoryId);
      if (error) throw new Error(error.message || 'No se pudo actualizar la categoría.');
      return;
    }

    const { error } = await supabase.from('categories').update({ is_active: isActive, activa: isActive }).eq('id', categoryId);
    if (error) throw new Error(error.message || 'No se pudo actualizar la categoría.');
  },

  async updateScheduleCategory(category: ScheduleCategory, input: {
    code: string;
    label: string;
    defaultDescription?: string;
    appliesToSchedules: boolean;
    appliesToAthletes: boolean;
    isActive: boolean;
  }) {
    const mode = await resolveCategoriesTableMode();
    if (mode === 'none') throw new Error('No se encontró la tabla de categorías.');

    const code = normalizeCategoryCode(input.code);
    const label = input.label.trim();
    const defaultDescription = input.defaultDescription?.trim() || null;

    if (mode === 'training_categories_public') {
      const { error } = await supabase
        .from('training_categories')
        .update({
          code,
          label,
          default_description: defaultDescription,
          for_schedules: input.appliesToSchedules,
          for_students: input.appliesToAthletes,
          is_active: input.isActive,
        })
        .eq('code', category.code);
      if (error) throw new Error(error.message || 'No se pudo actualizar la categoría.');
      return;
    }
    if (mode === 'training_categories_training') {
      const { error } = await supabase
        .schema('training')
        .from('training_categories')
        .update({
          code,
          label,
          default_description: defaultDescription,
          for_schedules: input.appliesToSchedules,
          for_students: input.appliesToAthletes,
          is_active: input.isActive,
        })
        .eq('code', category.code);
      if (error) throw new Error(error.message || 'No se pudo actualizar la categoría.');
      return;
    }

    throw new Error('Edición de categorías solo disponible en training_categories.');
  },

  async deleteScheduleCategory(category: ScheduleCategory) {
    const mode = await resolveCategoriesTableMode();
    if (mode === 'none') throw new Error('No se encontró la tabla de categorías.');

    const linked = await supabase.from('schedules').select('id').eq('categoria', category.code).limit(1);
    if (!linked.error && (linked.data || []).length > 0) {
      throw new Error('No se puede eliminar: la categoría está en uso por uno o más horarios. Desactívala primero.');
    }

    if (mode === 'training_categories_public') {
      const { error } = await supabase.from('training_categories').delete().eq('code', category.code);
      if (error) throw new Error(error.message || 'No se pudo eliminar la categoría.');
      return;
    }
    if (mode === 'training_categories_training') {
      const { error } = await supabase.schema('training').from('training_categories').delete().eq('code', category.code);
      if (error) throw new Error(error.message || 'No se pudo eliminar la categoría.');
      return;
    }

    throw new Error('Eliminación de categorías solo disponible en training_categories.');
  },
};

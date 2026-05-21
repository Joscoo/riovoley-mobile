import { useCallback, useEffect, useMemo, useState } from 'react';
import { athletesService } from '../services/athletesService';
import type {
  AthleteFormInput,
  AthleteItem,
  AthletesFilters,
  AthleteActionResult,
  SuspendPayload,
} from '../types/athletes.types';

const DEFAULT_FILTERS: AthletesFilters = {
  search: '',
  categoria: '',
  status: 'all',
  sortBy: 'apellido',
  sortOrder: 'asc',
};

const EMPTY_FORM: AthleteFormInput = {
  nombre: '',
  apellido: '',
  email: '',
  telefono: '',
  fecha_nacimiento: '',
  categoria: '',
};

export function useAthletesManager(canDelete: boolean) {
  const [athletes, setAthletes] = useState<AthleteItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [filters, setFilters] = useState<AthletesFilters>(DEFAULT_FILTERS);
  const [form, setForm] = useState<AthleteFormInput>(EMPTY_FORM);
  const [editingAthlete, setEditingAthlete] = useState<AthleteItem | null>(null);
  const [sendCredentials, setSendCredentials] = useState(true);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [athletesData, categoriesData] = await Promise.all([
        athletesService.fetchAthletes({ filters }),
        athletesService.fetchCategories(),
      ]);

      setAthletes(athletesData);
      setCategories(categoriesData);

      if (!form.categoria && categoriesData.length) {
        setForm((prev) => ({ ...prev, categoria: categoriesData[0] }));
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar los atletas.');
    } finally {
      setLoading(false);
    }
  }, [filters, form.categoria]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const resetForm = useCallback(() => {
    setForm((prev) => ({ ...EMPTY_FORM, categoria: categories[0] || prev.categoria || '' }));
    setEditingAthlete(null);
    setSendCredentials(true);
  }, [categories]);

  const handleCreateOrUpdate = useCallback(async () => {
    setSubmitting(true);
    setMessage(null);

    let result: AthleteActionResult;

    if (editingAthlete) {
      result = await athletesService.updateAthlete(editingAthlete.id, form);
    } else {
      result = await athletesService.createAthlete(form, { sendCredentials });
    }

    setSubmitting(false);
    setMessage(result.message);

    if (result.ok) {
      resetForm();
      await loadData();
    }

    return result;
  }, [editingAthlete, form, loadData, resetForm, sendCredentials]);

  const startEdit = useCallback((athlete: AthleteItem) => {
    setEditingAthlete(athlete);
    setForm({
      nombre: athlete.users.nombre || '',
      apellido: athlete.users.apellido || '',
      email: athlete.users.email || '',
      telefono: athlete.users.telefono || '',
      fecha_nacimiento: athlete.fecha_nacimiento || '',
      categoria: athlete.categoria || categories[0] || '',
    });
    setMessage(null);
  }, [categories]);

  const suspendOrReactivate = useCallback(async (athlete: AthleteItem, payload?: SuspendPayload) => {
    setSubmitting(true);
    setMessage(null);
    const result = athlete.suspended
      ? await athletesService.reactivateAthlete(athlete.user_id)
      : await athletesService.suspendAthlete(athlete.user_id, payload || {});

    setSubmitting(false);
    setMessage(result.message);
    if (result.ok) {
      await loadData();
    }
    return result;
  }, [loadData]);

  const resendCredentials = useCallback(async (athlete: AthleteItem) => {
    setSubmitting(true);
    setMessage(null);

    const result = await athletesService.resendAthleteCredentials({
      userId: athlete.user_id,
      email: athlete.email,
      nombre: athlete.users.nombre || 'Atleta',
      apellido: athlete.users.apellido || '',
    });

    setSubmitting(false);
    setMessage(result.message);
    return result;
  }, []);

  const confirmDelete = useCallback(async (athlete: AthleteItem) => {
    if (!canDelete) {
      return { ok: false, message: 'No tienes permisos para eliminar atletas.' };
    }

    setSubmitting(true);
    setMessage(null);

    const result = await athletesService.deleteAthleteCompletely(athlete);

    setSubmitting(false);
    setMessage(result.message);
    setPendingDeleteId(null);
    if (result.ok) {
      await loadData();
    }
    return result;
  }, [canDelete, loadData]);

  const sortedCountLabel = useMemo(() => `${athletes.length} atletas`, [athletes.length]);

  return {
    athletes,
    categories,
    filters,
    setFilters,
    form,
    setForm,
    editingAthlete,
    sendCredentials,
    setSendCredentials,
    loading,
    submitting,
    error,
    message,
    pendingDeleteId,
    setPendingDeleteId,
    sortedCountLabel,
    loadData,
    resetForm,
    handleCreateOrUpdate,
    startEdit,
    suspendOrReactivate,
    resendCredentials,
    confirmDelete,
  };
}

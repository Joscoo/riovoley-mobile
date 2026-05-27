import { useCallback, useEffect, useMemo, useState } from 'react';
import { paymentsService } from '../services/paymentsService';
import type { AthleteOption, PaymentFilters, PaymentFormInput, PaymentItem } from '../types/payment.types';

const DEFAULT_FILTERS: PaymentFilters = {
  search: '',
  status: 'all',
  membershipType: 'all',
};

const todayIso = new Date().toISOString().slice(0, 10);

const EMPTY_FORM: PaymentFormInput = {
  userId: '',
  studentId: '',
  paymentDate: todayIso,
  membershipType: 'normal',
  notes: '',
};

export function usePaymentsManager() {
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [athletes, setAthletes] = useState<AthleteOption[]>([]);
  const [filters, setFilters] = useState<PaymentFilters>(DEFAULT_FILTERS);
  const [form, setForm] = useState<PaymentFormInput>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [paymentsData, athletesData] = await Promise.all([
        paymentsService.fetchPayments(),
        paymentsService.fetchAthleteOptions(),
      ]);
      setPayments(paymentsData);
      setAthletes(athletesData);
      if (!form.userId && athletesData[0]) {
        setForm((prev) => ({ ...prev, userId: athletesData[0].userId, studentId: athletesData[0].studentId }));
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar pagos.');
    } finally {
      setLoading(false);
    }
  }, [form.userId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredPayments = useMemo(() => {
    return payments.filter((item) => {
      if (filters.status !== 'all' && item.status !== filters.status) return false;
      if (filters.membershipType !== 'all' && item.membershipType !== filters.membershipType) return false;
      const search = filters.search.trim().toLowerCase();
      if (!search) return true;
      return item.athleteName.toLowerCase().includes(search) || item.athleteEmail.toLowerCase().includes(search);
    });
  }, [payments, filters]);

  const metrics = useMemo(() => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);

    const activeMonthPayments = payments.filter((p) => {
      const startRaw = p.periodStart || p.paymentDate || p.createdAt;
      const endRaw = p.periodEnd || p.paymentDate || p.createdAt;
      if (!startRaw || !endRaw) return false;

      const start = new Date(startRaw);
      const end = new Date(endRaw);

      // Se considera dentro del mes activo si el periodo de membresía
      // se cruza con cualquier día del mes actual.
      return start <= monthEnd && end >= monthStart;
    });
    const total = activeMonthPayments.length;
    const activeMonthActivePayments = activeMonthPayments.filter((p) => p.status === 'active');
    const active = activeMonthActivePayments.length;
    const overdue = activeMonthPayments.filter((p) => p.status === 'overdue').length;
    const expiring = activeMonthPayments.filter((p) => p.status === 'expiring').length;
    const totalAmount = activeMonthActivePayments.reduce((acc, item) => acc + (item.amount || 0), 0);
    return { total, active, overdue, expiring, totalAmount };
  }, [payments]);

  const startCreate = useCallback(() => {
    setEditingId(null);
    setMessage(null);
    setForm((prev) => ({
      ...EMPTY_FORM,
      userId: prev.userId || athletes[0]?.userId || '',
      studentId: prev.studentId || athletes[0]?.studentId || '',
    }));
  }, [athletes]);

  const startEdit = useCallback((item: PaymentItem) => {
    const athlete = athletes.find((option) => option.userId === item.userId);
    setEditingId(item.id);
    setMessage(null);
    setForm({
      userId: item.userId,
      paymentDate: item.paymentDate,
      membershipType: item.membershipType,
      notes: item.notes || '',
      studentId: athlete?.studentId || '',
    });
  }, [athletes]);

  const submit = useCallback(async () => {
    setSubmitting(true);
    setMessage(null);
    const result = editingId
      ? await paymentsService.updatePayment(editingId, form)
      : await paymentsService.createPayment(form);
    setSubmitting(false);
    setMessage(result.message);
    if (result.ok) {
      setEditingId(null);
      await loadData();
    }
    return result;
  }, [editingId, form, loadData]);

  const remove = useCallback(async (id: string) => {
    setSubmitting(true);
    setMessage(null);
    const result = await paymentsService.deletePayment(id);
    setSubmitting(false);
    setMessage(result.message);
    if (result.ok) await loadData();
    return result;
  }, [loadData]);

  return {
    payments: filteredPayments,
    athletes,
    filters,
    setFilters,
    form,
    setForm,
    editingId,
    loading,
    submitting,
    error,
    message,
    metrics,
    loadData,
    startCreate,
    startEdit,
    submit,
    remove,
  };
}

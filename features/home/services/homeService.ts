/**
 * Home service - Supabase queries
 */

import { supabase } from '@/lib/supabase';
import { HomeAnnouncement, HomeTraining, HomeAttendance, HomePayment, HomeUserPayment } from '../types/home.types';

export const homeService = {
  async resolvePaymentsOwnerMode(): Promise<'user' | 'student' | null> {
    const byUser = await supabase.from('payments').select('id,user_id').limit(1);
    if (!byUser.error) return 'user';
    const byStudent = await supabase.from('payments').select('id,student_id').limit(1);
    if (!byStudent.error) return 'student';
    return null;
  },

  resolvePaymentColumns() {
    return {
      amount: ['amount', 'monto'],
      paymentDate: ['payment_date', 'fecha_pago', 'date'],
      dueDate: ['due_date', 'fecha_vencimiento'],
      periodStart: ['period_start', 'periodo_inicio'],
      periodEnd: ['period_end', 'periodo_fin'],
      createdAt: ['created_at', 'fecha_creacion'],
    } as const;
  },

  pickColumn<T extends Record<string, any>>(row: T, candidates: readonly string[]) {
    for (const c of candidates) {
      if (Object.prototype.hasOwnProperty.call(row, c)) return row[c];
    }
    return null;
  },

  computePaymentStatus(periodEndLike: string | null | undefined) {
    const periodEnd = periodEndLike ? new Date(`${String(periodEndLike).slice(0, 10)}T23:59:59`) : null;
    if (!periodEnd) return { label: 'Vencido' as const, daysRemaining: -1 };
    const now = new Date();
    const daysRemaining = Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysRemaining < 0) return { label: 'Vencido' as const, daysRemaining };
    if (daysRemaining <= 5) return { label: 'Próximo a vencer' as const, daysRemaining };
    return { label: 'Activo' as const, daysRemaining };
  },

  // User Profile
  async fetchUserProfile(userId: string) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('full_name, role')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    return data;
  },

  // Announcements
  async fetchAnnouncements(limit = 5): Promise<HomeAnnouncement[]> {
    const { data, error } = await supabase
      .from('announcements')
      .select('id, title, content, created_at')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching announcements:', error);
      return [];
    }

    return data ?? [];
  },

  // Next Training/Schedule
  async fetchNextTraining(userId: string): Promise<HomeTraining | null> {
    // TODO: filtrar por categoría, rol o grupo del usuario cuando esté disponible.
    // This query depends on your actual schema
    // Assuming there's a relationship between user_profiles and schedules
    const { data, error } = await supabase
      .from('schedules')
      .select('id, category, day_of_week, start_time, end_time, location')
      .order('start_time', { ascending: true })
      .limit(1);

    if (error) {
      console.error('Error fetching next training:', error);
      return null;
    }

    return data?.[0] ?? null;
  },

  // Attendance Status
  async fetchAttendanceStatus(userId: string): Promise<HomeAttendance | null> {
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id,categoria,fecha_ingreso')
      .eq('user_id', userId)
      .maybeSingle();

    if (studentError || !student) {
      console.error('Error fetching student for attendance:', studentError);
      return null;
    }

    const startDate = String(student.fecha_ingreso || new Date().toISOString()).slice(0, 10);

    const { data: ownAttendances, error: ownError } = await supabase
      .from('attendances')
      .select('fecha')
      .eq('student_id', student.id)
      .gte('fecha', startDate);

    if (ownError) {
      console.error('Error fetching own attendance rows:', ownError);
      return null;
    }

    const { data: categoryStudents } = await supabase
      .from('students')
      .select('id')
      .eq('categoria', student.categoria);

    const categoryStudentIds = (categoryStudents ?? []).map((row: any) => row.id);
    let totalSessions = 0;

    if (categoryStudentIds.length > 0) {
      const { data: categoryAttendances } = await supabase
        .from('attendances')
        .select('fecha')
        .in('student_id', categoryStudentIds)
        .gte('fecha', startDate);

      totalSessions = new Set((categoryAttendances ?? []).map((row: any) => String(row.fecha).slice(0, 10))).size;
    }

    const attendedCount = ownAttendances?.length ?? 0;
    const percentage = totalSessions > 0 ? Math.round((attendedCount / totalSessions) * 100) : 0;

    return {
      attended: attendedCount > 0,
      percentage,
    };
  },

  // Payment Status
  async fetchPaymentStatus(userId: string): Promise<HomePayment | null> {
    const payments = await this.fetchUserPayments(userId, 1);
    const current = payments[0];
    if (!current) return { pending: false };
    return {
      pending: current.statusLabel !== 'Activo',
      amount: current.amount,
      dueDate: current.periodEnd,
    };
  },

  async fetchUserPayments(userId: string, limit = 5): Promise<HomeUserPayment[]> {
    const ownerMode = await this.resolvePaymentsOwnerMode();
    if (!ownerMode) return [];

    const { amount, paymentDate, dueDate, periodStart, periodEnd, createdAt } = this.resolvePaymentColumns();
    const selectColumns = ['id', ...(ownerMode === 'user' ? ['user_id'] : ['student_id']), ...amount, ...paymentDate, ...dueDate, ...periodStart, ...periodEnd, ...createdAt];
    const uniqueColumns = [...new Set(selectColumns)];

    let query = supabase.from('payments').select(uniqueColumns.join(','));
    if (ownerMode === 'user') {
      query = query.eq('user_id', userId);
    } else {
      const { data: student } = await supabase.from('students').select('id').eq('user_id', userId).maybeSingle();
      if (!student?.id) return [];
      query = query.eq('student_id', student.id);
    }

    const { data, error } = await query.order('id', { ascending: false }).limit(Math.max(limit, 1));
    if (error) {
      console.error('Error fetching user payments:', error);
      return [];
    }

    const rows = data || [];
    return rows.map((row: any) => {
      const amountValue = Number(this.pickColumn(row, amount) || 0);
      const paymentDateValue = this.pickColumn(row, paymentDate);
      const periodStartValue = this.pickColumn(row, periodStart) || paymentDateValue;
      const periodEndValue = this.pickColumn(row, periodEnd) || this.pickColumn(row, dueDate);
      const computed = this.computePaymentStatus(periodEndValue);
      return {
        id: String(row.id),
        amount: amountValue,
        statusLabel: computed.label,
        daysRemaining: computed.daysRemaining,
        paymentDate: paymentDateValue ? String(paymentDateValue).slice(0, 10) : undefined,
        periodStart: periodStartValue ? String(periodStartValue).slice(0, 10) : undefined,
        periodEnd: periodEndValue ? String(periodEndValue).slice(0, 10) : undefined,
      };
    });
  },
};

import { supabase } from '@/lib/supabase';
import type {
  AttendanceStudentItem,
  AttendanceTrainingDateOption,
  StudentAttendanceBreakdown,
} from '../types/attendance.types';

const toDateOnly = (value: string) => value.slice(0, 10);
const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
const SPANISH_BY_DAY: Record<string, string> = {
  sunday: 'domingo',
  monday: 'lunes',
  tuesday: 'martes',
  wednesday: 'miércoles',
  thursday: 'jueves',
  friday: 'viernes',
  saturday: 'sábado',
};

const normalizeDay = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

export const attendanceService = {
  async fetchTrainingDateOptions(): Promise<AttendanceTrainingDateOption[]> {
    const today = new Date();
    const days: Array<{ key: 'yesterday' | 'today' | 'tomorrow'; label: string; date: Date }> = [
      { key: 'yesterday', label: 'Ayer', date: new Date(today) },
      { key: 'today', label: 'Hoy', date: new Date(today) },
      { key: 'tomorrow', label: 'Mañana', date: new Date(today) },
    ];
    days[0].date.setDate(today.getDate() - 1);
    days[2].date.setDate(today.getDate() + 1);

    return days.map((item) => ({
      key: item.key,
      label: item.label,
      date: item.date.toISOString().slice(0, 10),
      timeRange: '',
      trainingLabel: '',
    }));
  },

  async fetchStudentsForDate(date: string): Promise<AttendanceStudentItem[]> {
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id,user_id,categoria,users!user_id(id,nombre,apellido,email,role)');

    if (studentsError) throw new Error(studentsError.message || 'No se pudieron cargar atletas.');

    const studentRows = (students || []).filter((row: any) => {
      const role = String(row.users?.role || '').toLowerCase();
      return role === 'estudiante' || role === 'usuario';
    });

    const studentIds = studentRows.map((row: any) => row.id);
    let attendanceMap = new Map<string, string>();

    if (studentIds.length > 0) {
      const { data: attendances } = await supabase
        .from('attendances')
        .select('id,student_id,fecha')
        .in('student_id', studentIds)
        .eq('fecha', date);

      attendanceMap = new Map((attendances || []).map((row: any) => [String(row.student_id), String(row.id)]));
    }

    return studentRows
      .map((row: any) => {
        const attendanceId = attendanceMap.get(String(row.id)) || null;
        return {
          id: String(row.id),
          user_id: String(row.user_id),
          categoria: row.categoria ?? null,
          full_name: `${row.users?.apellido || ''} ${row.users?.nombre || ''}`.trim() || 'Atleta',
          email: row.users?.email ?? null,
          attendance_id: attendanceId,
          present: Boolean(attendanceId),
        } as AttendanceStudentItem;
      })
      .sort((a, b) => a.full_name.localeCompare(b.full_name, 'es', { sensitivity: 'base' }));
  },

  async markPresent(studentId: string, date: string) {
    const { data: existing } = await supabase
      .from('attendances')
      .select('id')
      .eq('student_id', studentId)
      .eq('fecha', date)
      .maybeSingle();

    if (existing?.id) return;

    const { error } = await supabase.from('attendances').insert({ student_id: studentId, fecha: date });
    if (error) throw new Error(error.message || 'No se pudo registrar asistencia.');
  },

  async markAbsent(studentId: string, date: string) {
    const { error } = await supabase
      .from('attendances')
      .delete()
      .eq('student_id', studentId)
      .eq('fecha', date);

    if (error) throw new Error(error.message || 'No se pudo quitar asistencia.');
  },

  async setAllPresent(studentIds: string[], date: string) {
    for (const studentId of studentIds) {
      // eslint-disable-next-line no-await-in-loop
      await this.markPresent(studentId, date);
    }
  },

  async clearDate(date: string) {
    const { error } = await supabase.from('attendances').delete().eq('fecha', date);
    if (error) throw new Error(error.message || 'No se pudo limpiar el día.');
  },

  async fetchStudentBreakdown(userId: string): Promise<StudentAttendanceBreakdown> {
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id,categoria,fecha_ingreso')
      .eq('user_id', userId)
      .maybeSingle();

    if (studentError || !student) {
      throw new Error(studentError?.message || 'No se encontró el atleta asociado al usuario.');
    }

    const studentId = String(student.id);
    const startDate = String(student.fecha_ingreso || new Date().toISOString()).slice(0, 10);

    const { data: ownAttendances, error: ownError } = await supabase
      .from('attendances')
      .select('fecha')
      .eq('student_id', studentId)
      .gte('fecha', startDate)
      .order('fecha', { ascending: false });

    if (ownError) throw new Error(ownError.message || 'No se pudo cargar tu asistencia.');

    const { data: categoryStudents } = await supabase
      .from('students')
      .select('id')
      .eq('categoria', student.categoria);

    const categoryIds = (categoryStudents || []).map((row: any) => row.id);
    let categoryDates: string[] = [];

    if (categoryIds.length > 0) {
      const { data: categoryAttendances } = await supabase
        .from('attendances')
        .select('fecha')
        .in('student_id', categoryIds)
        .gte('fecha', startDate);
      categoryDates = (categoryAttendances || []).map((row: any) => toDateOnly(String(row.fecha)));
    }

    const uniqueSessions = new Set(categoryDates);
    const attendedDates = (ownAttendances || []).map((row: any) => toDateOnly(String(row.fecha)));
    const attendedSet = new Set(attendedDates);
    const missedDates = [...uniqueSessions]
      .filter((date) => !attendedSet.has(date))
      .sort((a, b) => b.localeCompare(a));
    const totalPresent = attendedDates.length;
    const totalSessions = uniqueSessions.size;
    const percentage = totalSessions > 0 ? Math.round((totalPresent / totalSessions) * 100) : 0;

    return {
      percentage,
      totalPresent,
      totalSessions,
      attendedDates,
      missedDates,
    };
  },
};

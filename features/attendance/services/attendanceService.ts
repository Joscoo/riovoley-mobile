import { Platform, Share } from 'react-native';
import { supabase } from '@/lib/supabase';
import type {
  AttendanceCategoryStat,
  AttendanceHistoryDay,
  AttendancePaymentMethod,
  AttendanceReportPayload,
  AttendanceStudentItem,
  AttendanceTrainingDateOption,
  PersistedAttendanceReport,
  StudentAttendanceBreakdown,
} from '../types/attendance.types';

const toDateOnly = (value: string) => value.slice(0, 10);
const DEFAULT_PAYMENT_METHOD: AttendancePaymentMethod = 'mensual';

const PAYMENT_LABELS: Record<AttendancePaymentMethod, string> = {
  mensual: 'Pago mensual',
  sesion_individual: 'Pago por sesión individual',
  tarjeta_entrenamiento: 'Pago por tarjeta de entrenamiento',
};

const normalizeMethod = (value: string | null | undefined): AttendancePaymentMethod => {
  const normalized = (value || '').toLowerCase();
  if (normalized.includes('individual')) return 'sesion_individual';
  if (normalized.includes('tarjeta')) return 'tarjeta_entrenamiento';
  return 'mensual';
};

const escapeCsv = (value: string) => {
  const escaped = value.replaceAll('"', '""');
  return `"${escaped}"`;
};

const isMissingColumnError = (error: any) => String(error?.message || '').toLowerCase().includes('does not exist');
const isMissingTableError = (error: any) => {
  const text = String(error?.message || '').toLowerCase();
  return (
    (text.includes('relation') && text.includes('does not exist'))
    || (text.includes('could not find') && text.includes('table'))
  );
};

async function fetchAttendanceRowsByDate(date: string) {
  const withMethod = await supabase
    .from('attendances')
    .select('id,student_id,fecha,payment_method')
    .eq('fecha', date);

  if (!withMethod.error) return withMethod.data || [];
  if (!isMissingColumnError(withMethod.error)) throw new Error(withMethod.error.message || 'No se pudieron cargar asistencias.');

  const fallback = await supabase
    .from('attendances')
    .select('id,student_id,fecha')
    .eq('fecha', date);

  if (fallback.error) throw new Error(fallback.error.message || 'No se pudieron cargar asistencias.');
  return fallback.data || [];
}

async function fetchPaymentMethodByAttendance(attendanceIds: string[]) {
  if (attendanceIds.length === 0) return new Map<string, AttendancePaymentMethod>();

  const byTable = await supabase
    .from('attendance_payment_methods')
    .select('attendance_id,payment_method')
    .in('attendance_id', attendanceIds);

  if (byTable.error) {
    if (isMissingTableError(byTable.error)) return new Map<string, AttendancePaymentMethod>();
    throw new Error(byTable.error.message || 'No se pudo cargar método de pago de asistencia.');
  }

  return new Map((byTable.data || []).map((row: any) => [String(row.attendance_id), normalizeMethod(row.payment_method)]));
}

async function savePaymentMethod(attendanceId: string, studentId: string, date: string, paymentMethod: AttendancePaymentMethod) {
  const saveTable = await supabase
    .from('attendance_payment_methods')
    .upsert(
      {
        attendance_id: attendanceId,
        student_id: studentId,
        fecha: date,
        payment_method: paymentMethod,
      },
      { onConflict: 'attendance_id' }
    );

  if (!saveTable.error) return;

  if (!isMissingTableError(saveTable.error)) {
    throw new Error(saveTable.error.message || 'No se pudo guardar método de pago.');
  }

  const updateInline = await supabase
    .from('attendances')
    .update({ payment_method: paymentMethod })
    .eq('id', attendanceId);

  if (updateInline.error && !isMissingColumnError(updateInline.error)) {
    throw new Error(updateInline.error.message || 'No se pudo guardar método de pago.');
  }
}

function buildCategoryStats(rows: AttendanceStudentItem[]): AttendanceCategoryStat[] {
  const byCategory = new Map<string, { present: number; total: number }>();
  rows.forEach((row) => {
    const key = row.categoria || 'sin_categoria';
    const current = byCategory.get(key) || { present: 0, total: 0 };
    current.total += 1;
    if (row.present) current.present += 1;
    byCategory.set(key, current);
  });

  return [...byCategory.entries()].map(([category, values]) => ({
    category,
    present: values.present,
    total: values.total,
    percentage: values.total > 0 ? Math.round((values.present / values.total) * 1000) / 10 : 0,
  }));
}

function buildReportPayload(date: string, rows: AttendanceStudentItem[]): AttendanceReportPayload {
  const totalPresent = rows.filter((row) => row.present).length;
  const totalStudents = rows.length;
  return {
    date,
    totalPresent,
    totalStudents,
    categoryStats: buildCategoryStats(rows),
    rows: rows.map((row) => ({
      fullName: row.full_name,
      category: row.categoria || 'sin_categoria',
      paymentMethod: row.payment_method,
      present: row.present,
    })),
  };
}

function reportToCsv(payload: AttendanceReportPayload) {
  const lines: string[] = [];
  lines.push(`Reporte de asistencias,${payload.date}`);
  lines.push(`Total presentes,${payload.totalPresent}`);
  lines.push(`Total atletas,${payload.totalStudents}`);
  lines.push('');
  lines.push('Estadisticas por categoria');
  lines.push('Categoria,Presentes,Total,Porcentaje');
  payload.categoryStats.forEach((stat) => {
    lines.push(`${escapeCsv(stat.category)},${stat.present},${stat.total},${stat.percentage}%`);
  });
  lines.push('');
  lines.push('Detalle por atleta');
  lines.push('Atleta,Categoria,Presente,Metodo de pago');
  payload.rows.forEach((row) => {
    lines.push([
      escapeCsv(row.fullName),
      escapeCsv(row.category),
      row.present ? 'Si' : 'No',
      escapeCsv(PAYMENT_LABELS[row.paymentMethod]),
    ].join(','));
  });
  return lines.join('\n');
}

function downloadWeb(content: string, fileName: string) {
  if (typeof document === 'undefined') return;
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export const attendanceService = {
  paymentMethodOptions: [
    { value: 'mensual' as const, label: PAYMENT_LABELS.mensual },
    { value: 'sesion_individual' as const, label: PAYMENT_LABELS.sesion_individual },
    { value: 'tarjeta_entrenamiento' as const, label: PAYMENT_LABELS.tarjeta_entrenamiento },
  ],

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

    const attendanceRows = await fetchAttendanceRowsByDate(date);
    const attendanceMap = new Map((attendanceRows || []).map((row: any) => [String(row.student_id), row]));

    const attendanceIds = (attendanceRows || []).map((row: any) => String(row.id));
    const paymentMap = await fetchPaymentMethodByAttendance(attendanceIds);

    return studentRows
      .map((row: any) => {
        const attendanceRow = attendanceMap.get(String(row.id));
        const attendanceId = attendanceRow ? String(attendanceRow.id) : null;
        const inlineMethod = normalizeMethod(attendanceRow?.payment_method);
        const mappedMethod = attendanceId ? paymentMap.get(attendanceId) : undefined;
        return {
          id: String(row.id),
          user_id: String(row.user_id),
          categoria: row.categoria ?? null,
          full_name: `${row.users?.apellido || ''} ${row.users?.nombre || ''}`.trim() || 'Atleta',
          email: row.users?.email ?? null,
          attendance_id: attendanceId,
          present: Boolean(attendanceId),
          payment_method: mappedMethod || inlineMethod || DEFAULT_PAYMENT_METHOD,
        } as AttendanceStudentItem;
      })
      .sort((a, b) => a.full_name.localeCompare(b.full_name, 'es', { sensitivity: 'base' }));
  },

  async markPresent(studentId: string, date: string, paymentMethod: AttendancePaymentMethod = DEFAULT_PAYMENT_METHOD) {
    const { data: existing } = await supabase
      .from('attendances')
      .select('id')
      .eq('student_id', studentId)
      .eq('fecha', date)
      .maybeSingle();

    let attendanceId = existing?.id ? String(existing.id) : null;

    if (!attendanceId) {
      const insert = await supabase.from('attendances').insert({ student_id: studentId, fecha: date }).select('id').single();
      if (insert.error || !insert.data?.id) {
        throw new Error(insert.error?.message || 'No se pudo registrar asistencia.');
      }
      attendanceId = String(insert.data.id);
    }

    await savePaymentMethod(attendanceId, studentId, date, paymentMethod);
  },

  async updatePaymentMethod(studentId: string, date: string, paymentMethod: AttendancePaymentMethod) {
    const { data: attendance } = await supabase
      .from('attendances')
      .select('id')
      .eq('student_id', studentId)
      .eq('fecha', date)
      .maybeSingle();

    if (!attendance?.id) return;
    await savePaymentMethod(String(attendance.id), studentId, date, paymentMethod);
  },

  async markAbsent(studentId: string, date: string) {
    const { error } = await supabase
      .from('attendances')
      .delete()
      .eq('student_id', studentId)
      .eq('fecha', date);

    if (error) throw new Error(error.message || 'No se pudo quitar asistencia.');
  },

  async setAllPresent(rows: Array<{ id: string; payment_method: AttendancePaymentMethod }>, date: string) {
    for (const row of rows) {
      // eslint-disable-next-line no-await-in-loop
      await this.markPresent(row.id, date, row.payment_method || DEFAULT_PAYMENT_METHOD);
    }
  },

  async clearDate(date: string) {
    const { error } = await supabase.from('attendances').delete().eq('fecha', date);
    if (error) throw new Error(error.message || 'No se pudo limpiar el día.');
  },

  async fetchAttendanceHistoryDays(): Promise<AttendanceHistoryDay[]> {
    const { data, error } = await supabase
      .from('attendances')
      .select('fecha')
      .order('fecha', { ascending: false });

    if (error) throw new Error(error.message || 'No se pudo cargar historial.');

    const counts = new Map<string, number>();
    (data || []).forEach((row: any) => {
      const d = toDateOnly(String(row.fecha));
      counts.set(d, (counts.get(d) || 0) + 1);
    });

    return [...counts.entries()].map(([date, count]) => ({ date, count }));
  },

  async buildReportByDate(date: string): Promise<AttendanceReportPayload> {
    const rows = await this.fetchStudentsForDate(date);
    return buildReportPayload(date, rows);
  },

  async persistReport(payload: AttendanceReportPayload): Promise<PersistedAttendanceReport> {
    const fileName = `reporte-asistencia-${payload.date}.csv`;

    const insert = await supabase
      .from('attendance_reports')
      .insert({
        report_date: payload.date,
        status: 'ready',
        file_name: fileName,
        payload,
      })
      .select('*')
      .single();

    if (insert.error || !insert.data) {
      throw new Error(insert.error?.message || 'No se pudo guardar el reporte persistido.');
    }

    return {
      id: String(insert.data.id),
      report_date: String(insert.data.report_date),
      status: (insert.data.status || 'ready') as 'ready' | 'processing' | 'error',
      file_name: insert.data.file_name || fileName,
      payload: (insert.data.payload || payload) as AttendanceReportPayload,
      created_at: insert.data.created_at || undefined,
    };
  },

  async fetchPersistedReports(): Promise<PersistedAttendanceReport[]> {
    const { data, error } = await supabase
      .from('attendance_reports')
      .select('id,report_date,status,file_name,payload,created_at')
      .order('report_date', { ascending: false });

    if (error) {
      if (isMissingTableError(error)) return [];
      throw new Error(error.message || 'No se pudo cargar reportes persistidos.');
    }

    return (data || []).map((row: any) => ({
      id: String(row.id),
      report_date: String(row.report_date),
      status: (row.status || 'ready') as 'ready' | 'processing' | 'error',
      file_name: row.file_name || `reporte-asistencia-${row.report_date}.csv`,
      payload: row.payload as AttendanceReportPayload,
      created_at: row.created_at || undefined,
    }));
  },

  async deletePersistedReport(reportId: string) {
    const { error } = await supabase.from('attendance_reports').delete().eq('id', reportId);
    if (error) throw new Error(error.message || 'No se pudo eliminar el reporte.');
  },

  async downloadReport(payload: AttendanceReportPayload, fileName?: string) {
    const content = reportToCsv(payload);
    const name = fileName || `reporte-asistencia-${payload.date}.csv`;

    if (Platform.OS === 'web') {
      downloadWeb(content, name);
      return;
    }

    await Share.share({
      title: name,
      message: content,
    });
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

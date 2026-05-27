import { useCallback, useEffect, useMemo, useState } from 'react';
import { attendanceService } from '../services/attendanceService';
import type {
  AttendancePaymentMethod,
  AttendanceStudentItem,
  AttendanceTrainingDateOption,
  PersistedAttendanceReport,
} from '../types/attendance.types';

export function useAttendanceRegister() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [dateOptions, setDateOptions] = useState<AttendanceTrainingDateOption[]>([]);
  const [students, setStudents] = useState<AttendanceStudentItem[]>([]);
  const [historyDays, setHistoryDays] = useState<Array<{ date: string; count: number }>>([]);
  const [persistedReports, setPersistedReports] = useState<PersistedAttendanceReport[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [studentsRes, optionsRes, historyRes, reportsRes] = await Promise.allSettled([
        attendanceService.fetchStudentsForDate(date),
        attendanceService.fetchTrainingDateOptions(),
        attendanceService.fetchAttendanceHistoryDays(),
        attendanceService.fetchPersistedReports(),
      ]);

      if (studentsRes.status === 'fulfilled') setStudents(studentsRes.value);
      if (optionsRes.status === 'fulfilled') setDateOptions(optionsRes.value);
      if (historyRes.status === 'fulfilled') setHistoryDays(historyRes.value);
      if (reportsRes.status === 'fulfilled') setPersistedReports(reportsRes.value);

      if (studentsRes.status === 'rejected') {
        throw studentsRes.reason;
      }

      if (historyRes.status === 'rejected') {
        setMessage(historyRes.reason instanceof Error ? historyRes.reason.message : 'No se pudo cargar historial.');
      }

      if (reportsRes.status === 'rejected') {
        setMessage(reportsRes.reason instanceof Error ? reportsRes.reason.message : 'No se pudo cargar reportes persistidos.');
      }

      if (optionsRes.status === 'fulfilled' && optionsRes.value.length > 0 && !optionsRes.value.some((opt) => opt.date === date)) {
        setDate(optionsRes.value[0].date);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo cargar asistencia.');
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    void load();
  }, [load]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      if (s.categoria) set.add(s.categoria);
    });
    return [...set].sort();
  }, [students]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return students.filter((student) => {
      const categoryPass = category === 'all' || student.categoria === category;
      const searchPass = !query || student.full_name.toLowerCase().includes(query) || (student.email || '').toLowerCase().includes(query);
      return categoryPass && searchPass;
    });
  }, [students, search, category]);

  const stats = useMemo(() => {
    const total = filtered.length;
    const present = filtered.filter((s) => s.present).length;
    const absent = Math.max(0, total - present);
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
    return { total, present, absent, percentage };
  }, [filtered]);

  const toggleOne = useCallback(async (student: AttendanceStudentItem) => {
    setSubmitting(true);
    setMessage(null);
    try {
      if (student.present) {
        await attendanceService.markAbsent(student.id, date);
      } else {
        await attendanceService.markPresent(student.id, date, student.payment_method);
      }
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo actualizar asistencia.');
    } finally {
      setSubmitting(false);
    }
  }, [date, load]);

  const changePaymentMethod = useCallback(async (student: AttendanceStudentItem, method: AttendancePaymentMethod) => {
    setStudents((prev) => prev.map((item) => (item.id === student.id ? { ...item, payment_method: method } : item)));

    if (!student.present) return;

    setSubmitting(true);
    try {
      await attendanceService.updatePaymentMethod(student.id, date, method);
      setMessage(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo actualizar método de pago.');
    } finally {
      setSubmitting(false);
    }
  }, [date]);

  const markAllPresent = useCallback(async () => {
    setSubmitting(true);
    setMessage(null);
    try {
      await attendanceService.setAllPresent(filtered.map((s) => ({ id: s.id, payment_method: s.payment_method })), date);
      await load();
      setMessage('Todos marcados como presentes.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo marcar todos.');
    } finally {
      setSubmitting(false);
    }
  }, [date, filtered, load]);

  const clearDay = useCallback(async () => {
    setSubmitting(true);
    setMessage(null);
    try {
      await attendanceService.clearDate(date);
      await load();
      setMessage('Se limpiaron las asistencias del día.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo limpiar el día.');
    } finally {
      setSubmitting(false);
    }
  }, [date, load]);

  const exportDayReport = useCallback(async (targetDate: string) => {
    setSubmitting(true);
    setMessage(null);
    try {
      const payload = await attendanceService.buildReportByDate(targetDate);
      await attendanceService.downloadReport(payload, `reporte-asistencia-${targetDate}.csv`);
      const report = await attendanceService.persistReport(payload);
      setPersistedReports((prev) => [report, ...prev.filter((item) => item.id !== report.id)]);
      setMessage(`Reporte exportado y persistido: ${targetDate}`);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo exportar el reporte.');
    } finally {
      setSubmitting(false);
    }
  }, [load]);

  const downloadPersistedReport = useCallback(async (report: PersistedAttendanceReport) => {
    setSubmitting(true);
    setMessage(null);
    try {
      await attendanceService.downloadReport(report.payload, report.file_name);
      setMessage(`Reporte descargado: ${report.report_date}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo descargar el reporte.');
    } finally {
      setSubmitting(false);
    }
  }, []);

  const deletePersistedReport = useCallback(async (reportId: string) => {
    setSubmitting(true);
    setMessage(null);
    try {
      await attendanceService.deletePersistedReport(reportId);
      setPersistedReports((prev) => prev.filter((item) => item.id !== reportId));
      setMessage('Reporte eliminado.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo eliminar el reporte.');
    } finally {
      setSubmitting(false);
    }
  }, []);

  return {
    date,
    setDate,
    dateOptions,
    students: filtered,
    categories,
    category,
    setCategory,
    search,
    setSearch,
    loading,
    submitting,
    message,
    stats,
    historyDays,
    persistedReports,
    toggleOne,
    changePaymentMethod,
    markAllPresent,
    clearDay,
    exportDayReport,
    downloadPersistedReport,
    deletePersistedReport,
    refresh: load,
  };
}

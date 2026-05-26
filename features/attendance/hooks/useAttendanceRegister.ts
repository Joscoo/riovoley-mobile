import { useCallback, useEffect, useMemo, useState } from 'react';
import { attendanceService } from '../services/attendanceService';
import type { AttendanceStudentItem, AttendanceTrainingDateOption } from '../types/attendance.types';

export function useAttendanceRegister() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [dateOptions, setDateOptions] = useState<AttendanceTrainingDateOption[]>([]);
  const [students, setStudents] = useState<AttendanceStudentItem[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [data, options] = await Promise.all([
        attendanceService.fetchStudentsForDate(date),
        attendanceService.fetchTrainingDateOptions(),
      ]);
      setStudents(data);
      setDateOptions(options);
      if (options.length > 0 && !options.some((opt) => opt.date === date)) {
        setDate(options[0].date);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo cargar asistencia.');
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    load();
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
        await attendanceService.markPresent(student.id, date);
      }
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo actualizar asistencia.');
    } finally {
      setSubmitting(false);
    }
  }, [date, load]);

  const markAllPresent = useCallback(async () => {
    setSubmitting(true);
    setMessage(null);
    try {
      await attendanceService.setAllPresent(filtered.map((s) => s.id), date);
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
    toggleOne,
    markAllPresent,
    clearDay,
    refresh: load,
  };
}

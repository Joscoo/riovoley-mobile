import { useCallback, useEffect, useMemo, useState } from 'react';
import { attendanceService } from '../services/attendanceService';
import type { PersistedAttendanceReport } from '../types/attendance.types';

export function useAttendanceReports() {
  const [historyDays, setHistoryDays] = useState<Array<{ date: string; count: number }>>([]);
  const [persistedReports, setPersistedReports] = useState<PersistedAttendanceReport[]>([]);
  const [filterDay, setFilterDay] = useState<number | null>(null);
  const [filterMonth, setFilterMonth] = useState<number | null>(null);
  const [filterYear, setFilterYear] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [historyRes, reportsRes] = await Promise.allSettled([
        attendanceService.fetchAttendanceHistoryDays(),
        attendanceService.fetchPersistedReports(),
      ]);

      if (historyRes.status === 'fulfilled') {
        setHistoryDays(historyRes.value);
      } else {
        throw historyRes.reason;
      }

      if (reportsRes.status === 'fulfilled') {
        setPersistedReports(reportsRes.value);
      } else {
        setMessage(reportsRes.reason instanceof Error ? reportsRes.reason.message : 'No se pudo cargar reportes persistidos.');
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo cargar historial.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const years = useMemo(() => {
    const set = new Set<number>();
    historyDays.forEach((d) => set.add(new Date(`${d.date}T00:00:00`).getFullYear()));
    return [...set].sort((a, b) => b - a);
  }, [historyDays]);

  const filteredHistoryDays = useMemo(() => {
    return historyDays.filter((day) => {
      const d = new Date(`${day.date}T00:00:00`);
      if (filterDay && d.getDate() !== filterDay) return false;
      if (filterMonth && d.getMonth() + 1 !== filterMonth) return false;
      if (filterYear && d.getFullYear() !== filterYear) return false;
      return true;
    });
  }, [historyDays, filterDay, filterMonth, filterYear]);

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
    historyDays: filteredHistoryDays,
    persistedReports,
    years,
    filterDay,
    setFilterDay,
    filterMonth,
    setFilterMonth,
    filterYear,
    setFilterYear,
    loading,
    submitting,
    message,
    exportDayReport,
    downloadPersistedReport,
    deletePersistedReport,
    refresh: load,
  };
}

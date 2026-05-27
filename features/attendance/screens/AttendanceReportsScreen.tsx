import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { LoadingState, SectionHeader, ThemedText } from '@/shared/components';
import { colors, spacing } from '@/shared/theme';
import { useAttendanceReports } from '../hooks/useAttendanceReports';

const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('es-EC', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

export default function AttendanceReportsScreen() {
  const {
    historyDays,
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
  } = useAttendanceReports();

  const today = new Date();
  const baseDay = filterDay ?? today.getDate();
  const baseMonth = filterMonth ?? today.getMonth() + 1;
  const baseYear = filterYear ?? today.getFullYear();
  const prevDay = baseDay <= 1 ? 31 : baseDay - 1;
  const nextDay = baseDay >= 31 ? 1 : baseDay + 1;
  const prevMonth = baseMonth <= 1 ? 12 : baseMonth - 1;
  const nextMonth = baseMonth >= 12 ? 1 : baseMonth + 1;
  const prevYear = baseYear - 1;
  const nextYear = baseYear + 1;

  if (loading) return <LoadingState message="Cargando historial de asistencias..." />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <SectionHeader title="Historial y reportes" subtitle="Asistencias registradas y exportables" />

      <View style={styles.section}>
        <ThemedText type="subtitle">Filtro de fecha</ThemedText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          <Pressable style={styles.numChip} onPress={() => setFilterDay(null)}>
            <ThemedText style={styles.numChipText}>Día: todos</ThemedText>
          </Pressable>
          <Pressable style={styles.numChip} onPress={() => setFilterDay(prevDay)}>
            <ThemedText style={styles.numChipText}>{prevDay}</ThemedText>
          </Pressable>
          <Pressable style={[styles.numChip, styles.numChipActive]} onPress={() => setFilterDay(baseDay)}>
            <ThemedText style={styles.numChipText}>{baseDay}</ThemedText>
          </Pressable>
          <Pressable style={styles.numChip} onPress={() => setFilterDay(nextDay)}>
            <ThemedText style={styles.numChipText}>{nextDay}</ThemedText>
          </Pressable>
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          <Pressable style={styles.numChip} onPress={() => setFilterMonth(null)}>
            <ThemedText style={styles.numChipText}>Mes: todos</ThemedText>
          </Pressable>
          <Pressable style={styles.numChip} onPress={() => setFilterMonth(prevMonth)}>
            <ThemedText style={styles.numChipText}>{prevMonth}</ThemedText>
          </Pressable>
          <Pressable style={[styles.numChip, styles.numChipActive]} onPress={() => setFilterMonth(baseMonth)}>
            <ThemedText style={styles.numChipText}>{baseMonth}</ThemedText>
          </Pressable>
          <Pressable style={styles.numChip} onPress={() => setFilterMonth(nextMonth)}>
            <ThemedText style={styles.numChipText}>{nextMonth}</ThemedText>
          </Pressable>
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          <Pressable style={styles.numChip} onPress={() => setFilterYear(null)}>
            <ThemedText style={styles.numChipText}>Año: todos</ThemedText>
          </Pressable>
          <Pressable style={styles.numChip} onPress={() => setFilterYear(prevYear)}>
            <ThemedText style={styles.numChipText}>{prevYear}</ThemedText>
          </Pressable>
          <Pressable style={[styles.numChip, styles.numChipActive]} onPress={() => setFilterYear(baseYear)}>
            <ThemedText style={styles.numChipText}>{baseYear}</ThemedText>
          </Pressable>
          <Pressable style={styles.numChip} onPress={() => setFilterYear(nextYear)}>
            <ThemedText style={styles.numChipText}>{nextYear}</ThemedText>
          </Pressable>
        </ScrollView>
      </View>

      {message ? <ThemedText style={styles.message}>{message}</ThemedText> : null}

      <View style={styles.section}>
        <ThemedText type="subtitle">Reportes persistidos</ThemedText>
        {persistedReports.map((report) => (
          <View key={report.id} style={styles.historyCard}>
            <View>
              <ThemedText style={styles.historyDate}>{formatDate(report.report_date)}</ThemedText>
              <ThemedText style={styles.historyCount}>Estado: {report.status}</ThemedText>
            </View>
            <View style={styles.reportActions}>
              <Pressable style={styles.downloadBtn} onPress={() => void downloadPersistedReport(report)} disabled={submitting}>
                <ThemedText style={styles.exportText}>Descargar</ThemedText>
              </Pressable>
              <Pressable style={styles.deleteBtn} onPress={() => void deletePersistedReport(report.id)} disabled={submitting}>
                <ThemedText style={styles.exportText}>Eliminar</ThemedText>
              </Pressable>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <ThemedText type="subtitle">Historial de asistencias por día</ThemedText>
        {historyDays.map((day) => (
          <View key={day.date} style={styles.historyCard}>
            <View>
              <ThemedText style={styles.historyDate}>{formatDate(day.date)}</ThemedText>
              <ThemedText style={styles.historyCount}>{day.count} asistencia(s)</ThemedText>
            </View>
            <Pressable style={styles.exportBtn} onPress={() => void exportDayReport(day.date)} disabled={submitting}>
              <ThemedText style={styles.exportText}>Exportar</ThemedText>
            </Pressable>
          </View>
        ))}

        {historyDays.length === 0 ? (
          <View style={styles.historyCard}>
            <ThemedText style={styles.historyCount}>No hay sesiones con ese filtro de fecha.</ThemedText>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.riovoley.dark },
  content: { paddingHorizontal: spacing[4], paddingTop: spacing[6], paddingBottom: spacing[8], gap: spacing[3] },
  section: {
    borderWidth: 1,
    borderColor: 'rgba(245,179,58,0.25)',
    borderRadius: 12,
    padding: spacing[3],
    gap: spacing[2],
  },
  filterRow: { flexDirection: 'row', gap: spacing[1], paddingBottom: spacing[1] },
  numChip: {
    borderWidth: 1,
    borderColor: 'rgba(245,179,58,0.35)',
    borderRadius: 999,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  numChipActive: { backgroundColor: 'rgba(245,179,58,0.24)' },
  numChipText: { fontSize: 12, fontWeight: '700' },
  message: { color: '#fcd34d', fontSize: 12 },
  historyCard: {
    borderWidth: 1,
    borderColor: 'rgba(245,179,58,0.2)',
    borderRadius: 10,
    padding: spacing[2],
    backgroundColor: colors.riovoley.cardDarkAlt,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing[2],
  },
  historyDate: { fontWeight: '700' },
  historyCount: { color: colors.riovoley.mutedText, fontSize: 12 },
  exportBtn: {
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.6)',
    borderRadius: 8,
    backgroundColor: 'rgba(16,185,129,0.25)',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
  },
  downloadBtn: {
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.6)',
    borderRadius: 8,
    backgroundColor: 'rgba(16,185,129,0.25)',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
  },
  deleteBtn: {
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.55)',
    borderRadius: 8,
    backgroundColor: 'rgba(127,29,29,0.35)',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
  },
  exportText: { fontSize: 12, fontWeight: '800' },
  reportActions: { flexDirection: 'row', gap: spacing[1] },
});

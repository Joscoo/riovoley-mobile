import { FlatList, StyleSheet, View } from 'react-native';
import { EmptyState, LoadingState, ThemedText } from '@/shared/components';
import { colors, spacing } from '@/shared/theme';
import { useStudentAttendance } from '../hooks/useStudentAttendance';

interface StudentAttendanceViewProps {
  userId: string | null;
}

export function StudentAttendanceView({ userId }: StudentAttendanceViewProps) {
  const { data, loading, error } = useStudentAttendance(userId);

  if (loading) return <LoadingState message="Cargando tu desglose de asistencia..." />;
  if (error) return <EmptyState title="Sin datos" message={error} />;
  if (!data) return <EmptyState title="Sin registros" message="No hay asistencia registrada." />;

  return (
    <View style={styles.container}>
      <View style={styles.summaryCard}>
        <ThemedText type="subtitle">Tu asistencia</ThemedText>
        <ThemedText style={styles.value}>{data.percentage}%</ThemedText>
        <ThemedText style={styles.meta}>Presentes: {data.totalPresent}</ThemedText>
        <ThemedText style={styles.meta}>Sesiones de categoría: {data.totalSessions}</ThemedText>
      </View>

      <ThemedText type="subtitle" style={styles.subtitle}>Días asistidos</ThemedText>
      <FlatList
        data={data.attendedDates}
        keyExtractor={(item, index) => `${item}-${index}`}
        renderItem={({ item }) => (
          <View style={styles.dayRow}>
            <ThemedText>{item}</ThemedText>
          </View>
        )}
        ListEmptyComponent={<EmptyState title="Sin asistencias" message="Aún no tienes días asistidos registrados." />}
        contentContainerStyle={styles.listContent}
      />

      <ThemedText type="subtitle" style={styles.subtitle}>Sesiones faltadas</ThemedText>
      <FlatList
        data={data.missedDates}
        keyExtractor={(item, index) => `missed-${item}-${index}`}
        renderItem={({ item }) => (
          <View style={styles.dayRow}>
            <ThemedText>{item}</ThemedText>
          </View>
        )}
        ListEmptyComponent={<EmptyState title="Sin faltas" message="No tienes sesiones faltadas registradas." />}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  summaryCard: {
    borderWidth: 1,
    borderColor: 'rgba(245,179,58,0.3)',
    borderRadius: 12,
    backgroundColor: colors.riovoley.cardDark,
    padding: spacing[3],
    marginBottom: spacing[3],
  },
  subtitle: { marginBottom: spacing[2] },
  value: { fontSize: 28, fontWeight: '800', marginVertical: spacing[1] },
  meta: { color: colors.riovoley.mutedText, fontSize: 12 },
  dayRow: {
    borderWidth: 1,
    borderColor: 'rgba(245,179,58,0.2)',
    borderRadius: 10,
    padding: spacing[2],
    marginBottom: spacing[2],
    backgroundColor: colors.riovoley.cardDarkAlt,
  },
  listContent: { paddingBottom: spacing[8] },
});

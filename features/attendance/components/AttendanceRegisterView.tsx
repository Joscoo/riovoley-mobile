import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { LoadingState, ThemedText } from '@/shared/components';
import { colors, spacing } from '@/shared/theme';
import { useAttendanceRegister } from '../hooks/useAttendanceRegister';
import { AttendanceStudentCard } from './AttendanceStudentCard';

export function AttendanceRegisterView() {
  const {
    date,
    setDate,
    dateOptions,
    students,
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
  } = useAttendanceRegister();
  if (loading) return <LoadingState message="Cargando control de asistencias..." />;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.datePickerContainer}>
          <ThemedText style={styles.datePickerLabel}>Fecha de entrenamiento</ThemedText>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={dateOptions}
            keyExtractor={(item) => item.key}
            renderItem={({ item }) => (
              <Pressable
                style={[styles.dateChip, date === item.date && styles.dateChipActive]}
                onPress={() => setDate(item.date)}>
                <ThemedText style={styles.dateChipTitle}>{item.label}</ThemedText>
                <ThemedText style={styles.dateChipText}>{item.date}</ThemedText>
                <ThemedText style={styles.dateChipMeta}>{item.timeRange}</ThemedText>
                <ThemedText style={styles.dateChipMeta}>{item.trainingLabel}</ThemedText>
              </Pressable>
            )}
            contentContainerStyle={styles.dateChipList}
          />
        </View>
        <TextInput value={search} onChangeText={setSearch} style={styles.searchInput} placeholder="Buscar atleta" placeholderTextColor={colors.riovoley.mutedText} />
      </View>

      <View style={styles.actionsRow}>
        <Pressable style={styles.actionPrimary} onPress={() => void markAllPresent()} disabled={submitting}>
          <ThemedText style={styles.actionPrimaryText}>Todos presentes</ThemedText>
        </Pressable>
        <Pressable style={styles.actionSecondary} onPress={() => void clearDay()} disabled={submitting}>
          <ThemedText style={styles.actionSecondaryText}>Limpiar día</ThemedText>
        </Pressable>
      </View>

      <View style={styles.chipsRow}>
        <Pressable style={[styles.chip, category === 'all' && styles.chipActive]} onPress={() => setCategory('all')}>
          <ThemedText style={styles.chipText}>Todas</ThemedText>
        </Pressable>
        {categories.map((c) => (
          <Pressable key={c} style={[styles.chip, category === c && styles.chipActive]} onPress={() => setCategory(c)}>
            <ThemedText style={styles.chipText}>{c.replaceAll('_', ' ')}</ThemedText>
          </Pressable>
        ))}
      </View>

      <View style={styles.statsRow}>
        <ThemedText style={styles.stat}>Total: {stats.total}</ThemedText>
        <ThemedText style={styles.stat}>Presentes: {stats.present}</ThemedText>
        <ThemedText style={styles.stat}>Ausentes: {stats.absent}</ThemedText>
        <ThemedText style={styles.stat}>Asistencia: {stats.percentage}%</ThemedText>
      </View>

      {message ? <ThemedText style={styles.message}>{message}</ThemedText> : null}

      <FlatList
        data={students}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <AttendanceStudentCard item={item} disabled={submitting} onToggle={toggleOne} />}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: { gap: spacing[2], marginBottom: spacing[2] },
  datePickerContainer: {
    borderWidth: 1,
    borderColor: 'rgba(245,179,58,0.35)',
    borderRadius: 10,
    padding: spacing[2],
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  datePickerLabel: { fontSize: 12, fontWeight: '700', marginBottom: spacing[1] },
  dateChipList: { gap: spacing[2] },
  dateChip: {
    borderWidth: 1,
    borderColor: 'rgba(245,179,58,0.35)',
    borderRadius: 12,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    minWidth: 148,
  },
  dateChipActive: { backgroundColor: 'rgba(245,179,58,0.22)' },
  dateChipTitle: { fontSize: 12, fontWeight: '800' },
  dateChipText: { fontSize: 12, fontWeight: '700' },
  dateChipMeta: { fontSize: 11, color: colors.riovoley.mutedText },
  searchInput: {
    borderWidth: 1,
    borderColor: 'rgba(245,179,58,0.35)',
    borderRadius: 10,
    color: colors.riovoley.text,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[2],
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  actionsRow: { flexDirection: 'row', gap: spacing[2], marginBottom: spacing[2] },
  actionPrimary: { flex: 1, backgroundColor: '#0d7d53', borderRadius: 10, paddingVertical: spacing[2], alignItems: 'center' },
  actionPrimaryText: { color: '#ecfdf5', fontWeight: '800' },
  actionSecondary: { flex: 1, backgroundColor: 'rgba(127,29,29,0.4)', borderRadius: 10, paddingVertical: spacing[2], alignItems: 'center' },
  actionSecondaryText: { color: '#fee2e2', fontWeight: '800' },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2], marginBottom: spacing[2] },
  chip: { borderWidth: 1, borderColor: 'rgba(245,179,58,0.35)', borderRadius: 999, paddingHorizontal: spacing[2], paddingVertical: spacing[1] },
  chipActive: { backgroundColor: 'rgba(245,179,58,0.22)' },
  chipText: { fontSize: 12, fontWeight: '700' },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2], marginBottom: spacing[2] },
  stat: { fontSize: 12, fontWeight: '700' },
  message: { color: '#fcd34d', marginBottom: spacing[2], fontSize: 12 },
  listContent: { paddingBottom: spacing[8] },
});

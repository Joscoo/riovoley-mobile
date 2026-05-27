import { StyleSheet, View } from 'react-native';
import { ThemedText, AppCard } from '@/shared/components';
import { colors, spacing, fontWeights } from '@/shared/theme';
import type { HomeTraining } from '../types/home.types';

interface NextTrainingCardProps {
  training: HomeTraining[];
  loading?: boolean;
}

function formatCategoryLabel(value: string) {
  return value
    .replaceAll('_', ' ')
    .split(' ')
    .map((word) => (word ? `${word[0].toUpperCase()}${word.slice(1).toLowerCase()}` : ''))
    .join(' ');
}

function formatTime(value: string) {
  const raw = String(value || '').trim();
  if (!raw) return '--:--';
  return raw.slice(0, 5);
}

export function NextTrainingCard({ training, loading }: NextTrainingCardProps) {
  return (
    <AppCard style={[styles.container, styles.cardElevated]}>
      <ThemedText type="subtitle">Horarios de hoy</ThemedText>

      {loading ? <ThemedText style={styles.loadingText}>Cargando...</ThemedText> : null}

      {!loading && training.length === 0 ? (
        <ThemedText style={styles.noData}>No hay entrenamientos programados para hoy</ThemedText>
      ) : null}

      {!loading && training.length > 0 ? (
        <View style={styles.content}>
          {training.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <ThemedText style={styles.categoryText}>{formatCategoryLabel(item.category)}</ThemedText>
              <View style={styles.timeBadge}>
                <ThemedText style={styles.timeText}>{`${formatTime(item.start_time)} - ${formatTime(item.end_time)}`}</ThemedText>
              </View>
            </View>
          ))}
        </View>
      ) : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing[4],
    marginVertical: spacing[3],
  },
  cardElevated: {
    backgroundColor: colors.riovoley.cardDarkAlt,
  },
  content: {
    marginTop: spacing[3],
    gap: spacing[1],
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[2],
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  categoryText: {
    flex: 1,
    marginRight: spacing[2],
    fontWeight: fontWeights.semibold,
  },
  timeBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: 8,
    backgroundColor: 'rgba(245, 179, 58, 0.13)',
    borderWidth: 1,
    borderColor: 'rgba(245, 179, 58, 0.35)',
  },
  timeText: {
    color: colors.riovoley.gold,
    fontWeight: fontWeights.bold,
  },
  noData: {
    marginTop: spacing[2],
    fontStyle: 'italic',
    opacity: 0.85,
  },
  loadingText: {
    marginTop: spacing[2],
    opacity: 0.85,
  },
});

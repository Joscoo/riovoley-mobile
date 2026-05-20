import { StyleSheet, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemedText, AppCard } from '@/shared/components';
import { colors, spacing, fontWeights } from '@/shared/theme';
import type { HomeTraining } from '../types/home.types';

interface NextTrainingCardProps {
  training: HomeTraining | null;
  loading?: boolean;
}

function DetailRow({ icon, label, value }: { icon: keyof typeof MaterialIcons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowLabel}>
        <MaterialIcons name={icon} size={18} color={colors.riovoley.gold} />
        <ThemedText style={styles.label}>{label}</ThemedText>
      </View>
      <ThemedText style={styles.value}>{value}</ThemedText>
    </View>
  );
}

export function NextTrainingCard({ training, loading }: NextTrainingCardProps) {
  return (
    <AppCard style={[styles.container, styles.cardElevated]}>
      <ThemedText type="subtitle">Próximo Entrenamiento</ThemedText>

      {loading ? <ThemedText style={styles.loadingText}>Cargando...</ThemedText> : null}

      {!loading && !training ? <ThemedText style={styles.noData}>No hay entrenamientos programados</ThemedText> : null}

      {!loading && training ? (
        <View style={styles.content}>
          <DetailRow icon="calendar-month" label="Día" value={training.day_of_week} />
          <DetailRow icon="schedule" label="Hora" value={`${training.start_time} - ${training.end_time}`} />
          <DetailRow icon="sports-volleyball" label="Categoría" value={training.category} />
          <DetailRow icon="place" label="Lugar" value={training.location} />
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
    gap: spacing[2],
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[1],
  },
  rowLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  label: {
    fontWeight: fontWeights.semibold,
    fontSize: 14,
  },
  value: {
    flex: 1,
    textAlign: 'right',
    marginLeft: spacing[2],
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

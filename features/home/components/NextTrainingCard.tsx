import { StyleSheet, View } from 'react-native';
import { ThemedText, AppCard } from '@/shared/components';
import { colors, spacing } from '@/shared/theme';
import { HomeTraining } from '../types/home.types';

interface NextTrainingCardProps {
  training: HomeTraining | null;
  loading?: boolean;
}

export function NextTrainingCard({ training, loading }: NextTrainingCardProps) {
  if (loading) {
    return (
      <AppCard style={styles.container}>
        <ThemedText type="subtitle">Próximo Entrenamiento</ThemedText>
        <ThemedText style={styles.loadingText}>Cargando...</ThemedText>
      </AppCard>
    );
  }

  if (!training) {
    return (
      <AppCard style={styles.container}>
        <ThemedText type="subtitle">Próximo Entrenamiento</ThemedText>
        <ThemedText style={styles.noData}>No hay entrenamientos programados</ThemedText>
      </AppCard>
    );
  }

  return (
    <AppCard style={[styles.container, styles.cardElevated]}>
      <ThemedText type="subtitle">Próximo Entrenamiento</ThemedText>

      <View style={styles.content}>
        <View style={styles.row}>
          <ThemedText style={styles.label}>📅 Día:</ThemedText>
          <ThemedText style={styles.value}>{training.day_of_week}</ThemedText>
        </View>

        <View style={styles.row}>
          <ThemedText style={styles.label}>⏰ Hora:</ThemedText>
          <ThemedText style={styles.value}>
            {training.start_time} - {training.end_time}
          </ThemedText>
        </View>

        <View style={styles.row}>
          <ThemedText style={styles.label}>🏐 Categoría:</ThemedText>
          <ThemedText style={styles.value}>{training.category}</ThemedText>
        </View>

        <View style={styles.row}>
          <ThemedText style={styles.label}>📍 Lugar:</ThemedText>
          <ThemedText style={styles.value}>{training.location}</ThemedText>
        </View>
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing[4],
    marginVertical: spacing[3],
  },
  cardElevated: {
    backgroundColor: colors.riovoley.cardDark,
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
  label: {
    fontWeight: '600',
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
    opacity: 0.7,
  },
  loadingText: {
    marginTop: spacing[2],
    opacity: 0.7,
  },
});

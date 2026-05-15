import { StyleSheet, View, ScrollView } from 'react-native';
import { ThemedText, AppCard } from '@/shared/components';
import { colors, spacing } from '@/shared/theme';

interface SummaryMetric {
  label: string;
  value: string | number;
  icon: string;
  color?: string;
}

interface SummaryMetricsProps {
  metrics: SummaryMetric[];
}

export function SummaryMetrics({ metrics }: SummaryMetricsProps) {
  if (metrics.length === 0) return null;

  return (
    <View style={styles.container}>
      <ThemedText type="subtitle" style={styles.title}>
        Resumen Rápido
      </ThemedText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}>
        {metrics.map((metric, index) => (
          <AppCard key={`metric-${index}`} style={styles.card} variant="elevated">
            <View style={styles.content}>
              <ThemedText style={[styles.icon]}>{metric.icon}</ThemedText>
              <ThemedText style={styles.value}>{metric.value}</ThemedText>
              <ThemedText style={styles.label} numberOfLines={1}>
                {metric.label}
              </ThemedText>
            </View>
          </AppCard>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing[4],
  },
  title: {
    paddingHorizontal: spacing[4],
    marginBottom: spacing[2],
  },
  scrollView: {
    marginHorizontal: -spacing[4],
  },
  scrollContent: {
    paddingHorizontal: spacing[4],
    gap: spacing[2],
  },
  card: {
    width: 100,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: spacing[1],
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  icon: {
    fontSize: 32,
    marginBottom: spacing[1],
  },
  value: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: spacing[1],
  },
  label: {
    fontSize: 11,
    textAlign: 'center',
    fontWeight: '500',
  },
});

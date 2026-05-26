import { StyleSheet, View, ScrollView, Pressable } from 'react-native';
import { type ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText, MetricCard } from '@/shared/components';
import { spacing } from '@/shared/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

interface SummaryMetric {
  label: string;
  value: string | number;
  iconName: IconName;
  onPress?: () => void;
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
          <Pressable key={`metric-${index}`} onPress={metric.onPress} disabled={!metric.onPress}>
            <MetricCard label={metric.label} value={metric.value} iconName={metric.iconName} />
          </Pressable>
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
});

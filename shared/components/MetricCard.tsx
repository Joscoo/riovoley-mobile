import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, type ComponentProps } from 'react-native';
import { ThemedText } from './ThemedText';
import { PrimaryCard } from './PrimaryCard';
import { colors, spacing, fontWeights } from '@/shared/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

interface MetricCardProps {
  label: string;
  value: string | number;
  iconName: IconName;
}

export function MetricCard({ label, value, iconName }: MetricCardProps) {
  return (
    <PrimaryCard style={styles.card}>
      <Ionicons name={iconName} size={24} color={colors.riovoley.gold} />
      <ThemedText style={styles.value}>{value}</ThemedText>
      <ThemedText style={styles.label}>{label}</ThemedText>
    </PrimaryCard>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 108,
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[1],
  },
  value: {
    fontWeight: fontWeights.extrabold,
    color: colors.riovoley.text,
  },
  label: {
    fontSize: 12,
    color: colors.riovoley.mutedText,
    fontWeight: fontWeights.semibold,
  },
});

import { StyleSheet, View } from 'react-native';
import { ThemedText } from './ThemedText';
import { colors, fontWeights, spacing, borderRadius } from '@/shared/theme';

interface StatusBadgeProps {
  label: string;
  tone?: 'info' | 'success' | 'warning' | 'danger';
}

export function StatusBadge({ label, tone = 'info' }: StatusBadgeProps) {
  const toneColor = {
    info: colors.riovoley.info,
    success: colors.riovoley.success,
    warning: colors.riovoley.warning,
    danger: colors.riovoley.danger,
  }[tone];

  return (
    <View style={[styles.badge, { borderColor: toneColor, backgroundColor: `${toneColor}22` }]}>
      <ThemedText style={[styles.label, { color: toneColor }]}>{label}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 11,
    fontWeight: fontWeights.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

import { Pressable, StyleSheet, type PressableProps } from 'react-native';
import { ThemedText } from './ThemedText';
import { colors, borderRadius, spacing, fontWeights } from '@/shared/theme';

interface PrimaryActionButtonProps extends PressableProps {
  label: string;
  loading?: boolean;
}

export function PrimaryActionButton({ label, loading = false, style, ...rest }: PrimaryActionButtonProps) {
  return (
    <Pressable style={[styles.button, style]} disabled={loading || rest.disabled} {...rest}>
      <ThemedText style={styles.label}>{loading ? 'Cargando...' : label}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.riovoley.gold,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[4],
  },
  label: {
    color: colors.riovoley.dark,
    fontWeight: fontWeights.extrabold,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
});

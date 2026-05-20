import { StyleSheet, Pressable, type PressableProps } from 'react-native';
import { ThemedText } from './ThemedText';
import { colors, borderRadius, fontWeights } from '@/shared/theme';

export interface AppButtonProps extends PressableProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  loading?: boolean;
}

export function AppButton({ label, variant = 'primary', loading = false, style, ...rest }: AppButtonProps) {
  const palette = {
    primary: { bg: colors.riovoley.gold, text: colors.riovoley.navy, border: colors.riovoley.gold },
    secondary: { bg: colors.riovoley.deepBlue, text: '#fff', border: colors.riovoley.deepBlue },
    danger: { bg: colors.riovoley.danger, text: '#fff', border: colors.riovoley.danger },
    outline: { bg: 'transparent', text: colors.riovoley.pearl, border: colors.riovoley.gold },
  }[variant];

  return (
    <Pressable
      disabled={loading || rest.disabled}
      style={[styles.button, { backgroundColor: palette.bg, borderColor: palette.border }, style]}
      {...rest}>
      <ThemedText style={[styles.label, { color: palette.text }]}>{loading ? 'Cargando...' : label}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  label: {
    fontWeight: fontWeights.extrabold,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
});

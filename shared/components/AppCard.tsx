import { StyleSheet, type ViewProps } from 'react-native';
import { ThemedView } from './ThemedView';
import { borderRadius, colors, spacing } from '@/shared/theme';

export interface AppCardProps extends ViewProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
}

export function AppCard({ children, variant = 'default', style, ...rest }: AppCardProps) {
  return <ThemedView style={[styles.base, styles[variant], style]} {...rest}>{children}</ThemedView>;
}

const styles = StyleSheet.create({
  base: {
    padding: spacing[4],
    borderRadius: borderRadius.lg,
    marginVertical: spacing[2],
    backgroundColor: colors.riovoley.cardDark,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.12)',
  },
  default: {},
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  outlined: {
    borderColor: 'rgba(255, 215, 0, 0.32)',
  },
});

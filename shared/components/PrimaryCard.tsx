import { StyleSheet, type ViewProps } from 'react-native';
import { ThemedView } from './ThemedView';
import { borderRadius, colors, spacing } from '@/shared/theme';

interface PrimaryCardProps extends ViewProps {
  children: React.ReactNode;
}

export function PrimaryCard({ children, style, ...rest }: PrimaryCardProps) {
  return (
    <ThemedView style={[styles.card, style]} {...rest}>
      {children}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.xl,
    backgroundColor: colors.riovoley.cardDark,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
    padding: spacing[4],
  },
});

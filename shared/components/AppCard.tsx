import { StyleSheet, ViewProps } from 'react-native';
import { ThemedView } from './ThemedView';
import { spacing, borderRadius } from '../theme/spacing';

export interface AppCardProps extends ViewProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
}

export function AppCard({ children, variant = 'default', style, ...rest }: AppCardProps) {
  const getStyle = () => {
    switch (variant) {
      case 'elevated':
        return styles.elevated;
      case 'outlined':
        return styles.outlined;
      case 'default':
      default:
        return styles.default;
    }
  };

  return (
    <ThemedView style={[getStyle(), style]} {...rest}>
      {children}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  default: {
    padding: spacing[4],
    borderRadius: borderRadius.md,
    marginVertical: spacing[2],
  },
  elevated: {
    padding: spacing[4],
    borderRadius: borderRadius.md,
    marginVertical: spacing[2],
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  outlined: {
    padding: spacing[4],
    borderRadius: borderRadius.md,
    marginVertical: spacing[2],
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
});

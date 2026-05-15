import { StyleSheet, ViewProps } from 'react-native';
import { ThemedView } from './ThemedView';
import { ThemedText } from './ThemedText';
import { spacing } from '../theme/spacing';

export interface EmptyStateProps extends ViewProps {
  icon?: string;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  title,
  message,
  actionLabel,
  onAction,
  style,
  ...rest
}: EmptyStateProps) {
  return (
    <ThemedView style={[styles.container, style]} {...rest}>
      <ThemedText type="title" style={styles.title}>
        {title}
      </ThemedText>
      {message && (
        <ThemedText style={styles.message}>{message}</ThemedText>
      )}
      {actionLabel && onAction && (
        <ThemedText style={styles.action} onPress={onAction}>
          {actionLabel}
        </ThemedText>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
  },
  title: {
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  message: {
    textAlign: 'center',
    marginBottom: spacing[4],
  },
  action: {
    color: '#0a7ea4',
    fontWeight: '600',
    marginTop: spacing[2],
  },
});

import { StyleSheet, ViewProps } from 'react-native';
import { ThemedView } from './ThemedView';
import { ThemedText } from './ThemedText';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

export interface ErrorStateProps extends ViewProps {
  message: string;
  retryLabel?: string;
  onRetry?: () => void;
}

export function ErrorState({ message, retryLabel = 'Reintentar', onRetry, style, ...rest }: ErrorStateProps) {
  return (
    <ThemedView style={[styles.container, style]} {...rest}>
      <ThemedText style={styles.errorIcon}>⚠️</ThemedText>
      <ThemedText type="title" style={styles.title}>
        Oops, algo salió mal
      </ThemedText>
      <ThemedText style={styles.message}>{message}</ThemedText>
      {onRetry && (
        <ThemedText
          style={[styles.retry, { color: colors.riovoley.primary }]}
          onPress={onRetry}>
          {retryLabel}
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
  errorIcon: {
    fontSize: 48,
    marginBottom: spacing[4],
  },
  title: {
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  message: {
    textAlign: 'center',
    marginBottom: spacing[4],
  },
  retry: {
    fontWeight: '600',
    marginTop: spacing[2],
  },
});

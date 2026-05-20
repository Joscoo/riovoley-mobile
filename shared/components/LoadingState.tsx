import { StyleSheet, ActivityIndicator, ViewProps } from 'react-native';
import { ThemedView } from './ThemedView';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

export interface LoadingStateProps extends ViewProps {
  size?: 'small' | 'large';
  message?: string;
}

export function LoadingState({ size = 'large', message, style, ...rest }: LoadingStateProps) {
  return (
    <ThemedView style={[styles.container, style]} {...rest}>
      <ActivityIndicator size={size} color={colors.riovoley.gold} />
      {message && (
        <ThemedText style={styles.message}>{message}</ThemedText>
      )}
    </ThemedView>
  );
}

import { ThemedText } from './ThemedText';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
  },
  message: {
    marginTop: spacing[4],
    textAlign: 'center',
  },
});


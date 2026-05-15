import { StyleSheet, SafeAreaView, ViewProps } from 'react-native';
import { ThemedView } from './ThemedView';
import { spacing } from '../theme/spacing';

export interface ScreenContainerProps extends ViewProps {
  children: React.ReactNode;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  padding?: number;
}

export function ScreenContainer({
  children,
  padding = spacing[4],
  style,
  ...rest
}: ScreenContainerProps) {
  return (
    <ThemedView style={[styles.container, { padding }, style]} {...rest}>
      {children}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

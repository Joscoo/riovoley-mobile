import { StyleSheet, View } from 'react-native';
import { ThemedText } from './ThemedText';
import { colors, fontWeights, spacing } from '@/shared/theme';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
}

export function SectionHeader({ title, subtitle }: SectionHeaderProps) {
  return (
    <View style={styles.container}>
      <ThemedText style={styles.title}>{title}</ThemedText>
      {subtitle ? <ThemedText style={styles.subtitle}>{subtitle}</ThemedText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing[2],
  },
  title: {
    fontSize: 30,
    fontWeight: fontWeights.black,
    color: colors.riovoley.text,
  },
  subtitle: {
    marginTop: spacing[1],
    fontSize: 14,
    color: colors.riovoley.mutedText,
    fontWeight: fontWeights.semibold,
  },
});

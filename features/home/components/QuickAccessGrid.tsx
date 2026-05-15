import { StyleSheet, View, ScrollView } from 'react-native';
import { ThemedText, AppCard } from '@/shared/components';
import { colors, spacing } from '@/shared/theme';

export interface QuickAccessItem {
  id: string;
  label: string;
  icon: string;
  onPress: () => void;
}

interface QuickAccessGridProps {
  items: QuickAccessItem[];
  columns?: number;
}

export function QuickAccessGrid({ items, columns = 3 }: QuickAccessGridProps) {
  if (items.length === 0) return null;

  // Split items into rows
  const rows: QuickAccessItem[][] = [];
  for (let i = 0; i < items.length; i += columns) {
    rows.push(items.slice(i, i + columns));
  }

  return (
    <View style={styles.container}>
      <ThemedText type="subtitle" style={styles.title}>
        Acceso Rápido
      </ThemedText>
      {rows.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} style={styles.row}>
          {row.map((item) => (
            <AppCard key={item.id} style={styles.card} onPress={item.onPress}>
              <ThemedText style={styles.icon}>{item.icon}</ThemedText>
              <ThemedText style={styles.label}>{item.label}</ThemedText>
            </AppCard>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing[4],
    marginVertical: spacing[4],
  },
  title: {
    marginBottom: spacing[3],
  },
  row: {
    flexDirection: 'row',
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  card: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing[4],
    minHeight: 100,
  },
  icon: {
    fontSize: 32,
    marginBottom: spacing[1],
  },
  label: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
});

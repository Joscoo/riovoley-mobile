import { MaterialIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View, type ComponentProps } from 'react-native';
import { ThemedText, AppCard } from '@/shared/components';
import { spacing, colors, fontWeights } from '@/shared/theme';

export type QuickAccessIcon = ComponentProps<typeof MaterialIcons>['name'];

export interface QuickAccessItem {
  id: string;
  label: string;
  iconName: QuickAccessIcon;
  onPress: () => void;
}

interface QuickAccessGridProps {
  items: QuickAccessItem[];
  columns?: number;
}

export function QuickAccessGrid({ items, columns = 3 }: QuickAccessGridProps) {
  if (items.length === 0) return null;

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
            <Pressable key={item.id} style={styles.pressable} onPress={item.onPress}>
              <AppCard style={styles.card}>
                <MaterialIcons name={item.iconName} size={28} color={colors.riovoley.gold} />
                <ThemedText style={styles.label}>{item.label}</ThemedText>
              </AppCard>
            </Pressable>
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
  pressable: {
    flex: 1,
  },
  card: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing[4],
    minHeight: 102,
  },
  label: {
    marginTop: spacing[1],
    fontSize: 12,
    textAlign: 'center',
    fontWeight: fontWeights.semibold,
    color: colors.riovoley.text,
  },
});

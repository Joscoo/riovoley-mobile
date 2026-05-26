import { Pressable, StyleSheet, View } from 'react-native';
import { ThemedText } from '@/shared/components';
import { colors, spacing } from '@/shared/theme';
import type { AttendanceStudentItem } from '../types/attendance.types';

interface AttendanceStudentCardProps {
  item: AttendanceStudentItem;
  disabled?: boolean;
  onToggle: (item: AttendanceStudentItem) => void;
}

export function AttendanceStudentCard({ item, disabled = false, onToggle }: AttendanceStudentCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <ThemedText type="defaultSemiBold" style={styles.name}>{item.full_name}</ThemedText>
        <View style={[styles.badge, item.present ? styles.present : styles.absent]}>
          <ThemedText style={styles.badgeText}>{item.present ? 'Presente' : 'Ausente'}</ThemedText>
        </View>
      </View>
      <ThemedText style={styles.meta}>{item.categoria?.replaceAll('_', ' ') || 'Sin categoria'}</ThemedText>
      <Pressable style={styles.toggleBtn} onPress={() => onToggle(item)} disabled={disabled}>
        <ThemedText style={styles.toggleText}>{item.present ? 'Marcar ausente' : 'Marcar presente'}</ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: 'rgba(245,179,58,0.28)',
    borderRadius: 12,
    padding: spacing[3],
    backgroundColor: colors.riovoley.cardDarkAlt,
    marginBottom: spacing[2],
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing[2], alignItems: 'center' },
  name: { flex: 1 },
  badge: { borderRadius: 999, paddingHorizontal: spacing[2], paddingVertical: 4 },
  present: { backgroundColor: 'rgba(34,197,94,0.2)' },
  absent: { backgroundColor: 'rgba(239,68,68,0.2)' },
  badgeText: { fontSize: 11, fontWeight: '700' },
  meta: { marginTop: spacing[1], fontSize: 12, color: colors.riovoley.mutedText },
  toggleBtn: {
    marginTop: spacing[2],
    borderWidth: 1,
    borderColor: 'rgba(245,179,58,0.35)',
    borderRadius: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
  },
  toggleText: { color: colors.riovoley.gold, fontSize: 12, fontWeight: '700' },
});

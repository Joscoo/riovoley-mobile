import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppCard, ThemedText } from '@/shared/components';
import { colors, spacing } from '@/shared/theme';
import type { ScheduleItem } from '../types/schedule.types';

interface ScheduleCardProps {
  item: ScheduleItem;
  canEdit: boolean;
  canRemind: boolean;
  onEdit: (item: ScheduleItem) => void;
  onRemind: (item: ScheduleItem) => void;
}

export function ScheduleCard({ item, canEdit, canRemind, onEdit, onRemind }: ScheduleCardProps) {
  const category = (item.category || '').toLowerCase();
  const categoryLabel =
    category === 'open_gym'
      ? 'Open Gym'
      : (item.category || 'Sin categoria').replaceAll('_', ' ');

  return (
    <AppCard style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.badge}>
          <ThemedText style={styles.badgeText}>{categoryLabel}</ThemedText>
        </View>
        <ThemedText style={styles.time}>{item.start_time} - {item.end_time}</ThemedText>
      </View>
      <View style={styles.rowBetween}>
        <ThemedText type="defaultSemiBold">{item.day_of_week}</ThemedText>
        {item.location ? <ThemedText style={styles.location}>{item.location}</ThemedText> : null}
      </View>
      {item.description ? <ThemedText style={styles.description}>{item.description}</ThemedText> : null}

      <View style={styles.actions}>
        {canRemind ? (
          <Pressable style={styles.actionBtn} onPress={() => onRemind(item)}>
            <Ionicons name="notifications-outline" size={16} color={colors.riovoley.gold} />
            <ThemedText style={styles.actionText}>Recordar horario</ThemedText>
          </Pressable>
        ) : null}
        {canEdit ? (
          <Pressable style={styles.actionBtn} onPress={() => onEdit(item)}>
            <Ionicons name="create-outline" size={16} color={colors.riovoley.gold} />
            <ThemedText style={styles.actionText}>Modificar</ThemedText>
          </Pressable>
        ) : null}
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing[2],
    borderWidth: 1,
    borderColor: 'rgba(245,179,58,0.28)',
    backgroundColor: colors.riovoley.cardDarkAlt,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[1] },
  badge: {
    borderWidth: 1,
    borderColor: 'rgba(245,179,58,0.38)',
    borderRadius: 999,
    paddingHorizontal: spacing[2],
    paddingVertical: 4,
    backgroundColor: 'rgba(8,21,59,0.55)',
  },
  badgeText: { fontSize: 11, textTransform: 'capitalize', color: colors.riovoley.pearl, fontWeight: '700' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  time: { color: colors.riovoley.gold, fontWeight: '700' },
  location: { color: colors.riovoley.mutedText, fontSize: 12, marginLeft: spacing[2], flexShrink: 1, textAlign: 'right' },
  description: { marginTop: spacing[1] },
  actions: { marginTop: spacing[2], flexDirection: 'row', gap: spacing[3], flexWrap: 'wrap' },
  actionBtn: { flexDirection: 'row', gap: spacing[1], alignItems: 'center' },
  actionText: { color: colors.riovoley.gold, fontSize: 12, fontWeight: '700' },
});

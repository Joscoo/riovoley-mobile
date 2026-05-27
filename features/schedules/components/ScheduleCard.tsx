import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppCard, ThemedText } from '@/shared/components';
import { colors, spacing } from '@/shared/theme';
import type { ScheduleItem } from '../types/schedule.types';

interface ScheduleCardProps {
  item: ScheduleItem;
  canEdit: boolean;
  canDelete: boolean;
  canRemind: boolean;
  isConfirmingDelete: boolean;
  onEdit: (item: ScheduleItem) => void;
  onDelete: (item: ScheduleItem) => void;
  onCancelDelete: () => void;
  onConfirmDelete: (item: ScheduleItem) => void;
  onRemind: (item: ScheduleItem) => void;
}

export function ScheduleCard({
  item,
  canEdit,
  canDelete,
  canRemind,
  isConfirmingDelete,
  onEdit,
  onDelete,
  onCancelDelete,
  onConfirmDelete,
  onRemind,
}: ScheduleCardProps) {
  const capitalizeFirst = (value: string) => (value ? `${value.charAt(0).toUpperCase()}${value.slice(1)}` : value);
  const formatTime = (value?: string | null) => {
    const raw = String(value || '').trim();
    if (!raw) return '--:--';
    return raw.slice(0, 5);
  };
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
        <ThemedText style={styles.time}>{formatTime(item.start_time)} - {formatTime(item.end_time)}</ThemedText>
      </View>
      <View style={styles.rowBetween}>
        <ThemedText type="defaultSemiBold">{capitalizeFirst(item.day_of_week || '')}</ThemedText>
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
        {canDelete ? (
          <Pressable style={styles.actionBtn} onPress={() => onDelete(item)}>
            <Ionicons name="trash-outline" size={16} color={colors.riovoley.gold} />
            <ThemedText style={styles.actionText}>Eliminar</ThemedText>
          </Pressable>
        ) : null}
      </View>

      {isConfirmingDelete ? (
        <View style={styles.confirmBox}>
          <ThemedText style={styles.confirmText}>¿Seguro que deseas eliminar este horario?</ThemedText>
          <View style={styles.confirmActions}>
            <Pressable style={styles.confirmCancelBtn} onPress={onCancelDelete}>
              <ThemedText style={styles.confirmCancelText}>Cancelar</ThemedText>
            </Pressable>
            <Pressable style={styles.confirmDeleteBtn} onPress={() => onConfirmDelete(item)}>
              <ThemedText style={styles.confirmDeleteText}>Aceptar</ThemedText>
            </Pressable>
          </View>
        </View>
      ) : null}
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
  confirmBox: {
    marginTop: spacing[2],
    borderWidth: 1,
    borderColor: 'rgba(245,179,58,0.28)',
    borderRadius: 10,
    padding: spacing[2],
    backgroundColor: 'rgba(2,12,38,0.35)',
  },
  confirmText: { fontSize: 12, marginBottom: spacing[2] },
  confirmActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing[2] },
  confirmCancelBtn: {
    borderWidth: 1,
    borderColor: 'rgba(245,179,58,0.35)',
    borderRadius: 8,
    paddingHorizontal: spacing[2],
    paddingVertical: 6,
  },
  confirmDeleteBtn: {
    backgroundColor: colors.riovoley.gold,
    borderRadius: 8,
    paddingHorizontal: spacing[2],
    paddingVertical: 6,
  },
  confirmCancelText: { color: colors.riovoley.pearl, fontSize: 12, fontWeight: '700' },
  confirmDeleteText: { color: colors.riovoley.dark, fontSize: 12, fontWeight: '800' },
});

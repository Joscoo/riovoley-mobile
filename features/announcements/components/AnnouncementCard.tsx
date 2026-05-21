import { StyleSheet, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { AppCard, StatusBadge, ThemedText } from '@/shared/components';
import { colors, spacing } from '@/shared/theme';
import type { AnnouncementItem } from '../types/announcement.types';

interface AnnouncementCardProps {
  item: AnnouncementItem;
}

function getPriorityLabel(priority?: string | null) {
  if (priority === 'high') return 'Alta';
  if (priority === 'low') return 'Baja';
  return 'Normal';
}

export function AnnouncementCard({ item }: AnnouncementCardProps) {
  return (
    <AppCard style={styles.card}>
      <View style={styles.headerRow}>
        <MaterialIcons name="campaign" size={18} color={colors.riovoley.gold} />
        <ThemedText type="defaultSemiBold" numberOfLines={1}>
          {item.title}
        </ThemedText>
      </View>
      <View style={styles.badges}>
        <StatusBadge label={`Prioridad: ${getPriorityLabel(item.priority)}`} tone="info" />
        <StatusBadge label={`Dirigido a: ${(item.targetAudience || []).join(', ') || 'all'}`} tone="warning" />
      </View>
      <ThemedText style={styles.content} numberOfLines={3}>
        {item.content || 'Sin contenido adicional.'}
      </ThemedText>
      <ThemedText style={styles.date}>{item.createdAt ? new Date(item.createdAt).toLocaleDateString('es-EC') : ''}</ThemedText>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: { marginVertical: spacing[1] },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  badges: { marginTop: spacing[1], flexDirection: 'row', gap: spacing[2], flexWrap: 'wrap' },
  content: { marginTop: spacing[1], opacity: 0.9 },
  date: { marginTop: spacing[2], color: colors.riovoley.mutedText, fontSize: 12 },
});

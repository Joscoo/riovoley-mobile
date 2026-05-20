import { StyleSheet, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { AppCard, ThemedText } from '@/shared/components';
import { colors, spacing } from '@/shared/theme';
import type { AnnouncementItem } from '../types/announcement.types';

interface AnnouncementCardProps {
  item: AnnouncementItem;
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
      <ThemedText style={styles.content} numberOfLines={3}>
        {item.content || 'Sin contenido adicional.'}
      </ThemedText>
      <ThemedText style={styles.date}>{item.createdAt ? new Date(item.createdAt).toLocaleDateString('es-EC') : ''}</ThemedText>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: spacing[1],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  content: {
    marginTop: spacing[1],
    opacity: 0.9,
  },
  date: {
    marginTop: spacing[2],
    color: colors.riovoley.mutedText,
    fontSize: 12,
  },
});

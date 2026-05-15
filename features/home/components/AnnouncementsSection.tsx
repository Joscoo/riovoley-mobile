import { StyleSheet, View } from 'react-native';
import { ThemedText, AppCard } from '@/shared/components';
import { colors, spacing } from '@/shared/theme';
import { HomeAnnouncement } from '../types/home.types';

interface AnnouncementsSectionProps {
  announcements: HomeAnnouncement[];
  loading?: boolean;
  onViewAll?: () => void;
}

export function AnnouncementsSection({
  announcements,
  loading,
  onViewAll,
}: AnnouncementsSectionProps) {
  const displayItems = announcements.slice(0, 3);
  const hasMore = announcements.length > 3;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="subtitle">Anuncios</ThemedText>
        {hasMore && (
          <ThemedText
            style={[styles.viewAll, { color: colors.riovoley.primary }]}
            onPress={onViewAll}>
            Ver todos
          </ThemedText>
        )}
      </View>

      {loading ? (
        <AppCard>
          <ThemedText style={styles.loadingText}>Cargando anuncios...</ThemedText>
        </AppCard>
      ) : displayItems.length === 0 ? (
        <AppCard>
          <ThemedText style={styles.noData}>No hay anuncios disponibles</ThemedText>
        </AppCard>
      ) : (
        displayItems.map((announcement) => (
          <AppCard key={announcement.id} style={styles.announcement}>
            <ThemedText type="defaultSemiBold" numberOfLines={1}>
              {announcement.title}
            </ThemedText>
            {announcement.content && (
              <ThemedText numberOfLines={2} style={styles.content}>
                {announcement.content}
              </ThemedText>
            )}
          </AppCard>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing[4],
    marginVertical: spacing[3],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  viewAll: {
    fontWeight: '600',
    fontSize: 14,
  },
  announcement: {
    marginVertical: spacing[1],
  },
  content: {
    marginTop: spacing[1],
    opacity: 0.8,
  },
  noData: {
    fontStyle: 'italic',
    opacity: 0.7,
  },
  loadingText: {
    opacity: 0.7,
  },
});

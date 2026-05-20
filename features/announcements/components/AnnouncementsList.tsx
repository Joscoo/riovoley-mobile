import { FlatList, StyleSheet, View } from 'react-native';
import { EmptyState, ErrorState, LoadingState } from '@/shared/components';
import { spacing } from '@/shared/theme';
import type { AnnouncementItem } from '../types/announcement.types';
import { AnnouncementCard } from './AnnouncementCard';

interface AnnouncementsListProps {
  announcements: AnnouncementItem[];
  loading: boolean;
  error: string | null;
}

export function AnnouncementsList({ announcements, loading, error }: AnnouncementsListProps) {
  if (loading) {
    return <LoadingState message="Cargando anuncios..." />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  if (announcements.length === 0) {
    return <EmptyState title="Sin anuncios" message="No hay anuncios activos por ahora." />;
  }

  return (
    <FlatList
      data={announcements}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <AnnouncementCard item={item} />}
      contentContainerStyle={styles.list}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    paddingBottom: spacing[8],
  },
  separator: {
    height: spacing[1],
  },
});

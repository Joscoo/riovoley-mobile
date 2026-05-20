import { StyleSheet, View } from 'react-native';
import { SectionHeader } from '@/shared/components';
import { colors, spacing } from '@/shared/theme';
import { useAnnouncements } from '../hooks/useAnnouncements';
import { AnnouncementsList } from '../components/AnnouncementsList';

export default function AnnouncementsScreen() {
  const { announcements, loading, error } = useAnnouncements();

  return (
    <View style={styles.container}>
      <SectionHeader title="Anuncios" subtitle="Comunicados activos del club" />
      <AnnouncementsList announcements={announcements} loading={loading} error={error} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.riovoley.dark,
    paddingHorizontal: spacing[4],
    paddingTop: spacing[6],
  },
});

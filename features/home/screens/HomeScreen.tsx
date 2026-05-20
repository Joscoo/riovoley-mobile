import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { ParallaxScrollView } from '@/shared/components';
import { spacing } from '@/shared/theme';

import {
  ProfileHeader,
  QuickAccessGrid,
  NextTrainingCard,
  AnnouncementsSection,
  AlertsSection,
  SummaryMetrics,
} from '../components';
import { useUserProfile } from '../hooks/useUserProfile';
import { useNextTraining } from '../hooks/useNextTraining';
import { useAttendance } from '../hooks/useAttendance';
import { usePaymentStatus } from '../hooks/usePaymentStatus';
import { useAnnouncements } from '@/features/announcements/hooks/useAnnouncements';
import type { QuickAccessItem } from '../components/QuickAccessGrid';

export default function HomeScreen() {
  const router = useRouter();
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | undefined>();

  const { profile } = useUserProfile(userId);
  const { announcements, loading: announcementsLoading } = useAnnouncements(3);
  const { training, loading: trainingLoading } = useNextTraining(userId);
  const { attendance } = useAttendance(userId);
  const { paymentStatus, loading: paymentLoading } = usePaymentStatus(userId);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;

      setSessionEmail(data.session?.user?.email ?? null);
      setUserId(data.session?.user?.id);
    };

    init();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSessionEmail(nextSession?.user?.email ?? null);
      setUserId(nextSession?.user?.id);
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const quickAccessItems: QuickAccessItem[] = [
    { id: 'profile', label: 'Perfil', iconName: 'person-circle-outline', onPress: () => router.push('/(tabs)/profile') },
    { id: 'announcements', label: 'Anuncios', iconName: 'megaphone-outline', onPress: () => router.push('/(tabs)/announcements') },
    { id: 'athletes', label: 'Atletas', iconName: 'people-outline', onPress: () => router.push('/(tabs)/athletes') },
  ];

  const summaryMetrics = [
    { label: 'Asistencia', value: `${attendance?.percentage ?? 0}%`, iconName: 'checkmark-circle-outline' as const },
    { label: 'Próximo', value: training ? training.day_of_week.slice(0, 3) : 'N/A', iconName: 'calendar-outline' as const },
    {
      label: 'Pago',
      value: paymentLoading ? '...' : paymentStatus?.pending ? 'Pendiente' : 'Al día',
      iconName: 'card-outline' as const,
    },
    { label: 'Anuncios', value: announcements.length, iconName: 'megaphone-outline' as const },
  ];

  const alerts = [
    ...(attendance && !attendance.attended
      ? [{ type: 'warning' as const, message: 'Asistencia pendiente esta semana' }]
      : []),
    ...(paymentStatus?.pending
      ? [
          {
            type: 'warning' as const,
            message: `Pago pendiente${paymentStatus.amount ? ` de $${paymentStatus.amount}` : ''}`,
          },
        ]
      : []),
    ...(announcements.length > 0
      ? [{ type: 'info' as const, message: `${announcements.length} nuevo(s) anuncio(s)` }]
      : []),
  ];

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#294B96', dark: '#1B3470' }}
      stickyHeader={
        <View style={styles.stickyBar}>
          <Image source={require('@/assets/images/logoRio.png')} style={styles.stickyLogo} contentFit="contain" />
        </View>
      }
      headerImage={
        <View style={styles.headerImage}>
          <View style={styles.metalLayerPrimary} />
          <View style={styles.metalLayerSecondary} />
          <View style={styles.nacarGlowTop} />
          <View style={styles.nacarGlowBottom} />
          <View style={styles.goldLine} />

          <View style={styles.brandPlate}>
            <Image source={require('@/assets/images/logoRio.png')} style={styles.logo} contentFit="contain" />
          </View>
        </View>
      }>
      <ProfileHeader name={profile?.full_name ?? null} role={profile?.role ?? null} email={sessionEmail} />

      <SummaryMetrics metrics={summaryMetrics} />
      <NextTrainingCard training={training} loading={trainingLoading} />
      <QuickAccessGrid items={quickAccessItems} columns={3} />
      <AnnouncementsSection
        announcements={announcements.map((a) => ({
          id: a.id,
          title: a.title,
          content: a.content ?? undefined,
          created_at: a.createdAt ?? undefined,
        }))}
        loading={announcementsLoading}
        onViewAll={() => router.push('/(tabs)/announcements')}
      />
      <AlertsSection alerts={alerts} />
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: '#274A96',
  },
  metalLayerPrimary: {
    position: 'absolute',
    top: -110,
    left: -100,
    width: 440,
    height: 260,
    borderRadius: 180,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    transform: [{ rotate: '-9deg' }],
  },
  metalLayerSecondary: {
    position: 'absolute',
    right: -95,
    bottom: -90,
    width: 360,
    height: 250,
    borderRadius: 170,
    backgroundColor: 'rgba(20, 40, 90, 0.40)',
    transform: [{ rotate: '14deg' }],
  },
  nacarGlowTop: {
    position: 'absolute',
    top: 10,
    right: 20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 238, 194, 0.34)',
  },
  nacarGlowBottom: {
    position: 'absolute',
    bottom: 12,
    left: 32,
    width: 98,
    height: 98,
    borderRadius: 49,
    backgroundColor: 'rgba(245, 179, 58, 0.26)',
  },
  goldLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 2,
    backgroundColor: 'rgba(245, 179, 58, 0.60)',
  },
  brandPlate: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 243, 201, 0.52)',
    backgroundColor: 'rgba(18, 53, 120, 0.40)',
  },
  logo: {
    width: 176,
    height: 54,
  },
  stickyBar: {
    height: 58,
    paddingTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(23, 51, 112, 0.97)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(245, 179, 58, 0.55)',
  },
  stickyLogo: {
    width: 108,
    height: 30,
  },
});

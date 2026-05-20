import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { supabase } from '@/lib/supabase';
import { ParallaxScrollView, ThemedText } from '@/shared/components';
import { spacing, colors, fontWeights } from '@/shared/theme';

import {
  ProfileHeader,
  QuickAccessGrid,
  NextTrainingCard,
  AnnouncementsSection,
  AlertsSection,
  SummaryMetrics,
} from '../components';
import { useUserProfile } from '../hooks/useUserProfile';
import { useAnnouncements } from '../hooks/useAnnouncements';
import { useNextTraining } from '../hooks/useNextTraining';
import { useAttendance } from '../hooks/useAttendance';
import { usePaymentStatus } from '../hooks/usePaymentStatus';
import type { QuickAccessItem } from '../components/QuickAccessGrid';

export default function HomeScreen() {
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
    { id: 'schedules', label: 'Horarios', iconName: 'calendar-month', onPress: () => console.log('Navigate to schedules') },
    { id: 'attendance', label: 'Asistencia', iconName: 'check-circle', onPress: () => console.log('Navigate to attendance') },
    { id: 'payments', label: 'Pagos', iconName: 'credit-card', onPress: () => console.log('Navigate to payments') },
    { id: 'progress', label: 'Progreso', iconName: 'trending-up', onPress: () => console.log('Navigate to progress') },
    { id: 'announcements', label: 'Anuncios', iconName: 'campaign', onPress: () => console.log('Navigate to announcements') },
    { id: 'profile', label: 'Perfil', iconName: 'person', onPress: () => console.log('Navigate to profile') },
  ];

  const summaryMetrics = [
    { label: 'Asistencia', value: `${attendance?.percentage ?? 0}%`, iconName: 'check-circle' as const },
    { label: 'Próximo', value: training ? training.day_of_week.slice(0, 3) : 'N/A', iconName: 'calendar-month' as const },
    {
      label: 'Pago',
      value: paymentLoading ? '...' : paymentStatus?.pending ? 'Pendiente' : 'Al día',
      iconName: 'credit-card' as const,
    },
    { label: 'Anuncios', value: announcements.length, iconName: 'campaign' as const },
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
      headerBackgroundColor={{ light: '#153E7D', dark: '#0E2B5A' }}
      headerImage={
        <View style={styles.headerImage}>
          <View style={styles.metalLayerPrimary} />
          <View style={styles.metalLayerSecondary} />
          <View style={styles.nacarGlowTop} />
          <View style={styles.nacarGlowBottom} />

          <View style={styles.brandPlate}>
            <Image source={require('@/assets/images/logoRiovoley.jpg')} style={styles.logo} contentFit="cover" />
            <ThemedText type="title" style={styles.headerText}>
              RioVoley
            </ThemedText>
          </View>
        </View>
      }>
      <ProfileHeader name={profile?.full_name ?? null} role={profile?.role ?? null} email={sessionEmail} />

      <SummaryMetrics metrics={summaryMetrics} />
      <NextTrainingCard training={training} loading={trainingLoading} />
      <QuickAccessGrid items={quickAccessItems} columns={3} />
      <AnnouncementsSection
        announcements={announcements}
        loading={announcementsLoading}
        onViewAll={() => console.log('View all announcements')}
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
  },
  metalLayerPrimary: {
    position: 'absolute',
    top: -80,
    left: -40,
    width: 320,
    height: 220,
    borderRadius: 140,
    backgroundColor: 'rgba(255,255,255,0.09)',
    transform: [{ rotate: '-8deg' }],
  },
  metalLayerSecondary: {
    position: 'absolute',
    right: -70,
    bottom: -70,
    width: 300,
    height: 200,
    borderRadius: 130,
    backgroundColor: 'rgba(7, 22, 49, 0.36)',
    transform: [{ rotate: '14deg' }],
  },
  nacarGlowTop: {
    position: 'absolute',
    top: 22,
    right: 26,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 215, 0, 0.18)',
  },
  nacarGlowBottom: {
    position: 'absolute',
    bottom: 16,
    left: 38,
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255, 239, 186, 0.20)',
  },
  brandPlate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.34)',
    backgroundColor: 'rgba(7, 20, 44, 0.40)',
  },
  logo: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 236, 170, 0.85)',
  },
  headerText: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: fontWeights.black,
    textShadowColor: 'rgba(0, 0, 0, 0.35)',
    textShadowRadius: 8,
    textShadowOffset: { width: 0, height: 2 },
  },
});

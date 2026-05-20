import { useEffect, useState } from 'react';
import { Button, StyleSheet, View } from 'react-native';
import { supabase } from '@/lib/supabase';
import { ParallaxScrollView, ThemedText } from '@/shared/components';
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
import { useAnnouncements } from '../hooks/useAnnouncements';
import { useNextTraining } from '../hooks/useNextTraining';
import { useAttendance } from '../hooks/useAttendance';
import { usePaymentStatus } from '../hooks/usePaymentStatus';
import type { QuickAccessItem } from '../components/QuickAccessGrid';

export default function HomeScreen() {
  const [loading, setLoading] = useState(false);
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

      const currentEmail = data.session?.user?.email ?? null;
      const currentUserId = data.session?.user?.id;
      setSessionEmail(currentEmail);
      setUserId(currentUserId);
    };

    init();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, nextSession) => {
        const nextEmail = nextSession?.user?.email ?? null;
        const nextUserId = nextSession?.user?.id;
        setSessionEmail(nextEmail);
        setUserId(nextUserId);
      },
    );

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setLoading(false);
  };

  const quickAccessItems: QuickAccessItem[] = [
    {
      id: 'schedules',
      label: 'Horarios',
      icon: '??',
      onPress: () => console.log('Navigate to schedules'),
    },
    {
      id: 'attendance',
      label: 'Asistencia',
      icon: '?',
      onPress: () => console.log('Navigate to attendance'),
    },
    {
      id: 'payments',
      label: 'Pagos',
      icon: '??',
      onPress: () => console.log('Navigate to payments'),
    },
    {
      id: 'progress',
      label: 'Progreso',
      icon: '??',
      onPress: () => console.log('Navigate to progress'),
    },
    {
      id: 'announcements',
      label: 'Anuncios',
      icon: '??',
      onPress: () => console.log('Navigate to announcements'),
    },
    {
      id: 'profile',
      label: 'Perfil',
      icon: '??',
      onPress: () => console.log('Navigate to profile'),
    },
  ];

  const summaryMetrics = [
    {
      label: 'Asistencia',
      value: `${attendance?.percentage ?? 0}%`,
      icon: '?',
    },
    {
      label: 'Próximo',
      value: training ? training.day_of_week.slice(0, 3) : 'N/A',
      icon: '??',
    },
    {
      label: 'Pago',
      value: paymentLoading ? '...' : paymentStatus?.pending ? 'Pendiente' : 'Al día',
      icon: '??',
    },
    {
      label: 'Anuncios',
      value: announcements.length,
      icon: '??',
    },
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
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <View style={styles.headerImage}>
          <ThemedText type="title" style={styles.headerText}>
            ?? RioVoley
          </ThemedText>
        </View>
      }>
      <ProfileHeader
        name={profile?.full_name ?? null}
        role={profile?.role ?? null}
        email={sessionEmail}
      />

      <View style={styles.signOutContainer}>
        <Button title="Cerrar sesión" onPress={handleSignOut} disabled={loading} />
      </View>

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
  },
  headerText: {
    color: '#fff',
  },
  signOutContainer: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
  },
});

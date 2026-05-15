import { useEffect, useState } from 'react';
import { Button, Platform, StyleSheet, View, ScrollView } from 'react-native';
import { supabase } from '@/lib/supabase';
import { ParallaxScrollView, ThemedText, ThemedView } from '@/shared/components';
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
import { useAttendance } from '../hooks/usePaymentStatus';
import type { QuickAccessItem } from '../components/QuickAccessGrid';
import { Image } from 'expo-image';

export default function HomeScreen() {
  const [loading, setLoading] = useState(false);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | undefined>();

  // Hooks for data
  const { profile, loading: profileLoading } = useUserProfile(userId);
  const { announcements, loading: announcementsLoading } = useAnnouncements(3);
  const { training, loading: trainingLoading } = useNextTraining(userId);
  const { attendance, loading: attendanceLoading } = useAttendance(userId);

  // Initialize session
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

  // Quick access items
  const quickAccessItems: QuickAccessItem[] = [
    {
      id: 'schedules',
      label: 'Horarios',
      icon: '📅',
      onPress: () => console.log('Navigate to schedules'),
    },
    {
      id: 'attendance',
      label: 'Asistencia',
      icon: '✅',
      onPress: () => console.log('Navigate to attendance'),
    },
    {
      id: 'payments',
      label: 'Pagos',
      icon: '💳',
      onPress: () => console.log('Navigate to payments'),
    },
    {
      id: 'progress',
      label: 'Progreso',
      icon: '📈',
      onPress: () => console.log('Navigate to progress'),
    },
    {
      id: 'announcements',
      label: 'Anuncios',
      icon: '📢',
      onPress: () => console.log('Navigate to announcements'),
    },
    {
      id: 'profile',
      label: 'Perfil',
      icon: '👤',
      onPress: () => console.log('Navigate to profile'),
    },
  ];

  // Summary metrics
  const summaryMetrics = [
    {
      label: 'Asistencia',
      value: `${attendance?.percentage ?? 0}%`,
      icon: '✅',
    },
    {
      label: 'Próximo',
      value: training ? training.day_of_week.slice(0, 3) : 'N/A',
      icon: '📅',
    },
    {
      label: 'Anuncios',
      value: announcements.length,
      icon: '📢',
    },
  ];

  // Alerts
  const alerts = [
    ...(attendance && !attendance.attended ? [{ type: 'warning' as const, message: 'Asistencia pendiente esta semana' }] : []),
    ...(announcements.length > 0 ? [{ type: 'info' as const, message: `${announcements.length} nuevo(s) anuncio(s)` }] : []),
  ];

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <View style={styles.headerImage}>
          {/* RioVoley branding could go here */}
          <ThemedText type="title" style={styles.headerText}>
            🏐 RioVoley
          </ThemedText>
        </View>
      }>
      {/* Profile Header */}
      <ProfileHeader
        name={profile?.full_name ?? null}
        role={profile?.role ?? null}
        email={sessionEmail}
      />

      {/* Sign Out Button (temporary, for testing) */}
      <View style={styles.signOutContainer}>
        <Button title="Cerrar sesión" onPress={handleSignOut} disabled={loading} />
      </View>

      {/* Summary Metrics */}
      <SummaryMetrics metrics={summaryMetrics} />

      {/* Next Training */}
      <NextTrainingCard training={training} loading={trainingLoading} />

      {/* Quick Access Grid */}
      <QuickAccessGrid items={quickAccessItems} columns={3} />

      {/* Announcements */}
      <AnnouncementsSection
        announcements={announcements}
        loading={announcementsLoading}
        onViewAll={() => console.log('View all announcements')}
      />

      {/* Alerts */}
      <AlertsSection alerts={alerts} />

      {/* Debug Info (remove in production) */}
      <ThemedView style={styles.debugContainer}>
        <ThemedText type="subtitle">Debug Info</ThemedText>
        <ThemedText>Session: {sessionEmail || 'No session'}</ThemedText>
        <ThemedText>Profile Loading: {profileLoading ? 'yes' : 'no'}</ThemedText>
        <ThemedText>Announcements: {announcements.length}</ThemedText>
      </ThemedView>
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
  debugContainer: {
    marginHorizontal: spacing[4],
    marginVertical: spacing[4],
    padding: spacing[3],
    borderRadius: 8,
    opacity: 0.6,
  },
});

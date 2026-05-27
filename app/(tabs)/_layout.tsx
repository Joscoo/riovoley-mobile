import { Redirect, Tabs } from 'expo-router';
import React, { useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, View } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { colors } from '@/shared/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSessionRole } from '@/shared/auth/useSessionRole';
import { canAccessAthletes } from '@/shared/navigation/roleTabs';
import { bootstrapCategoryTrainingReminders, bootstrapPaymentReminders, registerForPushNotifications } from '@/shared/notifications/pushNotifications';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { loading, hasSession, role, userId } = useSessionRole();

  useEffect(() => {
    if (!userId) return;
    registerForPushNotifications(userId).catch(() => {});
    bootstrapCategoryTrainingReminders(userId).catch(() => {});
    bootstrapPaymentReminders(userId).catch(() => {});
  }, [userId]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.riovoley.dark }}>
        <ActivityIndicator color={colors.riovoley.gold} />
      </View>
    );
  }
  if (!hasSession) return <Redirect href="/login" />;

  const showAthletes = canAccessAthletes(role);
  const showAnnouncements = role !== 'administrador';

  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{
        tabBarActiveTintColor: colors[colorScheme ?? 'dark'].tabIconSelected,
        tabBarInactiveTintColor: colors[colorScheme ?? 'dark'].tabIconDefault,
        tabBarStyle: {
          backgroundColor: colors.riovoley.navy,
          borderTopColor: 'rgba(245, 179, 58, 0.35)',
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
        },
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarLabelStyle: { fontWeight: '700' },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => <Ionicons size={size} name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="announcements"
        options={{
          href: showAnnouncements ? undefined : null,
          title: 'Anuncios',
          tabBarIcon: ({ color, size }) => <Ionicons size={size} name="megaphone" color={color} />,
        }}
      />
      <Tabs.Screen
        name="payments"
        options={{
          href: null,
          title: 'Pagos',
          tabBarIcon: ({ color, size }) => <Ionicons size={size} name="card" color={color} />,
        }}
      />
      <Tabs.Screen
        name="schedules"
        options={{
          title: 'Horarios',
          tabBarIcon: ({ color, size }) => <Ionicons size={size} name="calendar" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => <Ionicons size={size} name="person" color={color} />,
        }}
      />
      <Tabs.Screen
        name="athletes"
        options={{
          href: showAthletes ? undefined : null,
          title: 'Atletas',
          tabBarIcon: ({ color, size }) => <Ionicons size={size} name="people" color={color} />,
        }}
      />
      <Tabs.Screen name="attendance" options={{ href: null }} />
      <Tabs.Screen name="attendance-reports" options={{ href: null }} />
      <Tabs.Screen name="explore" options={{ href: null }} />
    </Tabs>
  );
}

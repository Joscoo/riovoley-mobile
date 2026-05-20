import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { EmptyState, ErrorState, LoadingState, PrimaryActionButton, SectionHeader, ThemedText } from '@/shared/components';
import { colors, spacing } from '@/shared/theme';
import { useProfile } from '../hooks/useProfile';
import { ProfileInfoCard } from '../components/ProfileInfoCard';

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, loading, error } = useProfile();
  const [signOutLoading, setSignOutLoading] = useState(false);

  const handleSignOut = async () => {
    setSignOutLoading(true);
    await supabase.auth.signOut();
    setSignOutLoading(false);
    router.replace('/login');
  };

  return (
    <View style={styles.container}>
      <SectionHeader title="Perfil" subtitle="Información de tu cuenta" />

      {loading ? <LoadingState message="Cargando perfil..." /> : null}
      {!loading && error ? <ErrorState message={error} /> : null}
      {!loading && !error && !profile ? <EmptyState title="Sin datos" message="No se encontró información del perfil." /> : null}
      {!loading && !error && profile ? <ProfileInfoCard profile={profile} /> : null}

      <View style={styles.footer}>
        <ThemedText style={styles.footerText}>¿Quieres salir de tu cuenta?</ThemedText>
        <PrimaryActionButton label="Cerrar sesión" loading={signOutLoading} onPress={handleSignOut} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.riovoley.dark,
    paddingHorizontal: spacing[4],
    paddingTop: spacing[6],
    gap: spacing[3],
  },
  footer: {
    marginTop: 'auto',
    gap: spacing[2],
    paddingBottom: spacing[6],
  },
  footerText: {
    color: colors.riovoley.mutedText,
  },
});

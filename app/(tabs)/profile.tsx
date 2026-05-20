import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { ThemedText, PrimaryActionButton, PrimaryCard, SectionHeader } from '@/shared/components';
import { colors, spacing, fontWeights } from '@/shared/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSignOut = async () => {
    setLoading(true);
    setError(null);
    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      setError('No se pudo cerrar sesión. Intenta nuevamente.');
      setLoading(false);
      return;
    }

    router.replace('/login');
  };

  return (
    <View style={styles.screen}>
      <SectionHeader title="Perfil" subtitle="Gestiona tu cuenta y sesión" />

      <PrimaryCard style={styles.card}>
        <View style={styles.row}>
          <MaterialIcons name="logout" size={22} color={colors.riovoley.gold} />
          <ThemedText style={styles.cardTitle}>Cerrar sesión</ThemedText>
        </View>
        <ThemedText style={styles.cardSubtitle}>
          Esta acción cerrará tu sesión actual y te llevará al inicio de sesión.
        </ThemedText>

        {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}

        <PrimaryActionButton label="Cerrar sesión" loading={loading} onPress={onSignOut} />
      </PrimaryCard>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.riovoley.dark,
    paddingHorizontal: spacing[4],
    paddingTop: spacing[6],
  },
  card: {
    gap: spacing[3],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: fontWeights.extrabold,
  },
  cardSubtitle: {
    color: colors.riovoley.mutedText,
  },
  error: {
    color: colors.riovoley.danger,
    fontWeight: fontWeights.semibold,
  },
});

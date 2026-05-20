import { MaterialIcons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { ThemedText, PrimaryCard, StatusBadge } from '@/shared/components';
import { colors, spacing } from '@/shared/theme';
import { getRoleLabel } from '@/shared/permissions/rolePermissions';
import type { ProfileData } from '../types/profile.types';

interface ProfileInfoCardProps {
  profile: ProfileData;
}

export function ProfileInfoCard({ profile }: ProfileInfoCardProps) {
  return (
    <PrimaryCard style={styles.card}>
      <View style={styles.headerRow}>
        <MaterialIcons name="person" size={28} color={colors.riovoley.gold} />
        <ThemedText type="subtitle">Mi Perfil</ThemedText>
      </View>

      <View style={styles.field}>
        <ThemedText style={styles.label}>Nombre</ThemedText>
        <ThemedText style={styles.value}>{profile.fullName || 'No disponible'}</ThemedText>
      </View>

      <View style={styles.field}>
        <ThemedText style={styles.label}>Correo</ThemedText>
        <ThemedText style={styles.value}>{profile.email || 'No disponible'}</ThemedText>
      </View>

      <View style={styles.field}>
        <ThemedText style={styles.label}>Rol</ThemedText>
        <StatusBadge label={profile.role ? getRoleLabel(profile.role as never) : 'Sin rol'} tone="info" />
      </View>
    </PrimaryCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing[3],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  field: {
    gap: spacing[1],
  },
  label: {
    color: colors.riovoley.mutedText,
    fontSize: 13,
  },
  value: {
    fontSize: 17,
  },
});

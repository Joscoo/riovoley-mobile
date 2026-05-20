import { StyleSheet, View } from 'react-native';
import { ThemedText, ThemedView, StatusBadge } from '@/shared/components';
import { colors, spacing, fontWeights } from '@/shared/theme';
import { getRoleLabel } from '@/shared/permissions/rolePermissions';

interface ProfileHeaderProps {
  name: string | null;
  role: string | null;
  email: string | null;
}

export function ProfileHeader({ name, role, email }: ProfileHeaderProps) {
  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.greeting}>¡Bienvenido!</ThemedText>
        <ThemedText style={styles.name}>{name || 'Usuario'}</ThemedText>
      </View>

      <View style={styles.roleContainer}>
        <ThemedText style={styles.roleLabel}>Rol:</ThemedText>
        <StatusBadge label={role ? getRoleLabel(role as never) : 'Sin rol'} tone="warning" />
      </View>

      {email ? (
        <ThemedText style={styles.email} type="defaultSemiBold">
          {email}
        </ThemedText>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[4],
    marginBottom: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(245, 179, 58, 0.25)',
  },
  header: {
    marginBottom: spacing[2],
  },
  greeting: {
    marginBottom: spacing[1],
    fontSize: 42,
    fontWeight: fontWeights.black,
    color: colors.riovoley.text,
    lineHeight: 44,
  },
  name: {
    fontSize: 28,
    fontWeight: fontWeights.extrabold,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing[1],
    gap: spacing[2],
  },
  roleLabel: {
    fontWeight: fontWeights.semibold,
  },
  email: {
    fontSize: 13,
    opacity: 0.9,
    marginTop: spacing[1],
  },
});

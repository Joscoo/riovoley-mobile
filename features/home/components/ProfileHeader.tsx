import { StyleSheet, View } from 'react-native';
import { ThemedText, ThemedView } from '@/shared/components';
import { colors, spacing } from '@/shared/theme';
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
        <ThemedText type="title" style={styles.greeting}>
          ¡Bienvenido!
        </ThemedText>
        <ThemedText style={styles.name}>{name || 'Usuario'}</ThemedText>
      </View>

      <View style={styles.roleContainer}>
        <ThemedText style={styles.roleLabel}>Rol:</ThemedText>
        <ThemedText style={[styles.roleValue, { color: colors.riovoley.primary }]}>
          {role ? getRoleLabel(role as any) : 'Sin rol'}
        </ThemedText>
      </View>

      {email && (
        <ThemedText style={styles.email} type="defaultSemiBold">
          {email}
        </ThemedText>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[4],
    marginBottom: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(100, 100, 100, 0.2)',
  },
  header: {
    marginBottom: spacing[2],
  },
  greeting: {
    marginBottom: spacing[1],
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing[1],
  },
  roleLabel: {
    marginRight: spacing[2],
    fontWeight: '500',
  },
  roleValue: {
    fontWeight: '600',
  },
  email: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: spacing[1],
  },
});

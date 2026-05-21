import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppCard, ThemedText } from '@/shared/components';
import { colors, spacing } from '@/shared/theme';
import type { AthleteItem } from '../types/athletes.types';

interface AthleteCardProps {
  athlete: AthleteItem;
  canDelete: boolean;
  submitting: boolean;
  isConfirmingDelete: boolean;
  onEdit: (athlete: AthleteItem) => void;
  onSuspendToggle: (athlete: AthleteItem) => void;
  onResendCredentials: (athlete: AthleteItem) => void;
  onDeleteRequest: (athlete: AthleteItem) => void;
  onDeleteCancel: () => void;
  onDeleteConfirm: (athlete: AthleteItem) => void;
}

const formatCategory = (value: string | null) => (value || '--').replaceAll('_', ' ');

export function AthleteCard({
  athlete,
  canDelete,
  submitting,
  isConfirmingDelete,
  onEdit,
  onSuspendToggle,
  onResendCredentials,
  onDeleteRequest,
  onDeleteCancel,
  onDeleteConfirm,
}: AthleteCardProps) {
  return (
    <AppCard style={styles.card}>
      <View style={styles.headerRow}>
        <ThemedText type="defaultSemiBold" style={styles.title}>{athlete.full_name}</ThemedText>
        <View style={[styles.statusBadge, athlete.suspended ? styles.suspended : styles.active]}>
          <ThemedText style={styles.statusText}>{athlete.suspended ? 'Suspendido' : 'Activo'}</ThemedText>
        </View>
      </View>

      <ThemedText style={styles.meta}>{athlete.email}</ThemedText>
      <ThemedText style={styles.meta}>Telefono: {athlete.telefono}</ThemedText>
      <ThemedText style={styles.meta}>Categoria: {formatCategory(athlete.categoria)}</ThemedText>
      <ThemedText style={styles.meta}>Nacimiento: {athlete.fecha_nacimiento || '--'}</ThemedText>

      <View style={styles.actionsRow}>
        <Pressable style={styles.actionBtn} onPress={() => onEdit(athlete)} disabled={submitting}>
          <Ionicons name="create-outline" size={16} color={colors.riovoley.gold} />
          <ThemedText style={styles.actionText}>Editar</ThemedText>
        </Pressable>

        <Pressable style={styles.actionBtn} onPress={() => onSuspendToggle(athlete)} disabled={submitting}>
          <Ionicons name={athlete.suspended ? 'checkmark-circle-outline' : 'ban-outline'} size={16} color={colors.riovoley.gold} />
          <ThemedText style={styles.actionText}>{athlete.suspended ? 'Reactivar' : 'Suspender'}</ThemedText>
        </Pressable>

        <Pressable style={styles.actionBtn} onPress={() => onResendCredentials(athlete)} disabled={submitting}>
          <Ionicons name="mail-outline" size={16} color={colors.riovoley.gold} />
          <ThemedText style={styles.actionText}>Reenviar credenciales</ThemedText>
        </Pressable>

        {canDelete ? (
          <Pressable style={styles.actionBtn} onPress={() => onDeleteRequest(athlete)} disabled={submitting}>
            <Ionicons name="trash-outline" size={16} color={colors.riovoley.gold} />
            <ThemedText style={styles.actionText}>Eliminar</ThemedText>
          </Pressable>
        ) : null}
      </View>

      {isConfirmingDelete ? (
        <View style={styles.confirmBox}>
          <ThemedText style={styles.confirmText}>¿Seguro que deseas eliminar este atleta?</ThemedText>
          <View style={styles.confirmActions}>
            <Pressable style={styles.cancelBtn} onPress={onDeleteCancel}>
              <ThemedText style={styles.cancelText}>Cancelar</ThemedText>
            </Pressable>
            <Pressable style={styles.deleteBtn} onPress={() => onDeleteConfirm(athlete)}>
              <ThemedText style={styles.deleteText}>Aceptar</ThemedText>
            </Pressable>
          </View>
        </View>
      ) : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing[2],
    borderWidth: 1,
    borderColor: 'rgba(245,179,58,0.28)',
    backgroundColor: colors.riovoley.cardDarkAlt,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 16, flex: 1, marginRight: spacing[2] },
  statusBadge: { borderRadius: 999, paddingHorizontal: spacing[2], paddingVertical: 4 },
  active: { backgroundColor: 'rgba(34,197,94,0.2)' },
  suspended: { backgroundColor: 'rgba(239,68,68,0.2)' },
  statusText: { fontSize: 11, fontWeight: '700' },
  meta: { fontSize: 12, marginTop: 2 },
  actionsRow: { marginTop: spacing[2], flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing[1] },
  actionText: { color: colors.riovoley.gold, fontWeight: '700', fontSize: 12 },
  confirmBox: {
    marginTop: spacing[2],
    borderWidth: 1,
    borderColor: 'rgba(245,179,58,0.3)',
    borderRadius: 10,
    padding: spacing[2],
  },
  confirmText: { marginBottom: spacing[2] },
  confirmActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing[2] },
  cancelBtn: { borderWidth: 1, borderColor: 'rgba(245,179,58,0.35)', borderRadius: 8, paddingHorizontal: spacing[2], paddingVertical: 6 },
  cancelText: { fontWeight: '700' },
  deleteBtn: { backgroundColor: colors.riovoley.gold, borderRadius: 8, paddingHorizontal: spacing[2], paddingVertical: 6 },
  deleteText: { color: colors.riovoley.dark, fontWeight: '800' },
});

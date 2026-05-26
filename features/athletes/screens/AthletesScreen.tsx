import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useSessionRole } from '@/shared/auth/useSessionRole';
import { EmptyState, ErrorState, LoadingState, SectionHeader, ThemedText } from '@/shared/components';
import { canAccessAthletesPanel, canManageAthletes } from '@/shared/permissions/rolePermissions';
import { colors, spacing } from '@/shared/theme';
import { AthleteCard } from '../components/AthleteCard';
import { AthleteFormCard } from '../components/AthleteFormCard';
import { AthletesFiltersBar } from '../components/AthletesFiltersBar';
import { useAthletesManager } from '../hooks/useAthletesManager';

export default function AthletesScreen() {
  const { loading: roleLoading, role } = useSessionRole();
  const [formOpen, setFormOpen] = useState(false);

  const canManage = canManageAthletes(role || '');
  const canDelete = role === 'administrador';

  const {
    athletes,
    categories,
    filters,
    setFilters,
    form,
    setForm,
    editingAthlete,
    sendCredentials,
    setSendCredentials,
    loading,
    submitting,
    error,
    message,
    pendingDeleteId,
    setPendingDeleteId,
    sortedCountLabel,
    loadData,
    resetForm,
    handleCreateOrUpdate,
    startEdit,
    suspendOrReactivate,
    resendCredentials,
    confirmDelete,
  } = useAthletesManager(canDelete);

  const messageTone = useMemo(() => {
    if (!message) return null;
    if (message.toLowerCase().includes('no se pudo') || message.toLowerCase().includes('error')) return 'error';
    return 'success';
  }, [message]);

  if (roleLoading) return <LoadingState message="Validando permisos..." />;

  if (!canAccessAthletesPanel(role)) {
    return <EmptyState title="Acceso denegado" message="No tienes permisos para acceder a atletas." />;
  }

  if (loading) return <LoadingState message="Cargando atletas..." />;

  if (error) return <ErrorState message={error} />;

  return (
    <View style={styles.container}>
      <FlatList
        data={athletes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <AthleteCard
            athlete={item}
            canDelete={canDelete}
            submitting={submitting}
            isConfirmingDelete={pendingDeleteId === item.id}
            onEdit={(athlete) => {
              startEdit(athlete);
              setFormOpen(true);
            }}
            onSuspendToggle={(athlete) => {
              void suspendOrReactivate(athlete);
            }}
            onResendCredentials={(athlete) => {
              void resendCredentials(athlete);
            }}
            onDeleteRequest={(athlete) => setPendingDeleteId(athlete.id)}
            onDeleteCancel={() => setPendingDeleteId(null)}
            onDeleteConfirm={(athlete) => {
              void confirmDelete(athlete);
            }}
          />
        )}
        ListHeaderComponent={
          <View>
            <SectionHeader title="Atletas" subtitle="Gestion integral de atletas" />

            {canManage ? (
              <Pressable style={styles.formToggleBtn} onPress={() => setFormOpen((prev) => !prev)}>
                <ThemedText style={styles.formToggleText}>
                  {formOpen ? 'Cerrar formulario' : editingAthlete ? 'Editar atleta' : 'Nuevo atleta'}
                </ThemedText>
              </Pressable>
            ) : null}

            {canManage && formOpen ? (
              <AthleteFormCard
                form={form}
                categories={categories}
                editing={Boolean(editingAthlete)}
                sendCredentials={sendCredentials}
                submitting={submitting}
                onChange={setForm}
                onToggleSendCredentials={setSendCredentials}
                onCancel={() => {
                  resetForm();
                  setFormOpen(false);
                }}
                onSubmit={() => {
                  void handleCreateOrUpdate();
                }}
              />
            ) : null}

            <AthletesFiltersBar filters={filters} categories={categories} onChange={setFilters} />

            <View style={styles.summaryRow}>
              <ThemedText style={styles.summaryText}>{sortedCountLabel}</ThemedText>
              <Pressable style={styles.refreshBtn} onPress={() => { void loadData(); }}>
                <ThemedText style={styles.refreshText}>Refrescar</ThemedText>
              </Pressable>
            </View>

            {message ? (
              <ThemedText style={messageTone === 'error' ? styles.messageError : styles.messageSuccess}>{message}</ThemedText>
            ) : null}
          </View>
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<EmptyState title="Sin atletas" message="No hay atletas con los filtros actuales." />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.riovoley.dark,
    paddingHorizontal: spacing[4],
    paddingTop: spacing[6],
  },
  formToggleBtn: {
    borderWidth: 1,
    borderColor: 'rgba(245,179,58,0.35)',
    borderRadius: 10,
    backgroundColor: colors.riovoley.gold,
    paddingVertical: spacing[2],
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  formToggleText: { color: colors.riovoley.dark, fontWeight: '800' },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  summaryText: { fontWeight: '700' },
  refreshBtn: {
    borderWidth: 1,
    borderColor: 'rgba(245,179,58,0.35)',
    borderRadius: 999,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
  },
  refreshText: { fontSize: 12, fontWeight: '700', color: colors.riovoley.gold },
  messageSuccess: {
    color: '#8de0a6',
    marginBottom: spacing[2],
    fontSize: 12,
  },
  messageError: {
    color: '#ff9a9a',
    marginBottom: spacing[2],
    fontSize: 12,
  },
  listContent: { paddingBottom: spacing[8] },
});

import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { EmptyState, ErrorState, LoadingState, SectionHeader, ThemedText } from '@/shared/components';
import { useSessionRole } from '@/shared/auth/useSessionRole';
import { canManagePayments, canViewPayments } from '@/shared/permissions/rolePermissions';
import { colors, spacing } from '@/shared/theme';
import { usePaymentsManager } from '../hooks/usePaymentsManager';
import type { AthleteOption, PaymentItem } from '../types/payment.types';

const formatDate = (iso: string | null | undefined) => (iso ? new Date(`${iso}T00:00:00`).toLocaleDateString('es-EC') : '-');
const formatMoney = (amount: number) => `$ ${amount.toFixed(2)}`;

const addDays = (iso: string | null | undefined, days: number) => {
  if (!iso) return null;
  const d = new Date(`${String(iso).slice(0, 10)}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

function AthleteSelector({
  athletes,
  value,
  onSelect,
}: {
  athletes: AthleteOption[];
  value: string;
  onSelect: (next: AthleteOption) => void;
}) {
  const [query, setQuery] = useState('');
  const current = athletes.find((item) => item.userId === value);
  const normalizedQuery = query.trim().toLowerCase();
  const filtered = normalizedQuery
    ? athletes.filter((item) => item.label.toLowerCase().includes(normalizedQuery))
    : [];

  return (
    <View style={styles.fieldBlock}>
      <ThemedText style={styles.label}>Atleta *</ThemedText>
      <TextInput
        value={query}
        onChangeText={setQuery}
        style={styles.input}
        placeholder="Buscar atleta..."
        placeholderTextColor={colors.riovoley.mutedText}
      />
      <View style={styles.selectTrigger}>
        <ThemedText style={styles.selectText}>{current?.label || 'Sin atleta seleccionado'}</ThemedText>
      </View>
      {normalizedQuery ? (
        <View style={styles.selectMenu}>
          <ScrollView nestedScrollEnabled style={{ maxHeight: 170 }}>
            {filtered.map((athlete) => (
              <Pressable
                key={athlete.userId}
                style={styles.selectOption}
                onPress={() => {
                  onSelect(athlete);
                  setQuery('');
                }}>
                <ThemedText style={styles.selectText}>{athlete.label}</ThemedText>
              </Pressable>
            ))}
            {filtered.length === 0 ? (
              <View style={styles.selectOption}>
                <ThemedText style={styles.cardMuted}>Sin coincidencias</ThemedText>
              </View>
            ) : null}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

function PaymentCard({ item }: { item: PaymentItem }) {
  const statusColor = item.status === 'active' ? '#0fa879' : item.status === 'overdue' ? '#b04c58' : '#c0911b';
  const statusLabel = item.status === 'active' ? 'Activo' : item.status === 'expiring' ? 'Próximo a vencer' : 'Vencido';
  const daysLabel = item.daysRemaining >= 0 ? `${item.daysRemaining} día(s) restantes` : `${Math.abs(item.daysRemaining)} día(s) vencido`;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <ThemedText style={styles.cardTitle}>{item.athleteName}</ThemedText>
        <View style={[styles.badge, { backgroundColor: statusColor }]}>
          <ThemedText style={styles.badgeText}>{statusLabel}</ThemedText>
        </View>
      </View>
      <ThemedText style={styles.cardInfo}>Periodo: {formatDate(item.periodStart)} - {formatDate(item.periodEnd)}</ThemedText>
      <ThemedText style={styles.cardInfo}>Membresía: {daysLabel}</ThemedText>
      <ThemedText style={styles.cardInfo}>Fecha de pago: {formatDate(item.paymentDate)}</ThemedText>
      <ThemedText style={styles.cardAmount}>{formatMoney(item.amount)}</ThemedText>
    </View>
  );
}

export default function PaymentsScreen() {
  const { role, loading: roleLoading, userId } = useSessionRole();
  const [formOpen, setFormOpen] = useState(false);

  const {
    payments,
    athletes,
    filters,
    setFilters,
    form,
    setForm,
    editingId,
    loading,
    submitting,
    error,
    message,
    metrics,
    loadData,
    startCreate,
    submit,
  } = usePaymentsManager();

  const canManage = canManagePayments(role || '');
  const canView = canViewPayments(role || '');
  const isAthleteView = !canManage;
  const visiblePayments = canManage ? payments : payments.filter((item) => item.userId === userId);

  const selectedAthleteLabel = useMemo(
    () => athletes.find((item) => item.userId === form.userId)?.label || 'Sin seleccionar',
    [athletes, form.userId],
  );

  const currentPayment = isAthleteView ? visiblePayments[0] || null : null;
  const previousPayments = isAthleteView ? visiblePayments.slice(1) : visiblePayments;

  if (roleLoading || loading) return <LoadingState message="Cargando pagos..." />;
  if (!canView) return <EmptyState title="Acceso denegado" message="No tienes permisos para ver pagos." />;
  if (error) return <ErrorState message={error} />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <SectionHeader title="Pagos" subtitle="Gestión de mensualidades" />

      {canManage ? (
        <>
          <View style={styles.metricsRow}>
            <View style={styles.metricCard}><ThemedText style={styles.metricTitle}>Total</ThemedText><ThemedText style={styles.metricValue}>{metrics.total}</ThemedText></View>
            <View style={styles.metricCard}><ThemedText style={styles.metricTitle}>Activos</ThemedText><ThemedText style={styles.metricValue}>{metrics.active}</ThemedText></View>
            <View style={styles.metricCard}><ThemedText style={styles.metricTitle}>Próx. vencer</ThemedText><ThemedText style={styles.metricValue}>{metrics.expiring}</ThemedText></View>
            <View style={styles.metricCard}><ThemedText style={styles.metricTitle}>Vencidos</ThemedText><ThemedText style={styles.metricValue}>{metrics.overdue}</ThemedText></View>
          </View>
          <View style={[styles.metricCard, styles.totalCard]}>
            <ThemedText style={styles.metricTitle}>Total recaudado</ThemedText>
            <ThemedText style={styles.metricValue}>{formatMoney(metrics.totalAmount)}</ThemedText>
          </View>

          <View style={styles.toolbarRow}>
            <Pressable style={styles.primaryBtn} onPress={() => { setFormOpen((prev) => !prev); startCreate(); }}>
              <ThemedText style={styles.primaryText}>{formOpen ? 'Cerrar registro' : 'Registrar pago'}</ThemedText>
            </Pressable>
            <Pressable style={styles.secondaryBtn} onPress={() => { void loadData(); }}>
              <ThemedText style={styles.secondaryText}>Actualizar</ThemedText>
            </Pressable>
          </View>

          {formOpen ? (
            <View style={styles.formCard}>
              <ThemedText style={styles.formTitle}>{editingId ? 'Editar pago' : 'Registrar nuevo pago'}</ThemedText>

              <AthleteSelector
                athletes={athletes}
                value={form.userId}
                onSelect={(athlete) => setForm((prev) => ({ ...prev, userId: athlete.userId, studentId: athlete.studentId }))}
              />

              <View style={styles.fieldBlock}>
                <ThemedText style={styles.label}>Fecha de pago *</ThemedText>
                <TextInput
                  value={form.paymentDate}
                  onChangeText={(paymentDate) => setForm((prev) => ({ ...prev, paymentDate }))}
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.riovoley.mutedText}
                />
              </View>

              <View style={styles.fieldBlock}>
                <ThemedText style={styles.label}>Tipo de mensualidad *</ThemedText>
                <View style={styles.chipsRow}>
                  <Pressable
                    style={[styles.chip, form.membershipType === 'normal' && styles.chipActive]}
                    onPress={() => setForm((prev) => ({ ...prev, membershipType: 'normal' }))}>
                    <ThemedText style={styles.chipText}>Normal ($35.00)</ThemedText>
                  </Pressable>
                  <Pressable
                    style={[styles.chip, form.membershipType === 'group' && styles.chipActive]}
                    onPress={() => setForm((prev) => ({ ...prev, membershipType: 'group' }))}>
                    <ThemedText style={styles.chipText}>Grupo ($32.50)</ThemedText>
                  </Pressable>
                </View>
              </View>

              <View style={styles.fieldBlock}>
                <ThemedText style={styles.label}>Observaciones</ThemedText>
                <TextInput
                  value={form.notes}
                  onChangeText={(notes) => setForm((prev) => ({ ...prev, notes }))}
                  style={[styles.input, styles.textArea]}
                  placeholder="Notas internas del pago"
                  placeholderTextColor={colors.riovoley.mutedText}
                  multiline
                  numberOfLines={3}
                  maxLength={300}
                />
              </View>

              <ThemedText style={styles.helperText}>Atleta: {selectedAthleteLabel}</ThemedText>

              <View style={styles.toolbarRow}>
                <Pressable
                  style={styles.primaryBtn}
                  disabled={submitting}
                  onPress={async () => {
                    const result = await submit();
                    if (result.ok) setFormOpen(false);
                  }}>
                  <ThemedText style={styles.primaryText}>{submitting ? 'Guardando...' : editingId ? 'Actualizar' : 'Guardar'}</ThemedText>
                </Pressable>
                <Pressable style={styles.secondaryBtn} onPress={() => setFormOpen(false)}>
                  <ThemedText style={styles.secondaryText}>Cancelar</ThemedText>
                </Pressable>
              </View>
            </View>
          ) : null}

          <View style={styles.filterCard}>
            <TextInput
              value={filters.search}
              onChangeText={(search) => setFilters((prev) => ({ ...prev, search }))}
              placeholder="Buscar por atleta o correo"
              placeholderTextColor={colors.riovoley.mutedText}
              style={styles.input}
            />
            <View style={styles.chipsRow}>
              {(['all', 'active', 'expiring', 'overdue'] as const).map((status) => (
                <Pressable key={status} style={[styles.chip, filters.status === status && styles.chipActive]} onPress={() => setFilters((prev) => ({ ...prev, status }))}>
                  <ThemedText style={styles.chipText}>{status === 'all' ? 'Todos' : status === 'active' ? 'Activo' : status === 'expiring' ? 'Próx. vencer' : 'Vencido'}</ThemedText>
                </Pressable>
              ))}
            </View>
          </View>
        </>
      ) : (
        <>
          {currentPayment ? (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <ThemedText style={styles.cardTitle}>Estado de tu membresía</ThemedText>
                <View style={[styles.badge, { backgroundColor: currentPayment.status === 'active' ? '#0fa879' : currentPayment.status === 'expiring' ? '#c0911b' : '#b04c58' }]}>
                  <ThemedText style={styles.badgeText}>{currentPayment.status === 'active' ? 'Activo' : currentPayment.status === 'expiring' ? 'Próximo a vencer' : 'Vencido'}</ThemedText>
                </View>
              </View>
              <ThemedText style={styles.cardInfo}>
                Tiempo restante: {currentPayment.daysRemaining >= 0 ? `${currentPayment.daysRemaining} día(s)` : 'Vencida'}
              </ThemedText>
              <ThemedText style={styles.cardInfo}>Fecha de pago: {formatDate(currentPayment.paymentDate)}</ThemedText>
              <ThemedText style={styles.cardInfo}>Fecha fin: {formatDate(currentPayment.periodEnd)}</ThemedText>
              <ThemedText style={styles.cardInfo}>Próximo pago: {formatDate(addDays(currentPayment.periodEnd, 1))}</ThemedText>
            </View>
          ) : (
            <EmptyState title="Sin pagos" message="No tienes pagos registrados aún." />
          )}
          <ThemedText type="subtitle">Fechas de pagos anteriores</ThemedText>
        </>
      )}

      {message ? <ThemedText style={styles.message}>{message}</ThemedText> : null}

      {(isAthleteView ? previousPayments : visiblePayments).map((item) => (
        <PaymentCard key={item.id} item={item} />
      ))}

      {(isAthleteView ? previousPayments.length === 0 : visiblePayments.length === 0) ? (
        <EmptyState title="Sin pagos" message="No hay pagos con los filtros actuales." />
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.riovoley.dark },
  content: { paddingHorizontal: spacing[4], paddingTop: spacing[6], paddingBottom: spacing[8], gap: spacing[3] },
  metricsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  metricCard: {
    borderWidth: 1,
    borderColor: 'rgba(245,179,58,0.35)',
    borderRadius: 12,
    backgroundColor: 'rgba(32,55,111,0.35)',
    padding: spacing[2],
    minWidth: '48%',
  },
  totalCard: { minWidth: '100%' },
  metricTitle: { fontSize: 12, fontWeight: '700', color: colors.riovoley.mutedText },
  metricValue: { fontSize: 24, fontWeight: '800', color: colors.riovoley.text },
  toolbarRow: { flexDirection: 'row', gap: spacing[2] },
  primaryBtn: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: colors.riovoley.gold,
    paddingVertical: spacing[2],
    alignItems: 'center',
  },
  primaryText: { color: colors.riovoley.dark, fontWeight: '800' },
  secondaryBtn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245,179,58,0.35)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingVertical: spacing[2],
    alignItems: 'center',
  },
  secondaryText: { color: colors.riovoley.text, fontWeight: '700' },
  formCard: {
    borderWidth: 1,
    borderColor: 'rgba(245,179,58,0.35)',
    borderRadius: 14,
    padding: spacing[3],
    backgroundColor: 'rgba(26,45,98,0.45)',
    gap: spacing[2],
  },
  formTitle: { fontWeight: '800', fontSize: 18 },
  fieldBlock: { gap: spacing[1] },
  label: { fontSize: 12, fontWeight: '700', color: colors.riovoley.gold },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(245,179,58,0.35)',
    borderRadius: 10,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[2],
    color: colors.riovoley.text,
    backgroundColor: 'rgba(8,18,50,0.35)',
  },
  textArea: { minHeight: 90, textAlignVertical: 'top' },
  helperText: { fontSize: 12, color: colors.riovoley.mutedText },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  chip: {
    borderWidth: 1,
    borderColor: 'rgba(245,179,58,0.35)',
    borderRadius: 999,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
  },
  chipActive: { backgroundColor: 'rgba(245,179,58,0.24)' },
  chipText: { fontSize: 12, fontWeight: '700' },
  filterCard: {
    borderWidth: 1,
    borderColor: 'rgba(245,179,58,0.35)',
    borderRadius: 14,
    padding: spacing[3],
    gap: spacing[2],
  },
  card: {
    borderWidth: 1,
    borderColor: 'rgba(245,179,58,0.35)',
    borderRadius: 14,
    backgroundColor: 'rgba(33,57,116,0.40)',
    padding: spacing[3],
    marginBottom: spacing[2],
    gap: spacing[1],
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontWeight: '800', fontSize: 18 },
  cardMuted: { fontSize: 12, color: colors.riovoley.mutedText },
  cardInfo: { fontSize: 13 },
  cardAmount: { marginTop: spacing[1], fontWeight: '800', fontSize: 20, color: colors.riovoley.gold },
  badge: { borderRadius: 999, paddingHorizontal: spacing[2], paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: '800' },
  message: { fontSize: 12, color: '#8de0a6' },
  selectTrigger: {
    borderWidth: 1,
    borderColor: 'rgba(245,179,58,0.35)',
    borderRadius: 10,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[2],
  },
  selectText: { color: colors.riovoley.text },
  selectMenu: {
    borderWidth: 1,
    borderColor: 'rgba(245,179,58,0.35)',
    borderRadius: 10,
    marginTop: spacing[1],
    backgroundColor: 'rgba(13,26,70,0.98)',
  },
  selectOption: { paddingHorizontal: spacing[2], paddingVertical: spacing[2] },
});

import { StyleSheet, View } from 'react-native';
import { AppCard, ThemedText } from '@/shared/components';
import { colors, spacing } from '@/shared/theme';
import type { HomeUserPayment } from '../types/home.types';

interface UserPaymentsSectionProps {
  payments: HomeUserPayment[];
  loading: boolean;
}

const formatDate = (value?: string) => (value ? new Date(`${value}T00:00:00`).toLocaleDateString('es-EC') : '-');

export function UserPaymentsSection({ payments, loading }: UserPaymentsSectionProps) {
  return (
    <View style={styles.container}>
      <ThemedText type="subtitle" style={styles.title}>Mis pagos</ThemedText>
      {loading ? <ThemedText style={styles.muted}>Cargando pagos...</ThemedText> : null}
      {!loading && payments.length === 0 ? <ThemedText style={styles.muted}>No tienes pagos registrados.</ThemedText> : null}
      {!loading
        ? payments.map((payment) => (
            <AppCard key={payment.id} style={styles.card}>
              <View style={styles.row}>
                <ThemedText style={styles.amount}>$ {payment.amount.toFixed(2)}</ThemedText>
                <ThemedText style={styles.status}>{payment.statusLabel}</ThemedText>
              </View>
              <ThemedText style={styles.info}>Periodo: {formatDate(payment.periodStart)} - {formatDate(payment.periodEnd)}</ThemedText>
              <ThemedText style={styles.info}>
                {payment.daysRemaining >= 0
                  ? `${payment.daysRemaining} día(s) restantes`
                  : `${Math.abs(payment.daysRemaining)} día(s) vencido`}
              </ThemedText>
            </AppCard>
          ))
        : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing[4],
    marginVertical: spacing[4],
    gap: spacing[2],
  },
  title: { marginBottom: spacing[1] },
  muted: { color: colors.riovoley.mutedText, fontSize: 13 },
  card: { gap: spacing[1] },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  amount: { fontSize: 20, fontWeight: '800', color: colors.riovoley.gold },
  status: { fontSize: 12, fontWeight: '800' },
  info: { fontSize: 12, color: colors.riovoley.text },
});

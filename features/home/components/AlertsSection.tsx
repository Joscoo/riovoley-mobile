import { StyleSheet, View } from 'react-native';
import { ThemedText, AppCard } from '@/shared/components';
import { colors, spacing } from '@/shared/theme';

interface Alert {
  type: 'warning' | 'danger' | 'info';
  message: string;
}

interface AlertsSectionProps {
  alerts: Alert[];
}

export function AlertsSection({ alerts }: AlertsSectionProps) {
  if (alerts.length === 0) return null;

  const getAlertColor = (type: Alert['type']) => {
    switch (type) {
      case 'danger':
        return colors.riovoley.danger;
      case 'warning':
        return colors.riovoley.warning;
      case 'info':
      default:
        return colors.riovoley.info;
    }
  };

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'danger':
        return '🚨';
      case 'warning':
        return '⚠️';
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  return (
    <View style={styles.container}>
      {alerts.map((alert, index) => (
        <AppCard key={`alert-${index}`} style={styles.alert}>
          <View style={styles.content}>
            <ThemedText style={styles.icon}>{getAlertIcon(alert.type)}</ThemedText>
            <ThemedText
              style={[styles.message, { color: getAlertColor(alert.type) }]}
              numberOfLines={2}>
              {alert.message}
            </ThemedText>
          </View>
        </AppCard>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing[4],
    marginVertical: spacing[3],
  },
  alert: {
    marginVertical: spacing[1],
    borderLeftWidth: 4,
    borderLeftColor: colors.riovoley.warning,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  icon: {
    fontSize: 20,
  },
  message: {
    flex: 1,
    fontWeight: '500',
    fontSize: 13,
  },
});

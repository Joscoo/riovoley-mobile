import { MaterialIcons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { ThemedText, AppCard } from '@/shared/components';
import { colors, spacing, fontWeights } from '@/shared/theme';

interface Alert {
  type: 'warning' | 'danger' | 'info';
  message: string;
}

interface AlertsSectionProps {
  alerts: Alert[];
}

export function AlertsSection({ alerts }: AlertsSectionProps) {
  if (alerts.length === 0) return null;

  const tone = (type: Alert['type']) => {
    switch (type) {
      case 'danger':
        return { color: colors.riovoley.danger, icon: 'error' as const };
      case 'warning':
        return { color: colors.riovoley.warning, icon: 'warning' as const };
      default:
        return { color: colors.riovoley.info, icon: 'info' as const };
    }
  };

  return (
    <View style={styles.container}>
      {alerts.map((alert, index) => {
        const { color, icon } = tone(alert.type);
        return (
          <AppCard key={`alert-${index}`} style={[styles.alert, { borderLeftColor: color }]}> 
            <View style={styles.content}>
              <MaterialIcons name={icon} size={20} color={color} />
              <ThemedText style={[styles.message, { color }]} numberOfLines={2}>
                {alert.message}
              </ThemedText>
            </View>
          </AppCard>
        );
      })}
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
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  message: {
    flex: 1,
    fontWeight: fontWeights.semibold,
    fontSize: 13,
  },
});

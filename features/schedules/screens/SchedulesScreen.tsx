import { useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSessionRole } from '@/shared/auth/useSessionRole';
import { EmptyState, ErrorState, LoadingState, SectionHeader, ThemedText } from '@/shared/components';
import { canManageSchedules, canSendScheduleReminder } from '@/shared/permissions/rolePermissions';
import { colors, spacing } from '@/shared/theme';
import { sendPushToAudience } from '@/shared/notifications/pushNotifications';
import { ScheduleCard } from '../components/ScheduleCard';
import { useSchedules } from '../hooks/useSchedules';
import { schedulesService } from '../services/schedulesService';
import type { ScheduleItem } from '../types/schedule.types';

const DAY_ORDER: Record<string, number> = {
  lunes: 1,
  monday: 1,
  martes: 2,
  tuesday: 2,
  miercoles: 3,
  miércoles: 3,
  wednesday: 3,
  jueves: 4,
  thursday: 4,
  viernes: 5,
  friday: 5,
  sabado: 6,
  sábado: 6,
  saturday: 6,
  domingo: 7,
  sunday: 7,
};

const categoryLabel = (category?: string | null) => {
  const value = (category || '').trim().toLowerCase();
  if (!value) return 'Sin categoria';
  if (value === 'open_gym') return 'Open Gym';
  if (value === 'iniciacion_hombres') return 'Iniciacion Hombres';
  if (value === 'iniciacion_mujeres') return 'Iniciacion Mujeres';
  if (value === 'perfeccionamiento_hombres') return 'Perfeccionamiento Hombres';
  if (value === 'perfeccionamiento_mujeres') return 'Perfeccionamiento Mujeres';
  return category.replaceAll('_', ' ');
};

const categoryKey = (category?: string | null) => (category || '').trim().toLowerCase();

export default function SchedulesScreen() {
  const { role } = useSessionRole();
  const { schedules, loading, error, reload } = useSchedules();
  const [editing, setEditing] = useState<ScheduleItem | null>(null);
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | string>('all');

  const isAdmin = canManageSchedules(role || '');
  const canRemind = canSendScheduleReminder(role || '');

  const openEdit = (item: ScheduleItem) => {
    setEditing(item);
    setDescription(item.description || '');
  };

  const saveEdit = async () => {
    if (!editing) return;
    try {
      await schedulesService.updateSchedule(editing.id, { description });
      await sendPushToAudience({
        title: 'Horario actualizado',
        body: `Se actualizo el horario de ${editing.category || 'tu categoria'}.`,
        audience: ['all'],
        data: { type: 'schedule_update', scheduleId: editing.id },
      });
      setEditing(null);
      setDescription('');
      reload();
      Alert.alert('Listo', 'Horario actualizado y notificacion enviada.');
    } catch {
      Alert.alert('Error', 'No se pudo actualizar el horario.');
    }
  };

  const remind = async (item: ScheduleItem) => {
    try {
      await sendPushToAudience({
        title: 'Recordatorio de horario',
        body: `${item.day_of_week} ${item.start_time}-${item.end_time} (${item.category || 'General'}).`,
        audience: ['all'],
        data: { type: 'schedule_reminder', scheduleId: item.id },
      });
      Alert.alert('Listo', 'Recordatorio enviado.');
    } catch {
      Alert.alert('Error', 'No se pudo enviar el recordatorio.');
    }
  };

  const categories = useMemo(() => {
    const set = new Set<string>();
    schedules.forEach((item) => {
      const key = categoryKey(item.category);
      if (key && key !== 'open_gym') set.add(key);
    });
    const baseOrder = [
      'iniciacion_hombres',
      'iniciacion_mujeres',
      'perfeccionamiento_hombres',
      'perfeccionamiento_mujeres',
    ];
    const ordered = [...baseOrder.filter((item) => set.has(item)), ...[...set].filter((item) => !baseOrder.includes(item)).sort()];
    return ordered;
  }, [schedules]);

  const filteredSchedules = useMemo(() => {
    const visible = schedules.filter((item) => {
      const key = categoryKey(item.category);
      if (key === 'open_gym') return true;
      if (selectedCategory === 'all') return true;
      return key === selectedCategory;
    });

    return visible.sort((a, b) => {
      const aKey = categoryKey(a.category);
      const bKey = categoryKey(b.category);
      if (aKey === 'open_gym' && bKey !== 'open_gym') return -1;
      if (aKey !== 'open_gym' && bKey === 'open_gym') return 1;

      const dayDiff = (DAY_ORDER[String(a.day_of_week).toLowerCase()] ?? 99) - (DAY_ORDER[String(b.day_of_week).toLowerCase()] ?? 99);
      if (dayDiff !== 0) return dayDiff;
      return String(a.start_time).localeCompare(String(b.start_time));
    });
  }, [schedules, selectedCategory]);

  if (loading) return <LoadingState message="Cargando horarios..." />;
  if (error) return <ErrorState message={error} />;
  if (!schedules.length) return <EmptyState title="Sin horarios" message="No hay horarios disponibles." />;

  return (
    <View style={styles.container}>
      <SectionHeader title="Horarios" subtitle="Gestion y recordatorios por rol" />
      <View style={styles.filters}>
        <Pressable
          onPress={() => setSelectedCategory('all')}
          style={[styles.filterChip, selectedCategory === 'all' && styles.filterChipActive]}>
          <ThemedText style={styles.filterChipText}>Todos</ThemedText>
        </Pressable>
        {categories.map((category) => (
          <Pressable
            key={category}
            onPress={() => setSelectedCategory(category)}
            style={[styles.filterChip, selectedCategory === category && styles.filterChipActive]}>
            <ThemedText style={styles.filterChipText}>{categoryLabel(category)}</ThemedText>
          </Pressable>
        ))}
      </View>
      <FlatList
        data={filteredSchedules}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ScheduleCard item={item} canEdit={isAdmin} canRemind={canRemind} onEdit={openEdit} onRemind={remind} />
        )}
        contentContainerStyle={styles.listContent}
      />

      {editing ? (
        <View style={styles.editor}>
          <ThemedText type="defaultSemiBold">Editar horario ({editing.day_of_week})</ThemedText>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Descripcion"
            placeholderTextColor={colors.riovoley.mutedText}
            style={styles.input}
          />
          <View style={styles.editorActions}>
            <Pressable onPress={() => setEditing(null)}><ThemedText>Cancelar</ThemedText></Pressable>
            <Pressable onPress={saveEdit}><ThemedText style={styles.save}>Guardar</ThemedText></Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.riovoley.dark, paddingHorizontal: spacing[4], paddingTop: spacing[6] },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2], marginBottom: spacing[3] },
  filterChip: {
    borderWidth: 1,
    borderColor: 'rgba(245,179,58,0.35)',
    borderRadius: 999,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  filterChipActive: { backgroundColor: 'rgba(245,179,58,0.22)' },
  filterChipText: { fontSize: 12, fontWeight: '700' },
  listContent: { paddingBottom: spacing[6] },
  editor: { backgroundColor: colors.riovoley.cardDark, borderRadius: 12, padding: spacing[3], marginTop: spacing[3], marginBottom: spacing[4] },
  input: { borderWidth: 1, borderColor: colors.riovoley.gold, borderRadius: 10, color: colors.riovoley.text, padding: spacing[2], marginTop: spacing[2] },
  editorActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing[2] },
  save: { color: colors.riovoley.gold, fontWeight: '700' },
});

import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSessionRole } from '@/shared/auth/useSessionRole';
import { EmptyState, ErrorState, LoadingState, SectionHeader, ThemedText } from '@/shared/components';
import { canManageSchedules, canSendScheduleReminder } from '@/shared/permissions/rolePermissions';
import { sendPushToAudience } from '@/shared/notifications/pushNotifications';
import { colors, spacing } from '@/shared/theme';
import { ScheduleCard } from '../components/ScheduleCard';
import { useSchedules } from '../hooks/useSchedules';
import { schedulesService } from '../services/schedulesService';
import type { ScheduleFormState, ScheduleItem, ScheduleMutationInput } from '../types/schedule.types';

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

const DAY_OPTIONS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
const BASE_CATEGORY_ORDER = [
  'iniciacion_hombres',
  'iniciacion_mujeres',
  'perfeccionamiento_hombres',
  'perfeccionamiento_mujeres',
  'open_gym',
];
const TIME_SLOTS = Array.from({ length: 48 }, (_, index) => {
  const hours = Math.floor(index / 2);
  const minutes = index % 2 === 0 ? '00' : '30';
  return `${String(hours).padStart(2, '0')}:${minutes}`;
});

const EMPTY_FORM: ScheduleFormState = {
  day_of_week: 'lunes',
  category: 'iniciacion_hombres',
  start_time: '16:00',
  end_time: '17:30',
  description: '',
};

const categoryKey = (category?: string | null) => (category || '').trim().toLowerCase();

const categoryLabel = (category?: string | null) => {
  const value = categoryKey(category);
  if (!value) return 'Sin categoría';
  if (value === 'open_gym') return 'Open Gym';
  return value
    .replaceAll('_', ' ')
    .split(' ')
    .map((word) => (word ? `${word[0].toUpperCase()}${word.slice(1)}` : word))
    .join(' ');
};

const toMinutes = (value: string) => {
  const [hours, minutes] = value.split(':').map((part) => Number(part));
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return NaN;
  return hours * 60 + minutes;
};

const isValidTime = (value: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

export default function SchedulesScreen() {
  const { role } = useSessionRole();
  const { schedules, loading, error, reload } = useSchedules();

  const [selectedCategory, setSelectedCategory] = useState<'all' | string>('all');
  const [managementOpen, setManagementOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] = useState<ScheduleFormState>(EMPTY_FORM);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [managementMessage, setManagementMessage] = useState<string | null>(null);
  const [managementMessageType, setManagementMessageType] = useState<'success' | 'error' | null>(null);

  const isAdmin = canManageSchedules(role || '');
  const canRemind = canSendScheduleReminder(role || '');

  const categories = useMemo(() => {
    const set = new Set<string>();
    schedules.forEach((item) => {
      const key = categoryKey(item.category);
      if (key) set.add(key);
    });

    const fromBase = BASE_CATEGORY_ORDER.filter((item) => set.has(item));
    const extras = [...set].filter((item) => !BASE_CATEGORY_ORDER.includes(item)).sort();
    const merged = [...fromBase, ...extras];
    return merged.length ? merged : BASE_CATEGORY_ORDER;
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

  const setMessage = (type: 'success' | 'error', message: string) => {
    setManagementMessageType(type);
    setManagementMessage(message);
  };

  const resetForm = () => {
    setFormState({ ...EMPTY_FORM, category: categories[0] || EMPTY_FORM.category });
    setEditingId(null);
  };

  const validateForm = () => {
    if (!formState.day_of_week || !formState.category || !formState.start_time || !formState.end_time) {
      return 'Completa día, categoría y horas.';
    }

    if (!isValidTime(formState.start_time) || !isValidTime(formState.end_time)) {
      return 'Usa formato de hora HH:MM.';
    }

    if (toMinutes(formState.start_time) >= toMinutes(formState.end_time)) {
      return 'La hora de inicio debe ser menor a la hora de fin.';
    }

    return null;
  };

  const openEdit = (item: ScheduleItem) => {
    setManagementOpen(true);
    setEditingId(item.id);
    setManagementMessage(null);
    setManagementMessageType(null);
    setFormState({
      day_of_week: item.day_of_week,
      category: categoryKey(item.category) || categories[0] || EMPTY_FORM.category,
      start_time: item.start_time,
      end_time: item.end_time,
      description: item.description || '',
    });
  };

  const handleSave = async () => {
    const validationError = validateForm();
    if (validationError) {
      setMessage('error', validationError);
      return;
    }

    const payload: ScheduleMutationInput = {
      day_of_week: formState.day_of_week,
      category: formState.category,
      start_time: formState.start_time,
      end_time: formState.end_time,
      description: formState.description.trim() || undefined,
    };

    setSubmitLoading(true);
    setManagementMessage(null);
    setManagementMessageType(null);

    try {
      if (editingId) {
        await schedulesService.updateSchedule(editingId, payload);
        setMessage('success', 'Horario actualizado correctamente.');
      } else {
        await schedulesService.createSchedule(payload);
        setMessage('success', 'Horario creado correctamente.');
      }

      await reload();
      resetForm();
    } catch (error) {
      const detail = error instanceof Error ? error.message : '';
      setMessage('error', detail ? `No se pudo guardar el horario: ${detail}` : 'No se pudo guardar el horario. Intenta nuevamente.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = (item: ScheduleItem) => {
    setPendingDeleteId(item.id);
  };

  const confirmDelete = async (item: ScheduleItem) => {
    setSubmitLoading(true);
    setManagementMessage(null);
    setManagementMessageType(null);
    try {
      await schedulesService.deleteSchedule(item.id);
      await reload();
      if (editingId === item.id) {
        resetForm();
      }
      setPendingDeleteId(null);
      setMessage('success', 'Horario eliminado correctamente.');
    } catch (error) {
      const detail = error instanceof Error ? error.message : '';
      setMessage('error', detail ? `No se pudo eliminar el horario: ${detail}` : 'No se pudo eliminar el horario.');
    } finally {
      setSubmitLoading(false);
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

  if (loading) return <LoadingState message="Cargando horarios..." />;
  if (error) return <ErrorState message={error} />;

  return (
    <View style={styles.container}>
      <SectionHeader title="Horarios" subtitle="Gestión y recordatorios por rol" />

      {isAdmin ? (
        <Pressable style={styles.manageButton} onPress={() => setManagementOpen((prev) => !prev)}>
          <Ionicons name={managementOpen ? 'close-outline' : 'settings-outline'} size={16} color={colors.riovoley.dark} />
          <ThemedText style={styles.manageButtonText}>{managementOpen ? 'Cerrar gestión' : 'Gestionar horarios'}</ThemedText>
        </Pressable>
      ) : null}

      {isAdmin && managementOpen ? (
        <View style={styles.managementCard}>
          <ThemedText type="defaultSemiBold" style={styles.managementTitle}>
            {editingId ? 'Editar horario' : 'Nuevo horario'}
          </ThemedText>

          <ThemedText style={styles.label}>Día de la semana</ThemedText>
          <View style={styles.optionGrid}>
            {DAY_OPTIONS.map((day) => (
              <Pressable
                key={day}
                style={[styles.optionChip, formState.day_of_week === day && styles.optionChipActive]}
                onPress={() => setFormState((prev) => ({ ...prev, day_of_week: day }))}>
                <ThemedText style={styles.optionChipText}>{day}</ThemedText>
              </Pressable>
            ))}
          </View>

          <ThemedText style={styles.label}>Categoría</ThemedText>
          <View style={styles.optionGrid}>
            {categories.map((category) => (
              <Pressable
                key={category}
                style={[styles.optionChip, formState.category === category && styles.optionChipActive]}
                onPress={() => setFormState((prev) => ({ ...prev, category }))}>
                <ThemedText style={styles.optionChipText}>{categoryLabel(category)}</ThemedText>
              </Pressable>
            ))}
          </View>

          <View style={styles.timeRow}>
            <View style={styles.timeCol}>
              <ThemedText style={styles.label}>Hora inicio</ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timeBar}>
                {TIME_SLOTS.map((time) => (
                  <Pressable
                    key={`start-${time}`}
                    style={[styles.timeChip, formState.start_time === time && styles.timeChipActive]}
                    onPress={() => setFormState((prev) => ({ ...prev, start_time: time }))}>
                    <ThemedText style={styles.timeChipText}>{time}</ThemedText>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
            <View style={styles.timeCol}>
              <ThemedText style={styles.label}>Hora fin</ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timeBar}>
                {TIME_SLOTS.map((time) => (
                  <Pressable
                    key={`end-${time}`}
                    style={[styles.timeChip, formState.end_time === time && styles.timeChipActive]}
                    onPress={() => setFormState((prev) => ({ ...prev, end_time: time }))}>
                    <ThemedText style={styles.timeChipText}>{time}</ThemedText>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>

          <ThemedText style={styles.label}>Descripción (opcional)</ThemedText>
          <TextInput
            value={formState.description}
            onChangeText={(text) => setFormState((prev) => ({ ...prev, description: text }))}
            placeholder="Describe el entrenamiento"
            placeholderTextColor={colors.riovoley.mutedText}
            style={[styles.input, styles.multilineInput]}
            multiline
          />

          {managementMessage ? (
            <ThemedText style={managementMessageType === 'error' ? styles.errorText : styles.successText}>{managementMessage}</ThemedText>
          ) : null}

          <View style={styles.managementActions}>
            <Pressable style={styles.secondaryAction} onPress={resetForm} disabled={submitLoading}>
              <ThemedText style={styles.secondaryActionText}>Cancelar</ThemedText>
            </Pressable>
            <Pressable style={styles.primaryAction} onPress={handleSave} disabled={submitLoading}>
              <ThemedText style={styles.primaryActionText}>{submitLoading ? 'Guardando...' : editingId ? 'Actualizar' : 'Guardar'}</ThemedText>
            </Pressable>
          </View>
        </View>
      ) : null}

      <View style={styles.filters}>
        <Pressable
          onPress={() => setSelectedCategory('all')}
          style={[styles.filterChip, selectedCategory === 'all' && styles.filterChipActive]}>
          <ThemedText style={styles.filterChipText}>Todos</ThemedText>
        </Pressable>
        {categories
          .filter((category) => category !== 'open_gym')
          .map((category) => (
            <Pressable
              key={category}
              onPress={() => setSelectedCategory(category)}
              style={[styles.filterChip, selectedCategory === category && styles.filterChipActive]}>
              <ThemedText style={styles.filterChipText}>{categoryLabel(category)}</ThemedText>
            </Pressable>
          ))}
      </View>

      {!filteredSchedules.length ? (
        <EmptyState title="Sin horarios" message="No hay horarios disponibles." />
      ) : (
        <FlatList
          data={filteredSchedules}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ScheduleCard
              item={item}
              canEdit={isAdmin}
              canDelete={isAdmin}
              canRemind={canRemind}
              isConfirmingDelete={pendingDeleteId === item.id}
              onEdit={openEdit}
              onDelete={handleDelete}
              onCancelDelete={() => setPendingDeleteId(null)}
              onConfirmDelete={confirmDelete}
              onRemind={remind}
            />
          )}
          contentContainerStyle={styles.listContent}
        />
      )}
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
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[1],
    backgroundColor: colors.riovoley.gold,
    borderRadius: 10,
    paddingVertical: spacing[2],
    marginBottom: spacing[3],
  },
  manageButtonText: { color: colors.riovoley.dark, fontWeight: '800' },
  managementCard: {
    borderWidth: 1,
    borderColor: 'rgba(245,179,58,0.35)',
    borderRadius: 12,
    padding: spacing[3],
    marginBottom: spacing[3],
    backgroundColor: colors.riovoley.cardDark,
  },
  managementTitle: { marginBottom: spacing[2] },
  label: { fontSize: 12, fontWeight: '700', color: colors.riovoley.pearl, marginBottom: spacing[1], marginTop: spacing[1] },
  optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2], marginBottom: spacing[1] },
  optionChip: {
    borderWidth: 1,
    borderColor: 'rgba(245,179,58,0.35)',
    borderRadius: 999,
    paddingHorizontal: spacing[2],
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  optionChipActive: { backgroundColor: 'rgba(245,179,58,0.22)' },
  optionChipText: { fontSize: 12, fontWeight: '700' },
  timeRow: { flexDirection: 'row', gap: spacing[2] },
  timeCol: { flex: 1 },
  timeBar: { gap: spacing[2], paddingBottom: spacing[1] },
  timeChip: {
    borderWidth: 1,
    borderColor: 'rgba(245,179,58,0.35)',
    borderRadius: 8,
    paddingHorizontal: spacing[2],
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  timeChipActive: { backgroundColor: 'rgba(245,179,58,0.24)' },
  timeChipText: { fontSize: 12, fontWeight: '700' },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(245,179,58,0.35)',
    borderRadius: 10,
    color: colors.riovoley.text,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[2],
    backgroundColor: 'rgba(2,12,38,0.35)',
  },
  multilineInput: { minHeight: 84, textAlignVertical: 'top' },
  managementActions: { flexDirection: 'row', gap: spacing[2], marginTop: spacing[3] },
  secondaryAction: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(245,179,58,0.35)',
    borderRadius: 10,
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  secondaryActionText: { color: colors.riovoley.pearl, fontWeight: '700' },
  primaryAction: {
    flex: 1,
    backgroundColor: colors.riovoley.gold,
    borderRadius: 10,
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  primaryActionText: { color: colors.riovoley.dark, fontWeight: '800' },
  successText: { color: '#8de0a6', marginTop: spacing[2], fontSize: 12 },
  errorText: { color: '#ff9a9a', marginTop: spacing[2], fontSize: 12 },
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
  listContent: { paddingBottom: spacing[8] },
});



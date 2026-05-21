import { useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SectionHeader, ThemedText } from '@/shared/components';
import { colors, spacing } from '@/shared/theme';
import { useSessionRole } from '@/shared/auth/useSessionRole';
import { canCreateAnnouncements } from '@/shared/permissions/rolePermissions';
import { useAnnouncements } from '../hooks/useAnnouncements';
import { AnnouncementsList } from '../components/AnnouncementsList';
import { announcementsService } from '../services/announcementsService';

export default function AnnouncementsScreen() {
  const { role, userId } = useSessionRole();
  const { announcements, loading, error, reload } = useAnnouncements(role);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal');
  const [audience, setAudience] = useState<string[]>(['all']);
  const [expiryDay, setExpiryDay] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [isActive, setIsActive] = useState(true);

  const canCreate = canCreateAnnouncements(role || '');

  const submitAnnouncement = async () => {
    if (!userId) return;
    if (!title.trim() || !content.trim()) {
      Alert.alert('Campos requeridos', 'Completa titulo y contenido.');
      return;
    }
    const expiresAt =
      expiryYear && expiryMonth && expiryDay
        ? `${expiryYear}-${expiryMonth.padStart(2, '0')}-${expiryDay.padStart(2, '0')}`
        : null;

    if ((expiryYear || expiryMonth || expiryDay) && !expiresAt) {
      Alert.alert('Fecha invalida', 'Completa dia, mes y anio.');
      return;
    }
    if (expiresAt) {
      const day = Number(expiryDay);
      const month = Number(expiryMonth);
      const year = Number(expiryYear);
      const invalidBasic = Number.isNaN(day) || Number.isNaN(month) || Number.isNaN(year) || day < 1 || day > 31 || month < 1 || month > 12 || year < 2024;
      if (invalidBasic) {
        Alert.alert('Fecha invalida', 'Ingresa una fecha valida.');
        return;
      }
    }

    try {
      await announcementsService.createAnnouncement({
        title: title.trim(),
        content: content.trim(),
        priority,
        targetAudience: audience,
        createdBy: userId,
        expiresAt,
        isActive,
      });
      setTitle('');
      setContent('');
      setPriority('normal');
      setAudience(['all']);
      setExpiryDay('');
      setExpiryMonth('');
      setExpiryYear('');
      setIsActive(true);
      await reload();
      Alert.alert('Listo', 'Anuncio creado y notificado.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo crear el anuncio.';
      Alert.alert('Error', message);
    }
  };

  const toggleAudience = (value: string) => {
    if (value === 'all') return setAudience(['all']);
    setAudience((prev) => {
      const withoutAll = prev.filter((item) => item !== 'all');
      const next = withoutAll.includes(value) ? withoutAll.filter((item) => item !== value) : [...withoutAll, value];
      return next.length ? next : ['all'];
    });
  };

  return (
    <View style={styles.container}>
      <SectionHeader title="Anuncios" subtitle="Comunicados activos del club" />

      {canCreate ? (
        <View style={styles.form}>
          <ThemedText type="defaultSemiBold">Crear anuncio</ThemedText>
          <TextInput value={title} onChangeText={setTitle} placeholder="Titulo" placeholderTextColor={colors.riovoley.mutedText} style={styles.input} />
          <TextInput value={content} onChangeText={setContent} placeholder="Contenido" placeholderTextColor={colors.riovoley.mutedText} style={[styles.input, styles.multiline]} multiline />
          <View style={styles.row}>
            {(['urgent', 'high', 'normal', 'low'] as const).map((item) => (
              <Pressable key={item} onPress={() => setPriority(item)} style={[styles.chip, priority === item && styles.chipActive]}>
                <ThemedText style={styles.chipText}>
                  {item === 'urgent' ? 'Urgente' : item === 'high' ? 'Alta' : item === 'normal' ? 'Normal' : 'Baja'}
                </ThemedText>
              </Pressable>
            ))}
          </View>
          <View style={styles.row}>
            {[
              { value: 'all', label: 'Todos' },
              { value: 'administradores', label: 'Administradores' },
              { value: 'entrenadores', label: 'Entrenadores' },
              { value: 'estudiantes', label: 'Atletas' },
            ].map((item) => (
              <Pressable
                key={item.value}
                onPress={() => toggleAudience(item.value)}
                style={[styles.chip, audience.includes(item.value) && styles.chipActive]}>
                <ThemedText style={styles.chipText}>{item.label}</ThemedText>
              </Pressable>
            ))}
          </View>
          <ThemedText style={styles.label}>Fecha de expiracion (opcional)</ThemedText>
          <View style={styles.row}>
            <TextInput
              value={expiryDay}
              onChangeText={setExpiryDay}
              placeholder="Dia"
              keyboardType="number-pad"
              maxLength={2}
              placeholderTextColor={colors.riovoley.mutedText}
              style={[styles.input, styles.dateInput]}
            />
            <TextInput
              value={expiryMonth}
              onChangeText={setExpiryMonth}
              placeholder="Mes"
              keyboardType="number-pad"
              maxLength={2}
              placeholderTextColor={colors.riovoley.mutedText}
              style={[styles.input, styles.dateInput]}
            />
            <TextInput
              value={expiryYear}
              onChangeText={setExpiryYear}
              placeholder="Anio"
              keyboardType="number-pad"
              maxLength={4}
              placeholderTextColor={colors.riovoley.mutedText}
              style={[styles.input, styles.dateInput]}
            />
          </View>
          <View style={styles.row}>
            <Pressable onPress={() => setIsActive(true)} style={[styles.chip, isActive && styles.chipActive]}>
              <ThemedText style={styles.chipText}>Anuncio activo</ThemedText>
            </Pressable>
            <Pressable onPress={() => setIsActive(false)} style={[styles.chip, !isActive && styles.chipActive]}>
              <ThemedText style={styles.chipText}>Anuncio inactivo</ThemedText>
            </Pressable>
          </View>
          <Pressable style={styles.submit} onPress={submitAnnouncement}>
            <Ionicons name="send" size={16} color={colors.riovoley.dark} />
            <ThemedText style={styles.submitText}>Publicar anuncio</ThemedText>
          </Pressable>
        </View>
      ) : null}

      <AnnouncementsList announcements={announcements} loading={loading} error={error} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.riovoley.dark, paddingHorizontal: spacing[4], paddingTop: spacing[6] },
  form: { backgroundColor: colors.riovoley.cardDark, borderWidth: 1, borderColor: 'rgba(245,179,58,0.25)', borderRadius: 12, padding: spacing[3], marginBottom: spacing[3], gap: spacing[2] },
  input: { borderWidth: 1, borderColor: colors.riovoley.gold, borderRadius: 10, padding: spacing[2], color: colors.riovoley.text },
  multiline: { minHeight: 70, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: spacing[2], flexWrap: 'wrap' },
  chip: { borderWidth: 1, borderColor: colors.riovoley.gold, borderRadius: 999, paddingHorizontal: spacing[2], paddingVertical: 6 },
  chipActive: { backgroundColor: 'rgba(245,179,58,0.2)' },
  chipText: { fontSize: 12 },
  label: { fontSize: 12, color: colors.riovoley.mutedText, marginTop: spacing[1] },
  dateInput: { flex: 1 },
  submit: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing[1], backgroundColor: colors.riovoley.gold, borderRadius: 10, paddingVertical: spacing[2], marginTop: spacing[1] },
  submitText: { color: colors.riovoley.dark, fontWeight: '700' },
});

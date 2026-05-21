import { Pressable, StyleSheet, Switch, TextInput, View } from 'react-native';
import { ThemedText } from '@/shared/components';
import { colors, spacing } from '@/shared/theme';
import type { AthleteFormInput } from '../types/athletes.types';

interface AthleteFormProps {
  form: AthleteFormInput;
  categories: string[];
  editing: boolean;
  sendCredentials: boolean;
  submitting: boolean;
  onChange: (next: AthleteFormInput) => void;
  onToggleSendCredentials: (next: boolean) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export function AthleteFormCard({
  form,
  categories,
  editing,
  sendCredentials,
  submitting,
  onChange,
  onToggleSendCredentials,
  onSubmit,
  onCancel,
}: AthleteFormProps) {
  return (
    <View style={styles.card}>
      <ThemedText type="defaultSemiBold" style={styles.title}>{editing ? 'Editar atleta' : 'Nuevo atleta'}</ThemedText>

      <TextInput value={form.nombre} onChangeText={(nombre) => onChange({ ...form, nombre })} placeholder="Nombre" placeholderTextColor={colors.riovoley.mutedText} style={styles.input} />
      <TextInput value={form.apellido} onChangeText={(apellido) => onChange({ ...form, apellido })} placeholder="Apellido" placeholderTextColor={colors.riovoley.mutedText} style={styles.input} />
      <TextInput value={form.email} onChangeText={(email) => onChange({ ...form, email })} placeholder="Email" placeholderTextColor={colors.riovoley.mutedText} keyboardType="email-address" autoCapitalize="none" style={styles.input} />
      <TextInput value={form.telefono} onChangeText={(telefono) => onChange({ ...form, telefono })} placeholder="Telefono" placeholderTextColor={colors.riovoley.mutedText} style={styles.input} />
      <TextInput value={form.fecha_nacimiento} onChangeText={(fecha_nacimiento) => onChange({ ...form, fecha_nacimiento })} placeholder="Fecha nacimiento (YYYY-MM-DD)" placeholderTextColor={colors.riovoley.mutedText} style={styles.input} />

      <View style={styles.categoriesRow}>
        {categories.map((categoria) => (
          <Pressable
            key={categoria}
            style={[styles.chip, form.categoria === categoria && styles.chipActive]}
            onPress={() => onChange({ ...form, categoria })}>
            <ThemedText style={styles.chipText}>{categoria.replaceAll('_', ' ')}</ThemedText>
          </Pressable>
        ))}
      </View>

      {!editing ? (
        <View style={styles.switchRow}>
          <ThemedText>Enviar credenciales al crear</ThemedText>
          <Switch value={sendCredentials} onValueChange={onToggleSendCredentials} />
        </View>
      ) : null}

      <View style={styles.actions}>
        <Pressable style={styles.secondaryBtn} onPress={onCancel} disabled={submitting}>
          <ThemedText style={styles.secondaryText}>Cancelar</ThemedText>
        </Pressable>
        <Pressable style={styles.primaryBtn} onPress={onSubmit} disabled={submitting}>
          <ThemedText style={styles.primaryText}>{submitting ? 'Guardando...' : editing ? 'Actualizar' : 'Crear atleta'}</ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: 'rgba(245,179,58,0.35)',
    borderRadius: 12,
    padding: spacing[3],
    marginBottom: spacing[3],
    backgroundColor: colors.riovoley.cardDark,
    gap: spacing[2],
  },
  title: { marginBottom: spacing[1] },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(245,179,58,0.35)',
    borderRadius: 10,
    color: colors.riovoley.text,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[2],
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  categoriesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  chip: {
    borderWidth: 1,
    borderColor: 'rgba(245,179,58,0.35)',
    borderRadius: 999,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
  },
  chipActive: { backgroundColor: 'rgba(245,179,58,0.22)' },
  chipText: { fontSize: 12, fontWeight: '700' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  actions: { flexDirection: 'row', gap: spacing[2], marginTop: spacing[1] },
  secondaryBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(245,179,58,0.35)',
    borderRadius: 10,
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  secondaryText: { fontWeight: '700' },
  primaryBtn: {
    flex: 1,
    backgroundColor: colors.riovoley.gold,
    borderRadius: 10,
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  primaryText: { color: colors.riovoley.dark, fontWeight: '800' },
});

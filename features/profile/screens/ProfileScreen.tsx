import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { EmptyState, ErrorState, LoadingState, PrimaryActionButton, SectionHeader, ThemedText } from '@/shared/components';
import { colors, spacing } from '@/shared/theme';
import { useProfile } from '../hooks/useProfile';
import { ProfileInfoCard } from '../components/ProfileInfoCard';
import { profileService } from '../services/profileService';

type StatusType = 'success' | 'error';
interface ActionStatus {
  type: StatusType;
  message: string;
}

const formatDateTime = (value?: string | null) => {
  if (!value) return 'No disponible';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No disponible';
  return date.toLocaleString('es-EC');
};

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, loading, error } = useProfile();

  const [signOutLoading, setSignOutLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [passwordStatus, setPasswordStatus] = useState<ActionStatus | null>(null);
  const [signOutStatus, setSignOutStatus] = useState<ActionStatus | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSignOut = async () => {
    if (signOutLoading) return;
    setSignOutLoading(true);
    setSignOutStatus(null);

    try {
      await profileService.signOut();
      router.replace('/login');
    } catch {
      router.replace('/login');
    } finally {
      setSignOutLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordLoading) return;
    setPasswordLoading(true);
    setPasswordStatus(null);

    try {
      const result = await profileService.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      if (!result.ok) {
        if (result.mode === 'fallback') {
          setPasswordStatus({
            type: 'success',
            message:
              result.message ||
              'No se pudo cambiar directamente; te enviamos un correo para restablecer la contrasena.',
          });
          setTimeout(() => {
            router.replace('/login');
          }, 2000);
        } else {
          setPasswordStatus({ type: 'error', message: result.message || 'No se pudo cambiar la contrasena.' });
        }
        return;
      }

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordStatus({ type: 'success', message: 'Contrasena actualizada. Inicia sesion con tu nueva contrasena.' });
      setTimeout(() => {
        router.replace('/login');
      }, 2000);
    } catch {
      setPasswordStatus({ type: 'error', message: 'No se pudo completar el cambio de contrasena.' });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <SectionHeader title="Perfil" subtitle="Informacion de tu cuenta" />

      {loading ? <LoadingState message="Cargando perfil..." /> : null}
      {!loading && error ? <ErrorState message={error} /> : null}
      {!loading && !error && !profile ? <EmptyState title="Sin datos" message="No se encontro informacion del perfil." /> : null}

      {!loading && !error && profile ? (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <ProfileInfoCard profile={profile} />

          <View style={styles.sessionCard}>
            <ThemedText style={styles.footerText}>Quieres salir de tu cuenta?</ThemedText>
            {signOutStatus ? (
              <ThemedText style={signOutStatus.type === 'success' ? styles.statusSuccess : styles.statusError}>
                {signOutStatus.message}
              </ThemedText>
            ) : null}
            <PrimaryActionButton
              label="Cerrar sesion"
              loading={signOutLoading}
              disabled={signOutLoading}
              onPress={handleSignOut}
            />
          </View>

          <View style={styles.passwordCard}>
            <ThemedText type="defaultSemiBold">Cambiar contrasena</ThemedText>
            <View style={styles.lastChangeBox}>
              <ThemedText style={styles.lastChangeLabel}>Ultimo cambio de contrasena</ThemedText>
              <ThemedText style={styles.lastChangeValue}>{formatDateTime(profile.lastPasswordChangeAt)}</ThemedText>
            </View>
            <View style={styles.inputRow}>
              <TextInput
                secureTextEntry={!showCurrentPassword}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Contrasena actual"
                placeholderTextColor={colors.riovoley.mutedText}
                style={styles.input}
              />
              <Pressable style={styles.eyeButton} onPress={() => setShowCurrentPassword((prev) => !prev)}>
                <Ionicons name={showCurrentPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.riovoley.gold} />
              </Pressable>
            </View>
            <View style={styles.inputRow}>
              <TextInput
                secureTextEntry={!showNewPassword}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Nueva contrasena"
                placeholderTextColor={colors.riovoley.mutedText}
                style={styles.input}
              />
              <Pressable style={styles.eyeButton} onPress={() => setShowNewPassword((prev) => !prev)}>
                <Ionicons name={showNewPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.riovoley.gold} />
              </Pressable>
            </View>
            <View style={styles.inputRow}>
              <TextInput
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirmar nueva contrasena"
                placeholderTextColor={colors.riovoley.mutedText}
                style={styles.input}
              />
              <Pressable style={styles.eyeButton} onPress={() => setShowConfirmPassword((prev) => !prev)}>
                <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.riovoley.gold} />
              </Pressable>
            </View>
            <View style={styles.requirementsBox}>
              <ThemedText style={styles.requirementsTitle}>Requisitos de contrasena</ThemedText>
              <ThemedText style={styles.requirementItem}>- Minimo 6 caracteres.</ThemedText>
              <ThemedText style={styles.requirementItem}>- Debe coincidir con la confirmacion.</ThemedText>
              <ThemedText style={styles.requirementItem}>- Evita usar datos personales faciles.</ThemedText>
            </View>
            {passwordStatus ? (
              <ThemedText style={passwordStatus.type === 'success' ? styles.statusSuccess : styles.statusError}>
                {passwordStatus.message}
              </ThemedText>
            ) : null}
            <PrimaryActionButton
              label="Actualizar contrasena"
              loading={passwordLoading}
              disabled={passwordLoading}
              onPress={handleChangePassword}
            />
          </View>
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.riovoley.dark,
    paddingHorizontal: spacing[4],
    paddingTop: spacing[6],
    gap: spacing[3],
  },
  scrollContent: {
    gap: spacing[3],
    paddingBottom: spacing[8],
  },
  sessionCard: {
    backgroundColor: colors.riovoley.cardDark,
    borderWidth: 1,
    borderColor: 'rgba(245,179,58,0.22)',
    borderRadius: 12,
    padding: spacing[3],
    gap: spacing[2],
  },
  passwordCard: {
    backgroundColor: colors.riovoley.cardDark,
    borderWidth: 1,
    borderColor: 'rgba(245,179,58,0.22)',
    borderRadius: 12,
    padding: spacing[3],
    gap: spacing[2],
  },
  lastChangeBox: {
    borderWidth: 1,
    borderColor: 'rgba(245,179,58,0.2)',
    borderRadius: 10,
    padding: spacing[2],
    backgroundColor: 'rgba(8,21,59,0.35)',
    gap: 2,
  },
  lastChangeLabel: {
    color: colors.riovoley.mutedText,
    fontSize: 12,
  },
  lastChangeValue: {
    color: colors.riovoley.pearl,
    fontSize: 12,
    fontWeight: '700',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(245,179,58,0.35)',
    borderRadius: 10,
    color: colors.riovoley.text,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    backgroundColor: 'rgba(8,21,59,0.5)',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  eyeButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(245,179,58,0.35)',
    backgroundColor: 'rgba(8,21,59,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  requirementsBox: {
    borderWidth: 1,
    borderColor: 'rgba(245,179,58,0.2)',
    borderRadius: 10,
    padding: spacing[2],
    backgroundColor: 'rgba(8,21,59,0.35)',
    gap: 2,
  },
  requirementsTitle: {
    fontWeight: '700',
    color: colors.riovoley.pearl,
    fontSize: 12,
  },
  requirementItem: {
    color: colors.riovoley.mutedText,
    fontSize: 12,
  },
  statusSuccess: {
    color: colors.riovoley.success,
    fontSize: 12,
  },
  statusError: {
    color: colors.riovoley.danger,
    fontSize: 12,
  },
  footerText: {
    color: colors.riovoley.mutedText,
  },
});

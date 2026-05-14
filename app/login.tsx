import { Image } from 'expo-image';
import { Redirect } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Alert,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

// Alert.alert no funciona en web — este helper muestra un Alert nativo en móvil
// y en web simplemente no hace nada (el error se muestra inline en la UI).
const showAlert = (title: string, message: string) => {
  if (Platform.OS !== 'web') {
    Alert.alert(title, message);
  }
};

export default function LoginScreen() {
  const MAX_FAILED_ATTEMPTS = 5;
  const LOCKOUT_SECONDS = 30;
  const accentGold = '#FFD700';
  const accentBlue = '#1E3A8A';
  const containerColor = useMemo(() => '#0A0A0A', []);
  const cardColor = useMemo(() => 'rgba(20, 20, 30, 0.96)', []);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockUntil, setLockUntil] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  // Estado para el mensaje de error inline (visible en web y móvil)
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isInvalidCredentialsError = (error: unknown): boolean => {
    if (!error || typeof error !== 'object') {
      return false;
    }

    const candidate = error as {
      message?: string;
      code?: string;
      status?: number;
    };

    const message = (candidate.message ?? '').toLowerCase();
    const code = (candidate.code ?? '').toLowerCase();
    const status = candidate.status;
    const isEmailNotConfirmed =
      code === 'email_not_confirmed' || message.includes('email not confirmed');

    if (isEmailNotConfirmed) {
      return false;
    }

    return (
      (status === 400 &&
        (message.includes('invalid login credentials') ||
          message.includes('invalid credentials') ||
          code === 'invalid_credentials')) ||
      code === 'invalid_credentials' ||
      code === 'invalid_grant' ||
      message.includes('invalid login credentials') ||
      message.includes('invalid credentials') ||
      message.includes('email or password') ||
      message.includes('correo o contrasena')
    );
  };

  useEffect(() => {
    if (!lockUntil) {
      setRemainingSeconds(0);
      return;
    }

    const tick = () => {
      const remaining = Math.max(0, Math.ceil((lockUntil - Date.now()) / 1000));
      setRemainingSeconds(remaining);
      if (remaining <= 0) {
        setLockUntil(null);
        setFailedAttempts(0);
      }
    };

    tick();
    const intervalId = setInterval(tick, 1000);
    return () => clearInterval(intervalId);
  }, [lockUntil]);

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) {
        return;
      }

      setHasSession(!!data.session);
      setChecking(false);
    };

    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasSession(!!session);
      setChecking(false);
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleSignIn = async () => {
    setErrorMsg(null); // Limpiar error anterior al cada intento

    if (!email || !password) {
      setErrorMsg('Ingresa tu correo y contraseña.');
      showAlert('Faltan datos', 'Ingresa email y password.');
      return;
    }

    if (lockUntil && lockUntil > Date.now()) {
      setErrorMsg(`Demasiados intentos. Espera ${remainingSeconds}s para volver a intentarlo.`);
      showAlert(
        'Demasiados intentos',
        `Espera ${remainingSeconds} segundos para volver a intentarlo.`,
      );
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      if (__DEV__) {
        console.log(
          'Supabase signIn error:',
          JSON.stringify({
            message: error.message,
            code: (error as { code?: string }).code,
            status: (error as { status?: number }).status,
            name: error.name,
          }),
        );
      }

      const nextAttempts = failedAttempts + 1;
      const attemptsLeft = MAX_FAILED_ATTEMPTS - nextAttempts;
      const isInvalidCredentials = isInvalidCredentialsError(error);

      if (nextAttempts >= MAX_FAILED_ATTEMPTS) {
        setLockUntil(Date.now() + LOCKOUT_SECONDS * 1000);
        setFailedAttempts(0);
        const lockMsg = `Superaste ${MAX_FAILED_ATTEMPTS} intentos fallidos. Espera ${LOCKOUT_SECONDS} segundos.`;
        setErrorMsg(lockMsg);
        showAlert('Login bloqueado', lockMsg);
        return;
      }

      setFailedAttempts(nextAttempts);

      if (isInvalidCredentials) {
        const msg = `Correo o contraseña incorrectos. Te quedan ${attemptsLeft} intento(s).`;
        setErrorMsg(msg);
        showAlert('Credenciales incorrectas', msg);
        return;
      }

      // Error desconocido
      setErrorMsg(error.message);
      showAlert('Error al iniciar sesion', error.message);
      return;
    }

    setFailedAttempts(0);
    setLockUntil(null);
    setErrorMsg(null);
  };

  if (checking) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator />
      </ThemedView>
    );
  }

  if (hasSession) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: containerColor }]}>
      <View style={styles.bgOverlay} />
      <View style={[styles.bgAccent, { borderColor: accentGold }]} />
      <View style={[styles.bgGlow, { backgroundColor: accentBlue }]} />
      <ThemedView
        style={[styles.card, { backgroundColor: cardColor, borderColor: accentGold }]}
        lightColor={cardColor}
        darkColor={cardColor}>
        <View style={styles.logoWrap}>
          <View style={[styles.logoHalo, { borderColor: accentGold }]} />
          <Image source={require('@/assets/images/icon.png')} style={styles.logo} />
        </View>
        <ThemedText style={styles.title}>Iniciar sesion</ThemedText>
        <ThemedText style={styles.subtitle}>Accede a tu cuenta RioVoley</ThemedText>
        <TextInput
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="Correo electronico"
          placeholderTextColor="#94A3B8"
          style={[styles.input, { borderColor: errorMsg ? '#EF4444' : accentGold }]}
          value={email}
          onChangeText={(v) => { setEmail(v); setErrorMsg(null); }}
        />
        <View style={[styles.passwordWrap, { borderColor: errorMsg ? '#EF4444' : accentGold }]}>
          <TextInput
            placeholder="Contrasena"
            placeholderTextColor="#94A3B8"
            secureTextEntry={!showPassword}
            style={styles.passwordInput}
            value={password}
            onChangeText={(v) => { setPassword(v); setErrorMsg(null); }}
          />
          <Pressable
            onPress={() => setShowPassword((prev) => !prev)}
            hitSlop={8}
            style={styles.eyeButton}>
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color="#94A3B8"
            />
          </Pressable>
        </View>

        {/* Mensaje de error inline — visible en web y móvil */}
        {errorMsg ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={15} color="#EF4444" />
            <ThemedText style={styles.errorText}>{errorMsg}</ThemedText>
          </View>
        ) : null}

        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            { backgroundColor: accentGold, opacity: pressed ? 0.85 : 1 },
          ]}
          onPress={handleSignIn}
          disabled={loading || remainingSeconds > 0}>
          <ThemedText style={styles.primaryButtonText}>
            {remainingSeconds > 0 ? `Espera ${remainingSeconds}s` : 'Ingresar'}
          </ThemedText>
        </Pressable>
        {loading ? <ActivityIndicator style={styles.loading} color={accentGold} /> : null}
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  bgOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(10, 10, 10, 0.88)',
  },
  bgAccent: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 2,
    opacity: 0.18,
    top: -80,
    right: -120,
  },
  bgGlow: {
    position: 'absolute',
    width: 360,
    height: 360,
    borderRadius: 180,
    opacity: 0.2,
    bottom: -160,
    left: -140,
  },
  card: {
    width: '100%',
    gap: 12,
    padding: 20,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#FFD700',
    shadowColor: '#000000',
    shadowOpacity: 0.35,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 18 },
    elevation: 12,
  },
  logoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  logoHalo: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 2,
    opacity: 0.25,
    shadowColor: '#FFD700',
    shadowOpacity: 0.6,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  logo: {
    width: 130,
    height: 130,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'center',
    fontFamily: Fonts.sans,
    color: '#F8F9FA',
  },
  subtitle: {
    fontSize: 15,
    opacity: 0.75,
    textAlign: 'center',
    color: '#94A3B8',
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(10, 10, 10, 0.5)',
    color: '#F8F9FA',
  },
  passwordWrap: {
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'rgba(10, 10, 10, 0.5)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
    paddingRight: 8,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 10,
    color: '#F8F9FA',
  },
  eyeButton: {
    padding: 4,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    flex: 1,
  },
  primaryButton: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#0A0A0A',
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  loading: {
    alignSelf: 'flex-start',
  },
});
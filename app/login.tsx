import { Image } from 'expo-image';
import { Redirect } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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

export default function LoginScreen() {
  const accentGold = '#FFD700';
  const accentBlue = '#1E3A8A';
  const containerColor = useMemo(() => '#0A0A0A', []);
  const cardColor = useMemo(() => 'rgba(20, 20, 30, 0.96)', []);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);

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
    if (!email || !password) {
      Alert.alert('Faltan datos', 'Ingresa email y password.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      Alert.alert('Error al iniciar sesion', error.message);
    }
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
          style={[styles.input, { borderColor: accentGold }]}
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          placeholder="Contrasena"
          placeholderTextColor="#94A3B8"
          secureTextEntry
          style={[styles.input, { borderColor: accentGold }]}
          value={password}
          onChangeText={setPassword}
        />
        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            { backgroundColor: accentGold, opacity: pressed ? 0.85 : 1 },
          ]}
          onPress={handleSignIn}
          disabled={loading}>
          <ThemedText style={styles.primaryButtonText}>Ingresar</ThemedText>
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
    borderColor: '#FFD700',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(10, 10, 10, 0.5)',
    color: '#F8F9FA',
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

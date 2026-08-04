import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { COLORS } from '../../constants';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { useAccessibilityStore } from '../../store/accessibilityStore';

const BACKEND_HEALTH = 'https://samaj-setu-backend.onrender.com/health';
const ROLE_ROUTE = { citizen: 'CitizenTabs', leader: 'TeamTabs', member: 'TeamTabs', admin: 'AdminTabs' };

export default function SplashScreen({ navigation }) {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Wake up Render backend while the splash animation plays (fire-and-forget)
    fetch(BACKEND_HEALTH, { method: 'GET' }).catch(() => {});

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();

    const resume = async () => {
      await Promise.all([
        useThemeStore.getState().loadTheme(),
        useAccessibilityStore.getState().loadAccessibilitySettings(),
        useAuthStore.getState().loadFromStorage(),
      ]);

      const { token, role } = useAuthStore.getState();
      const { biometricEnabled } = useAccessibilityStore.getState();
      const destination = token && ROLE_ROUTE[role];

      if (destination && biometricEnabled) {
        const hasHardware = await LocalAuthentication.hasHardwareAsync().catch(() => false);
        const isEnrolled   = hasHardware && await LocalAuthentication.isEnrolledAsync().catch(() => false);
        if (isEnrolled) {
          const result = await LocalAuthentication.authenticateAsync({ promptMessage: 'Unlock Samaj Setu' }).catch(() => ({ success: false }));
          if (!result.success) {
            // Biometric failed/cancelled — fall back to a normal login rather than locking the user out
            return navigation.replace('Welcome');
          }
        }
      }

      navigation.replace(destination || 'Language');
    };

    const timer = setTimeout(resume, 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoContainer, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoEmoji}>🏛️</Text>
        </View>
        <Text style={styles.appName}>Samaj Setu</Text>
        <Text style={styles.tagline}>समाज सेतु • সমাজ সেতু</Text>
        <Text style={styles.subtitle}>Bridge to Society</Text>
      </Animated.View>
      <Text style={styles.office}>RAM Mandir New Town Hatiara{'\n'}Office</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  logoContainer: { alignItems: 'center' },
  logoCircle:    { width: 120, height: 120, borderRadius: 60, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', marginBottom: 20, elevation: 8 },
  logoEmoji:     { fontSize: 60 },
  appName:       { fontSize: 36, fontWeight: 'bold', color: '#FFF', letterSpacing: 2 },
  tagline:       { fontSize: 16, color: 'rgba(255,255,255,0.85)', marginTop: 6 },
  subtitle:      { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  office:        { position: 'absolute', bottom: 40, color: 'rgba(255,255,255,0.7)', textAlign: 'center', fontSize: 13 },
});

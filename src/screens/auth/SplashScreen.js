import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Image } from 'react-native';
import { COLORS } from '../constants';

export default function SplashScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => navigation.replace('Language'), 2500);
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

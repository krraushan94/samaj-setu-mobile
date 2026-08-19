import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../constants';
import AppText from '../../components/AppText';
import { useT } from '../../i18n';

export default function WelcomeScreen({ navigation }) {
  const tr = useT().welcome;
  return (
    <LinearGradient colors={[COLORS.primary, '#7B1FA2']} style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.hero}>
        <Text style={styles.heroEmoji}>🏛️</Text>
        <AppText style={styles.appName}>{tr.appName}</AppText>
        <AppText style={styles.tagline}>{tr.tagline}</AppText>
        <AppText style={styles.tagline2}>{tr.tagline2}</AppText>
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity style={styles.btnPrimary} onPress={() => navigation.navigate('Register')} accessibilityRole="button">
          <AppText style={styles.btnPrimaryText}>{tr.createAccount}</AppText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnSecondary} onPress={() => navigation.navigate('Login')} accessibilityRole="button">
          <AppText style={styles.btnSecondaryText}>{tr.login}</AppText>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.guestBtn}
          onPress={() => navigation.replace('CitizenTabs')}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
        >
          <AppText style={styles.guestText}>{tr.browseAsGuest}</AppText>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, justifyContent: 'space-between', alignItems: 'center', paddingBottom: 60, paddingTop: 80 },
  hero:            { alignItems: 'center' },
  heroEmoji:       { fontSize: 72, marginBottom: 16 },
  appName:         { fontSize: 40, fontWeight: 'bold', color: '#FFF', letterSpacing: 2 },
  tagline:         { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 8 },
  tagline2:        { fontSize: 18, color: 'rgba(255,255,255,0.9)', marginTop: 12, fontStyle: 'italic' },
  buttons:         { width: '80%', gap: 14, alignItems: 'center' },
  btnPrimary:      { backgroundColor: '#FFF', borderRadius: 30, paddingVertical: 16, width: '100%', alignItems: 'center', elevation: 4 },
  btnPrimaryText:  { color: COLORS.primary, fontSize: 16, fontWeight: 'bold' },
  btnSecondary:    { borderWidth: 2, borderColor: '#FFF', borderRadius: 30, paddingVertical: 14, width: '100%', alignItems: 'center' },
  btnSecondaryText:{ color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  guestBtn:        { marginTop: 8, paddingVertical: 10, paddingHorizontal: 16 },
  guestText:       { color: 'rgba(255,255,255,0.75)', fontSize: 14 },
});

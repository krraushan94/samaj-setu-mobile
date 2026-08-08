import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, Alert, Switch } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import AppText from '../../components/AppText';
import { COLORS, LANGUAGES } from '../../constants';
import { useTheme, useThemeStore } from '../../store/themeStore';
import { useAccessibilityStore, FONT_SCALES } from '../../store/accessibilityStore';
import { useAuthStore } from '../../store/authStore';

const FONT_LABELS = { small: 'Small', normal: 'Normal', large: 'Large', xlarge: 'Extra Large' };

export default function AccessibilitySettingsScreen({ navigation }) {
  const t = useTheme();
  const { isDark, highContrast, toggleTheme, toggleHighContrast } = useThemeStore();
  const { fontSize, simpleMode, biometricEnabled, setFontSize, toggleSimpleMode, setBiometricEnabled } = useAccessibilityStore();
  const language = useAuthStore((s) => s.language);
  const setLanguage = useAuthStore((s) => s.setLanguage);
  const logout = useAuthStore((s) => s.logout);
  const [hasBiometricHardware, setHasBiometricHardware] = useState(false);

  useEffect(() => {
    LocalAuthentication.hasHardwareAsync().then(async (has) => {
      const enrolled = has && await LocalAuthentication.isEnrolledAsync();
      setHasBiometricHardware(!!enrolled);
    }).catch(() => setHasBiometricHardware(false));
  }, []);

  const onToggleBiometric = async (value) => {
    if (value) {
      const result = await LocalAuthentication.authenticateAsync({ promptMessage: 'Confirm to enable biometric unlock' });
      if (!result.success) return;
    }
    setBiometricEnabled(value);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: t.background }]} contentContainerStyle={styles.body}>
      <Section title="Font Size" t={t}>
        <View style={styles.chipRow}>
          {Object.keys(FONT_SCALES).map((key) => (
            <TouchableOpacity
              key={key}
              style={[styles.chip, { borderColor: t.primary }, fontSize === key && { backgroundColor: t.primary }]}
              onPress={() => setFontSize(key)}
              accessibilityLabel={`Font size ${FONT_LABELS[key]}`}
            >
              <AppText style={[styles.chipText, { color: fontSize === key ? t.textInverse : t.primary }]}>{FONT_LABELS[key]}</AppText>
            </TouchableOpacity>
          ))}
        </View>
      </Section>

      <Section title="Display" t={t}>
        <Row label="Dark Mode" value={isDark} onChange={toggleTheme} t={t} />
        <Row label="High Contrast Mode" value={highContrast} onChange={toggleHighContrast} t={t}
          hint="Pure black/white/yellow for low-vision users" />
        <Row label="Simple Mode" value={simpleMode} onChange={toggleSimpleMode} t={t}
          hint="Bigger buttons, fewer words — for elderly or first-time users" />
      </Section>

      <Section title="Security" t={t}>
        <Row
          label="Biometric Unlock"
          value={biometricEnabled}
          onChange={onToggleBiometric}
          t={t}
          disabled={!hasBiometricHardware}
          hint={hasBiometricHardware ? 'Use fingerprint/Face ID to reopen the app' : 'No fingerprint/Face ID set up on this device'}
        />
        <TouchableOpacity style={styles.changePasswordRow} onPress={() => navigation.navigate('ChangePassword')} accessibilityLabel="Change password">
          <AppText style={[styles.rowLabel, { color: t.text }]}>Change Password</AppText>
          <MaterialIcons name="chevron-right" size={22} color={t.textLight} />
        </TouchableOpacity>
      </Section>

      <Section title="Language / भाषा / ভাষা" t={t}>
        <View style={styles.chipRow}>
          {LANGUAGES.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={[styles.chip, { borderColor: t.primary }, language === lang.code && { backgroundColor: t.primary }]}
              onPress={() => setLanguage(lang.code)}
              accessibilityLabel={`Switch to ${lang.name}`}
            >
              <AppText style={[styles.chipText, { color: language === lang.code ? t.textInverse : t.primary }]}>{lang.label}</AppText>
            </TouchableOpacity>
          ))}
        </View>
      </Section>

      <TouchableOpacity
        style={[styles.aboutBtn, { borderColor: t.border }]}
        onPress={() => navigation.navigate('About')}
        accessibilityLabel="About Us"
      >
        <MaterialIcons name="info-outline" size={20} color={t.primary} />
        <AppText style={[styles.aboutText, { color: t.primary }]}>About Us</AppText>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.logoutBtn, { borderColor: t.danger }]}
        onPress={() => Alert.alert('Log Out', 'Are you sure?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Log Out', style: 'destructive', onPress: () => { logout(); navigation.replace('Welcome'); } },
        ])}
        accessibilityLabel="Log out"
      >
        <MaterialIcons name="logout" size={20} color={t.danger} />
        <AppText style={[styles.logoutText, { color: t.danger }]}>Log Out</AppText>
      </TouchableOpacity>
    </ScrollView>
  );
}

const Section = ({ title, t, children }) => (
  <View style={[styles.card, { backgroundColor: t.card, borderColor: t.border }]}>
    <AppText style={[styles.sectionTitle, { color: t.text }]}>{title}</AppText>
    {children}
  </View>
);

const Row = ({ label, value, onChange, t, hint, disabled }) => (
  <View style={styles.row}>
    <View style={{ flex: 1 }}>
      <AppText style={[styles.rowLabel, { color: disabled ? t.textLight : t.text }]}>{label}</AppText>
      {hint && <AppText style={[styles.rowHint, { color: t.textLight }]}>{hint}</AppText>}
    </View>
    <Switch value={value} onValueChange={onChange} disabled={disabled} accessibilityLabel={label} />
  </View>
);

const styles = StyleSheet.create({
  container:    { flex: 1 },
  body:         { padding: 16, paddingBottom: 40, gap: 14 },
  card:         { borderRadius: 14, padding: 16, borderWidth: 1, gap: 12 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  chipRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:         { borderWidth: 1.5, borderRadius: 20, paddingVertical: 8, paddingHorizontal: 14 },
  chipText:     { fontSize: 13, fontWeight: '600' },
  row:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  changePasswordRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 },
  rowLabel:     { fontSize: 14, fontWeight: '600' },
  rowHint:      { fontSize: 11, marginTop: 2 },
  aboutBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderRadius: 12, padding: 14 },
  aboutText:    { fontSize: 15, fontWeight: 'bold' },
  logoutBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderRadius: 12, padding: 14, marginTop: 4 },
  logoutText:   { fontSize: 15, fontWeight: 'bold' },
});

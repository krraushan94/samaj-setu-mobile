import React from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AppText from '../../components/AppText';
import { useTheme } from '../../store/themeStore';
import { useT } from '../../i18n';
import { OFFICE_ADDRESS, OFFICE_EMAIL } from '../../constants';

const APP_VERSION = '1.0.0';

export default function AboutScreen() {
  const t = useTheme();
  const tr = useT().about;

  return (
    <ScrollView style={[styles.container, { backgroundColor: t.background }]} contentContainerStyle={styles.body}>
      <View style={styles.hero}>
        <MaterialIcons name="handshake" size={48} color={t.primary} />
        <AppText style={[styles.appName, { color: t.text }]}>{tr.appName}</AppText>
        <AppText style={[styles.tagline, { color: t.textLight }]}>{tr.appTagline}</AppText>
      </View>

      <Section title={tr.appDescriptionTitle} t={t}>
        <AppText style={[styles.body14, { color: t.text }]}>{tr.appDescription}</AppText>
      </Section>

      <Section title={tr.teamTitle} t={t}>
        <AppText style={[styles.body14, { color: t.text }]}>{tr.teamDescription}</AppText>
        <View style={[styles.guidanceCard, { backgroundColor: t.background, borderColor: t.border }]}>
          <MaterialIcons name="verified" size={24} color={t.primary} />
          <View style={{ flex: 1 }}>
            <AppText style={[styles.guidanceLabel, { color: t.textLight }]}>{tr.guidanceLabel}</AppText>
            <AppText style={[styles.guidanceName, { color: t.text }]}>{tr.guidanceName}</AppText>
            <AppText style={[styles.guidanceTitle, { color: t.textLight }]}>{tr.guidanceTitle}</AppText>
          </View>
        </View>
      </Section>

      <Section title={tr.contactTitle} t={t}>
        <View style={styles.contactRow}>
          <MaterialIcons name="location-city" size={20} color={t.primary} />
          <AppText style={[styles.body14, { color: t.text, flex: 1 }]}>{OFFICE_ADDRESS}</AppText>
        </View>
        <TouchableOpacity style={styles.contactRow} onPress={() => Linking.openURL(`mailto:${OFFICE_EMAIL}`)}>
          <MaterialIcons name="email" size={20} color={t.primary} />
          <AppText style={[styles.body14, { color: t.primary, flex: 1 }]}>{OFFICE_EMAIL}</AppText>
        </TouchableOpacity>
      </Section>

      <AppText style={[styles.version, { color: t.textLight }]}>{tr.version}: {APP_VERSION}</AppText>
    </ScrollView>
  );
}

const Section = ({ title, t, children }) => (
  <View style={[styles.card, { backgroundColor: t.card, borderColor: t.border }]}>
    <AppText style={[styles.sectionTitle, { color: t.text }]}>{title}</AppText>
    {children}
  </View>
);

const styles = StyleSheet.create({
  container:      { flex: 1 },
  body:           { padding: 16, paddingBottom: 40, gap: 14 },
  hero:           { alignItems: 'center', gap: 8, paddingVertical: 12 },
  appName:        { fontSize: 22, fontWeight: 'bold' },
  tagline:        { fontSize: 13, textAlign: 'center', lineHeight: 19, paddingHorizontal: 12 },
  card:           { borderRadius: 14, padding: 16, borderWidth: 1, gap: 10 },
  sectionTitle:   { fontSize: 16, fontWeight: 'bold', marginBottom: 2 },
  body14:         { fontSize: 14, lineHeight: 21 },
  guidanceCard:   { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 10, padding: 12 },
  guidanceLabel:  { fontSize: 11 },
  guidanceName:   { fontSize: 15, fontWeight: 'bold' },
  guidanceTitle:  { fontSize: 12 },
  contactRow:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  version:        { fontSize: 12, textAlign: 'center', marginTop: 4 },
});

import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Linking } from 'react-native';
import * as Location from 'expo-location';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants';
import AppText from '../../components/AppText';
import { ticketAPI } from '../../services/api';
import { useT } from '../../i18n';

// Dedicated SOS screen — fires the real backend SOS bypass immediately on open,
// with no form and no payment step. Emergency call buttons stay visible even if
// sending the alert fails, so a network problem never blocks someone from calling
// for help directly.
export default function SOSScreen({ navigation }) {
  const tr = useT().sos;
  const [phase, setPhase] = useState('sending'); // sending | sent | failed
  const [result, setResult] = useState(null);

  const sendSOS = async () => {
    setPhase('sending');
    let latitude = null, longitude = null, locationText = null;
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        latitude = loc.coords.latitude;
        longitude = loc.coords.longitude;
        locationText = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
      }
    } catch {
      // Location is best-effort — never block the SOS on it
    }

    try {
      const { data } = await ticketAPI.sos({ latitude, longitude, locationText });
      setResult(data);
      setPhase('sent');
    } catch {
      setPhase('failed');
    }
  };

  useEffect(() => { sendSOS(); }, []);

  return (
    <View style={styles.container}>
      {phase === 'sending' && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.sos} />
          <AppText style={styles.statusText}>{tr.sending}</AppText>
          <AppText style={styles.subText}>{tr.locationNote}</AppText>
        </View>
      )}

      {phase === 'sent' && (
        <View style={styles.center}>
          <Text style={styles.emoji}>🚨</Text>
          <AppText style={styles.title}>{tr.sentTitle}</AppText>
          <AppText style={styles.body}>{tr.sentBody}</AppText>
          {result?.ticketNumber && (
            <View style={styles.refBox}>
              <AppText style={styles.refLabel}>{tr.ticketLabel}</AppText>
              <AppText style={styles.refNum}>{result.ticketNumber}</AppText>
            </View>
          )}
          <CallButtons tr={tr} />
          <TouchableOpacity style={styles.goBtn} onPress={() => navigation.replace('CitizenTabs')} accessibilityLabel={tr.goHome} accessibilityRole="button">
            <AppText style={styles.goBtnText}>{tr.goHome}</AppText>
          </TouchableOpacity>
        </View>
      )}

      {phase === 'failed' && (
        <View style={styles.center}>
          <MaterialIcons name="error" size={56} color={COLORS.danger} />
          <AppText style={styles.title}>{tr.failedTitle}</AppText>
          <AppText style={styles.body}>{tr.failedBody}</AppText>
          <CallButtons tr={tr} />
          <TouchableOpacity style={styles.retryBtn} onPress={sendSOS} accessibilityLabel={tr.retry} accessibilityRole="button">
            <AppText style={styles.retryBtnText}>{tr.retry}</AppText>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const CallButtons = ({ tr }) => (
  <View style={styles.callRow}>
    <TouchableOpacity style={[styles.callBtn, { backgroundColor: '#1565C0' }]} onPress={() => Linking.openURL('tel:100')}>
      <MaterialIcons name="local-police" size={20} color="#FFF" />
      <AppText style={styles.callBtnText}>{tr.callPolice}</AppText>
    </TouchableOpacity>
    <TouchableOpacity style={[styles.callBtn, { backgroundColor: COLORS.sos }]} onPress={() => Linking.openURL('tel:112')}>
      <MaterialIcons name="emergency" size={20} color="#FFF" />
      <AppText style={styles.callBtnText}>{tr.callEmergency}</AppText>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#FFF3F3' },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emoji:       { fontSize: 64, marginBottom: 12 },
  statusText:  { fontSize: 17, fontWeight: '600', color: COLORS.text, marginTop: 16 },
  subText:     { fontSize: 13, color: COLORS.textLight, marginTop: 6 },
  title:       { fontSize: 22, fontWeight: 'bold', color: COLORS.text, textAlign: 'center', marginBottom: 8 },
  body:        { fontSize: 15, color: COLORS.textLight, textAlign: 'center', marginBottom: 20, lineHeight: 21 },
  refBox:      { backgroundColor: '#FFF', borderRadius: 12, padding: 16, width: '100%', marginBottom: 20, alignItems: 'center', elevation: 1 },
  refLabel:    { fontSize: 12, color: COLORS.textLight, marginBottom: 4 },
  refNum:      { fontSize: 20, fontWeight: 'bold', color: COLORS.sos, letterSpacing: 1 },
  callRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 10, width: '100%', marginBottom: 20 },
  callBtn:     { flexGrow: 1, flexBasis: 140, minWidth: 140, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 8, elevation: 2 },
  callBtnText: { color: '#FFF', fontSize: 13, fontWeight: 'bold', textAlign: 'center' },
  goBtn:       { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32 },
  goBtnText:   { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
  retryBtn:    { backgroundColor: COLORS.text, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32 },
  retryBtnText:{ color: '#FFF', fontSize: 15, fontWeight: 'bold' },
});

import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Linking, Alert, ScrollView, ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useTheme } from '../../store/themeStore';
import { useT } from '../../i18n';
import { OFFICE_ADDRESS } from '../../constants';

const ALL_HELPLINES = [
  { label: 'Unified Emergency Number', number: '112',   icon: 'emergency',             color: '#D50000' },
  { label: 'Police',                   number: '100',   icon: 'local-police',          color: '#1565C0' },
  { label: 'Fire',                     number: '101',   icon: 'local-fire-department', color: '#BF360C' },
  { label: 'Ambulance',                number: '102',   icon: 'local-hospital',        color: '#2E7D32' },
  { label: 'Women Helpline',           number: '1091',  icon: 'support-agent',         color: '#AD1457' },
  { label: 'Child Helpline',           number: '1098',  icon: 'child-care',            color: '#4527A0' },
  { label: 'Disaster Relief',          number: '108',   icon: 'warning',               color: '#E65100' },
  { label: 'Cyber Crime',              number: '1930',  icon: 'security',              color: '#283593' },
  { label: 'Anti-Corruption',          number: '1064',  icon: 'gavel',                 color: '#37474F' },
  { label: 'Elder Helpline',           number: '14567', icon: 'elderly',               color: '#6A1B9A' },
  { label: 'Mental Health (Tele-MANAS)', number: '14416', icon: 'psychology',          color: '#00695C' },
];

export default function HelplinesScreen() {
  const t   = useTheme();
  const tr  = useT().helplines;
  const [tab, setTab]             = useState('emergency');
  const [locLoading, setLocLoading] = useState(false);

  const openNearby = async (query) => {
    setLocLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(tr.mapsError, tr.locationDenied);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = loc.coords;
      const url = `https://www.google.com/maps/search/${encodeURIComponent(query)}/@${latitude},${longitude},15z`;
      await Linking.openURL(url);
    } catch {
      Alert.alert(tr.mapsError, tr.locationDenied);
    } finally {
      setLocLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: t.background }]}>
      {/* Tab bar */}
      <View style={[styles.tabBar, { backgroundColor: t.surface, borderBottomColor: t.border }]}>
        <TouchableOpacity
          style={[styles.tab, tab === 'emergency' && { borderBottomWidth: 2, borderBottomColor: '#D50000' }]}
          onPress={() => setTab('emergency')}
          testID="tab-emergency"
          accessibilityLabel="Emergency tab"
        >
          <MaterialIcons name="emergency" size={17} color={tab === 'emergency' ? '#D50000' : t.textLight} />
          <Text style={[styles.tabText, { color: tab === 'emergency' ? '#D50000' : t.textLight },
            tab === 'emergency' && styles.tabTextActive]}>
            {tr.emergencyTab}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, tab === 'all' && { borderBottomWidth: 2, borderBottomColor: t.primary }]}
          onPress={() => setTab('all')}
          testID="tab-all"
          accessibilityLabel="All helplines tab"
        >
          <MaterialIcons name="phone-in-talk" size={17} color={tab === 'all' ? t.primary : t.textLight} />
          <Text style={[styles.tabText, { color: tab === 'all' ? t.primary : t.textLight },
            tab === 'all' && styles.tabTextActive]}>
            {tr.allTab}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {tab === 'emergency' ? (
          <>
            {/* Medical Emergency */}
            <View style={[styles.emergencyCard, { backgroundColor: '#E8F5E9', borderColor: '#2E7D32' }]}
              testID="card-medical">
              <View style={styles.cardHeader}>
                <MaterialIcons name="local-hospital" size={38} color="#2E7D32" />
                <View style={styles.cardInfo}>
                  <Text style={[styles.cardTitle, { color: '#1B5E20' }]}>{tr.medical}</Text>
                  <Text style={[styles.cardSub,   { color: '#388E3C' }]}>{tr.medicalSub}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.callBtn, { backgroundColor: '#2E7D32' }]}
                onPress={() => Linking.openURL('tel:102')}
                testID="btn-call-ambulance"
                accessibilityLabel={tr.callAmbulance}
              >
                <MaterialIcons name="call" size={20} color="#FFF" />
                <Text style={styles.callBtnText}>{tr.callAmbulance}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.mapBtn, { borderColor: '#2E7D32' }]}
                onPress={() => openNearby('hospital near me')}
                testID="btn-map-hospital"
                disabled={locLoading}
                accessibilityLabel={tr.nearestHospitals}
              >
                {locLoading
                  ? <ActivityIndicator size="small" color="#2E7D32" testID="loc-loader" />
                  : (<>
                      <MaterialIcons name="map" size={18} color="#2E7D32" />
                      <Text style={[styles.mapBtnText, { color: '#2E7D32' }]}>{tr.nearestHospitals}</Text>
                    </>)
                }
              </TouchableOpacity>
            </View>

            {/* Police Emergency */}
            <View style={[styles.emergencyCard, { backgroundColor: '#E3F2FD', borderColor: '#1565C0' }]}
              testID="card-police">
              <View style={styles.cardHeader}>
                <MaterialIcons name="local-police" size={38} color="#1565C0" />
                <View style={styles.cardInfo}>
                  <Text style={[styles.cardTitle, { color: '#0D47A1' }]}>{tr.police}</Text>
                  <Text style={[styles.cardSub,   { color: '#1976D2' }]}>{tr.policeSub}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.callBtn, { backgroundColor: '#1565C0' }]}
                onPress={() => Linking.openURL('tel:100')}
                testID="btn-call-police"
                accessibilityLabel={tr.callPolice}
              >
                <MaterialIcons name="call" size={20} color="#FFF" />
                <Text style={styles.callBtnText}>{tr.callPolice}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.mapBtn, { borderColor: '#1565C0' }]}
                onPress={() => openNearby('police station near me')}
                testID="btn-map-police"
                disabled={locLoading}
                accessibilityLabel={tr.nearestPolice}
              >
                {locLoading
                  ? <ActivityIndicator size="small" color="#1565C0" />
                  : (<>
                      <MaterialIcons name="map" size={18} color="#1565C0" />
                      <Text style={[styles.mapBtnText, { color: '#1565C0' }]}>{tr.nearestPolice}</Text>
                    </>)
                }
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <Text style={[styles.header, { color: t.text }]}>{tr.title}</Text>
            <Text style={[styles.sub,    { color: t.textLight }]}>{tr.subtitle}</Text>
            <View style={styles.grid}>
              {ALL_HELPLINES.map(h => {
                const label = tr.helplineLabels?.[h.number] || h.label;
                return (
                  <TouchableOpacity
                    key={h.number}
                    style={[styles.card, { backgroundColor: t.card }]}
                    onPress={() => Linking.openURL(`tel:${h.number}`)}
                    accessibilityLabel={`Call ${label} at ${h.number}`}
                    testID={`helpline-${h.number}`}
                  >
                    <MaterialIcons name={h.icon} size={32} color={h.color} />
                    <Text style={[styles.num,   { color: h.color }]}>{h.number}</Text>
                    <Text style={[styles.cardLabel, { color: t.text }]}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Physical office — cash payment / in-person help ("offline support") */}
            <View style={[styles.officeCard, { backgroundColor: t.card, borderColor: t.border }]}>
              <MaterialIcons name="location-city" size={28} color={t.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.officeTitle, { color: t.text }]}>{tr.officeTitle}</Text>
                <Text style={[styles.officeSub, { color: t.textLight }]}>{tr.officeSub}</Text>
                <Text style={[styles.officeAddr, { color: t.text }]}>{OFFICE_ADDRESS}</Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1 },
  // tab bar
  tabBar:        { flexDirection: 'row', borderBottomWidth: 1 },
  tab:           { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                   gap: 6, paddingVertical: 13 },
  tabText:       { fontSize: 14, fontWeight: '600' },
  tabTextActive: { fontWeight: '700' },
  // body
  body:          { padding: 16, gap: 16, paddingBottom: 32 },
  header:        { fontSize: 22, fontWeight: '700', marginBottom: 4 },
  sub:           { fontSize: 14, marginBottom: 12 },
  // All helplines grid
  grid:          { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card:          { width: '47%', borderRadius: 14, padding: 16, alignItems: 'center', gap: 6, elevation: 2 },
  num:           { fontSize: 22, fontWeight: '800' },
  cardLabel:     { fontSize: 13, fontWeight: '600', textAlign: 'center' },
  // Emergency cards
  emergencyCard: { borderRadius: 16, padding: 16, borderWidth: 1.5, gap: 12, elevation: 2 },
  cardHeader:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardInfo:      { flex: 1 },
  cardTitle:     { fontSize: 20, fontWeight: '800' },
  cardSub:       { fontSize: 14, marginTop: 2 },
  callBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                   gap: 8, borderRadius: 10, paddingVertical: 13 },
  callBtnText:   { color: '#FFF', fontSize: 16, fontWeight: '700' },
  mapBtn:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                   gap: 8, borderRadius: 10, paddingVertical: 11, borderWidth: 1.5, minHeight: 44 },
  mapBtnText:    { fontSize: 14, fontWeight: '600' },
  officeCard:    { flexDirection: 'row', gap: 14, alignItems: 'flex-start', borderRadius: 14, padding: 16, borderWidth: 1, marginTop: 8 },
  officeTitle:   { fontSize: 15, fontWeight: '700' },
  officeSub:     { fontSize: 12, marginTop: 2, marginBottom: 6 },
  officeAddr:    { fontSize: 13, lineHeight: 19 },
});

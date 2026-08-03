import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../store/themeStore';

const HELPLINES = [
  { label: 'Police',          number: '100',  icon: 'local-police',    color: '#1565C0' },
  { label: 'Fire',            number: '101',  icon: 'local-fire-department', color: '#BF360C' },
  { label: 'Ambulance',       number: '102',  icon: 'local-hospital',  color: '#2E7D32' },
  { label: 'Women Helpline',  number: '1091', icon: 'support-agent',   color: '#AD1457' },
  { label: 'Child Helpline',  number: '1098', icon: 'child-care',      color: '#4527A0' },
  { label: 'Disaster',        number: '108',  icon: 'warning',         color: '#E65100' },
  { label: 'Cyber Crime',     number: '1930', icon: 'security',        color: '#283593' },
  { label: 'Anti-Corruption', number: '1064', icon: 'gavel',           color: '#37474F' },
];

export default function HelplinesScreen() {
  const t = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: t.background }]}>
      <Text style={[styles.header, { color: t.text }]}>Emergency Helplines</Text>
      <Text style={[styles.sub, { color: t.textLight }]}>Tap any number to call directly</Text>
      <View style={styles.grid}>
        {HELPLINES.map(h => (
          <TouchableOpacity
            key={h.number}
            style={[styles.card, { backgroundColor: t.card }]}
            onPress={() => Linking.openURL(`tel:${h.number}`)}
            accessibilityLabel={`Call ${h.label} at ${h.number}`}
          >
            <MaterialIcons name={h.icon} size={32} color={h.color} />
            <Text style={[styles.num, { color: h.color }]}>{h.number}</Text>
            <Text style={[styles.label, { color: t.text }]}>{h.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header:    { fontSize: 22, fontWeight: '700', marginBottom: 4 },
  sub:       { fontSize: 14, marginBottom: 20 },
  grid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card:      { width: '47%', borderRadius: 14, padding: 16, alignItems: 'center', gap: 6, elevation: 2 },
  num:       { fontSize: 22, fontWeight: '800' },
  label:     { fontSize: 13, fontWeight: '600', textAlign: 'center' },
});

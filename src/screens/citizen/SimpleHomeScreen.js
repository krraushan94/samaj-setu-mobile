import React from 'react';
import { View, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AppText from '../../components/AppText';
import { COLORS } from '../../constants';
import { useTheme } from '../../store/themeStore';
import { useT } from '../../i18n';

// Big-icon, minimal-text Home layout for elderly / low-literacy / first-time users —
// four unmissable tiles instead of the full dashboard. Toggled from Settings → Simple Mode.
export default function SimpleHomeScreen({ navigation }) {
  const t = useTheme();
  const tr = useT().home;

  const triggerSOS = () => {
    Alert.alert(tr.sosTitle, tr.sosMessage,
      [{ text: tr.cancel, style: 'cancel' },
       { text: tr.sendSOS, style: 'destructive', onPress: () => navigation.navigate('SOS') }]
    );
  };

  const TILES = [
    { icon: 'report-problem', label: 'Report Issue', color: COLORS.danger,    bg: '#FFF3F3', onPress: () => navigation.navigate('IssueCategory') },
    { icon: 'list-alt',       label: 'My Tickets',   color: COLORS.secondary, bg: '#F3F7FF', onPress: () => navigation.navigate('MyTickets') },
    { icon: 'sos',            label: 'SOS',          color: COLORS.sos,       bg: '#FFEBEE', onPress: triggerSOS },
    { icon: 'people',         label: 'Community',    color: COLORS.success,  bg: '#F3FFF3', onPress: () => navigation.navigate('CommunityBoard') },
  ];

  return (
    <View style={[styles.container, { backgroundColor: t.background }]}>
      <View style={styles.grid}>
        {TILES.map((tile) => (
          <TouchableOpacity
            key={tile.label}
            style={[styles.tile, { backgroundColor: tile.bg, borderColor: tile.color }]}
            onPress={tile.onPress}
            accessibilityLabel={tile.label}
          >
            <MaterialIcons name={tile.icon} size={56} color={tile.color} />
            <AppText style={[styles.tileLabel, { color: tile.color }]}>{tile.label}</AppText>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity style={styles.settingsLink} onPress={() => navigation.navigate('AccessibilitySettings')}>
        <MaterialIcons name="settings" size={22} color={t.textLight} />
        <AppText style={[styles.settingsText, { color: t.textLight }]}>Settings</AppText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, padding: 20, justifyContent: 'center' },
  grid:          { gap: 16 },
  tile:          { borderRadius: 20, borderWidth: 2, paddingVertical: 32, alignItems: 'center', gap: 10 },
  tileLabel:     { fontSize: 20, fontWeight: 'bold' },
  settingsLink:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 24, padding: 10 },
  settingsText:  { fontSize: 14, fontWeight: '600' },
});

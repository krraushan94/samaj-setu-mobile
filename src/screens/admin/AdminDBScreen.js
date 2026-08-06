import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants';
import { adminAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import AppText from '../../components/AppText';

const TABLES = [
  { key: 'users',             label: 'Users',            icon: 'people',          color: '#1565C0' },
  { key: 'tickets',           label: 'Tickets',          icon: 'confirmation-number', color: '#C62828' },
  { key: 'payments',          label: 'Payments',         icon: 'payments',        color: '#2E7D32' },
  { key: 'media_attachments', label: 'Media Files',      icon: 'perm-media',      color: '#6A1B9A' },
  { key: 'audit_logs',        label: 'Audit Logs',       icon: 'history',         color: '#E65100' },
  { key: 'departments',       label: 'Departments',      icon: 'business',        color: '#283593' },
  { key: 'team_members',      label: 'Team Members',     icon: 'group',           color: '#00695C' },
  { key: 'notifications',     label: 'Notifications',    icon: 'notifications',   color: '#F57F17' },
  { key: 'app_impressions',   label: 'App Impressions',  icon: 'analytics',       color: '#880E4F' },
  { key: 'ticket_history',    label: 'Ticket History',   icon: 'timeline',        color: '#4527A0' },
  { key: 'events',            label: 'Events',           icon: 'event',           color: '#1B5E20' },
  { key: 'missing_persons',   label: 'Missing Persons',  icon: 'person-search',   color: '#BF360C' },
];

export default function AdminDBScreen({ navigation }) {
  const user = useAuthStore((s) => s.user);
  const isPrimaryAdmin = user?.username === 'Admin_Raushan';
  const [selected, setSelected] = useState(null);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  const loadTable = async (table, p = 1) => {
    setLoading(true);
    try {
      const { data } = await adminAPI.browseTable(table, { page: p, limit: 20 });
      setRows(p === 1 ? data.rows : [...rows, ...data.rows]);
      setTotal(data.total);
      setPage(p);
    } catch (e) {
      Alert.alert('Error', 'Could not load table');
    } finally { setLoading(false); }
  };

  const exportCSV = async (table) => {
    try {
      await adminAPI.exportTable(table);
      Alert.alert('Export', 'CSV export initiated (check Downloads)');
    } catch { Alert.alert('Error', 'Export failed'); }
  };

  if (!isPrimaryAdmin) {
    return (
      <View style={styles.container}>
        <View style={styles.headerBar}>
          <Text style={styles.pageTitle}>🗄️ Database Explorer</Text>
          <Text style={styles.pageSub}>Admin_Raushan — Read-only access</Text>
        </View>
        <View style={styles.restricted}>
          <MaterialIcons name="lock" size={40} color={COLORS.textLight} />
          <Text style={styles.restrictedText}>Restricted to Admin_Raushan — raw data access, including payments, isn't delegated to sub-admins.</Text>
        </View>
      </View>
    );
  }

  if (!selected) {
    return (
      <View style={styles.container}>
        <View style={styles.headerBar}>
          <Text style={styles.pageTitle}>🗄️ Database Explorer</Text>
          <Text style={styles.pageSub}>Admin_Raushan — Read-only access</Text>
        </View>
        <FlatList
          data={TABLES}
          numColumns={2}
          contentContainerStyle={styles.grid}
          keyExtractor={t => t.key}
          renderItem={({ item }) => (
            <TouchableOpacity style={[styles.tableCard, { borderLeftColor: item.color }]} onPress={() => { setSelected(item); loadTable(item.key); }}>
              <MaterialIcons name={item.icon} size={28} color={item.color} />
              <AppText style={styles.tableLabel}>{item.label}</AppText>
            </TouchableOpacity>
          )}
        />
      </View>
    );
  }

  const cols = rows.length > 0 ? Object.keys(rows[0]).slice(0, 4) : [];

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => { setSelected(null); setRows([]); }} style={styles.backRow}>
          <MaterialIcons name="arrow-back" size={20} color={COLORS.primary} />
          <Text style={styles.backText}>Tables</Text>
        </TouchableOpacity>
        <View style={styles.tableHeaderRow}>
          <Text style={styles.pageTitle}>{selected.label}</Text>
          <Text style={styles.pageSub}>{total} records</Text>
        </View>
        <TouchableOpacity style={styles.exportBtn} onPress={() => exportCSV(selected.key)}>
          <MaterialIcons name="download" size={18} color="#FFF" />
          <Text style={styles.exportText}>Export CSV</Text>
        </TouchableOpacity>
      </View>

      {loading && rows.length === 0
        ? <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
        : (
          <ScrollView horizontal>
            <View>
              {/* Column headers */}
              <View style={styles.tableRow}>
                {cols.map(c => <Text key={c} style={styles.colHeader}>{c}</Text>)}
              </View>
              <FlatList
                data={rows}
                keyExtractor={(_, i) => String(i)}
                onEndReached={() => { if (rows.length < total) loadTable(selected.key, page + 1); }}
                onEndReachedThreshold={0.5}
                renderItem={({ item, index }) => (
                  <View style={[styles.tableRow, index % 2 === 0 && styles.tableRowAlt]}>
                    {cols.map(c => (
                      <Text key={c} style={styles.cell} numberOfLines={1}>
                        {item[c] == null ? '—' : typeof item[c] === 'object' ? JSON.stringify(item[c]).slice(0, 40) : String(item[c]).slice(0, 40)}
                      </Text>
                    ))}
                  </View>
                )}
              />
            </View>
          </ScrollView>
        )
      }
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: COLORS.background },
  headerBar:      { backgroundColor: '#1A237E', padding: 16, paddingTop: 50 },
  pageTitle:      { flex: 1, flexShrink: 1, marginRight: 8, fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  pageSub:        { flexShrink: 0, fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  grid:           { padding: 12, gap: 10 },
  restricted:     { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  restrictedText: { fontSize: 14, color: COLORS.textLight, textAlign: 'center', lineHeight: 20 },
  tableCard:      { flex: 1, margin: 5, backgroundColor: '#FFF', borderRadius: 12, padding: 14, alignItems: 'center', gap: 8, borderLeftWidth: 4, elevation: 2, minHeight: 90 },
  tableLabel:     { fontSize: 13, fontWeight: '600', color: COLORS.text, textAlign: 'center' },
  backRow:        { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  backText:       { color: 'rgba(255,255,255,0.9)', fontSize: 14 },
  tableHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  exportBtn:      { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.success, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12 },
  exportText:     { color: '#FFF', fontSize: 13, fontWeight: '600' },
  tableRow:       { flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 8, borderBottomWidth: 1, borderColor: COLORS.border },
  tableRowAlt:    { backgroundColor: '#F5F5F5' },
  colHeader:      { width: 150, fontSize: 12, fontWeight: 'bold', color: '#1A237E', paddingRight: 8 },
  cell:           { width: 150, fontSize: 12, color: COLORS.text, paddingRight: 8 },
});

import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, STATUS_COLORS, STATUS_LABELS, PRIORITY_COLORS } from '../../constants';
import { ticketAPI, paymentAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export default function TeamDashboardScreen({ navigation }) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [tickets, setTickets] = useState([]);
  const [filter, setFilter] = useState('open');
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const { data } = await ticketAPI.list({ status: filter !== 'all' ? filter : undefined, limit: 50 });
      setTickets(data.tickets || []);
    } catch {}
  };

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };
  useEffect(() => { load(); }, [filter]);

  const FILTERS = ['all', 'open', 'in_progress', 'resolved'];

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#004D40', '#00695C']} style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.deptLabel}>{user?.department || 'My Department'}</Text>
            <Text style={styles.headerTitle}>Team Dashboard</Text>
          </View>
          <TouchableOpacity onPress={() => { logout(); navigation.replace('Welcome'); }}>
            <MaterialIcons name="logout" size={22} color="#FFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity key={f} style={[styles.filterChip, filter === f && styles.filterActive]} onPress={() => setFilter(f)}>
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'all' ? 'All' : STATUS_LABELS[f]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={tickets}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        keyExtractor={t => t.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No tickets found</Text>}
        renderItem={({ item: t }) => (
          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('TeamTicketDetail', { id: t.id })}>
            {t.priority === 'critical' && (
              <View style={styles.criticalBanner}><Text style={styles.criticalText}>🔴 CRITICAL — Immediate Action Required</Text></View>
            )}
            <View style={styles.cardTop}>
              <Text style={styles.ticketNum}>#{t.ticket_number}</Text>
              <View style={[styles.badge, { backgroundColor: PRIORITY_COLORS[t.priority] }]}>
                <Text style={styles.badgeText}>{t.priority?.toUpperCase()}</Text>
              </View>
            </View>
            <Text style={styles.title} numberOfLines={2}>{t.title}</Text>
            <View style={styles.cardBottom}>
              <Text style={styles.meta}>{t.sub_category} • Ward {t.ward || '–'}</Text>
              <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[t.status] + '22' }]}>
                <Text style={[styles.statusText, { color: STATUS_COLORS[t.status] }]}>{STATUS_LABELS[t.status]}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: COLORS.background },
  header:         { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20 },
  headerRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  deptLabel:      { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginBottom: 2 },
  headerTitle:    { fontSize: 22, fontWeight: 'bold', color: '#FFF' },
  filterRow:      { flexDirection: 'row', backgroundColor: '#FFF', paddingVertical: 10, paddingHorizontal: 12, gap: 8, elevation: 1 },
  filterChip:     { borderRadius: 20, paddingVertical: 6, paddingHorizontal: 14, borderWidth: 1, borderColor: COLORS.border },
  filterActive:   { backgroundColor: '#00695C', borderColor: '#00695C' },
  filterText:     { fontSize: 13, color: COLORS.text },
  filterTextActive:{ color: '#FFF', fontWeight: '600' },
  list:           { padding: 12, gap: 10, paddingBottom: 32 },
  empty:          { textAlign: 'center', color: COLORS.textLight, marginTop: 60, fontSize: 15 },
  card:           { backgroundColor: '#FFF', borderRadius: 14, overflow: 'hidden', elevation: 1 },
  criticalBanner: { backgroundColor: '#FFEBEE', padding: 8 },
  criticalText:   { color: COLORS.critical, fontSize: 12, fontWeight: 'bold' },
  cardTop:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, paddingBottom: 6 },
  ticketNum:      { fontSize: 12, color: COLORS.textLight, fontWeight: '600' },
  badge:          { borderRadius: 6, paddingVertical: 3, paddingHorizontal: 8 },
  badgeText:      { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  title:          { fontSize: 15, fontWeight: '600', color: COLORS.text, paddingHorizontal: 14, marginBottom: 8 },
  cardBottom:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingBottom: 12 },
  meta:           { fontSize: 12, color: COLORS.textLight },
  statusBadge:    { borderRadius: 8, paddingVertical: 3, paddingHorizontal: 8 },
  statusText:     { fontSize: 11, fontWeight: '600' },
});

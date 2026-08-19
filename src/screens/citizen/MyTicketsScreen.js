import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, STATUS_COLORS, STATUS_LABELS, PRIORITY_COLORS } from '../../constants';
import { useTheme } from '../../store/themeStore';
import AppText from '../../components/AppText';
import { ticketAPI } from '../../services/api';

export default function MyTicketsScreen({ navigation }) {
  const t = useTheme();
  const [tickets, setTickets] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    setLoadError(false);
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const { data } = await ticketAPI.list(params);
      setTickets(data.tickets || []);
    } catch {
      setLoadError(true);
    }
  };

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };
  useEffect(() => { setLoading(true); load().finally(() => setLoading(false)); }, [filter]);

  const FILTERS = ['all', 'payment_pending', 'open', 'in_progress', 'resolved', 'closed'];

  return (
    <View style={[styles.container, { backgroundColor: t.background }]}>
      <View style={[styles.filterRow, { backgroundColor: t.card }]}>
        <FlatList horizontal data={FILTERS} showsHorizontalScrollIndicator={false}
          keyExtractor={f => f}
          renderItem={({ item }) => (
            <TouchableOpacity style={[styles.filterChip, { borderColor: t.border }, filter === item && { backgroundColor: t.primary, borderColor: t.primary }]} onPress={() => setFilter(item)}>
              <AppText style={[styles.filterText, { color: t.text }, filter === item && styles.filterTextActive]}>
                {item === 'all' ? 'All' : STATUS_LABELS[item]}
              </AppText>
            </TouchableOpacity>
          )} />
      </View>

      {loading ? (
        <ActivityIndicator color={t.primary} style={styles.loadingSpinner} />
      ) : loadError ? (
        <View style={styles.errorBox}>
          <AppText style={[styles.errorText, { color: t.danger }]}>Couldn't load your tickets — the server may be waking up.</AppText>
          <TouchableOpacity onPress={load}><AppText style={[styles.retryText, { color: t.secondary }]}>Retry</AppText></TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={tickets}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<AppText style={[styles.empty, { color: t.textLight }]}>No tickets found</AppText>}
          renderItem={({ item: ticket }) => (
            <TouchableOpacity style={[styles.card, { backgroundColor: t.card }]} onPress={() => navigation.navigate('TicketDetail', { id: ticket.id })}>
              <View style={styles.cardTop}>
                <AppText style={[styles.ticketNum, { color: t.textLight }]}>#{ticket.ticket_number}</AppText>
                <View style={styles.badges}>
                  <View style={[styles.badge, { backgroundColor: PRIORITY_COLORS[ticket.priority] }]}>
                    <AppText style={styles.badgeText}>{ticket.priority?.toUpperCase()}</AppText>
                  </View>
                  <View style={[styles.badge, { backgroundColor: STATUS_COLORS[ticket.status] }]}>
                    <AppText style={styles.badgeText}>{STATUS_LABELS[ticket.status]}</AppText>
                  </View>
                </View>
              </View>
              <AppText style={[styles.title, { color: t.text }]} numberOfLines={2}>{ticket.title}</AppText>
              <View style={styles.cardBottom}>
                <MaterialIcons name="category" size={14} color={t.textLight} />
                <AppText style={[styles.meta, { color: t.textLight }]}> {ticket.category} • {new Date(ticket.created_at).toLocaleDateString('en-IN')}</AppText>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: COLORS.background },
  filterRow:       { backgroundColor: '#FFF', paddingVertical: 10, paddingHorizontal: 12, elevation: 1 },
  filterChip:      { borderRadius: 20, paddingVertical: 6, paddingHorizontal: 14, borderWidth: 1, borderColor: COLORS.border, marginRight: 8 },
  filterChipActive:{ backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText:      { fontSize: 13, color: COLORS.text },
  filterTextActive:{ color: '#FFF', fontWeight: '600' },
  list:            { padding: 16, gap: 10, paddingBottom: 32 },
  empty:           { textAlign: 'center', color: COLORS.textLight, marginTop: 60, fontSize: 15 },
  loadingSpinner:  { marginTop: 40 },
  errorBox:        { alignItems: 'center', padding: 24, gap: 8 },
  errorText:       { fontSize: 14, textAlign: 'center' },
  retryText:       { fontSize: 14, fontWeight: '700' },
  card:            { backgroundColor: '#FFF', borderRadius: 14, padding: 14, elevation: 1 },
  cardTop:         { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, alignItems: 'flex-start' },
  ticketNum:       { fontSize: 12, color: COLORS.textLight, fontWeight: '600' },
  badges:          { flexDirection: 'row', gap: 6 },
  badge:           { borderRadius: 6, paddingVertical: 2, paddingHorizontal: 8 },
  badgeText:       { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  title:           { fontSize: 15, fontWeight: '600', color: COLORS.text, marginBottom: 8 },
  cardBottom:      { flexDirection: 'row', alignItems: 'center' },
  meta:            { flex: 1, flexShrink: 1, fontSize: 12, color: COLORS.textLight },
});

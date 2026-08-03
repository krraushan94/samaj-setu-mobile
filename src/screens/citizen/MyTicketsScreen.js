import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, STATUS_COLORS, STATUS_LABELS, PRIORITY_COLORS } from '../../constants';
import { ticketAPI } from '../../services/api';

export default function MyTicketsScreen({ navigation }) {
  const [tickets, setTickets] = useState([]);
  const [filter, setFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const { data } = await ticketAPI.list(params);
      setTickets(data.tickets || []);
    } catch {}
  };

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };
  useEffect(() => { load(); }, [filter]);

  const FILTERS = ['all', 'payment_pending', 'open', 'in_progress', 'resolved', 'closed'];

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        <FlatList horizontal data={FILTERS} showsHorizontalScrollIndicator={false}
          keyExtractor={f => f}
          renderItem={({ item }) => (
            <TouchableOpacity style={[styles.filterChip, filter === item && styles.filterChipActive]} onPress={() => setFilter(item)}>
              <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>
                {item === 'all' ? 'All' : STATUS_LABELS[item]}
              </Text>
            </TouchableOpacity>
          )} />
      </View>

      <FlatList
        data={tickets}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        keyExtractor={t => t.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No tickets found</Text>}
        renderItem={({ item: t }) => (
          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('TicketDetail', { id: t.id })}>
            <View style={styles.cardTop}>
              <Text style={styles.ticketNum}>#{t.ticket_number}</Text>
              <View style={styles.badges}>
                <View style={[styles.badge, { backgroundColor: PRIORITY_COLORS[t.priority] }]}>
                  <Text style={styles.badgeText}>{t.priority?.toUpperCase()}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: STATUS_COLORS[t.status] }]}>
                  <Text style={styles.badgeText}>{STATUS_LABELS[t.status]}</Text>
                </View>
              </View>
            </View>
            <Text style={styles.title} numberOfLines={2}>{t.title}</Text>
            <View style={styles.cardBottom}>
              <MaterialIcons name="category" size={14} color={COLORS.textLight} />
              <Text style={styles.meta}> {t.category} • {new Date(t.created_at).toLocaleDateString('en-IN')}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
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
  card:            { backgroundColor: '#FFF', borderRadius: 14, padding: 14, elevation: 1 },
  cardTop:         { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, alignItems: 'flex-start' },
  ticketNum:       { fontSize: 12, color: COLORS.textLight, fontWeight: '600' },
  badges:          { flexDirection: 'row', gap: 6 },
  badge:           { borderRadius: 6, paddingVertical: 2, paddingHorizontal: 8 },
  badgeText:       { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  title:           { fontSize: 15, fontWeight: '600', color: COLORS.text, marginBottom: 8 },
  cardBottom:      { flexDirection: 'row', alignItems: 'center' },
  meta:            { fontSize: 12, color: COLORS.textLight },
});

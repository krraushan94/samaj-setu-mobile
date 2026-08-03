import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../store/themeStore';
import { communityAPI } from '../../services/api';

export default function EventsScreen() {
  const t = useTheme();
  const [events, setEvents] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try { const { data } = await communityAPI.getEvents(); setEvents(data.events || []); } catch {}
  };
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };
  useEffect(() => { load(); }, []);

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: t.background }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerStyle={styles.list}
      data={events}
      keyExtractor={e => e.id}
      ListEmptyComponent={
        <View style={styles.empty}>
          <MaterialIcons name="event" size={48} color={t.textLight} />
          <Text style={[styles.emptyText, { color: t.textLight }]}>No upcoming events</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={[styles.card, { backgroundColor: t.card }]}>
          <MaterialIcons name="event" size={24} color={t.primary} />
          <View style={styles.info}>
            <Text style={[styles.title, { color: t.text }]}>{item.title}</Text>
            {item.event_date && <Text style={[styles.date, { color: t.textLight }]}>{new Date(item.event_date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>}
            {item.location && <Text style={[styles.loc, { color: t.textLight }]}>📍 {item.location}</Text>}
            {item.description && <Text style={[styles.desc, { color: t.textLight }]}>{item.description}</Text>}
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list:      { padding: 14, gap: 12, paddingBottom: 32 },
  empty:     { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15 },
  card:      { flexDirection: 'row', borderRadius: 14, padding: 14, gap: 12, elevation: 2, alignItems: 'flex-start' },
  info:      { flex: 1, gap: 4 },
  title:     { fontSize: 16, fontWeight: '700' },
  date:      { fontSize: 13 },
  loc:       { fontSize: 13 },
  desc:      { fontSize: 13, marginTop: 4 },
});

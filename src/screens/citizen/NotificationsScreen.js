import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../store/themeStore';
import { notificationAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

const TYPE_ICONS = {
  sos: 'emergency', ticket_assigned: 'assignment-ind', ticket_status: 'confirmation-number',
  office_visit: 'event-available', announcement: 'campaign',
  task_assigned: 'add-task', task_status: 'fact-check',
};

export default function NotificationsScreen({ navigation }) {
  const t = useTheme();
  const role = useAuthStore((s) => s.role);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try { const { data } = await notificationAPI.list(); setNotifications(data.notifications || []); } catch {}
  };

  useEffect(() => { setLoading(true); load().finally(() => setLoading(false)); }, []);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const markRead = async (item) => {
    if (!item.is_read) {
      setNotifications(list => list.map(n => n.id === item.id ? { ...n, is_read: true } : n));
      try { await notificationAPI.markRead(item.id); } catch {}
    }
    // Route the tap to whatever this notification is about — previously a notification
    // could only ever be marked read, never actually taken anywhere.
    if (item.entity_type === 'ticket' && item.entity_id) {
      const isTeamRole = role === 'leader' || role === 'member';
      navigation.navigate(isTeamRole ? 'TeamTicketDetail' : 'TicketDetail', { id: item.entity_id });
    } else if (item.entity_type === 'task') {
      navigation.navigate('TeamWorkspace');
    } else if (item.entity_type === 'office_visit') {
      navigation.navigate('OfficeVisit');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: t.background }]}>
      <FlatList
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        data={notifications}
        keyExtractor={n => n.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={!loading && (
          <View style={styles.empty}>
            <MaterialIcons name="notifications-none" size={48} color={t.textLight} />
            <Text style={[styles.emptyText, { color: t.textLight }]}>No notifications yet</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, { backgroundColor: t.card }, !item.is_read && { borderLeftColor: t.primary, borderLeftWidth: 4 }]}
            onPress={() => markRead(item)}
          >
            <MaterialIcons name={TYPE_ICONS[item.type] || 'notifications'} size={22} color={item.is_read ? t.textLight : t.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: t.text }, !item.is_read && styles.titleUnread]} numberOfLines={2}>{item.title}</Text>
              <Text style={[styles.body, { color: t.textLight }]} numberOfLines={3}>{item.body}</Text>
              <Text style={[styles.date, { color: t.textLight }]}>{new Date(item.created_at).toLocaleString('en-IN')}</Text>
            </View>
            {!item.is_read && <View style={[styles.dot, { backgroundColor: t.primary }]} />}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1 },
  list:        { padding: 12, gap: 8, paddingBottom: 32 },
  empty:       { alignItems: 'center', marginTop: 60, gap: 10 },
  emptyText:   { fontSize: 14 },
  card:        { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderRadius: 12, padding: 14, elevation: 1 },
  title:       { fontSize: 14, fontWeight: '600' },
  titleUnread: { fontWeight: '700' },
  body:        { fontSize: 13, marginTop: 2, lineHeight: 18 },
  date:        { fontSize: 11, marginTop: 4 },
  dot:         { width: 8, height: 8, borderRadius: 4, marginTop: 4 },
});

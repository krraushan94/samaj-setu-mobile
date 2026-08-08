import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, TextInput, Alert, RefreshControl } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants';
import { userAPI } from '../../services/api';

// Admin-only — search citizens and block/unblock abusive accounts.
export default function AdminUsersScreen() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (q = search) => {
    try {
      const { data } = await userAPI.list({ search: q, limit: 30 });
      setUsers(data.users || []);
    } catch { Alert.alert('Error', 'Could not load users'); }
  };

  useEffect(() => { setLoading(true); load().finally(() => setLoading(false)); }, []);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const toggleBlock = (u) => {
    const willBlock = !u.is_blocked;
    Alert.alert(
      willBlock ? 'Block this user?' : 'Unblock this user?',
      willBlock
        ? `${u.full_name} will no longer be able to log in or submit reports.`
        : `${u.full_name} will be able to use the app again.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: willBlock ? 'Block' : 'Unblock', style: willBlock ? 'destructive' : 'default', onPress: async () => {
          try {
            await userAPI.block(u.id, willBlock);
            setUsers(list => list.map(x => x.id === u.id ? { ...x, is_blocked: willBlock } : x));
          } catch { Alert.alert('Error', 'Could not update user'); }
        } },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <Text style={styles.pageTitle}>👥 Manage Users</Text>
        <View style={styles.searchRow}>
          <MaterialIcons name="search" size={20} color="rgba(255,255,255,0.7)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or mobile"
            placeholderTextColor="rgba(255,255,255,0.6)"
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={() => load(search)}
            returnKeyType="search"
          />
        </View>
      </View>

      <FlatList
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        data={users}
        keyExtractor={u => u.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={!loading && <Text style={styles.empty}>No users found</Text>}
        renderItem={({ item }) => (
          <View style={[styles.card, item.is_blocked && styles.cardBlocked]}>
            <View style={styles.cardTop}>
              <Text style={styles.name} numberOfLines={1}>{item.full_name}</Text>
              {item.is_blocked && (
                <View style={styles.blockedBadge}><Text style={styles.blockedBadgeText}>Blocked</Text></View>
              )}
            </View>
            <Text style={styles.detail}>📞 {item.mobile}{item.ward ? `  ·  Ward ${item.ward}` : ''}{item.mandal ? `, ${item.mandal}` : ''}</Text>
            <Text style={styles.date}>Joined: {new Date(item.created_at).toLocaleDateString('en-IN')}</Text>
            <TouchableOpacity
              style={[styles.actionBtn, item.is_blocked ? styles.unblockBtn : styles.blockBtn]}
              onPress={() => toggleBlock(item)}
            >
              <MaterialIcons name={item.is_blocked ? 'lock-open' : 'block'} size={16} color="#FFF" />
              <Text style={styles.actionBtnText}>{item.is_blocked ? 'Unblock' : 'Block'}</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: COLORS.background },
  headerBar:     { backgroundColor: '#1A237E', padding: 16, paddingTop: 50, gap: 10 },
  pageTitle:     { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  searchRow:     { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10, paddingHorizontal: 12 },
  searchInput:   { flex: 1, color: '#FFF', paddingVertical: 8, fontSize: 14 },
  list:          { padding: 12, gap: 10, paddingBottom: 32 },
  empty:         { textAlign: 'center', marginTop: 40, fontSize: 14, color: COLORS.textLight },
  card:          { backgroundColor: '#FFF', borderRadius: 14, padding: 14, gap: 4, elevation: 2 },
  cardBlocked:   { borderWidth: 1.5, borderColor: COLORS.danger, backgroundColor: '#FFF3F3' },
  cardTop:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  name:          { flex: 1, fontSize: 15, fontWeight: '700', color: COLORS.text },
  blockedBadge:  { flexShrink: 0, backgroundColor: COLORS.danger, borderRadius: 8, paddingVertical: 3, paddingHorizontal: 8 },
  blockedBadgeText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  detail:        { fontSize: 13, color: COLORS.textLight },
  date:          { fontSize: 11, color: COLORS.textLight },
  actionBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 8, paddingVertical: 8, marginTop: 6 },
  blockBtn:      { backgroundColor: COLORS.danger },
  unblockBtn:    { backgroundColor: COLORS.success },
  actionBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
});

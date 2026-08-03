import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, STATUS_COLORS, STATUS_LABELS } from '../../constants';
import { communityAPI, ticketAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export default function CommunityBoardScreen({ navigation }) {
  const user = useAuthStore((s) => s.user);
  const [issues, setIssues] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const { data } = await communityAPI.getBoard({ limit: 30 });
      setIssues(data.issues || []);
    } catch {}
  };

  const upvote = async (id) => {
    if (!user) return navigation.navigate('Login');
    try {
      await ticketAPI.upvote(id);
      setIssues(prev => prev.map(i => i.id === id ? { ...i, upvote_count: (i.upvote_count || 0) + 1 } : i));
    } catch {}
  };

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };
  useEffect(() => { load(); }, []);

  return (
    <View style={styles.container}>
      <FlatList
        data={issues}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        keyExtractor={i => i.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.banner}>
            <Text style={styles.bannerTitle}>📋 Community Board</Text>
            <Text style={styles.bannerSub}>Anonymous public feed of issues in the area</Text>
          </View>
        }
        ListEmptyComponent={<Text style={styles.empty}>No public issues yet</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <View style={[styles.badge, { backgroundColor: STATUS_COLORS[item.status] }]}>
                <Text style={styles.badgeText}>{STATUS_LABELS[item.status]}</Text>
              </View>
              <Text style={styles.dept}>{item.department}</Text>
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.submitter}>{item.submitter}</Text>
            {item.location_text && (
              <View style={styles.row}><MaterialIcons name="location-on" size={13} color={COLORS.textLight} /><Text style={styles.loc}> {item.location_text}</Text></View>
            )}
            <View style={styles.footer}>
              <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString('en-IN')}</Text>
              <TouchableOpacity style={styles.upvoteBtn} onPress={() => upvote(item.id)}>
                <MaterialIcons name="thumb-up" size={15} color={COLORS.secondary} />
                <Text style={styles.upvoteText}> {item.upvote_count || 0} Me Too</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: COLORS.background },
  list:        { padding: 14, gap: 10, paddingBottom: 32 },
  banner:      { backgroundColor: COLORS.primary, borderRadius: 14, padding: 16, marginBottom: 8 },
  bannerTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  bannerSub:   { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  empty:       { textAlign: 'center', color: COLORS.textLight, marginTop: 40 },
  card:        { backgroundColor: '#FFF', borderRadius: 12, padding: 14, elevation: 1 },
  cardTop:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  badge:       { borderRadius: 6, paddingVertical: 3, paddingHorizontal: 8 },
  badgeText:   { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  dept:        { fontSize: 12, color: COLORS.textLight },
  title:       { fontSize: 15, fontWeight: '600', color: COLORS.text, marginBottom: 4 },
  submitter:   { fontSize: 12, color: COLORS.textLight, marginBottom: 4 },
  row:         { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  loc:         { fontSize: 12, color: COLORS.textLight },
  footer:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  date:        { fontSize: 11, color: COLORS.textLight },
  upvoteBtn:   { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E3F2FD', borderRadius: 8, paddingVertical: 5, paddingHorizontal: 10 },
  upvoteText:  { fontSize: 13, color: COLORS.secondary, fontWeight: '600' },
});

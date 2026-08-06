import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Alert, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, STATUS_COLORS, STATUS_LABELS, ISSUE_CATEGORIES } from '../../constants';
import { communityAPI, ticketAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export default function CommunityBoardScreen({ navigation }) {
  const user = useAuthStore((s) => s.user);
  const [issues, setIssues] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState(null);

  const load = async (category = categoryFilter) => {
    try {
      const { data } = await communityAPI.getBoard({ limit: 30, category: category || undefined });
      setIssues(data.issues || []);
    } catch {}
  };

  const selectFilter = (key) => {
    setCategoryFilter(key);
    load(key);
  };

  const upvote = async (id) => {
    if (!user) return navigation.navigate('Login');
    try {
      await ticketAPI.upvote(id);
      setIssues(prev => prev.map(i => i.id === id ? { ...i, upvote_count: (i.upvote_count || 0) + 1 } : i));
    } catch {}
  };

  const report = (id) => {
    if (!user) return navigation.navigate('Login');
    Alert.alert(
      'Report this post',
      'Let the team know this post looks false, defamatory, or inappropriate. They will review it.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Report', style: 'destructive', onPress: async () => {
          try {
            await communityAPI.reportPost(id, 'Reported from community board');
            Alert.alert('Thanks', 'Our team will review this post.');
          } catch {
            Alert.alert('Error', 'Could not submit report. Please try again.');
          }
        } },
      ]
    );
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
          <>
            <View style={styles.banner}>
              <Text style={styles.bannerTitle}>📋 Community Board</Text>
              <Text style={styles.bannerSub}>Anonymous public feed of issues in the area</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterRowContent}>
              <TouchableOpacity style={[styles.filterChip, !categoryFilter && styles.filterChipActive]} onPress={() => selectFilter(null)}>
                <Text style={[styles.filterChipText, !categoryFilter && styles.filterChipTextActive]}>All</Text>
              </TouchableOpacity>
              {ISSUE_CATEGORIES.map(cat => (
                <TouchableOpacity key={cat.key} style={[styles.filterChip, categoryFilter === cat.key && { backgroundColor: cat.color, borderColor: cat.color }]} onPress={() => selectFilter(cat.key)}>
                  <Text style={[styles.filterChipText, categoryFilter === cat.key && styles.filterChipTextActive]}>{cat.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        }
        ListEmptyComponent={<Text style={styles.empty}>No public issues yet</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <View style={[styles.badge, { backgroundColor: STATUS_COLORS[item.status] }]}>
                <Text style={styles.badgeText}>{item.status === 'resolved' ? `✓ ${STATUS_LABELS[item.status]}` : STATUS_LABELS[item.status]}</Text>
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
              <View style={styles.footerActions}>
                <TouchableOpacity style={styles.reportBtn} onPress={() => report(item.id)} accessibilityLabel="Report this post">
                  <MaterialIcons name="flag" size={15} color={COLORS.textLight} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.upvoteBtn} onPress={() => upvote(item.id)}>
                  <MaterialIcons name="thumb-up" size={15} color={COLORS.secondary} />
                  <Text style={styles.upvoteText}> {item.upvote_count || 0} Me Too</Text>
                </TouchableOpacity>
              </View>
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
  filterRow:        { marginBottom: 10 },
  filterRowContent: { gap: 8, paddingRight: 8 },
  filterChip:       { borderWidth: 1, borderColor: COLORS.border, backgroundColor: '#FFF', borderRadius: 18, paddingVertical: 7, paddingHorizontal: 14 },
  filterChipActive: { backgroundColor: COLORS.text, borderColor: COLORS.text },
  filterChipText:      { fontSize: 12, fontWeight: '600', color: COLORS.text },
  filterChipTextActive:{ color: '#FFF' },
  empty:       { textAlign: 'center', color: COLORS.textLight, marginTop: 40 },
  card:        { backgroundColor: '#FFF', borderRadius: 12, padding: 14, elevation: 1 },
  cardTop:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  badge:       { flexShrink: 0, borderRadius: 6, paddingVertical: 3, paddingHorizontal: 8 },
  badgeText:   { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  dept:        { flex: 1, flexShrink: 1, marginLeft: 8, fontSize: 12, color: COLORS.textLight, textAlign: 'right' },
  title:       { fontSize: 15, fontWeight: '600', color: COLORS.text, marginBottom: 4 },
  submitter:   { fontSize: 12, color: COLORS.textLight, marginBottom: 4 },
  row:         { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  loc:         { fontSize: 12, color: COLORS.textLight },
  footer:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  date:          { fontSize: 11, color: COLORS.textLight },
  footerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reportBtn:     { padding: 6 },
  upvoteBtn:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E3F2FD', borderRadius: 8, paddingVertical: 5, paddingHorizontal: 10 },
  upvoteText:    { fontSize: 13, color: COLORS.secondary, fontWeight: '600' },
});

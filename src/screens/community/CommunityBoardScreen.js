import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, STATUS_COLORS, STATUS_LABELS, ISSUE_CATEGORIES } from '../../constants';
import { useTheme } from '../../store/themeStore';
import AppText from '../../components/AppText';
import { communityAPI, ticketAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export default function CommunityBoardScreen({ navigation }) {
  const t = useTheme();
  const user = useAuthStore((s) => s.user);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState(null);
  // Tracked client-side for this session — the backend already rejects a genuine second
  // upvote (409, no double-count), but silently swallowing that left the button giving no
  // feedback at all. This also captures "already voted in an earlier session" the first
  // time a repeat tap comes back 409.
  const [upvotedIds, setUpvotedIds] = useState(new Set());

  const load = async (category = categoryFilter) => {
    setLoadError(false);
    try {
      const { data } = await communityAPI.getBoard({ limit: 30, category: category || undefined });
      setIssues(data.issues || []);
    } catch {
      setLoadError(true);
    }
  };

  const selectFilter = (key) => {
    setCategoryFilter(key);
    load(key);
  };

  const requireLogin = () => {
    Alert.alert(
      'Login required',
      'You can browse the community board as a guest, but you need to log in to do this.',
      [{ text: 'Cancel', style: 'cancel' }, { text: 'Log In / Sign Up', onPress: () => navigation.navigate('Login') }],
    );
  };

  const upvote = async (id) => {
    if (!user) return requireLogin();
    if (upvotedIds.has(id)) return;
    try {
      await ticketAPI.upvote(id);
      setIssues(prev => prev.map(i => i.id === id ? { ...i, upvote_count: (i.upvote_count || 0) + 1 } : i));
      setUpvotedIds(prev => new Set(prev).add(id));
    } catch (e) {
      if (e.response?.status === 409) setUpvotedIds(prev => new Set(prev).add(id));
    }
  };

  const report = (id) => {
    if (!user) return requireLogin();
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
  useEffect(() => { setLoading(true); load().finally(() => setLoading(false)); }, []);

  return (
    <View style={[styles.container, { backgroundColor: t.background }]}>
      {loading ? (
        <ActivityIndicator color={t.primary} style={styles.loadingSpinner} />
      ) : loadError ? (
        <View style={styles.errorBox}>
          <AppText style={[styles.errorText, { color: t.danger }]}>Couldn't load the community board — the server may be waking up.</AppText>
          <TouchableOpacity onPress={() => load()}><AppText style={[styles.retryText, { color: t.secondary }]}>Retry</AppText></TouchableOpacity>
        </View>
      ) : (
      <FlatList
        data={issues}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        keyExtractor={i => i.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <>
            <View style={[styles.banner, { backgroundColor: t.primary }]}>
              <AppText style={styles.bannerTitle}>📋 Community Board</AppText>
              <AppText style={styles.bannerSub}>Anonymous public feed of issues in the area</AppText>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterRowContent}>
              <TouchableOpacity style={[styles.filterChip, { borderColor: t.border, backgroundColor: t.card }, !categoryFilter && { backgroundColor: t.text, borderColor: t.text }]} onPress={() => selectFilter(null)}>
                <AppText style={[styles.filterChipText, { color: t.text }, !categoryFilter && styles.filterChipTextActive]}>All</AppText>
              </TouchableOpacity>
              {ISSUE_CATEGORIES.map(cat => (
                <TouchableOpacity key={cat.key} style={[styles.filterChip, { borderColor: t.border, backgroundColor: t.card }, categoryFilter === cat.key && { backgroundColor: cat.color, borderColor: cat.color }]} onPress={() => selectFilter(cat.key)}>
                  <AppText style={[styles.filterChipText, { color: t.text }, categoryFilter === cat.key && styles.filterChipTextActive]}>{cat.label}</AppText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        }
        ListEmptyComponent={<AppText style={[styles.empty, { color: t.textLight }]}>No public issues yet</AppText>}
        renderItem={({ item }) => {
          const alreadyUpvoted = upvotedIds.has(item.id);
          return (
          <View style={[styles.card, { backgroundColor: t.card }]}>
            <View style={styles.cardTop}>
              <View style={[styles.badge, { backgroundColor: STATUS_COLORS[item.status] }]}>
                <AppText style={styles.badgeText}>{item.status === 'resolved' ? `✓ ${STATUS_LABELS[item.status]}` : STATUS_LABELS[item.status]}</AppText>
              </View>
              <AppText style={[styles.dept, { color: t.textLight }]}>{item.department}</AppText>
            </View>
            <AppText style={[styles.title, { color: t.text }]}>{item.title}</AppText>
            <AppText style={[styles.submitter, { color: t.textLight }]}>{item.submitter}</AppText>
            {item.location_text && (
              <View style={styles.row}><MaterialIcons name="location-on" size={13} color={t.textLight} /><AppText style={[styles.loc, { color: t.textLight }]}> {item.location_text}</AppText></View>
            )}
            <View style={styles.footer}>
              <AppText style={[styles.date, { color: t.textLight }]}>{new Date(item.created_at).toLocaleDateString('en-IN')}</AppText>
              <View style={styles.footerActions}>
                <TouchableOpacity style={styles.reportBtn} onPress={() => report(item.id)} accessibilityLabel="Report this post" accessibilityRole="button">
                  <MaterialIcons name="flag" size={15} color={t.textLight} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.upvoteBtn, alreadyUpvoted && styles.upvoteBtnVoted]}
                  onPress={() => upvote(item.id)}
                  disabled={alreadyUpvoted}
                  accessibilityLabel={alreadyUpvoted ? 'Already upvoted' : 'Me Too — upvote this issue'}
                  accessibilityRole="button"
                >
                  <MaterialIcons name={alreadyUpvoted ? 'thumb-up' : 'thumb-up-off-alt'} size={15} color={alreadyUpvoted ? '#FFF' : t.secondary} />
                  <AppText style={[styles.upvoteText, { color: t.secondary }, alreadyUpvoted && styles.upvoteTextVoted]}> {item.upvote_count || 0} {alreadyUpvoted ? 'Voted' : 'Me Too'}</AppText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          );
        }}
      />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: COLORS.background },
  list:        { padding: 14, gap: 10, paddingBottom: 32 },
  loadingSpinner: { marginTop: 60 },
  errorBox:    { alignItems: 'center', padding: 24, gap: 8 },
  errorText:   { fontSize: 14, textAlign: 'center' },
  retryText:   { fontSize: 14, fontWeight: '700' },
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
  upvoteBtnVoted:{ backgroundColor: COLORS.secondary },
  upvoteText:    { fontSize: 13, color: COLORS.secondary, fontWeight: '600' },
  upvoteTextVoted:{ color: '#FFF' },
});

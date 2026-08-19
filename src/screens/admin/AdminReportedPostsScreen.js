import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
import { COLORS } from '../../constants';
import { useTheme } from '../../store/themeStore';
import AppText from '../../components/AppText';
import { communityAPI } from '../../services/api';

// Reviews community-board posts other citizens have flagged as false/defamatory/inappropriate
// (Phase 1's citizen-facing "Report" button). Admin can hide a post from the public board
// without deleting the underlying ticket — the citizen↔team conversation continues normally.
export default function AdminReportedPostsScreen() {
  const t = useTheme();
  const [reports, setReports] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const { data } = await communityAPI.getReports();
      setReports(data.reports || []);
    } catch {}
  };

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };
  useEffect(() => { load(); }, []);

  const toggleHide = async (ticketId, hidden) => {
    try {
      await communityAPI.hidePost(ticketId, hidden);
      load();
    } catch {
      Alert.alert('Error', 'Could not update post');
    }
  };

  return (
    <FlatList
      style={[styles.container, { backgroundColor: t.background }]}
      contentContainerStyle={styles.list}
      data={reports}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      keyExtractor={(r) => r.ticket_id}
      ListEmptyComponent={<AppText style={[styles.empty, { color: t.textLight }]}>No reported posts</AppText>}
      renderItem={({ item }) => (
        <View style={[styles.card, { backgroundColor: t.card }]}>
          <AppText style={[styles.ticketNum, { color: t.textLight }]}>#{item.ticket_number}</AppText>
          <AppText style={[styles.title, { color: t.text }]} numberOfLines={2}>{item.title}</AppText>
          <AppText style={[styles.meta, { color: t.textLight }]}>{item.category} • {item.sub_category}</AppText>
          <AppText style={[styles.reportCount, { color: t.danger }]}>🚩 Reported {item.report_count} time(s)</AppText>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: item.is_hidden_from_board ? t.success : t.danger }]}
            onPress={() => toggleHide(item.ticket_id, !item.is_hidden_from_board)}
          >
            <AppText style={styles.actionBtnText}>{item.is_hidden_from_board ? 'Restore to Board' : 'Hide from Board'}</AppText>
          </TouchableOpacity>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: COLORS.background },
  list:          { padding: 16, gap: 10, paddingBottom: 32 },
  empty:         { textAlign: 'center', color: COLORS.textLight, marginTop: 60 },
  card:          { backgroundColor: '#FFF', borderRadius: 12, padding: 14, elevation: 1 },
  ticketNum:     { fontSize: 12, color: COLORS.textLight, fontWeight: '600' },
  title:         { fontSize: 15, fontWeight: '600', color: COLORS.text, marginTop: 2 },
  meta:          { fontSize: 12, color: COLORS.textLight, marginTop: 4 },
  reportCount:   { fontSize: 13, color: COLORS.danger, fontWeight: '600', marginTop: 8, marginBottom: 10 },
  actionBtn:     { borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  actionBtnText: { color: '#FFF', fontWeight: '600', fontSize: 13 },
});

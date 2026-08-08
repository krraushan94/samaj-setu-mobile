import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, TextInput, Alert, Modal, RefreshControl } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants';
import { visitAPI } from '../../services/api';

const STATUS_COLORS = { pending: '#F9A825', scheduled: '#2E7D32', completed: '#1565C0', cancelled: '#C62828' };
const TABS = ['pending', 'scheduled', 'completed', 'cancelled', 'all'];

// Admin-only — review in-person office visit requests and assign a time.
export default function AdminVisitsScreen() {
  const [tab, setTab] = useState('pending');
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [target, setTarget] = useState(null); // visit being scheduled/actioned
  const [scheduledTime, setScheduledTime] = useState('');
  const [adminNote, setAdminNote] = useState('');

  const load = async (t = tab) => {
    try {
      const { data } = await visitAPI.list(t === 'all' ? {} : { status: t });
      setVisits(data.visits || []);
    } catch {}
  };

  useEffect(() => { setLoading(true); load(tab).finally(() => setLoading(false)); }, [tab]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const openSchedule = (visit) => {
    setTarget(visit);
    setScheduledTime(visit.scheduled_time || visit.preferred_date || '');
    setAdminNote(visit.admin_note || '');
  };

  const submitSchedule = async () => {
    if (!scheduledTime.trim()) return Alert.alert('Error', 'Enter a date/time for the visit');
    try {
      await visitAPI.schedule(target.id, { status: 'scheduled', scheduledTime: scheduledTime.trim(), adminNote: adminNote.trim() });
      setTarget(null);
      load();
    } catch (e) { Alert.alert('Error', e.response?.data?.message || 'Could not schedule visit'); }
  };

  const changeStatus = (visit, status) => {
    Alert.alert(status === 'cancelled' ? 'Cancel request' : 'Mark completed', 'Are you sure?', [
      { text: 'No', style: 'cancel' },
      { text: 'Yes', style: status === 'cancelled' ? 'destructive' : 'default', onPress: async () => {
        try { await visitAPI.schedule(visit.id, { status }); load(); } catch {}
      } },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabRow}>
        {TABS.map(tb => (
          <TouchableOpacity key={tb} style={[styles.tab, tab === tb && styles.tabActive]} onPress={() => setTab(tb)}>
            <Text style={[styles.tabText, tab === tb && styles.tabTextActive]}>{tb[0].toUpperCase() + tb.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        data={visits}
        keyExtractor={v => v.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={!loading && <Text style={styles.empty}>No {tab === 'all' ? '' : tab} visit requests</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <Text style={styles.name}>{item.visitor_name}</Text>
              <View style={[styles.badge, { backgroundColor: STATUS_COLORS[item.status] + '22' }]}>
                <Text style={[styles.badgeText, { color: STATUS_COLORS[item.status] }]}>{item.status}</Text>
              </View>
            </View>
            <Text style={styles.reason}>{item.reason}</Text>
            <Text style={styles.detail}>📞 {item.contact_mobile}  ·  👥 {item.number_of_persons}</Text>
            <Text style={styles.detail}>📍 {item.address}</Text>
            {item.aadhar_number && <Text style={styles.detail}>Aadhaar: {item.aadhar_number}</Text>}
            {item.preferred_date && <Text style={styles.detail}>Preferred: {item.preferred_date}</Text>}
            {item.scheduled_time && <Text style={[styles.detail, { color: STATUS_COLORS.scheduled, fontWeight: '600' }]}>🗓️ Scheduled: {item.scheduled_time}</Text>}
            {item.admin_note && <Text style={styles.detail}>Note: {item.admin_note}</Text>}
            <Text style={styles.date}>Requested: {new Date(item.created_at).toLocaleDateString('en-IN')}</Text>

            {(item.status === 'pending' || item.status === 'scheduled') && (
              <View style={styles.actions}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => openSchedule(item)}>
                  <MaterialIcons name="event" size={16} color={COLORS.primary} />
                  <Text style={styles.actionText}>{item.status === 'scheduled' ? 'Reschedule' : 'Schedule'}</Text>
                </TouchableOpacity>
                {item.status === 'scheduled' && (
                  <TouchableOpacity style={styles.actionBtn} onPress={() => changeStatus(item, 'completed')}>
                    <MaterialIcons name="check-circle" size={16} color="#1565C0" />
                    <Text style={styles.actionText}>Mark Completed</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.actionBtn} onPress={() => changeStatus(item, 'cancelled')}>
                  <MaterialIcons name="cancel" size={16} color={COLORS.danger} />
                  <Text style={[styles.actionText, { color: COLORS.danger }]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      />

      <Modal visible={!!target} transparent animationType="fade" onRequestClose={() => setTarget(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Schedule Visit — {target?.visitor_name}</Text>
            <TextInput style={styles.input} placeholder="Date/time (e.g. Mon 12 Aug, 11:00 AM)" value={scheduledTime} onChangeText={setScheduledTime} />
            <TextInput style={[styles.input, styles.textarea]} placeholder="Note to citizen (optional)" value={adminNote} onChangeText={setAdminNote} multiline numberOfLines={2} />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setTarget(null)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={submitSchedule}>
                <Text style={styles.confirmBtnText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: COLORS.background },
  tabRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 6, padding: 10, backgroundColor: '#FFF' },
  tab:          { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border },
  tabActive:    { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabText:      { fontSize: 12, color: COLORS.text },
  tabTextActive:{ color: '#FFF', fontWeight: '700' },
  list:         { padding: 12, gap: 10, paddingBottom: 32 },
  empty:        { textAlign: 'center', marginTop: 40, fontSize: 14, color: COLORS.textLight },
  card:         { backgroundColor: '#FFF', borderRadius: 14, padding: 14, gap: 4, elevation: 2 },
  cardTop:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  name:         { flex: 1, fontSize: 15, fontWeight: '700', color: COLORS.text },
  badge:        { flexShrink: 0, borderRadius: 8, paddingVertical: 4, paddingHorizontal: 8 },
  badgeText:    { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  reason:       { fontSize: 14, color: COLORS.text, fontWeight: '600' },
  detail:       { fontSize: 13, color: COLORS.textLight },
  date:         { fontSize: 11, color: COLORS.textLight, marginTop: 2 },
  actions:      { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 8, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 8 },
  actionBtn:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText:   { fontSize: 13, fontWeight: '600', color: COLORS.primary },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modalCard:    { backgroundColor: '#FFF', borderRadius: 16, padding: 20 },
  modalTitle:   { fontSize: 16, fontWeight: 'bold', marginBottom: 14, color: COLORS.text },
  input:        { borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12, fontSize: 14, marginBottom: 10 },
  textarea:     { height: 60, textAlignVertical: 'top' },
  modalActions: { flexDirection: 'row', gap: 10 },
  cancelBtn:    { flex: 1, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12, alignItems: 'center' },
  cancelBtnText:{ color: COLORS.text, fontWeight: '600' },
  confirmBtn:   { flex: 1, backgroundColor: COLORS.primary, borderRadius: 10, padding: 12, alignItems: 'center' },
  confirmBtnText:{ color: '#FFF', fontWeight: 'bold' },
});

import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Alert, Modal, TextInput, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, STATUS_COLORS, STATUS_LABELS, PRIORITY_COLORS } from '../../constants';
import { useTheme } from '../../store/themeStore';
import { ticketAPI, paymentAPI, departmentAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import AppText from '../../components/AppText';

export default function TeamDashboardScreen({ navigation }) {
  const th = useTheme();
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.role);
  const logout = useAuthStore((s) => s.logout);
  const [tickets, setTickets] = useState([]);
  const [filter, setFilter] = useState('open');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberForm, setMemberForm] = useState({ fullName: '', username: '', password: '' });
  const [memberError, setMemberError] = useState('');

  const load = async () => {
    setLoadError(false);
    try {
      const { data } = await ticketAPI.list({ status: filter !== 'all' ? filter : undefined, limit: 50 });
      setTickets(data.tickets || []);
    } catch {
      setLoadError(true);
    }
  };

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };
  useEffect(() => { setLoading(true); load().finally(() => setLoading(false)); }, [filter]);

  const confirmLogout = () => {
    Alert.alert('Log out?', 'You will need to log in again to access your team dashboard.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => { logout(); navigation.replace('Welcome'); } },
    ]);
  };

  const FILTERS = ['all', 'open', 'in_progress', 'resolved'];

  const submitAddMember = async () => {
    setMemberError('');
    if (!memberForm.fullName || !memberForm.username || !memberForm.password) {
      return setMemberError('Full name, username and password are required');
    }
    if (memberForm.password.length < 8) return setMemberError('Password must be at least 8 characters');
    try {
      await departmentAPI.addOwnMember(memberForm);
      setMemberForm({ fullName: '', username: '', password: '' });
      setShowAddMember(false);
      Alert.alert('Done', `${memberForm.fullName} added to your team.`);
    } catch (e) {
      setMemberError(e.response?.data?.message || 'Could not add team member');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: th.background }]}>
      <LinearGradient colors={['#004D40', '#00695C']} style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.deptLabel}>{user?.department || 'My Department'}</Text>
            <Text style={styles.headerTitle}>Team Dashboard</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 16 }}>
            {role === 'leader' && (
              <TouchableOpacity onPress={() => { setShowAddMember(true); setMemberError(''); }} accessibilityLabel="Add team member" accessibilityRole="button">
                <MaterialIcons name="person-add" size={22} color="#FFF" />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => navigation.navigate('Notifications')} accessibilityLabel="Notifications" accessibilityRole="button">
              <MaterialIcons name="notifications" size={22} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('AccessibilitySettings')} accessibilityLabel="Settings" accessibilityRole="button">
              <MaterialIcons name="settings" size={22} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={confirmLogout} accessibilityLabel="Log out" accessibilityRole="button">
              <MaterialIcons name="logout" size={22} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <View style={[styles.filterRow, { backgroundColor: th.card }]}>
        {FILTERS.map(f => (
          <TouchableOpacity key={f} style={[styles.filterChip, { borderColor: th.border }, filter === f && styles.filterActive]} onPress={() => setFilter(f)}>
            <AppText style={[styles.filterText, { color: th.text }, filter === f && styles.filterTextActive]}>
              {f === 'all' ? 'All' : STATUS_LABELS[f]}
            </AppText>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color="#00695C" style={styles.loadingSpinner} />
      ) : loadError ? (
        <View style={styles.errorBox}>
          <AppText style={[styles.errorText, { color: th.danger }]}>Couldn't load tickets — the server may be waking up.</AppText>
          <TouchableOpacity onPress={load}><AppText style={[styles.retryText, { color: th.secondary }]}>Retry</AppText></TouchableOpacity>
        </View>
      ) : (
      <FlatList
        data={tickets}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<AppText style={[styles.empty, { color: th.textLight }]}>No tickets found</AppText>}
        renderItem={({ item: ticket }) => (
          <TouchableOpacity style={[styles.card, { backgroundColor: th.card }]} onPress={() => navigation.navigate('TeamTicketDetail', { id: ticket.id, readOnly: ticket.canManage === false })}>
            {ticket.canManage === false && (
              <View style={styles.viewOnlyBanner}><AppText style={styles.viewOnlyText}>👁️ View only — {ticket.department_name || 'other department'}</AppText></View>
            )}
            {ticket.priority === 'critical' && (
              <View style={styles.criticalBanner}><AppText style={styles.criticalText}>🔴 CRITICAL — Immediate Action Required</AppText></View>
            )}
            <View style={styles.cardTop}>
              <AppText style={[styles.ticketNum, { color: th.textLight }]}>#{ticket.ticket_number}</AppText>
              <View style={[styles.badge, { backgroundColor: PRIORITY_COLORS[ticket.priority] }]}>
                <AppText style={styles.badgeText}>{ticket.priority?.toUpperCase()}</AppText>
              </View>
            </View>
            <AppText style={[styles.title, { color: th.text }]} numberOfLines={2}>{ticket.title}</AppText>
            <View style={styles.cardBottom}>
              <AppText style={[styles.meta, { color: th.textLight }]} numberOfLines={2}>{ticket.sub_category} • Ward {ticket.ward || '–'}</AppText>
              <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[ticket.status] + '22' }]}>
                <AppText style={[styles.statusText, { color: STATUS_COLORS[ticket.status] }]}>{STATUS_LABELS[ticket.status]}</AppText>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
      )}

      <Modal visible={showAddMember} transparent animationType="fade" onRequestClose={() => setShowAddMember(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Team Member</Text>
            <TextInput style={styles.input} placeholder="Full Name" value={memberForm.fullName} onChangeText={v => setMemberForm(f => ({ ...f, fullName: v }))} />
            <TextInput style={styles.input} placeholder="Username" value={memberForm.username} onChangeText={v => setMemberForm(f => ({ ...f, username: v }))} autoCapitalize="none" />
            <TextInput style={styles.input} placeholder="Password (8+ characters)" secureTextEntry value={memberForm.password} onChangeText={v => setMemberForm(f => ({ ...f, password: v }))} />
            {memberError && <Text style={styles.modalError}>{memberError}</Text>}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddMember(false)}><Text>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.createBtn} onPress={submitAddMember}><Text style={styles.createBtnText}>Add</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: COLORS.background },
  header:         { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20 },
  headerRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  deptLabel:      { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginBottom: 2 },
  headerTitle:    { fontSize: 22, fontWeight: 'bold', color: '#FFF' },
  filterRow:      { flexDirection: 'row', backgroundColor: '#FFF', paddingVertical: 10, paddingHorizontal: 12, gap: 8, elevation: 1 },
  filterChip:     { borderRadius: 20, paddingVertical: 6, paddingHorizontal: 14, borderWidth: 1, borderColor: COLORS.border },
  filterActive:   { backgroundColor: '#00695C', borderColor: '#00695C' },
  loadingSpinner: { marginTop: 40 },
  errorBox:       { alignItems: 'center', padding: 24, gap: 8 },
  errorText:      { fontSize: 14, textAlign: 'center' },
  retryText:      { fontSize: 14, fontWeight: '700' },
  filterText:     { fontSize: 13, color: COLORS.text },
  filterTextActive:{ color: '#FFF', fontWeight: '600' },
  list:           { padding: 12, gap: 10, paddingBottom: 32 },
  empty:          { textAlign: 'center', color: COLORS.textLight, marginTop: 60, fontSize: 15 },
  card:           { backgroundColor: '#FFF', borderRadius: 14, overflow: 'hidden', elevation: 1 },
  criticalBanner: { backgroundColor: '#FFEBEE', padding: 8 },
  criticalText:   { color: COLORS.critical, fontSize: 12, fontWeight: 'bold' },
  viewOnlyBanner: { backgroundColor: '#ECEFF1', padding: 8 },
  viewOnlyText:   { color: COLORS.textLight, fontSize: 12, fontWeight: 'bold' },
  cardTop:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, paddingBottom: 6 },
  ticketNum:      { fontSize: 12, color: COLORS.textLight, fontWeight: '600' },
  badge:          { borderRadius: 6, paddingVertical: 3, paddingHorizontal: 8 },
  badgeText:      { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  title:          { fontSize: 15, fontWeight: '600', color: COLORS.text, paddingHorizontal: 14, marginBottom: 8 },
  cardBottom:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingBottom: 12 },
  meta:           { flex: 1, flexShrink: 1, marginRight: 8, fontSize: 12, color: COLORS.textLight },
  statusBadge:    { flexShrink: 0, borderRadius: 8, paddingVertical: 3, paddingHorizontal: 8 },
  statusText:     { fontSize: 11, fontWeight: '600' },
  modalOverlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modalCard:      { backgroundColor: '#FFF', borderRadius: 16, padding: 20 },
  modalTitle:     { fontSize: 17, fontWeight: 'bold', marginBottom: 14, color: COLORS.text },
  input:          { borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12, fontSize: 15, marginBottom: 10 },
  modalError:     { color: COLORS.danger, fontSize: 13, marginBottom: 8 },
  modalActions:   { flexDirection: 'row', gap: 10 },
  cancelBtn:      { flex: 1, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12, alignItems: 'center' },
  createBtn:      { flex: 1, backgroundColor: '#00695C', borderRadius: 10, padding: 12, alignItems: 'center' },
  createBtnText:  { color: '#FFF', fontWeight: 'bold' },
});

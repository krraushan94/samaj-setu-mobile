import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, RefreshControl, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../store/themeStore';
import { visitAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { OFFICE_ADDRESS, OFFICE_EMAIL } from '../../constants';

const STATUS_COLORS = { pending: '#F9A825', scheduled: '#2E7D32', completed: '#1565C0', cancelled: '#C62828' };
const STATUS_LABELS = { pending: 'Pending Review', scheduled: 'Scheduled', completed: 'Completed', cancelled: 'Cancelled' };

export default function OfficeVisitScreen({ navigation }) {
  const t = useTheme();
  const user = useAuthStore(s => s.user);
  const [visits, setVisits] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    visitorName: user?.full_name || '', contactMobile: user?.mobile || '',
    address: [user?.colony, user?.ward && `Ward ${user.ward}`, user?.mandal, user?.pincode].filter(Boolean).join(', '),
    reason: '', numberOfPersons: '1', aadharNumber: user?.aadhar_number || '', preferredDate: '',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const load = async () => {
    if (!user) return;
    try { const { data } = await visitAPI.myVisits(); setVisits(data.visits || []); } catch {}
  };
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };
  useEffect(() => { load(); }, [user]);

  const submit = async () => {
    if (!form.visitorName.trim() || !form.contactMobile.trim() || !form.address.trim() || !form.reason.trim()) {
      return Alert.alert('Error', 'Name, contact number, address and reason are required');
    }
    if (!user) {
      return Alert.alert(
        'Login required',
        'You can browse office visit info as a guest, but you need to log in to request a visit.',
        [{ text: 'Cancel', style: 'cancel' }, { text: 'Log In / Sign Up', onPress: () => navigation.navigate('Login') }],
      );
    }
    try {
      await visitAPI.create(form);
      Alert.alert('Request sent', 'The office will review your request and assign a visit time. You can check the status below.');
      setShowForm(false);
      setForm(f => ({ ...f, reason: '', preferredDate: '' }));
      load();
    } catch (e) { Alert.alert('Error', e.response?.data?.message || 'Could not submit request'); }
  };

  const cancel = (id) => {
    Alert.alert('Cancel visit request', 'Are you sure you want to cancel this request?', [
      { text: 'No', style: 'cancel' },
      { text: 'Yes, cancel', style: 'destructive', onPress: async () => {
        try { await visitAPI.cancel(id); load(); } catch { Alert.alert('Error', 'Could not cancel request'); }
      } },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: t.background }]}>
      <View style={[styles.banner, { backgroundColor: t.primary }]}>
        <MaterialIcons name="event-available" size={24} color="#FFF" />
        <View style={styles.bannerText}>
          <Text style={styles.bannerTitle}>Visit the Office</Text>
          <Text style={styles.bannerSub}>{OFFICE_ADDRESS}</Text>
          <Text style={styles.bannerSub}>✉️ {OFFICE_EMAIL}</Text>
        </View>
        <TouchableOpacity style={styles.reportBtn} onPress={() => setShowForm(!showForm)}>
          <Text style={styles.reportBtnText}>{showForm ? 'Cancel' : '+ Request'}</Text>
        </TouchableOpacity>
      </View>

      {showForm && (
        <View style={[styles.form, { backgroundColor: t.card }]}>
          <TextInput style={[styles.input, { backgroundColor: t.inputBg, borderColor: t.border, color: t.text }]} placeholder="Your full name *" placeholderTextColor={t.textLight} value={form.visitorName} onChangeText={v => set('visitorName', v)} />
          <TextInput style={[styles.input, { backgroundColor: t.inputBg, borderColor: t.border, color: t.text }]} placeholder="Contact number *" keyboardType="phone-pad" maxLength={10} placeholderTextColor={t.textLight} value={form.contactMobile} onChangeText={v => set('contactMobile', v)} />
          {/* Already on file from registration — no need to ask again. Only show this field
              for the (rare, e.g. pre-Aadhaar-requirement) accounts that don't have one yet. */}
          {!user?.aadhar_number && (
            <TextInput style={[styles.input, { backgroundColor: t.inputBg, borderColor: t.border, color: t.text }]} placeholder="Aadhaar number (optional)" keyboardType="number-pad" maxLength={12} placeholderTextColor={t.textLight} value={form.aadharNumber} onChangeText={v => set('aadharNumber', v)} />
          )}
          <TextInput style={[styles.input, styles.textarea, { backgroundColor: t.inputBg, borderColor: t.border, color: t.text }]} placeholder="Your address / area you live in *" placeholderTextColor={t.textLight} value={form.address} onChangeText={v => set('address', v)} multiline numberOfLines={2} />
          <TextInput style={[styles.input, { backgroundColor: t.inputBg, borderColor: t.border, color: t.text }]} placeholder="Number of persons visiting *" keyboardType="number-pad" maxLength={2} placeholderTextColor={t.textLight} value={form.numberOfPersons} onChangeText={v => set('numberOfPersons', v)} />
          <TextInput style={[styles.input, styles.textarea, { backgroundColor: t.inputBg, borderColor: t.border, color: t.text }]} placeholder="Reason for visit *" placeholderTextColor={t.textLight} value={form.reason} onChangeText={v => set('reason', v)} multiline numberOfLines={3} />
          <TextInput style={[styles.input, { backgroundColor: t.inputBg, borderColor: t.border, color: t.text }]} placeholder="Preferred date/time (optional — office will confirm)" placeholderTextColor={t.textLight} value={form.preferredDate} onChangeText={v => set('preferredDate', v)} />
          <TouchableOpacity style={[styles.submitBtn, { backgroundColor: t.primary }]} onPress={submit}>
            <Text style={styles.submitBtnText}>Send Visit Request</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        data={visits}
        keyExtractor={v => v.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={[styles.empty, { color: t.textLight }]}>{user ? 'No visit requests yet' : 'Log in to see your visit requests'}</Text>}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: t.card }]}>
            <View style={styles.cardTop}>
              <Text style={[styles.reason, { color: t.text }]} numberOfLines={2}>{item.reason}</Text>
              <View style={[styles.badge, { backgroundColor: STATUS_COLORS[item.status] + '22' }]}>
                <Text style={[styles.badgeText, { color: STATUS_COLORS[item.status] }]}>{STATUS_LABELS[item.status]}</Text>
              </View>
            </View>
            <Text style={[styles.detail, { color: t.textLight }]}>👥 {item.number_of_persons} {item.number_of_persons === 1 ? 'person' : 'persons'}</Text>
            {item.scheduled_time && <Text style={[styles.detail, { color: STATUS_COLORS.scheduled, fontWeight: '600' }]}>🗓️ {item.scheduled_time}</Text>}
            {item.admin_note && <Text style={[styles.detail, { color: t.textLight }]}>Note: {item.admin_note}</Text>}
            <Text style={[styles.reportedAt, { color: t.textLight }]}>Requested: {new Date(item.created_at).toLocaleDateString('en-IN')}</Text>
            {(item.status === 'pending' || item.status === 'scheduled') && (
              <TouchableOpacity onPress={() => cancel(item.id)}>
                <Text style={styles.cancelLink}>Cancel this request</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1 },
  banner:        { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
  bannerText:    { flex: 1 },
  bannerTitle:   { color: '#FFF', fontSize: 16, fontWeight: '700' },
  bannerSub:     { color: 'rgba(255,255,255,0.85)', fontSize: 12 },
  reportBtn:     { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12 },
  reportBtnText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
  form:          { margin: 12, borderRadius: 14, padding: 14, gap: 8 },
  input:         { borderWidth: 1, borderRadius: 10, padding: 10, fontSize: 14 },
  textarea:      { height: 70, textAlignVertical: 'top' },
  submitBtn:     { borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 4 },
  submitBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  list:          { padding: 12, gap: 10, paddingBottom: 32 },
  empty:         { textAlign: 'center', marginTop: 40, fontSize: 14 },
  card:          { borderRadius: 14, padding: 14, gap: 4, elevation: 2 },
  cardTop:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  reason:        { flex: 1, fontSize: 15, fontWeight: '700' },
  badge:         { flexShrink: 0, borderRadius: 8, paddingVertical: 4, paddingHorizontal: 8 },
  badgeText:     { fontSize: 11, fontWeight: '700' },
  detail:        { fontSize: 13 },
  reportedAt:    { fontSize: 11, marginTop: 2 },
  cancelLink:    { color: '#C62828', fontSize: 12, fontWeight: '600', marginTop: 4 },
});

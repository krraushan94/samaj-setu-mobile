import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants';
import { useTheme } from '../../store/themeStore';
import AppText from '../../components/AppText';
import { adminAPI } from '../../services/api';

const MAX_TOTAL_ADMINS = 6; // Admin_Raushan + up to 5 more

// Admin_Raushan only — creates limited-power sub-admins (teams/tickets/community, no
// payments, no managing other admins). This screen isn't reachable for a sub-admin —
// the backend also enforces this independently via requirePrimaryAdmin.
export default function AdminManageAdminsScreen() {
  const t = useTheme();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ username: '', fullName: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [resetTarget, setResetTarget] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await adminAPI.listSubAdmins();
      setAdmins(data.admins || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const submitAdd = async () => {
    setError('');
    if (!form.username || !form.fullName || !form.password) {
      return setError('Username, full name and password are required');
    }
    if (form.password.length < 8) return setError('Password must be at least 8 characters');
    try {
      await adminAPI.addSubAdmin(form);
      setForm({ username: '', fullName: '', email: '', password: '' });
      setShowAdd(false);
      load();
    } catch (e) {
      setError(e.response?.data?.message || 'Could not create admin');
    }
  };

  const toggleActive = (admin) => {
    const action = admin.is_active ? 'Deactivate' : 'Reactivate';
    Alert.alert(action, `${action} ${admin.full_name}'s admin access?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: action, style: admin.is_active ? 'destructive' : 'default', onPress: async () => {
        try { await adminAPI.updateSubAdmin(admin.id, { isActive: !admin.is_active }); load(); } catch {}
      } },
    ]);
  };

  const submitReset = async () => {
    if (newPassword.length < 8) return Alert.alert('Error', 'Password must be at least 8 characters');
    try {
      await adminAPI.updateSubAdmin(resetTarget.id, { newPassword });
      Alert.alert('Done', `Password reset for ${resetTarget.full_name}. Share the new password with them directly.`);
      setResetTarget(null);
      setNewPassword('');
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Could not reset password');
    }
  };

  const slotsUsed = admins.length;
  const atCapacity = slotsUsed >= MAX_TOTAL_ADMINS;

  return (
    <ScrollView style={[styles.container, { backgroundColor: t.background }]} contentContainerStyle={styles.body}>
      <AppText style={[styles.intro, { color: t.textLight }]}>
        Admin_Raushan can add up to {MAX_TOTAL_ADMINS - 1} more admins ({slotsUsed}/{MAX_TOTAL_ADMINS} used).
        Sub-admins can manage Team Leaders, Members, tickets and community moderation — but not payments,
        raw data export, or other admin accounts.
      </AppText>

      <TouchableOpacity
        style={[styles.addBtn, atCapacity && { backgroundColor: t.border }]}
        disabled={atCapacity}
        onPress={() => { setShowAdd(true); setError(''); }}
      >
        <MaterialIcons name="person-add" size={18} color="#FFF" />
        <AppText style={styles.addBtnText}>{atCapacity ? 'Maximum admins reached' : 'Add Admin'}</AppText>
      </TouchableOpacity>

      {!loading && admins.map(a => (
        <View key={a.id} style={[styles.card, { backgroundColor: t.card }]}>
          <View style={{ flex: 1 }}>
            <AppText style={[styles.name, { color: t.text }]}>
              {a.full_name} {a.username === 'Admin_Raushan' && <AppText style={[styles.primaryTag, { color: t.secondary }]}>(Primary)</AppText>}
            </AppText>
            <AppText style={[styles.username, { color: t.textLight }]}>@{a.username} — {a.is_active ? 'Active' : 'Deactivated'}</AppText>
            {a.email && <AppText style={[styles.email, { color: t.textLight }]}>{a.email}</AppText>}
          </View>
          {a.username !== 'Admin_Raushan' && (
            <View style={{ flexDirection: 'row', gap: 16 }}>
              <TouchableOpacity onPress={() => { setResetTarget(a); setNewPassword(''); }} accessibilityLabel={`Reset password for ${a.full_name}`}>
                <MaterialIcons name="lock-reset" size={20} color={t.secondary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => toggleActive(a)} accessibilityLabel={`${a.is_active ? 'Deactivate' : 'Reactivate'} ${a.full_name}`}>
                <MaterialIcons name={a.is_active ? 'person-remove' : 'person-add'} size={20} color={a.is_active ? t.danger : t.success} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      ))}

      <Modal visible={showAdd} transparent animationType="fade" onRequestClose={() => setShowAdd(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: t.card }]}>
            <AppText style={[styles.modalTitle, { color: t.text }]}>Add Admin</AppText>
            <TextInput style={[styles.input, { borderColor: t.border, backgroundColor: t.inputBg, color: t.text }]} placeholderTextColor={t.textLight} placeholder="Full Name" value={form.fullName} onChangeText={v => setForm(f => ({ ...f, fullName: v }))} />
            <TextInput style={[styles.input, { borderColor: t.border, backgroundColor: t.inputBg, color: t.text }]} placeholderTextColor={t.textLight} placeholder="Username" value={form.username} onChangeText={v => setForm(f => ({ ...f, username: v }))} autoCapitalize="none" />
            <TextInput style={[styles.input, { borderColor: t.border, backgroundColor: t.inputBg, color: t.text }]} placeholderTextColor={t.textLight} placeholder="Email (optional)" value={form.email} onChangeText={v => setForm(f => ({ ...f, email: v }))} autoCapitalize="none" keyboardType="email-address" />
            <TextInput style={[styles.input, { borderColor: t.border, backgroundColor: t.inputBg, color: t.text }]} placeholderTextColor={t.textLight} placeholder="Password (8+ characters)" secureTextEntry value={form.password} onChangeText={v => setForm(f => ({ ...f, password: v }))} />
            {error && <AppText style={styles.error}>{error}</AppText>}
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.cancelBtn, { borderColor: t.border }]} onPress={() => setShowAdd(false)}><AppText style={{ color: t.text }}>Cancel</AppText></TouchableOpacity>
              <TouchableOpacity style={[styles.createBtn, { backgroundColor: t.primary }]} onPress={submitAdd}><AppText style={styles.createBtnText}>Create</AppText></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!resetTarget} transparent animationType="fade" onRequestClose={() => setResetTarget(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: t.card }]}>
            <AppText style={[styles.modalTitle, { color: t.text }]}>Reset Password — {resetTarget?.full_name}</AppText>
            <TextInput style={[styles.input, { borderColor: t.border, backgroundColor: t.inputBg, color: t.text }]} placeholderTextColor={t.textLight} placeholder="New password (8+ characters)" secureTextEntry value={newPassword} onChangeText={setNewPassword} />
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.cancelBtn, { borderColor: t.border }]} onPress={() => setResetTarget(null)}><AppText style={{ color: t.text }}>Cancel</AppText></TouchableOpacity>
              <TouchableOpacity style={[styles.createBtn, { backgroundColor: t.primary }]} onPress={submitReset}><AppText style={styles.createBtnText}>Reset</AppText></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: COLORS.background },
  body:         { padding: 16, paddingBottom: 40 },
  intro:        { fontSize: 12, color: COLORS.textLight, marginBottom: 16, lineHeight: 17 },
  addBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#1A237E', borderRadius: 10, paddingVertical: 12, marginBottom: 16 },
  addBtnDisabled:{ backgroundColor: COLORS.border },
  addBtnText:   { color: '#FFF', fontWeight: '600', fontSize: 14 },
  card:         { backgroundColor: '#FFF', borderRadius: 12, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', elevation: 1 },
  name:         { fontSize: 14, fontWeight: '600', color: COLORS.text },
  primaryTag:   { fontSize: 11, color: COLORS.secondary, fontWeight: 'normal' },
  username:     { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  email:        { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modalCard:    { backgroundColor: '#FFF', borderRadius: 16, padding: 20 },
  modalTitle:   { fontSize: 17, fontWeight: 'bold', marginBottom: 14, color: COLORS.text },
  input:        { borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12, fontSize: 15, marginBottom: 10 },
  error:        { color: COLORS.danger, fontSize: 13, marginBottom: 8 },
  modalActions: { flexDirection: 'row', gap: 10 },
  cancelBtn:    { flex: 1, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12, alignItems: 'center' },
  createBtn:    { flex: 1, backgroundColor: COLORS.primary, borderRadius: 10, padding: 12, alignItems: 'center' },
  createBtnText:{ color: '#FFF', fontWeight: 'bold' },
});

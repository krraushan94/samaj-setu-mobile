import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants';
import { useTheme } from '../../store/themeStore';
import AppText from '../../components/AppText';
import { departmentAPI, adminAPI } from '../../services/api';

// Admin-only Team management — only Admin_Raushan can create, reset the password for, or
// deactivate a Team Leader or member. There is no public "apply" flow anywhere in the app.
export default function AdminTeamsScreen() {
  const t = useTheme();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formDept, setFormDept] = useState(null);
  const [form, setForm] = useState({ fullName: '', username: '', password: '', role: 'leader' });
  const [resetTarget, setResetTarget] = useState(null); // { id, full_name }
  const [newPassword, setNewPassword] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await departmentAPI.list();
      setDepartments(data.departments || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const submitMember = async () => {
    if (!form.fullName || !form.username || !form.password) {
      return Alert.alert('Error', 'Full name, username and password are required');
    }
    if (form.password.length < 8) return Alert.alert('Error', 'Password must be at least 8 characters');
    try {
      await departmentAPI.addMember(formDept.id, form);
      setForm({ fullName: '', username: '', password: '', role: 'leader' });
      setFormDept(null);
      load();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Could not add team member');
    }
  };

  const deactivate = (memberId) => {
    Alert.alert('Deactivate', 'This team member will no longer be able to log in.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Deactivate', style: 'destructive', onPress: async () => {
        try { await departmentAPI.removeMember(memberId); load(); } catch {}
      } },
    ]);
  };

  const submitReset = async () => {
    if (newPassword.length < 8) return Alert.alert('Error', 'Password must be at least 8 characters');
    try {
      await adminAPI.updateTeamMember(resetTarget.id, { newPassword });
      Alert.alert('Done', `Password reset for ${resetTarget.full_name}. Share the new password with them directly.`);
      setResetTarget(null);
      setNewPassword('');
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Could not reset password');
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: th.background }]} contentContainerStyle={styles.body}>
      <AppText style={[styles.intro, { color: th.textLight }]}>Only Admin_Raushan can add or remove Team Leaders / members — there's no public application flow.</AppText>

      {departments.map(dept => (
        <View key={dept.id} style={[styles.deptCard, { backgroundColor: th.card }]}>
          <View style={styles.deptHeader}>
            <AppText style={styles.deptName}>{dept.name}</AppText>
            <TouchableOpacity style={styles.addBtn} onPress={() => setFormDept(dept)}>
              <MaterialIcons name="person-add" size={16} color="#FFF" />
              <AppText style={styles.addBtnText}>Add</AppText>
            </TouchableOpacity>
          </View>
          {(dept.members || []).filter(Boolean).length === 0 ? (
            <AppText style={[styles.empty, { color: th.textLight }]}>No team members yet.</AppText>
          ) : (
            (dept.members || []).filter(Boolean).map(m => (
              <View key={m.id} style={[styles.memberRow, { borderTopColor: th.border }]}>
                <View style={{ flex: 1 }}>
                  <AppText style={[styles.memberName, { color: th.text }]}>{m.full_name} <AppText style={[styles.memberRole, { color: th.textLight }]}>({m.role})</AppText></AppText>
                  <AppText style={[styles.memberUser, { color: th.textLight }]}>@{m.username} — {m.is_active ? 'Active' : 'Deactivated'}</AppText>
                </View>
                {m.is_active && (
                  <View style={{ flexDirection: 'row', gap: 16 }}>
                    <TouchableOpacity onPress={() => { setResetTarget(m); setNewPassword(''); }} accessibilityLabel={`Reset password for ${m.full_name}`}>
                      <MaterialIcons name="lock-reset" size={20} color={th.secondary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deactivate(m.id)} accessibilityLabel={`Deactivate ${m.full_name}`}>
                      <MaterialIcons name="person-remove" size={20} color={th.danger} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))
          )}
        </View>
      ))}

      <Modal visible={!!formDept} transparent animationType="fade" onRequestClose={() => setFormDept(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: th.card }]}>
            <AppText style={[styles.modalTitle, { color: th.text }]}>Add to {formDept?.name}</AppText>
            <TextInput style={[styles.input, { borderColor: th.border, backgroundColor: th.inputBg, color: th.text }]} placeholderTextColor={th.textLight} placeholder="Full Name" value={form.fullName} onChangeText={v => setForm(f => ({ ...f, fullName: v }))} />
            <TextInput style={[styles.input, { borderColor: th.border, backgroundColor: th.inputBg, color: th.text }]} placeholderTextColor={th.textLight} placeholder="Username" value={form.username} onChangeText={v => setForm(f => ({ ...f, username: v }))} autoCapitalize="none" />
            <TextInput style={[styles.input, { borderColor: th.border, backgroundColor: th.inputBg, color: th.text }]} placeholderTextColor={th.textLight} placeholder="Password (8+ characters)" secureTextEntry value={form.password} onChangeText={v => setForm(f => ({ ...f, password: v }))} />
            <View style={styles.roleRow}>
              {['leader', 'member'].map(r => (
                <TouchableOpacity key={r} style={[styles.roleChip, { borderColor: th.border }, form.role === r && { backgroundColor: th.primary, borderColor: th.primary }]} onPress={() => setForm(f => ({ ...f, role: r }))}>
                  <AppText style={[styles.roleChipText, { color: th.text }, form.role === r && styles.roleChipTextActive]}>{r === 'leader' ? 'Team Leader' : 'Member'}</AppText>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.cancelBtn, { borderColor: th.border }]} onPress={() => setFormDept(null)}><AppText style={{ color: th.text }}>Cancel</AppText></TouchableOpacity>
              <TouchableOpacity style={[styles.createBtn, { backgroundColor: th.primary }]} onPress={submitMember}><AppText style={styles.createBtnText}>Create</AppText></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!resetTarget} transparent animationType="fade" onRequestClose={() => setResetTarget(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: th.card }]}>
            <AppText style={[styles.modalTitle, { color: th.text }]}>Reset Password — {resetTarget?.full_name}</AppText>
            <TextInput style={[styles.input, { borderColor: th.border, backgroundColor: th.inputBg, color: th.text }]} placeholderTextColor={th.textLight} placeholder="New password (8+ characters)" secureTextEntry value={newPassword} onChangeText={setNewPassword} />
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.cancelBtn, { borderColor: th.border }]} onPress={() => setResetTarget(null)}><AppText style={{ color: th.text }}>Cancel</AppText></TouchableOpacity>
              <TouchableOpacity style={[styles.createBtn, { backgroundColor: th.primary }]} onPress={submitReset}><AppText style={styles.createBtnText}>Reset</AppText></TouchableOpacity>
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
  deptCard:     { backgroundColor: '#FFF', borderRadius: 12, padding: 14, marginBottom: 12, elevation: 1 },
  deptHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  deptName:     { flex: 1, flexShrink: 1, marginRight: 8, fontSize: 15, fontWeight: 'bold', color: '#1A237E' },
  addBtn:       { flexShrink: 0, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#1A237E', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 10 },
  addBtnText:   { color: '#FFF', fontSize: 12, fontWeight: '600' },
  empty:        { fontSize: 12, color: COLORS.textLight },
  memberRow:    { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderTopWidth: 1, borderTopColor: COLORS.border },
  memberName:   { fontSize: 14, fontWeight: '600', color: COLORS.text },
  memberRole:   { fontSize: 12, color: COLORS.textLight, fontWeight: 'normal' },
  memberUser:   { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modalCard:    { backgroundColor: '#FFF', borderRadius: 16, padding: 20 },
  modalTitle:   { fontSize: 17, fontWeight: 'bold', marginBottom: 14, color: COLORS.text },
  input:        { borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12, fontSize: 15, marginBottom: 10 },
  roleRow:      { flexDirection: 'row', gap: 8, marginBottom: 16 },
  roleChip:     { flex: 1, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  roleChipActive:{ backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  roleChipText: { fontSize: 13, color: COLORS.text },
  roleChipTextActive:{ color: '#FFF', fontWeight: '600' },
  modalActions: { flexDirection: 'row', gap: 10 },
  cancelBtn:    { flex: 1, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12, alignItems: 'center' },
  createBtn:    { flex: 1, backgroundColor: COLORS.primary, borderRadius: 10, padding: 12, alignItems: 'center' },
  createBtnText:{ color: '#FFF', fontWeight: 'bold' },
});

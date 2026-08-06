import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants';
import { departmentAPI, adminAPI } from '../../services/api';

// Admin-only Team management — only Admin_Raushan can create, reset the password for, or
// deactivate a Team Leader or member. There is no public "apply" flow anywhere in the app.
export default function AdminTeamsScreen() {
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
    <ScrollView style={styles.container} contentContainerStyle={styles.body}>
      <Text style={styles.intro}>Only Admin_Raushan can add or remove Team Leaders / members — there's no public application flow.</Text>

      {departments.map(dept => (
        <View key={dept.id} style={styles.deptCard}>
          <View style={styles.deptHeader}>
            <Text style={styles.deptName}>{dept.name}</Text>
            <TouchableOpacity style={styles.addBtn} onPress={() => setFormDept(dept)}>
              <MaterialIcons name="person-add" size={16} color="#FFF" />
              <Text style={styles.addBtnText}>Add</Text>
            </TouchableOpacity>
          </View>
          {(dept.members || []).filter(Boolean).length === 0 ? (
            <Text style={styles.empty}>No team members yet.</Text>
          ) : (
            (dept.members || []).filter(Boolean).map(m => (
              <View key={m.id} style={styles.memberRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.memberName}>{m.full_name} <Text style={styles.memberRole}>({m.role})</Text></Text>
                  <Text style={styles.memberUser}>@{m.username} — {m.is_active ? 'Active' : 'Deactivated'}</Text>
                </View>
                {m.is_active && (
                  <View style={{ flexDirection: 'row', gap: 16 }}>
                    <TouchableOpacity onPress={() => { setResetTarget(m); setNewPassword(''); }} accessibilityLabel={`Reset password for ${m.full_name}`}>
                      <MaterialIcons name="lock-reset" size={20} color={COLORS.secondary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deactivate(m.id)} accessibilityLabel={`Deactivate ${m.full_name}`}>
                      <MaterialIcons name="person-remove" size={20} color={COLORS.danger} />
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
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add to {formDept?.name}</Text>
            <TextInput style={styles.input} placeholder="Full Name" value={form.fullName} onChangeText={v => setForm(f => ({ ...f, fullName: v }))} />
            <TextInput style={styles.input} placeholder="Username" value={form.username} onChangeText={v => setForm(f => ({ ...f, username: v }))} autoCapitalize="none" />
            <TextInput style={styles.input} placeholder="Password (8+ characters)" secureTextEntry value={form.password} onChangeText={v => setForm(f => ({ ...f, password: v }))} />
            <View style={styles.roleRow}>
              {['leader', 'member'].map(r => (
                <TouchableOpacity key={r} style={[styles.roleChip, form.role === r && styles.roleChipActive]} onPress={() => setForm(f => ({ ...f, role: r }))}>
                  <Text style={[styles.roleChipText, form.role === r && styles.roleChipTextActive]}>{r === 'leader' ? 'Team Leader' : 'Member'}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setFormDept(null)}><Text>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.createBtn} onPress={submitMember}><Text style={styles.createBtnText}>Create</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!resetTarget} transparent animationType="fade" onRequestClose={() => setResetTarget(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Reset Password — {resetTarget?.full_name}</Text>
            <TextInput style={styles.input} placeholder="New password (8+ characters)" secureTextEntry value={newPassword} onChangeText={setNewPassword} />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setResetTarget(null)}><Text>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.createBtn} onPress={submitReset}><Text style={styles.createBtnText}>Reset</Text></TouchableOpacity>
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

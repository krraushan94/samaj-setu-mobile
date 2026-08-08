import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, TextInput, Alert, Modal, RefreshControl, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import { teamworkAPI } from '../services/api';

const STATUS_COLORS = { pending: '#F9A825', in_progress: '#1565C0', completed: '#2E7D32' };
const STATUS_LABELS = { pending: 'Pending', in_progress: 'In Progress', completed: 'Completed' };
const PRIORITY_COLORS = { low: '#78909C', medium: '#F57F17', high: '#C62828' };

// Task board for one department. `canCreate` (leader/admin) shows the "+ Task" button
// and lets a task be freely reassigned/edited; members can only move status/progress
// on tasks already assigned to them — enforced again server-side regardless of this UI.
export function TaskBoard({ departmentId, members, currentUserId, canCreate }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null); // task being updated
  const [form, setForm] = useState({ title: '', description: '', assignedTo: '', dueDate: '', priority: 'medium' });
  const [progressNote, setProgressNote] = useState('');

  const load = async () => {
    try {
      const { data } = await teamworkAPI.listTasks(departmentId ? { departmentId } : {});
      setTasks(data.tasks || []);
    } catch { Alert.alert('Error', 'Could not load tasks'); }
  };

  useEffect(() => { setLoading(true); load().finally(() => setLoading(false)); }, [departmentId]);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const submitTask = async () => {
    if (!form.title.trim()) return Alert.alert('Error', 'Title is required');
    try {
      await teamworkAPI.createTask({ ...form, departmentId, dueDate: form.dueDate || null, assignedTo: form.assignedTo || null });
      setShowForm(false);
      setForm({ title: '', description: '', assignedTo: '', dueDate: '', priority: 'medium' });
      load();
    } catch (e) { Alert.alert('Error', e.response?.data?.message || 'Could not create task'); }
  };

  const openTask = (task) => { setEditing(task); setProgressNote(task.progress_note || ''); };

  const updateStatus = async (status) => {
    try {
      await teamworkAPI.updateTask(editing.id, { status, progressNote });
      setEditing(null);
      load();
    } catch (e) { Alert.alert('Error', e.response?.data?.message || 'Could not update task'); }
  };

  const isOwn = (t) => t.assigned_to === currentUserId;
  const canEdit = (t) => canCreate || isOwn(t);
  const isOverdue = (t) => t.due_date && t.status !== 'completed' && new Date(t.due_date) < new Date(new Date().toDateString());

  return (
    <View style={styles.flex}>
      {canCreate && (
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(true)}>
          <MaterialIcons name="add-task" size={18} color="#FFF" />
          <Text style={styles.addBtnText}>New Task</Text>
        </TouchableOpacity>
      )}

      <FlatList
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        data={tasks}
        keyExtractor={t => t.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={!loading && <Text style={styles.empty}>No tasks yet</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity style={[styles.card, isOverdue(item) && styles.cardOverdue]} onPress={() => canEdit(item) && openTask(item)} disabled={!canEdit(item)}>
            <View style={styles.cardTop}>
              <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
              <View style={[styles.badge, { backgroundColor: STATUS_COLORS[item.status] + '22' }]}>
                <Text style={[styles.badgeText, { color: STATUS_COLORS[item.status] }]}>{STATUS_LABELS[item.status]}</Text>
              </View>
            </View>
            {item.description && <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>}
            <View style={styles.metaRow}>
              <Text style={[styles.meta, { color: PRIORITY_COLORS[item.priority] }]}>● {item.priority}</Text>
              {item.assigned_to_name && <Text style={styles.meta}>👤 {item.assigned_to_name}</Text>}
              {item.due_date && <Text style={[styles.meta, isOverdue(item) && styles.overdueText]}>📅 {item.due_date}{isOverdue(item) ? ' (overdue)' : ''}</Text>}
              {item.department_name && <Text style={styles.meta}>🏢 {item.department_name}</Text>}
            </View>
            {item.progress_note && <Text style={styles.progressNote}>Note: {item.progress_note}</Text>}
          </TouchableOpacity>
        )}
      />

      {/* Create task */}
      <Modal visible={showForm} transparent animationType="fade" onRequestClose={() => setShowForm(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>New Task</Text>
            <TextInput style={styles.input} placeholder="Title *" value={form.title} onChangeText={v => setForm(f => ({ ...f, title: v }))} />
            <TextInput style={[styles.input, styles.textarea]} placeholder="Description" value={form.description} onChangeText={v => setForm(f => ({ ...f, description: v }))} multiline numberOfLines={2} />
            {!!members?.length && (
              <>
                <Text style={styles.label}>Assign to</Text>
                <View style={styles.chipRow}>
                  {members.map(m => (
                    <TouchableOpacity key={m.id} style={[styles.chip, form.assignedTo === m.id && styles.chipActive]} onPress={() => setForm(f => ({ ...f, assignedTo: f.assignedTo === m.id ? '' : m.id }))}>
                      <Text style={[styles.chipText, form.assignedTo === m.id && styles.chipTextActive]}>{m.full_name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
            <Text style={styles.label}>Priority</Text>
            <View style={styles.chipRow}>
              {['low', 'medium', 'high'].map(p => (
                <TouchableOpacity key={p} style={[styles.chip, form.priority === p && { backgroundColor: PRIORITY_COLORS[p], borderColor: PRIORITY_COLORS[p] }]} onPress={() => setForm(f => ({ ...f, priority: p }))}>
                  <Text style={[styles.chipText, form.priority === p && styles.chipTextActive]}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput style={styles.input} placeholder="Due date (YYYY-MM-DD, optional)" value={form.dueDate} onChangeText={v => setForm(f => ({ ...f, dueDate: v }))} />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowForm(false)}><Text style={styles.cancelBtnText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={submitTask}><Text style={styles.confirmBtnText}>Create</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Update task status */}
      <Modal visible={!!editing} transparent animationType="fade" onRequestClose={() => setEditing(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{editing?.title}</Text>
            <TextInput style={[styles.input, styles.textarea]} placeholder="Progress note (optional)" value={progressNote} onChangeText={setProgressNote} multiline numberOfLines={2} />
            <View style={styles.statusRow}>
              {['pending', 'in_progress', 'completed'].map(s => (
                <TouchableOpacity key={s} style={[styles.statusBtn, { borderColor: STATUS_COLORS[s] }, editing?.status === s && { backgroundColor: STATUS_COLORS[s] }]} onPress={() => updateStatus(s)}>
                  <Text style={[styles.statusBtnText, { color: editing?.status === s ? '#FFF' : STATUS_COLORS[s] }]}>{STATUS_LABELS[s]}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditing(null)}><Text style={styles.cancelBtnText}>Close</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Group chat for one department — polls every 8s while mounted since Render's free
// tier sleeps idle connections, so a real WebSocket wouldn't stay open reliably anyway.
export function ChatPanel({ departmentId, currentUserId }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const listRef = useRef(null);

  const load = async () => {
    try {
      const { data } = await teamworkAPI.listMessages(departmentId ? { departmentId } : {});
      setMessages(data.messages || []);
    } catch {}
  };

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
    const interval = setInterval(load, 8000);
    return () => clearInterval(interval);
  }, [departmentId]);

  const send = async () => {
    if (!text.trim()) return;
    const body = text.trim();
    setText('');
    try {
      await teamworkAPI.postMessage({ departmentId, message: body });
      load();
    } catch { Alert.alert('Error', 'Could not send message'); }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={m => m.id}
        contentContainerStyle={styles.chatList}
        ListEmptyComponent={!loading && <Text style={styles.empty}>No messages yet — say hello 👋</Text>}
        renderItem={({ item }) => {
          const mine = item.sender_id === currentUserId;
          return (
            <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
              {!mine && <Text style={styles.bubbleSender}>{item.sender_name} · {item.sender_role}</Text>}
              <Text style={[styles.bubbleText, mine && { color: '#FFF' }]}>{item.message}</Text>
              <Text style={[styles.bubbleTime, mine && { color: 'rgba(255,255,255,0.7)' }]}>{new Date(item.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</Text>
            </View>
          );
        }}
      />
      <View style={styles.composerRow}>
        <TextInput style={styles.composerInput} placeholder="Message your team…" value={text} onChangeText={setText} multiline />
        <TouchableOpacity style={styles.sendBtn} onPress={send} testID="send-message-btn">
          <MaterialIcons name="send" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex:          { flex: 1 },
  addBtn:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: COLORS.primary, borderRadius: 10, padding: 12, margin: 12, marginBottom: 0 },
  addBtnText:    { color: '#FFF', fontWeight: '700', fontSize: 14 },
  list:          { padding: 12, gap: 10, paddingBottom: 32 },
  empty:         { textAlign: 'center', marginTop: 40, fontSize: 14, color: COLORS.textLight },
  card:          { backgroundColor: '#FFF', borderRadius: 14, padding: 14, gap: 4, elevation: 2 },
  cardOverdue:   { borderWidth: 1.5, borderColor: COLORS.danger },
  cardTop:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  title:         { flex: 1, fontSize: 15, fontWeight: '700', color: COLORS.text },
  badge:         { flexShrink: 0, borderRadius: 8, paddingVertical: 4, paddingHorizontal: 8 },
  badgeText:     { fontSize: 11, fontWeight: '700' },
  desc:          { fontSize: 13, color: COLORS.textLight },
  metaRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  meta:          { fontSize: 12, color: COLORS.textLight },
  overdueText:   { color: COLORS.danger, fontWeight: '700' },
  progressNote:  { fontSize: 12, color: COLORS.text, fontStyle: 'italic', marginTop: 4 },
  modalOverlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modalCard:     { backgroundColor: '#FFF', borderRadius: 16, padding: 20, maxHeight: '85%' },
  modalTitle:    { fontSize: 16, fontWeight: 'bold', marginBottom: 14, color: COLORS.text },
  input:         { borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12, fontSize: 14, marginBottom: 10 },
  textarea:      { height: 60, textAlignVertical: 'top' },
  label:         { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 6 },
  chipRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  chip:          { borderWidth: 1, borderColor: COLORS.border, borderRadius: 20, paddingVertical: 6, paddingHorizontal: 12 },
  chipActive:    { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText:      { fontSize: 12, color: COLORS.text },
  chipTextActive:{ color: '#FFF', fontWeight: '600' },
  modalActions:  { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn:     { flex: 1, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12, alignItems: 'center' },
  cancelBtnText: { color: COLORS.text, fontWeight: '600' },
  confirmBtn:    { flex: 1, backgroundColor: COLORS.primary, borderRadius: 10, padding: 12, alignItems: 'center' },
  confirmBtnText:{ color: '#FFF', fontWeight: 'bold' },
  statusRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  statusBtn:     { flexGrow: 1, borderWidth: 1.5, borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  statusBtnText: { fontSize: 13, fontWeight: '700' },
  chatList:      { padding: 12, gap: 8, paddingBottom: 12 },
  bubble:        { maxWidth: '80%', borderRadius: 12, padding: 10, marginBottom: 2 },
  bubbleMine:    { backgroundColor: COLORS.primary, alignSelf: 'flex-end' },
  bubbleTheirs:  { backgroundColor: '#FFF', alignSelf: 'flex-start', elevation: 1 },
  bubbleSender:  { fontSize: 11, fontWeight: '700', color: COLORS.primary, marginBottom: 2 },
  bubbleText:    { fontSize: 14, color: COLORS.text },
  bubbleTime:    { fontSize: 10, color: COLORS.textLight, marginTop: 4, alignSelf: 'flex-end' },
  composerRow:   { flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: 10, backgroundColor: '#FFF', borderTopWidth: 1, borderColor: COLORS.border },
  composerInput: { flex: 1, borderWidth: 1, borderColor: COLORS.border, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, maxHeight: 100 },
  sendBtn:       { backgroundColor: COLORS.primary, borderRadius: 20, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
});

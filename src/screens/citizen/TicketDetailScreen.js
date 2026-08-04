import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, STATUS_COLORS, STATUS_LABELS, PRIORITY_COLORS } from '../../constants';
import { ticketAPI, departmentAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

const ACTIONABLE_STATUSES = ['open', 'in_progress', 'resolved', 'closed'];

export default function TicketDetailScreen({ navigation, route }) {
  const { id } = route.params;
  const role = useAuthStore((s) => s.role);
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [resolutionNote, setResolutionNote] = useState('');
  const [noteText, setNoteText] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => ticketAPI.getById(id).then(({ data }) => setTicket(data.ticket)).catch(() => {}).finally(() => setLoading(false));

  useEffect(() => { load(); }, [id]);

  useEffect(() => {
    if (!ticket?.department_id) return;
    departmentAPI.list().then(({ data }) => {
      const dept = (data.departments || []).find(d => d.id === ticket.department_id);
      setMembers((dept?.members || []).filter(m => m && m.is_active));
    }).catch(() => {});
  }, [ticket?.department_id]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  if (!ticket)  return <View style={styles.center}><Text>Ticket not found</Text></View>;

  const canAct = (role === 'admin' || role === 'leader') && ticket.canManage !== false;

  const changeStatus = async (status) => {
    if (status === ticket.status) return;
    setBusy(true);
    try {
      await ticketAPI.updateStatus(ticket.id, { status, note: resolutionNote || undefined });
      setResolutionNote('');
      await load();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Could not update status');
    } finally { setBusy(false); }
  };

  const submitNote = async () => {
    if (!noteText.trim()) return;
    setBusy(true);
    try {
      await ticketAPI.addNote(ticket.id, noteText.trim());
      setNoteText('');
      await load();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Could not add note');
    } finally { setBusy(false); }
  };

  const assignTo = async (memberId) => {
    setBusy(true);
    try {
      await ticketAPI.assign(ticket.id, { assignedTo: memberId });
      await load();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Could not assign ticket');
    } finally { setBusy(false); }
  };

  const statusSteps = ['payment_pending','open','in_progress','resolved','closed'];
  const currentStep = statusSteps.indexOf(ticket.status);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.body}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.ticketNum}>#{ticket.ticket_number}</Text>
          <View style={[styles.badge, { backgroundColor: PRIORITY_COLORS[ticket.priority] }]}>
            <Text style={styles.badgeText}>{ticket.priority?.toUpperCase()}</Text>
          </View>
        </View>
        <Text style={styles.title}>{ticket.title}</Text>
        <Text style={styles.meta}>{ticket.category} • {ticket.sub_category}</Text>
      </View>

      {/* Status Timeline */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Status Progress</Text>
        <View style={styles.timeline}>
          {statusSteps.map((s, i) => (
            <View key={s} style={styles.timelineItem}>
              <View style={[styles.timelineDot, i <= currentStep && styles.timelineDotActive]} />
              {i < statusSteps.length - 1 && <View style={[styles.timelineLine, i < currentStep && styles.timelineLineActive]} />}
              <Text style={[styles.timelineLabel, i === currentStep && styles.timelineLabelActive]}>{STATUS_LABELS[s]}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Details */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Issue Details</Text>
        {ticket.description && <Text style={styles.desc}>{ticket.description}</Text>}
        {ticket.location_text && (
          <View style={styles.row}><MaterialIcons name="location-on" size={16} color={COLORS.textLight} /><Text style={styles.info}> {ticket.location_text}</Text></View>
        )}
        <View style={styles.row}><MaterialIcons name="business" size={16} color={COLORS.textLight} /><Text style={styles.info}> {ticket.department_name}</Text></View>
        <View style={styles.row}><MaterialIcons name="event" size={16} color={COLORS.textLight} /><Text style={styles.info}> {new Date(ticket.created_at).toLocaleString('en-IN')}</Text></View>
        {ticket.caregiver_name && (
          <View style={styles.row}>
            <MaterialIcons name="volunteer-activism" size={16} color={COLORS.textLight} />
            <Text style={styles.info}> Caregiver: {ticket.caregiver_name}{ticket.caregiver_mobile ? ` (${ticket.caregiver_mobile})` : ''}</Text>
          </View>
        )}
      </View>

      {/* Resolution proof */}
      {ticket.resolution_note && (
        <View style={[styles.card, { backgroundColor: '#E8F5E9' }]}>
          <Text style={styles.cardTitle}>✅ Resolution Update</Text>
          <Text style={styles.desc}>{ticket.resolution_note}</Text>
        </View>
      )}

      {/* Rating */}
      {ticket.status === 'resolved' && !ticket.citizen_rating && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Rate this Resolution</Text>
          <View style={styles.stars}>
            {[1,2,3,4,5].map(s => (
              <TouchableOpacity key={s} onPress={() => ticketAPI.rate(ticket.id, { rating: s }).then(() => Alert.alert('Thanks!', 'Your feedback was submitted')).catch(() => {})}>
                <Text style={styles.star}>⭐</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Team / Admin actions — hidden entirely for citizens and for other departments' tickets */}
      {canAct && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Manage Ticket</Text>

          <Text style={styles.label}>Change Status</Text>
          <View style={styles.statusRow}>
            {ACTIONABLE_STATUSES.map(s => (
              <TouchableOpacity
                key={s}
                style={[styles.statusChip, { borderColor: STATUS_COLORS[s] }, ticket.status === s && { backgroundColor: STATUS_COLORS[s] }]}
                disabled={busy}
                onPress={() => changeStatus(s)}
              >
                <Text style={[styles.statusChipText, { color: ticket.status === s ? '#FFF' : STATUS_COLORS[s] }]}>{STATUS_LABELS[s]}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={styles.noteInput}
            placeholder="Resolution note (used when you move to Resolved/Closed)"
            value={resolutionNote}
            onChangeText={setResolutionNote}
            multiline
          />

          {members.length > 0 && (
            <>
              <Text style={styles.label}>Assign To</Text>
              <View style={styles.statusRow}>
                {members.map(m => (
                  <TouchableOpacity
                    key={m.id}
                    style={[styles.assignChip, ticket.assigned_to === m.id && styles.assignChipActive]}
                    disabled={busy}
                    onPress={() => assignTo(m.id)}
                  >
                    <Text style={[styles.assignChipText, ticket.assigned_to === m.id && styles.assignChipTextActive]}>{m.full_name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          <Text style={styles.label}>Add Internal Note</Text>
          <View style={styles.row}>
            <TextInput style={[styles.noteInput, { flex: 1, marginBottom: 0 }]} placeholder="Note visible to the team" value={noteText} onChangeText={setNoteText} multiline />
            <TouchableOpacity style={styles.addNoteBtn} disabled={busy || !noteText.trim()} onPress={submitNote}>
              <MaterialIcons name="send" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* History */}
      {ticket.history?.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Activity Log</Text>
          {ticket.history.filter(Boolean).map((h, i) => (
            <View key={i} style={styles.histItem}>
              <View style={styles.histDot} />
              <View>
                {h.new_status
                  ? <Text style={styles.histStatus}>{STATUS_LABELS[h.old_status] || h.old_status || 'Created'} → {STATUS_LABELS[h.new_status] || h.new_status}</Text>
                  : <Text style={styles.histStatus}>Note by {h.changed_by}</Text>
                }
                {h.note && <Text style={styles.histNote}>{h.note}</Text>}
                <Text style={styles.histDate}>{new Date(h.created_at).toLocaleString('en-IN')}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: COLORS.background },
  center:             { flex: 1, justifyContent: 'center', alignItems: 'center' },
  body:               { padding: 16, gap: 12, paddingBottom: 40 },
  header:             { backgroundColor: '#FFF', borderRadius: 14, padding: 16 },
  headerRow:          { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  ticketNum:          { fontSize: 13, color: COLORS.textLight, fontWeight: '600' },
  badge:              { borderRadius: 8, paddingVertical: 4, paddingHorizontal: 10 },
  badgeText:          { color: '#FFF', fontSize: 11, fontWeight: 'bold' },
  title:              { fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginBottom: 4 },
  meta:               { fontSize: 13, color: COLORS.textLight },
  card:               { backgroundColor: '#FFF', borderRadius: 14, padding: 16 },
  cardTitle:          { fontSize: 15, fontWeight: 'bold', color: COLORS.text, marginBottom: 12 },
  timeline:           { flexDirection: 'row', alignItems: 'flex-start' },
  timelineItem:       { alignItems: 'center', flex: 1 },
  timelineDot:        { width: 14, height: 14, borderRadius: 7, backgroundColor: COLORS.border, marginBottom: 4 },
  timelineDotActive:  { backgroundColor: COLORS.primary },
  timelineLine:       { position: 'absolute', left: '50%', top: 6, width: '100%', height: 2, backgroundColor: COLORS.border },
  timelineLineActive: { backgroundColor: COLORS.primary },
  timelineLabel:      { fontSize: 9, color: COLORS.textLight, textAlign: 'center' },
  timelineLabelActive:{ color: COLORS.primary, fontWeight: '600' },
  desc:               { fontSize: 14, color: COLORS.text, lineHeight: 22, marginBottom: 8 },
  row:                { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  info:               { fontSize: 13, color: COLORS.textLight },
  stars:              { flexDirection: 'row', gap: 8 },
  star:               { fontSize: 28 },
  histItem:           { flexDirection: 'row', gap: 10, marginBottom: 12, alignItems: 'flex-start' },
  histDot:            { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary, marginTop: 4 },
  histStatus:         { fontSize: 13, fontWeight: '600', color: COLORS.text },
  histNote:           { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  histDate:           { fontSize: 11, color: COLORS.textLight, marginTop: 2 },
  label:              { fontSize: 13, fontWeight: '600', color: COLORS.textLight, marginBottom: 8, marginTop: 4 },
  statusRow:          { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  statusChip:         { borderWidth: 1.5, borderRadius: 20, paddingVertical: 7, paddingHorizontal: 12 },
  statusChipText:     { fontSize: 12, fontWeight: '600' },
  assignChip:         { borderWidth: 1, borderColor: COLORS.border, backgroundColor: '#FFF', borderRadius: 20, paddingVertical: 7, paddingHorizontal: 12 },
  assignChipActive:   { backgroundColor: COLORS.secondary, borderColor: COLORS.secondary },
  assignChipText:     { fontSize: 12, fontWeight: '600', color: COLORS.text },
  assignChipTextActive:{ color: '#FFF' },
  noteInput:          { borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 10, fontSize: 13, backgroundColor: '#FAFAFA', marginBottom: 12, minHeight: 44, textAlignVertical: 'top' },
  addNoteBtn:         { backgroundColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 14, justifyContent: 'center', marginLeft: 8 },
});

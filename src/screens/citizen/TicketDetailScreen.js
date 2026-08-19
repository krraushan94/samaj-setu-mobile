import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, STATUS_COLORS, STATUS_LABELS, PRIORITY_COLORS } from '../../constants';
import { useTheme } from '../../store/themeStore';
import { ticketAPI, departmentAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import AppText from '../../components/AppText';

const ACTIONABLE_STATUSES = ['open', 'in_progress', 'resolved', 'closed'];

export default function TicketDetailScreen({ navigation, route }) {
  const t = useTheme();
  const { id } = route.params;
  const role = useAuthStore((s) => s.role);
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [resolutionNote, setResolutionNote] = useState('');
  const [noteText, setNoteText] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => {
    setLoadError(false);
    return ticketAPI.getById(id).then(({ data }) => setTicket(data.ticket)).catch(() => setLoadError(true)).finally(() => setLoading(false));
  };

  useEffect(() => { setLoading(true); load(); }, [id]);

  // Fetched once — the auto-routed department already has its own members, but an
  // admin re-routing to a different department (below) needs every department's list.
  useEffect(() => {
    departmentAPI.list().then(({ data }) => setDepartments(data.departments || [])).catch(() => {});
  }, []);

  const members = (departments.find(d => d.id === ticket?.department_id)?.members || []).filter(m => m && m.is_active);

  if (loading) return <View style={[styles.center, { backgroundColor: t.background }]}><ActivityIndicator size="large" color={t.primary} /></View>;
  if (loadError) return (
    <View style={[styles.center, { backgroundColor: t.background, gap: 10 }]}>
      <AppText style={{ color: t.danger, fontSize: 14, textAlign: 'center', paddingHorizontal: 24 }}>Couldn't load this ticket — the server may be waking up.</AppText>
      <TouchableOpacity onPress={() => { setLoading(true); load(); }}><AppText style={{ color: t.secondary, fontWeight: '700' }}>Retry</AppText></TouchableOpacity>
    </View>
  );
  if (!ticket)  return <View style={[styles.center, { backgroundColor: t.background }]}><AppText style={{ color: t.text }}>Ticket not found</AppText></View>;

  const canAct = (role === 'admin' || role === 'leader') && ticket.canManage !== false;

  const doChangeStatus = async (status) => {
    setBusy(true);
    try {
      await ticketAPI.updateStatus(ticket.id, { status, note: resolutionNote || undefined });
      setResolutionNote('');
      await load();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Could not update status');
    } finally { setBusy(false); }
  };

  const changeStatus = (status) => {
    if (status === ticket.status) return;
    // Closing is the one status that's hard to walk back from (no further actions on a
    // closed ticket) — confirm before committing to it, unlike the routine forward moves.
    if (status === 'closed') {
      Alert.alert('Close this ticket?', 'Once closed, no further status changes or notes can be added. Are you sure?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Close Ticket', style: 'destructive', onPress: () => doChangeStatus(status) },
      ]);
    } else {
      doChangeStatus(status);
    }
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

  // Category-based routing picks the right department automatically when a citizen
  // reports an issue (see createTicket on the backend) — this is admin's override for
  // when that auto-routing was wrong. Team leaders can't move a ticket to another
  // department (server-enforced too), only reassign within their own team above.
  const reassignDepartment = async (departmentId) => {
    if (departmentId === ticket.department_id) return;
    setBusy(true);
    try {
      await ticketAPI.assign(ticket.id, { departmentId });
      await load();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Could not reassign department');
    } finally { setBusy(false); }
  };

  const statusSteps = ['payment_pending','open','in_progress','resolved','closed'];
  const currentStep = statusSteps.indexOf(ticket.status);

  return (
    <ScrollView style={[styles.container, { backgroundColor: t.background }]} contentContainerStyle={styles.body}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: t.card }]}>
        <View style={styles.headerRow}>
          <AppText style={[styles.ticketNum, { color: t.textLight }]}>#{ticket.ticket_number}</AppText>
          <View style={[styles.badge, { backgroundColor: PRIORITY_COLORS[ticket.priority] }]}>
            <AppText style={styles.badgeText}>{ticket.priority?.toUpperCase()}</AppText>
          </View>
        </View>
        <AppText style={[styles.title, { color: t.text }]}>{ticket.title}</AppText>
        <AppText style={[styles.meta, { color: t.textLight }]}>{ticket.category} • {ticket.sub_category}</AppText>
      </View>

      {/* Status Timeline */}
      <View style={[styles.card, { backgroundColor: t.card }]}>
        <AppText style={[styles.cardTitle, { color: t.text }]}>Status Progress</AppText>
        <View style={styles.timeline}>
          {statusSteps.map((s, i) => (
            <View key={s} style={styles.timelineItem}>
              <View style={[styles.timelineDot, { backgroundColor: t.border }, i <= currentStep && { backgroundColor: t.primary }]} />
              {i < statusSteps.length - 1 && <View style={[styles.timelineLine, { backgroundColor: t.border }, i < currentStep && { backgroundColor: t.primary }]} />}
              <AppText style={[styles.timelineLabel, { color: t.textLight }, i === currentStep && { color: t.primary, fontWeight: '600' }]}>{STATUS_LABELS[s]}</AppText>
            </View>
          ))}
        </View>
      </View>

      {/* Details */}
      <View style={[styles.card, { backgroundColor: t.card }]}>
        <AppText style={[styles.cardTitle, { color: t.text }]}>Issue Details</AppText>
        {ticket.description && <AppText style={[styles.desc, { color: t.text }]}>{ticket.description}</AppText>}
        {ticket.location_text && (
          <View style={styles.row}><MaterialIcons name="location-on" size={16} color={t.textLight} /><AppText style={[styles.info, { color: t.textLight }]}> {ticket.location_text}</AppText></View>
        )}
        <View style={styles.row}><MaterialIcons name="business" size={16} color={t.textLight} /><AppText style={[styles.info, { color: t.textLight }]}> {ticket.department_name}</AppText></View>
        <View style={styles.row}><MaterialIcons name="event" size={16} color={t.textLight} /><AppText style={[styles.info, { color: t.textLight }]}> {new Date(ticket.created_at).toLocaleString('en-IN')}</AppText></View>
        {ticket.caregiver_name && (
          <View style={styles.row}>
            <MaterialIcons name="volunteer-activism" size={16} color={t.textLight} />
            <AppText style={[styles.info, { color: t.textLight }]}> Caregiver: {ticket.caregiver_name}{ticket.caregiver_mobile ? ` (${ticket.caregiver_mobile})` : ''}</AppText>
          </View>
        )}
      </View>

      {/* Resolution proof */}
      {ticket.resolution_note && (
        <View style={[styles.card, { backgroundColor: '#E8F5E9' }]}>
          <AppText style={styles.cardTitle}>✅ Resolution Update</AppText>
          <AppText style={styles.desc}>{ticket.resolution_note}</AppText>
        </View>
      )}

      {/* Rating */}
      {ticket.status === 'resolved' && !ticket.citizen_rating && (
        <View style={[styles.card, { backgroundColor: t.card }]}>
          <AppText style={[styles.cardTitle, { color: t.text }]}>Rate this Resolution</AppText>
          <View style={styles.stars}>
            {[1,2,3,4,5].map(s => (
              <TouchableOpacity key={s} onPress={() => ticketAPI.rate(ticket.id, { rating: s }).then(() => Alert.alert('Thanks!', 'Your feedback was submitted')).catch(() => {})} accessibilityLabel={`Rate ${s} stars`} accessibilityRole="button">
                <Text style={styles.star}>⭐</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Team / Admin actions — hidden entirely for citizens and for other departments' tickets */}
      {canAct && (
        <View style={[styles.card, { backgroundColor: t.card }]}>
          <AppText style={[styles.cardTitle, { color: t.text }]}>Manage Ticket</AppText>

          <AppText style={[styles.label, { color: t.textLight }]}>Change Status</AppText>
          <View style={styles.statusRow}>
            {ACTIONABLE_STATUSES.map(s => (
              <TouchableOpacity
                key={s}
                style={[styles.statusChip, { borderColor: STATUS_COLORS[s] }, ticket.status === s && { backgroundColor: STATUS_COLORS[s] }]}
                disabled={busy}
                onPress={() => changeStatus(s)}
                accessibilityLabel={`Set status to ${STATUS_LABELS[s]}`}
                accessibilityRole="button"
              >
                <AppText style={[styles.statusChipText, { color: ticket.status === s ? '#FFF' : STATUS_COLORS[s] }]}>{STATUS_LABELS[s]}</AppText>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={[styles.noteInput, { borderColor: t.border, backgroundColor: t.inputBg, color: t.text }]}
            placeholder="Resolution note (used when you move to Resolved/Closed)"
            placeholderTextColor={t.textLight}
            value={resolutionNote}
            onChangeText={setResolutionNote}
            multiline
          />

          {role === 'admin' && departments.length > 0 && (
            <>
              <AppText style={[styles.label, { color: t.textLight }]}>Department (auto-routed by category — change if misrouted)</AppText>
              <View style={styles.statusRow}>
                {departments.map(d => (
                  <TouchableOpacity
                    key={d.id}
                    style={[styles.assignChip, { borderColor: t.border, backgroundColor: t.card }, ticket.department_id === d.id && { backgroundColor: t.secondary, borderColor: t.secondary }]}
                    disabled={busy}
                    onPress={() => reassignDepartment(d.id)}
                    accessibilityLabel={`Reassign to ${d.name} department`}
                    accessibilityRole="button"
                  >
                    <AppText style={[styles.assignChipText, { color: t.text }, ticket.department_id === d.id && styles.assignChipTextActive]}>{d.name}</AppText>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {members.length > 0 && (
            <>
              <AppText style={[styles.label, { color: t.textLight }]}>Assign To</AppText>
              <View style={styles.statusRow}>
                {members.map(m => (
                  <TouchableOpacity
                    key={m.id}
                    style={[styles.assignChip, { borderColor: t.border, backgroundColor: t.card }, ticket.assigned_to === m.id && { backgroundColor: t.secondary, borderColor: t.secondary }]}
                    disabled={busy}
                    onPress={() => assignTo(m.id)}
                    accessibilityLabel={`Assign to ${m.full_name}`}
                    accessibilityRole="button"
                  >
                    <AppText style={[styles.assignChipText, { color: t.text }, ticket.assigned_to === m.id && styles.assignChipTextActive]}>{m.full_name}</AppText>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          <AppText style={[styles.label, { color: t.textLight }]}>Add Internal Note</AppText>
          <View style={styles.row}>
            <TextInput style={[styles.noteInput, { flex: 1, marginBottom: 0, borderColor: t.border, backgroundColor: t.inputBg, color: t.text }]} placeholder="Note visible to the team" placeholderTextColor={t.textLight} value={noteText} onChangeText={setNoteText} multiline />
            <TouchableOpacity style={[styles.addNoteBtn, { backgroundColor: t.primary }]} disabled={busy || !noteText.trim()} onPress={submitNote} accessibilityLabel="Submit note" accessibilityRole="button">
              <MaterialIcons name="send" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* History */}
      {ticket.history?.length > 0 && (
        <View style={[styles.card, { backgroundColor: t.card }]}>
          <AppText style={[styles.cardTitle, { color: t.text }]}>Activity Log</AppText>
          {ticket.history.filter(Boolean).map((h, i) => (
            <View key={i} style={styles.histItem}>
              <View style={[styles.histDot, { backgroundColor: t.primary }]} />
              <View>
                {h.new_status
                  ? <AppText style={[styles.histStatus, { color: t.text }]}>{STATUS_LABELS[h.old_status] || h.old_status || 'Created'} → {STATUS_LABELS[h.new_status] || h.new_status}</AppText>
                  : <AppText style={[styles.histStatus, { color: t.text }]}>Note by {h.changed_by}</AppText>
                }
                {h.note && <AppText style={[styles.histNote, { color: t.textLight }]}>{h.note}</AppText>}
                <AppText style={[styles.histDate, { color: t.textLight }]}>{new Date(h.created_at).toLocaleString('en-IN')}</AppText>
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
  timelineItem:       { alignItems: 'center', flex: 1, paddingHorizontal: 2 },
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

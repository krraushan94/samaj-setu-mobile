import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { COLORS } from '../../constants';
import { useTheme } from '../../store/themeStore';
import AppText from '../../components/AppText';
import { departmentAPI, teamworkAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { TaskBoard, ChatPanel } from '../../components/TeamworkViews';

const STATUS_COLORS = { pending: '#F9A825', in_progress: '#1565C0', completed: '#2E7D32' };

// Admin — full access to every department's tasks and chat, plus a
// cross-department summary (counts by status, overdue) no team role can see.
export default function AdminTeamworkScreen() {
  const t = useTheme();
  const user = useAuthStore((s) => s.user);
  const [view, setView] = useState('summary'); // summary | tasks | chat
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState(null);
  const [summary, setSummary] = useState({ byStatus: [], overdueCount: 0 });

  useEffect(() => {
    departmentAPI.list().then(({ data }) => setDepartments(data.departments || [])).catch(() => {});
    loadSummary();
  }, []);

  const loadSummary = async () => {
    try { const { data } = await teamworkAPI.taskSummary(); setSummary(data); } catch {}
  };

  const selectedMembers = (departments.find(d => d.id === selectedDept)?.members || []).filter(m => m.is_active);

  return (
    <View style={[styles.container, { backgroundColor: t.background }]}>
      <View style={[styles.tabRow, { backgroundColor: t.card }]}>
        {['summary', 'tasks', 'chat'].map(v => (
          <TouchableOpacity key={v} style={[styles.tab, view === v && { borderBottomColor: t.primary }]} onPress={() => { setView(v); if (v === 'summary') loadSummary(); }}>
            <AppText style={[styles.tabText, { color: t.textLight }, view === v && { color: t.primary }]}>{v === 'summary' ? 'Overview' : v === 'tasks' ? 'Tasks' : 'Chat'}</AppText>
          </TouchableOpacity>
        ))}
      </View>

      {view === 'summary' ? (
        <ScrollView contentContainerStyle={styles.summaryBody}>
          <View style={[styles.overdueCard, { borderColor: t.danger }]}>
            <AppText style={[styles.overdueCount, { color: t.danger }]}>{summary.overdueCount}</AppText>
            <AppText style={[styles.overdueLabel, { color: t.danger }]}>Overdue Task{summary.overdueCount === 1 ? '' : 's'}</AppText>
          </View>
          <AppText style={[styles.sectionTitle, { color: t.text }]}>By Department</AppText>
          {Object.entries(
            summary.byStatus.reduce((acc, row) => {
              (acc[row.department_name] = acc[row.department_name] || []).push(row);
              return acc;
            }, {})
          ).map(([deptName, rows]) => (
            <View key={deptName} style={[styles.deptCard, { backgroundColor: t.card }]}>
              <AppText style={[styles.deptName, { color: t.text }]}>{deptName}</AppText>
              <View style={styles.statusRow}>
                {rows.map(r => (
                  <View key={r.status} style={[styles.statusChip, { backgroundColor: STATUS_COLORS[r.status] + '22' }]}>
                    <AppText style={[styles.statusChipText, { color: STATUS_COLORS[r.status] }]}>{r.status}: {r.count}</AppText>
                  </View>
                ))}
              </View>
            </View>
          ))}
          {!summary.byStatus.length && <AppText style={[styles.empty, { color: t.textLight }]}>No tasks created yet across any team</AppText>}
        </ScrollView>
      ) : (
        <>
          <ScrollView horizontal style={[styles.deptPicker, { backgroundColor: t.background }]} contentContainerStyle={{ gap: 8, paddingHorizontal: 12 }}>
            {departments.map(d => (
              <TouchableOpacity key={d.id} style={[styles.deptChip, { borderColor: t.border, backgroundColor: t.card }, selectedDept === d.id && { backgroundColor: t.primary, borderColor: t.primary }]} onPress={() => setSelectedDept(d.id)}>
                <AppText style={[styles.deptChipText, { color: t.text }, selectedDept === d.id && styles.deptChipTextActive]}>{d.name}</AppText>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {!selectedDept ? (
            <AppText style={[styles.empty, { color: t.textLight }]}>Pick a department above</AppText>
          ) : view === 'tasks' ? (
            <TaskBoard departmentId={selectedDept} members={selectedMembers} currentUserId={user?.id} canCreate />
          ) : (
            <ChatPanel departmentId={selectedDept} currentUserId={user?.id} />
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: COLORS.background },
  tabRow:         { flexDirection: 'row', backgroundColor: '#FFF', elevation: 2 },
  tab:            { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive:      { borderBottomColor: COLORS.primary },
  tabText:        { fontSize: 14, fontWeight: '600', color: COLORS.textLight },
  tabTextActive:  { color: COLORS.primary },
  summaryBody:    { padding: 16, gap: 12, paddingBottom: 32 },
  overdueCard:    { backgroundColor: '#FFF3F3', borderRadius: 14, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: COLORS.danger },
  overdueCount:   { fontSize: 32, fontWeight: 'bold', color: COLORS.danger },
  overdueLabel:   { fontSize: 13, color: COLORS.danger, marginTop: 4 },
  sectionTitle:   { fontSize: 15, fontWeight: '700', color: COLORS.text, marginTop: 8 },
  deptCard:       { backgroundColor: '#FFF', borderRadius: 12, padding: 14, gap: 8, elevation: 1 },
  deptName:       { fontSize: 14, fontWeight: '700', color: COLORS.text },
  statusRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusChip:     { borderRadius: 8, paddingVertical: 4, paddingHorizontal: 10 },
  statusChipText: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  empty:          { textAlign: 'center', marginTop: 40, fontSize: 14, color: COLORS.textLight },
  deptPicker:     { backgroundColor: COLORS.background, paddingVertical: 10, flexGrow: 0 },
  deptChip:       { borderWidth: 1, borderColor: COLORS.border, borderRadius: 20, paddingVertical: 8, paddingHorizontal: 14, backgroundColor: '#FFF' },
  deptChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  deptChipText:   { fontSize: 13, color: COLORS.text },
  deptChipTextActive: { color: '#FFF', fontWeight: '700' },
});

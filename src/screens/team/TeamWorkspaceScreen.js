import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../../constants';
import { departmentAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { TaskBoard, ChatPanel } from '../../components/TeamworkViews';

// Team leader/member workspace — Tasks + Chat, always scoped to their own
// department (never sent by the client — the backend infers it from the token).
export default function TeamWorkspaceScreen() {
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.role);
  const [tab, setTab] = useState('tasks');
  const [members, setMembers] = useState([]);

  useEffect(() => {
    departmentAPI.list().then(({ data }) => {
      const dept = (data.departments || []).find(d => d.id === user?.department_id);
      setMembers(dept?.members?.filter(m => m.is_active) || []);
    }).catch(() => {});
  }, [user?.department_id]);

  return (
    <View style={styles.container}>
      <View style={styles.tabRow}>
        <TouchableOpacity style={[styles.tab, tab === 'tasks' && styles.tabActive]} onPress={() => setTab('tasks')}>
          <Text style={[styles.tabText, tab === 'tasks' && styles.tabTextActive]}>Tasks</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'chat' && styles.tabActive]} onPress={() => setTab('chat')}>
          <Text style={[styles.tabText, tab === 'chat' && styles.tabTextActive]}>Team Chat</Text>
        </TouchableOpacity>
      </View>

      {tab === 'tasks' ? (
        <TaskBoard departmentId={user?.department_id} members={members} currentUserId={user?.id} canCreate={role === 'leader'} />
      ) : (
        <ChatPanel departmentId={user?.department_id} currentUserId={user?.id} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: COLORS.background },
  tabRow:        { flexDirection: 'row', backgroundColor: '#FFF', elevation: 2 },
  tab:           { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive:     { borderBottomColor: COLORS.primary },
  tabText:       { fontSize: 14, fontWeight: '600', color: COLORS.textLight },
  tabTextActive: { color: COLORS.primary },
});

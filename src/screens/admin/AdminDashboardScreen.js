import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, FlatList } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, STATUS_COLORS, STATUS_LABELS, PRIORITY_COLORS } from '../../constants';
import { adminAPI, ticketAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export default function AdminDashboardScreen({ navigation }) {
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const isPrimaryAdmin = user?.username === 'Admin_Raushan';
  const [stats, setStats] = useState(null);
  const [deptStats, setDeptStats] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const [s, d] = await Promise.all([adminAPI.getStats(), adminAPI.getDeptStats()]);
      setStats(s.data.stats);
      setDeptStats(d.data.stats);
    } catch {}
  };

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };
  useEffect(() => { load(); adminAPI.recordImpression({ screen: 'AdminDashboard', action: 'view' }); }, []);

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <LinearGradient colors={['#1A237E', '#283593']} style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.adminLabel}>🛡️ {user?.username || 'Admin'}</Text>
            <Text style={styles.headerTitle}>Master Dashboard</Text>
            <Text style={styles.headerSub}>RAM Mandir New Town Hatiara Office</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 16 }}>
            <TouchableOpacity onPress={() => navigation.navigate('AccessibilitySettings')} accessibilityLabel="Settings">
              <MaterialIcons name="settings" size={24} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { logout(); navigation.replace('Welcome'); }} accessibilityLabel="Log out">
              <MaterialIcons name="logout" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.body}>
        {/* Stat tiles */}
        {stats && (
          <View style={styles.statsGrid}>
            <StatTile label="Total Tickets" value={stats.totalTickets}         color="#1565C0" icon="confirmation-number" />
            <StatTile label="🔴 Critical"   value={stats.criticalActive}        color={COLORS.critical} icon="warning" />
            <StatTile label="⏳ Pmt Pending"value={stats.tickets?.payment_pending || 0} color={COLORS.textLight} icon="payment" />
            <StatTile label="✅ Resolved"   value={stats.tickets?.resolved || 0} color={COLORS.success} icon="check-circle" />
            <StatTile label="Total Users"   value={stats.totalUsers}             color="#6A1B9A" icon="people" />
            {isPrimaryAdmin && stats.cashCollected !== undefined && (
              <StatTile label="₹ Collected" value={`₹${stats.cashCollected}`}   color={COLORS.success} icon="attach-money" />
            )}
            <StatTile label="🚩 Needs Review" value={stats.needsReview || 0}     color={COLORS.warning} icon="flag" />
            <StatTile label="⚠️ Reported Posts" value={stats.reportedPosts || 0} color={COLORS.danger} icon="report" />
          </View>
        )}

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsRow}>
          {[
            { icon: 'list-alt',      label: 'All Tickets',     screen: 'AdminTickets' },
            { icon: 'people',        label: 'Teams',           screen: 'AdminTeams' },
            { icon: 'flag',          label: 'Reported Posts',  screen: 'AdminReportedPosts' },
            { icon: 'storage',       label: 'Database',        screen: 'AdminDB' },
            ...(isPrimaryAdmin ? [{ icon: 'admin-panel-settings', label: 'Manage Admins', screen: 'AdminManageAdmins' }] : []),
          ].map(a => (
            <TouchableOpacity key={a.screen} style={styles.actionCard} onPress={() => navigation.navigate(a.screen)}>
              <MaterialIcons name={a.icon} size={28} color="#1A237E" />
              <Text style={styles.actionLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Dept breakdown */}
        <Text style={styles.sectionTitle}>Department Overview</Text>
        {['Social Welfare','Politics','Marketing','Others'].map(dept => {
          const dRows = deptStats.filter(r => r.name === dept);
          const total = dRows.reduce((s, r) => s + Number(r.count), 0);
          const critical = dRows.filter(r => r.priority === 'critical').reduce((s, r) => s + Number(r.count), 0);
          return (
            <View key={dept} style={styles.deptCard}>
              <Text style={styles.deptName}>{dept}</Text>
              <View style={styles.deptRow}>
                <Text style={styles.deptStat}>Total: <Text style={styles.deptVal}>{total}</Text></Text>
                {critical > 0 && <Text style={[styles.deptStat, { color: COLORS.critical }]}>🔴 Critical: {critical}</Text>}
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const StatTile = ({ label, value, color, icon }) => (
  <View style={[styles.statTile, { borderLeftColor: color }]}>
    <MaterialIcons name={icon} size={22} color={color} />
    <Text style={[styles.statValue, { color }]}>{value ?? '–'}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: COLORS.background },
  header:      { paddingTop: 50, paddingBottom: 24, paddingHorizontal: 20 },
  headerRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  adminLabel:  { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 4 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFF' },
  headerSub:   { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  body:        { padding: 16 },
  statsGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  statTile:    { width: '47%', backgroundColor: '#FFF', borderRadius: 12, padding: 14, borderLeftWidth: 4, elevation: 1, gap: 4 },
  statValue:   { fontSize: 24, fontWeight: 'bold' },
  statLabel:   { fontSize: 12, color: COLORS.textLight },
  sectionTitle:{ fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginBottom: 12 },
  actionsRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  actionCard:  { width: '22%', backgroundColor: '#FFF', borderRadius: 12, padding: 12, alignItems: 'center', gap: 4, elevation: 1 },
  actionLabel: { fontSize: 10, color: COLORS.text, textAlign: 'center', fontWeight: '600' },
  deptCard:    { backgroundColor: '#FFF', borderRadius: 12, padding: 14, marginBottom: 8, elevation: 1 },
  deptName:    { fontSize: 15, fontWeight: 'bold', color: '#1A237E', marginBottom: 6 },
  deptRow:     { flexDirection: 'row', gap: 20 },
  deptStat:    { fontSize: 13, color: COLORS.textLight },
  deptVal:     { fontWeight: 'bold', color: COLORS.text },
});

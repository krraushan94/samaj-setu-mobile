import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, FlatList, ActivityIndicator, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, STATUS_COLORS, STATUS_LABELS, PRIORITY_COLORS } from '../../constants';
import { useTheme } from '../../store/themeStore';
import AppText from '../../components/AppText';
import { adminAPI, ticketAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export default function AdminDashboardScreen({ navigation }) {
  const th = useTheme();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  // Fixed to the single named primary-admin account for now, by deliberate choice — not a
  // generalized "is this a primary-tier admin" check.
  const isPrimaryAdmin = user?.username === 'Admin_Raushan';
  const [stats, setStats] = useState(null);
  const [deptStats, setDeptStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    setLoadError(false);
    try {
      const [s, d] = await Promise.all([adminAPI.getStats(), adminAPI.getDeptStats()]);
      setStats(s.data.stats);
      setDeptStats(d.data.stats);
    } catch {
      setLoadError(true);
    }
  };

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };
  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
    adminAPI.recordImpression({ screen: 'AdminDashboard', action: 'view' });
  }, []);

  const confirmLogout = () => {
    Alert.alert('Log out?', 'You will need to log in again to access the admin dashboard.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => { logout(); navigation.replace('Welcome'); } },
    ]);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: th.background }]} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <LinearGradient colors={['#1A237E', '#283593']} style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.adminLabel}>🛡️ {user?.username || 'Admin'}</Text>
            <Text style={styles.headerTitle}>Master Dashboard</Text>
            <Text style={styles.headerSub}>RAM Mandir New Town Hatiara Office</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 16 }}>
            <TouchableOpacity onPress={() => navigation.navigate('Notifications')} accessibilityLabel="Notifications" accessibilityRole="button">
              <MaterialIcons name="notifications" size={24} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('AccessibilitySettings')} accessibilityLabel="Settings" accessibilityRole="button">
              <MaterialIcons name="settings" size={24} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={confirmLogout} accessibilityLabel="Log out" accessibilityRole="button">
              <MaterialIcons name="logout" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {loading ? (
        <ActivityIndicator color={th.primary} style={styles.loadingSpinner} />
      ) : loadError ? (
        <View style={styles.errorBox}>
          <AppText style={[styles.errorText, { color: th.danger }]}>Couldn't load dashboard data — the server may be waking up.</AppText>
          <TouchableOpacity onPress={load}><AppText style={[styles.retryText, { color: th.secondary }]}>Retry</AppText></TouchableOpacity>
        </View>
      ) : (
      <View style={styles.body}>
        {/* Stat tiles */}
        {stats && (
          <View style={styles.statsGrid}>
            <StatTile label="Total Tickets" value={stats.totalTickets}         color="#1565C0" icon="confirmation-number" theme={th} />
            <StatTile label="🔴 Critical"   value={stats.criticalActive}        color={COLORS.critical} icon="warning" theme={th} />
            <StatTile label="⏳ Pmt Pending"value={stats.tickets?.payment_pending || 0} color={COLORS.textLight} icon="payment" theme={th} />
            <StatTile label="✅ Resolved"   value={stats.tickets?.resolved || 0} color={COLORS.success} icon="check-circle" theme={th} />
            <StatTile label="Total Users"   value={stats.totalUsers}             color="#6A1B9A" icon="people" theme={th} />
            {isPrimaryAdmin && stats.cashCollected !== undefined && (
              <StatTile label="₹ Collected" value={`₹${stats.cashCollected}`}   color={COLORS.success} icon="attach-money" theme={th} />
            )}
            <StatTile label="🚩 Needs Review" value={stats.needsReview || 0}     color={COLORS.warning} icon="flag" theme={th} />
            <StatTile label="⚠️ Reported Posts" value={stats.reportedPosts || 0} color={COLORS.danger} icon="report" theme={th} />
          </View>
        )}

        {/* Quick Actions */}
        <AppText style={[styles.sectionTitle, { color: th.text }]}>Quick Actions</AppText>
        <View style={styles.actionsRow}>
          {[
            { icon: 'list-alt',      label: 'All Tickets',     screen: 'AdminTickets' },
            { icon: 'people',        label: 'Teams',           screen: 'AdminTeams' },
            { icon: 'flag',          label: 'Reported Posts',  screen: 'AdminReportedPosts' },
            { icon: 'event-available', label: 'Office Visits', screen: 'AdminVisits' },
            { icon: 'people',        label: 'Manage Users',    screen: 'AdminUsers' },
            { icon: 'assignment',   label: 'Team Tasks & Chat', screen: 'AdminTeamwork' },
            { icon: 'storage',       label: 'Database',        screen: 'AdminDB' },
            ...(isPrimaryAdmin ? [{ icon: 'admin-panel-settings', label: 'Manage Admins', screen: 'AdminManageAdmins' }] : []),
          ].map(a => (
            <TouchableOpacity key={a.screen} style={[styles.actionCard, { backgroundColor: th.card }]} onPress={() => navigation.navigate(a.screen)} accessibilityLabel={a.label} accessibilityRole="button">
              <MaterialIcons name={a.icon} size={28} color="#1A237E" />
              <AppText style={[styles.actionLabel, { color: th.text }]}>{a.label}</AppText>
            </TouchableOpacity>
          ))}
        </View>

        {/* Dept breakdown */}
        <AppText style={[styles.sectionTitle, { color: th.text }]}>Department Overview</AppText>
        {['Social Welfare','Politics','Marketing','Others','BMS'].map(dept => {
          const dRows = deptStats.filter(r => r.name === dept);
          const total = dRows.reduce((s, r) => s + Number(r.count), 0);
          const critical = dRows.filter(r => r.priority === 'critical').reduce((s, r) => s + Number(r.count), 0);
          return (
            <View key={dept} style={[styles.deptCard, { backgroundColor: th.card }]}>
              <AppText style={styles.deptName}>{dept}</AppText>
              <View style={styles.deptRow}>
                <AppText style={[styles.deptStat, { color: th.textLight }]}>Total: <AppText style={[styles.deptVal, { color: th.text }]}>{total}</AppText></AppText>
                {critical > 0 && <AppText style={[styles.deptStat, { color: COLORS.critical }]}>🔴 Critical: {critical}</AppText>}
              </View>
            </View>
          );
        })}
      </View>
      )}
    </ScrollView>
  );
}

const StatTile = ({ label, value, color, icon, theme }) => (
  <View style={[styles.statTile, { borderLeftColor: color, backgroundColor: theme.card }]}>
    <MaterialIcons name={icon} size={22} color={color} />
    <AppText style={[styles.statValue, { color }]}>{value ?? '–'}</AppText>
    <AppText style={[styles.statLabel, { color: theme.textLight }]}>{label}</AppText>
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
  loadingSpinner: { marginTop: 60 },
  errorBox:    { alignItems: 'center', padding: 24, gap: 8 },
  errorText:   { fontSize: 14, textAlign: 'center' },
  retryText:   { fontSize: 14, fontWeight: '700' },
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

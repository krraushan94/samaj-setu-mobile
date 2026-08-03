import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, ISSUE_CATEGORIES, STATUS_COLORS, STATUS_LABELS } from '../../constants';
import { useAuthStore } from '../../store/authStore';
import { ticketAPI, adminAPI } from '../../services/api';

export default function HomeScreen({ navigation }) {
  const user = useAuthStore((s) => s.user);
  const [myTickets, setMyTickets] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadTickets = async () => {
    try {
      const { data } = await ticketAPI.list({ limit: 3 });
      setMyTickets(data.tickets || []);
    } catch {}
  };

  const onRefresh = async () => { setRefreshing(true); await loadTickets(); setRefreshing(false); };

  useEffect(() => {
    loadTickets();
    // Record home screen impression
    adminAPI.recordImpression({ screen: 'Home', action: 'view', sessionId: user?.id });
  }, []);

  const triggerSOS = () => {
    Alert.alert('🚨 SOS Emergency', 'This will immediately alert the Social Welfare team. Confirm?',
      [{ text: 'Cancel', style: 'cancel' },
       { text: 'Send SOS', style: 'destructive', onPress: () => navigation.navigate('SOS') }]
    );
  };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      {/* Header */}
      <LinearGradient colors={[COLORS.primary, '#7B1FA2']} style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>Namaskar, {user?.full_name?.split(' ')[0] || 'Friend'} 👋</Text>
            <Text style={styles.area}>New Town Hatiara{user?.ward ? ` • Ward ${user.ward}` : ''}</Text>
          </View>
          <TouchableOpacity style={styles.sosBtn} onPress={triggerSOS}>
            <MaterialIcons name="sos" size={20} color="#FFF" />
            <Text style={styles.sosText}>SOS</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.body}>
        {/* Action Cards */}
        <View style={styles.actionsGrid}>
          <ActionCard emoji="🔴" label="Log an Issue" color="#FFF3F3" border={COLORS.danger} onPress={() => navigation.navigate('IssueCategory')} />
          <ActionCard emoji="💬" label="Feedback"      color="#F3F7FF" border={COLORS.secondary} onPress={() => navigation.navigate('IssueCategory', { type: 'feedback' })} />
          <ActionCard emoji="💡" label="Suggestion"    color="#FFFFF3" border='#F9A825' onPress={() => navigation.navigate('IssueCategory', { type: 'development' })} />
          <ActionCard emoji="📢" label="Others"        color="#F3FFF3" border={COLORS.success} onPress={() => navigation.navigate('IssueCategory', { type: 'others' })} />
        </View>

        {/* My Recent Tickets */}
        <Text style={styles.sectionTitle}>My Recent Tickets</Text>
        {myTickets.length === 0
          ? <Text style={styles.emptyText}>No tickets yet. Log your first issue above!</Text>
          : myTickets.map(t => (
              <TouchableOpacity key={t.id} style={styles.ticketCard} onPress={() => navigation.navigate('TicketDetail', { id: t.id })}>
                <View style={styles.ticketRow}>
                  <Text style={styles.ticketNum}>#{t.ticket_number}</Text>
                  <View style={[styles.badge, { backgroundColor: STATUS_COLORS[t.status] + '22' }]}>
                    <Text style={[styles.badgeText, { color: STATUS_COLORS[t.status] }]}>{STATUS_LABELS[t.status]}</Text>
                  </View>
                </View>
                <Text style={styles.ticketTitle} numberOfLines={1}>{t.title}</Text>
                <Text style={styles.ticketDate}>{new Date(t.created_at).toLocaleDateString('en-IN')}</Text>
              </TouchableOpacity>
            ))
        }
        <TouchableOpacity style={styles.viewAll} onPress={() => navigation.navigate('MyTickets')}>
          <Text style={styles.viewAllText}>View All My Tickets →</Text>
        </TouchableOpacity>

        {/* Quick Links */}
        <Text style={styles.sectionTitle}>Community</Text>
        <View style={styles.quickLinks}>
          {[
            { icon: 'people', label: 'Community Board', screen: 'CommunityBoard' },
            { icon: 'event', label: 'Events',           screen: 'Events' },
            { icon: 'person-search', label: 'Missing',  screen: 'Missing' },
            { icon: 'phone', label: 'Helplines',        screen: 'Helplines' },
          ].map(q => (
            <TouchableOpacity key={q.screen} style={styles.quickCard} onPress={() => navigation.navigate(q.screen)}>
              <MaterialIcons name={q.icon} size={28} color={COLORS.primary} />
              <Text style={styles.quickLabel}>{q.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const ActionCard = ({ emoji, label, color, border, onPress }) => (
  <TouchableOpacity style={[styles.actionCard, { backgroundColor: color, borderColor: border }]} onPress={onPress} activeOpacity={0.8}>
    <Text style={styles.actionEmoji}>{emoji}</Text>
    <Text style={styles.actionLabel}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: COLORS.background },
  header:       { paddingTop: 50, paddingBottom: 24, paddingHorizontal: 20 },
  headerRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting:     { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  area:         { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  sosBtn:       { backgroundColor: COLORS.sos, borderRadius: 20, paddingVertical: 8, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 4, elevation: 4 },
  sosText:      { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
  body:         { padding: 16 },
  actionsGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  actionCard:   { width: '47%', borderRadius: 14, padding: 18, alignItems: 'center', borderWidth: 1.5, elevation: 1 },
  actionEmoji:  { fontSize: 32, marginBottom: 8 },
  actionLabel:  { fontSize: 14, fontWeight: '600', color: COLORS.text, textAlign: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginBottom: 12, marginTop: 4 },
  emptyText:    { color: COLORS.textLight, fontSize: 14, textAlign: 'center', padding: 20 },
  ticketCard:   { backgroundColor: '#FFF', borderRadius: 12, padding: 14, marginBottom: 10, elevation: 1 },
  ticketRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  ticketNum:    { fontSize: 12, color: COLORS.textLight, fontWeight: '600' },
  badge:        { borderRadius: 10, paddingVertical: 3, paddingHorizontal: 8 },
  badgeText:    { fontSize: 11, fontWeight: '600' },
  ticketTitle:  { fontSize: 15, fontWeight: '600', color: COLORS.text },
  ticketDate:   { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  viewAll:      { alignItems: 'center', padding: 12 },
  viewAllText:  { color: COLORS.secondary, fontSize: 14 },
  quickLinks:   { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  quickCard:    { width: '47%', backgroundColor: '#FFF', borderRadius: 12, padding: 16, alignItems: 'center', elevation: 1 },
  quickLabel:   { fontSize: 13, fontWeight: '600', color: COLORS.text, marginTop: 6, textAlign: 'center' },
});

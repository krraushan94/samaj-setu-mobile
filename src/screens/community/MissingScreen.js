import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, RefreshControl, TextInput, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../store/themeStore';
import { communityAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export default function MissingScreen({ navigation }) {
  const t = useTheme();
  const user = useAuthStore(s => s.user);
  const [persons, setPersons] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', age: '', gender: '', lastSeen: '', description: '', contact: '' });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const load = async () => {
    try { const { data } = await communityAPI.getMissing(); setPersons(data.persons || []); } catch {}
  };
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };
  useEffect(() => { load(); }, []);

  const submit = async () => {
    if (!form.name || !form.contact) return Alert.alert('Error', 'Name and contact number are required');
    if (!user) return navigation.navigate('Login');
    try {
      await communityAPI.reportMissing(form);
      Alert.alert('Reported', 'Missing person alert has been sent to the area. Thank you.');
      setShowForm(false);
      setForm({ name: '', age: '', gender: '', lastSeen: '', description: '', contact: '' });
      load();
    } catch { Alert.alert('Error', 'Could not submit report'); }
  };

  return (
    <View style={[styles.container, { backgroundColor: t.background }]}>
      <View style={[styles.banner, { backgroundColor: '#BF360C' }]}>
        <MaterialIcons name="person-search" size={24} color="#FFF" />
        <View style={styles.bannerText}>
          <Text style={styles.bannerTitle}>Missing Persons</Text>
          <Text style={styles.bannerSub}>Alert the community — every second counts</Text>
        </View>
        <TouchableOpacity style={styles.reportBtn} onPress={() => setShowForm(!showForm)}>
          <Text style={styles.reportBtnText}>{showForm ? 'Cancel' : '+ Report'}</Text>
        </TouchableOpacity>
      </View>

      {showForm && (
        <View style={[styles.form, { backgroundColor: t.card }]}>
          <TextInput style={[styles.input, { backgroundColor: t.inputBg, borderColor: t.border, color: t.text }]} placeholder="Name of missing person *" placeholderTextColor={t.textLight} value={form.name} onChangeText={v => set('name', v)} />
          <TextInput style={[styles.input, { backgroundColor: t.inputBg, borderColor: t.border, color: t.text }]} placeholder="Age" keyboardType="number-pad" placeholderTextColor={t.textLight} value={form.age} onChangeText={v => set('age', v)} />
          <TextInput style={[styles.input, { backgroundColor: t.inputBg, borderColor: t.border, color: t.text }]} placeholder="Last seen location" placeholderTextColor={t.textLight} value={form.lastSeen} onChangeText={v => set('lastSeen', v)} />
          <TextInput style={[styles.input, { backgroundColor: t.inputBg, borderColor: t.border, color: t.text }]} placeholder="Contact number *" keyboardType="phone-pad" placeholderTextColor={t.textLight} value={form.contact} onChangeText={v => set('contact', v)} />
          <TextInput style={[styles.input, styles.textarea, { backgroundColor: t.inputBg, borderColor: t.border, color: t.text }]} placeholder="Description (what were they wearing, any details)" placeholderTextColor={t.textLight} value={form.description} onChangeText={v => set('description', v)} multiline numberOfLines={3} />
          <TouchableOpacity style={[styles.submitBtn, { backgroundColor: '#BF360C' }]} onPress={submit}>
            <Text style={styles.submitBtnText}>🚨 Send Alert to Community</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        data={persons}
        keyExtractor={p => p.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={[styles.empty, { color: t.textLight }]}>No active missing person reports</Text>}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: t.card }]}>
            <MaterialIcons name="person" size={40} color={t.textLight} />
            <View style={styles.personInfo}>
              <Text style={[styles.personName, { color: t.text }]}>{item.name}{item.age ? `, ${item.age} yrs` : ''}</Text>
              {item.last_seen && <Text style={[styles.detail, { color: t.textLight }]}>📍 Last seen: {item.last_seen}</Text>}
              {item.description && <Text style={[styles.detail, { color: t.textLight }]}>{item.description}</Text>}
              <Text style={[styles.contact, { color: '#BF360C' }]}>📞 Contact: {item.contact}</Text>
              <Text style={[styles.reportedAt, { color: t.textLight }]}>Reported: {new Date(item.created_at).toLocaleDateString('en-IN')}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1 },
  banner:        { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
  bannerText:    { flex: 1 },
  bannerTitle:   { color: '#FFF', fontSize: 16, fontWeight: '700' },
  bannerSub:     { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  reportBtn:     { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12 },
  reportBtnText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
  form:          { margin: 12, borderRadius: 14, padding: 14, gap: 8 },
  input:         { borderWidth: 1, borderRadius: 10, padding: 10, fontSize: 14 },
  textarea:      { height: 80, textAlignVertical: 'top' },
  submitBtn:     { borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 4 },
  submitBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  list:          { padding: 12, gap: 10, paddingBottom: 32 },
  empty:         { textAlign: 'center', marginTop: 40, fontSize: 14 },
  card:          { flexDirection: 'row', borderRadius: 14, padding: 14, gap: 12, elevation: 2, alignItems: 'flex-start' },
  personInfo:    { flex: 1, gap: 4 },
  personName:    { fontSize: 16, fontWeight: '700' },
  detail:        { fontSize: 13 },
  contact:       { fontSize: 13, fontWeight: '600' },
  reportedAt:    { fontSize: 11, marginTop: 4 },
});

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, ISSUE_CATEGORIES, SUB_CATEGORIES, PRIORITY_COLORS } from '../../constants';
import { ticketAPI, paymentAPI } from '../../services/api';

const STEPS = ['Category', 'Sub-Category', 'Details', 'Payment'];

export default function IssueCategoryScreen({ navigation, route }) {
  const [step, setStep] = useState(0);
  const [category, setCategory] = useState(route.params?.type || '');
  const [subCategory, setSubCategory] = useState('');
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', locationText: '', isAnonymous: false });
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(false);
  const [paymentRef, setPaymentRef] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const pickMedia = async (type) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Permission needed', 'Allow media access');
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: type === 'photo' ? ImagePicker.MediaTypeOptions.Images : ImagePicker.MediaTypeOptions.Videos,
      allowsMultipleSelection: type === 'photo', quality: 0.7,
    });
    if (!result.canceled) setMedia(m => [...m, ...result.assets.map(a => ({ ...a, mediaType: type }))]);
  };

  const autoLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Permission needed');
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    set('locationText', `${loc.coords.latitude.toFixed(5)}, ${loc.coords.longitude.toFixed(5)}`);
  };

  const submitTicket = async () => {
    if (!form.title.trim()) return Alert.alert('Error', 'Title is required');
    setLoading(true);
    try {
      const { data: ticket } = await ticketAPI.create({ category, subCategory, ...form });
      const { data: payment } = await paymentAPI.initiate(ticket.ticketId);
      setPaymentRef(payment.referenceNumber);
      setStep(3);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Submission failed');
    } finally { setLoading(false); }
  };

  return (
    <View style={styles.container}>
      {/* Step indicator */}
      <View style={styles.steps}>
        {STEPS.map((s, i) => (
          <View key={s} style={styles.stepItem}>
            <View style={[styles.stepCircle, i <= step && styles.stepCircleActive]}>
              <Text style={[styles.stepNum, i <= step && styles.stepNumActive]}>{i + 1}</Text>
            </View>
            <Text style={[styles.stepLabel, i === step && styles.stepLabelActive]}>{s}</Text>
          </View>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">

        {/* STEP 0: Category */}
        {step === 0 && (
          <>
            <Text style={styles.sectionTitle}>Select Category</Text>
            <View style={styles.grid}>
              {ISSUE_CATEGORIES.map(cat => (
                <TouchableOpacity key={cat.key} style={[styles.catCard, { borderColor: cat.color, backgroundColor: cat.color + '15' }]}
                  onPress={() => { setCategory(cat.key); setSubCategory(''); setStep(1); }}>
                  <MaterialIcons name={cat.icon} size={28} color={cat.color} />
                  <Text style={[styles.catLabel, { color: cat.color }]}>{cat.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* STEP 1: Sub-category */}
        {step === 1 && (
          <>
            <Text style={styles.sectionTitle}>Select Issue Type</Text>
            {(SUB_CATEGORIES[category] || []).map(sub => (
              <TouchableOpacity key={sub} style={[styles.subCard, subCategory === sub && styles.subCardActive]}
                onPress={() => { setSubCategory(sub); set('title', sub); setStep(2); }}>
                <Text style={[styles.subText, subCategory === sub && styles.subTextActive]}>{sub}</Text>
                <MaterialIcons name="chevron-right" size={20} color={subCategory === sub ? '#FFF' : COLORS.textLight} />
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.backBtn} onPress={() => setStep(0)}>
              <Text style={styles.backText}>← Change Category</Text>
            </TouchableOpacity>
          </>
        )}

        {/* STEP 2: Details */}
        {step === 2 && (
          <>
            <Text style={styles.sectionTitle}>Issue Details</Text>
            <Text style={styles.label}>Title</Text>
            <TextInput style={styles.input} value={form.title} onChangeText={v => set('title', v)} placeholder="Describe the issue briefly" />

            <Text style={styles.label}>Description</Text>
            <TextInput style={[styles.input, styles.textarea]} value={form.description} onChangeText={v => set('description', v)}
              placeholder="Provide more details... (or use voice 🎤)" multiline numberOfLines={4} />

            <Text style={styles.label}>Location</Text>
            <View style={styles.row}>
              <TextInput style={[styles.input, { flex: 1 }]} value={form.locationText} onChangeText={v => set('locationText', v)} placeholder="Type address or use GPS" />
              <TouchableOpacity style={styles.gpsBtn} onPress={autoLocation}>
                <MaterialIcons name="gps-fixed" size={22} color={COLORS.primary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Priority</Text>
            <View style={styles.row}>
              {['low','medium','high','critical'].map(p => (
                <TouchableOpacity key={p} style={[styles.priorityChip, { borderColor: PRIORITY_COLORS[p] }, form.priority === p && { backgroundColor: PRIORITY_COLORS[p] }]}
                  onPress={() => set('priority', p)}>
                  <Text style={[styles.priorityText, form.priority === p && { color: '#FFF' }]}>{p.charAt(0).toUpperCase()+p.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {category === 'women_safety' && <Text style={styles.autoAlert}>⚠️ Auto-escalated to CRITICAL for women safety</Text>}

            <Text style={styles.label}>Attachments</Text>
            <View style={styles.row}>
              <MediaBtn icon="photo-camera" label="Photo" onPress={() => pickMedia('photo')} />
              <MediaBtn icon="videocam"    label="Video" onPress={() => pickMedia('video')} />
              <MediaBtn icon="mic"         label="Audio" onPress={() => Alert.alert('Coming soon')} />
            </View>
            {media.length > 0 && <Text style={styles.mediaCount}>✅ {media.length} file(s) attached</Text>}

            <TouchableOpacity style={styles.anonRow} onPress={() => set('isAnonymous', !form.isAnonymous)}>
              <MaterialIcons name={form.isAnonymous ? 'check-box' : 'check-box-outline-blank'} size={22} color={COLORS.primary} />
              <Text style={styles.anonText}>Submit anonymously (your name won't be shown publicly)</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.nextBtn} onPress={submitTicket} disabled={loading}>
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.nextBtnText}>Proceed to Payment →</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.backBtn} onPress={() => setStep(1)}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
          </>
        )}

        {/* STEP 3: Payment Confirmation */}
        {step === 3 && (
          <View style={styles.confirmCard}>
            <Text style={styles.confirmEmoji}>✅</Text>
            <Text style={styles.confirmTitle}>Issue Submitted!</Text>
            <Text style={styles.confirmSub}>Your issue has been logged successfully.</Text>

            <View style={styles.refBox}>
              <Text style={styles.refLabel}>Payment Reference</Text>
              <Text style={styles.refNum}>{paymentRef}</Text>
              <Text style={styles.refInstr}>Visit the Office and pay ₹50 cash quoting this reference number to activate your ticket.</Text>
            </View>

            <View style={styles.feeInfo}>
              <MaterialIcons name="info" size={18} color={COLORS.secondary} />
              <Text style={styles.feeText}> ₹50 nominal fee prevents spam and ensures genuine submissions only.</Text>
            </View>

            <View style={styles.onlineNote}>
              <Text style={styles.onlineNoteText}>💳 Online payment coming soon</Text>
            </View>

            <TouchableOpacity style={styles.nextBtn} onPress={() => navigation.replace('CitizenTabs')}>
              <Text style={styles.nextBtnText}>Go to My Tickets</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const MediaBtn = ({ icon, label, onPress }) => (
  <TouchableOpacity style={styles.mediaBtn} onPress={onPress}>
    <MaterialIcons name={icon} size={22} color={COLORS.primary} />
    <Text style={styles.mediaBtnText}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: COLORS.background },
  steps:           { flexDirection: 'row', backgroundColor: '#FFF', paddingVertical: 16, paddingHorizontal: 12, justifyContent: 'space-around', elevation: 2 },
  stepItem:        { alignItems: 'center', gap: 4 },
  stepCircle:      { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.border, justifyContent: 'center', alignItems: 'center' },
  stepCircleActive:{ backgroundColor: COLORS.primary },
  stepNum:         { color: COLORS.textLight, fontWeight: 'bold', fontSize: 12 },
  stepNumActive:   { color: '#FFF' },
  stepLabel:       { fontSize: 11, color: COLORS.textLight },
  stepLabelActive: { color: COLORS.primary, fontWeight: '600' },
  body:            { padding: 16, paddingBottom: 40 },
  sectionTitle:    { fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginBottom: 16 },
  grid:            { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  catCard:         { width: '47%', borderRadius: 12, borderWidth: 1.5, padding: 14, alignItems: 'center', gap: 6 },
  catLabel:        { fontSize: 12, fontWeight: '600', textAlign: 'center' },
  subCard:         { backgroundColor: '#FFF', borderRadius: 10, padding: 14, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 1 },
  subCardActive:   { backgroundColor: COLORS.primary },
  subText:         { fontSize: 15, color: COLORS.text },
  subTextActive:   { color: '#FFF', fontWeight: '600' },
  label:           { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 6 },
  input:           { borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12, fontSize: 15, backgroundColor: '#FFF', marginBottom: 14 },
  textarea:        { height: 100, textAlignVertical: 'top' },
  row:             { flexDirection: 'row', gap: 8, marginBottom: 14, alignItems: 'center' },
  gpsBtn:          { padding: 12, backgroundColor: '#FFF', borderRadius: 10, borderWidth: 1, borderColor: COLORS.border },
  priorityChip:    { flex: 1, borderWidth: 2, borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  priorityText:    { fontSize: 13, fontWeight: '600', color: COLORS.text },
  autoAlert:       { backgroundColor: '#FFF3E0', borderRadius: 8, padding: 10, marginBottom: 14, color: COLORS.warning, fontSize: 13 },
  mediaBtn:        { flex: 1, backgroundColor: '#FFF', borderRadius: 10, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, gap: 4 },
  mediaBtnText:    { fontSize: 12, color: COLORS.text },
  mediaCount:      { color: COLORS.success, fontSize: 13, marginBottom: 14 },
  anonRow:         { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  anonText:        { fontSize: 13, color: COLORS.textLight, flex: 1 },
  nextBtn:         { backgroundColor: COLORS.primary, borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 8 },
  nextBtnText:     { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  backBtn:         { alignItems: 'center', padding: 10 },
  backText:        { color: COLORS.secondary, fontSize: 14 },
  confirmCard:     { backgroundColor: '#FFF', borderRadius: 16, padding: 24, alignItems: 'center', elevation: 2 },
  confirmEmoji:    { fontSize: 60, marginBottom: 16 },
  confirmTitle:    { fontSize: 24, fontWeight: 'bold', color: COLORS.success, marginBottom: 6 },
  confirmSub:      { fontSize: 15, color: COLORS.textLight, marginBottom: 24 },
  refBox:          { backgroundColor: '#F3F7FF', borderRadius: 12, padding: 16, width: '100%', marginBottom: 16 },
  refLabel:        { fontSize: 12, color: COLORS.textLight, marginBottom: 4 },
  refNum:          { fontSize: 22, fontWeight: 'bold', color: COLORS.secondary, letterSpacing: 2, marginBottom: 8 },
  refInstr:        { fontSize: 13, color: COLORS.text, lineHeight: 20 },
  feeInfo:         { flexDirection: 'row', alignItems: 'flex-start', padding: 12, backgroundColor: '#E3F2FD', borderRadius: 10, marginBottom: 12 },
  feeText:         { fontSize: 13, color: COLORS.secondary, flex: 1 },
  onlineNote:      { backgroundColor: '#F5F5F5', borderRadius: 8, padding: 10, marginBottom: 16 },
  onlineNoteText:  { color: COLORS.textLight, fontSize: 13, textAlign: 'center' },
});

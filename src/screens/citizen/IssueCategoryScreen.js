import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert, ActivityIndicator, Linking } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { MaterialIcons } from '@expo/vector-icons';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { COLORS, ISSUE_CATEGORIES, SUB_CATEGORIES, PRIORITY_COLORS, PAYMENT_EXEMPT_GROUPS, PAYMENT_EXEMPT_SUBCATEGORY_LABELS, MENTAL_HEALTH_SUBCATEGORY, OFFICE_ADDRESS } from '../../constants';
import { ticketAPI, paymentAPI, mediaAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useT } from '../../i18n';

const SPEECH_LANG = { en: 'en-IN', hi: 'hi-IN', bn: 'bn-IN' };

export default function IssueCategoryScreen({ navigation, route }) {
  const language = useAuthStore((s) => s.language);
  const tr = useT().issueForm;
  const trCat = useT().categories;
  const STEPS = [tr.stepCategory, tr.stepSubCategory, tr.stepDetails, tr.stepDone];
  const [step, setStep] = useState(0);
  const [category, setCategory] = useState(route.params?.type || '');
  const [subCategory, setSubCategory] = useState('');
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', locationText: '', isAnonymous: false });
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(false);
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentRequired, setPaymentRequired] = useState(true);
  const [listening, setListening] = useState(false);
  const [showMentalHealthHelp, setShowMentalHealthHelp] = useState(false);

  const isFeeExempt = PAYMENT_EXEMPT_GROUPS.includes(category) || PAYMENT_EXEMPT_SUBCATEGORY_LABELS.includes(subCategory);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Voice-to-text for the description field — requires a native rebuild (EAS Build),
  // not available in plain Expo Go.
  useSpeechRecognitionEvent('result', (event) => {
    const text = event.results?.[0]?.transcript;
    if (text) set('description', text);
  });
  useSpeechRecognitionEvent('end', () => setListening(false));
  useSpeechRecognitionEvent('error', () => setListening(false));

  const toggleVoiceInput = async () => {
    if (listening) {
      ExpoSpeechRecognitionModule.stop();
      return;
    }
    const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!granted) return Alert.alert('Permission needed', 'Microphone access is required for voice input');
    setListening(true);
    ExpoSpeechRecognitionModule.start({
      lang: SPEECH_LANG[language] || 'en-IN',
      interimResults: true,
      continuous: false,
    });
  };

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

  const trCommon = useT().common;

  const submitTicket = async () => {
    if (!form.title.trim()) return Alert.alert(trCommon.error, 'Title is required');
    setLoading(true);
    try {
      const { data: ticket } = await ticketAPI.create({ category, subCategory, ...form });

      // Upload any attached media files (non-blocking — failure doesn't abort submission)
      if (media.length > 0) {
        const formData = new FormData();
        formData.append('ticketId', ticket.ticketId);
        formData.append('type', media[0].mediaType === 'video' ? 'video' : 'photo');
        media.forEach((asset, i) => {
          const ext = asset.uri.split('.').pop()?.toLowerCase() || (asset.mediaType === 'video' ? 'mp4' : 'jpg');
          formData.append('files', {
            uri:  asset.uri,
            type: asset.mediaType === 'video' ? 'video/mp4' : 'image/jpeg',
            name: `attachment-${i}.${ext}`,
          });
        });
        mediaAPI.upload(formData).catch(() => {}); // silent — ticket already created
      }

      // Server is the source of truth on whether this category is fee-exempt
      setPaymentRequired(ticket.paymentRequired !== false);
      if (ticket.paymentRequired !== false) {
        const { data: payment } = await paymentAPI.initiate(ticket.ticketId);
        setPaymentRef(payment.referenceNumber);
      }
      setStep(3);
    } catch (e) {
      Alert.alert(trCommon.error, e.response?.data?.message || 'Submission failed');
    } finally { setLoading(false); }
  };

  if (showMentalHealthHelp) {
    return (
      <View style={styles.container}>
        <View style={styles.mhCard}>
          <Text style={styles.mhEmoji}>💚</Text>
          <Text style={styles.mhTitle}>You're not alone</Text>
          <Text style={styles.mhBody}>
            If you or someone you know is going through a mental health crisis, free and confidential
            support is available right now — please reach out.
          </Text>
          <TouchableOpacity style={styles.mhCallBtn} onPress={() => Linking.openURL('tel:14416')}>
            <MaterialIcons name="call" size={20} color="#FFF" />
            <Text style={styles.mhCallBtnText}>Call Tele-MANAS Helpline (14416)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.mhContinueBtn} onPress={() => { setShowMentalHealthHelp(false); setStep(2); }}>
            <Text style={styles.mhContinueBtnText}>Also report this privately to Social Welfare →</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backBtn} onPress={() => setShowMentalHealthHelp(false)}>
            <Text style={styles.backText}>{tr.back}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

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
            <Text style={styles.sectionTitle}>{tr.selectCategory}</Text>
            <View style={styles.grid}>
              {ISSUE_CATEGORIES.map(cat => (
                <TouchableOpacity key={cat.key} style={[styles.catCard, { borderColor: cat.color, backgroundColor: cat.color + '15' }]}
                  onPress={() => { setCategory(cat.key); setSubCategory(''); setStep(1); }}>
                  <MaterialIcons name={cat.icon} size={28} color={cat.color} />
                  <Text style={[styles.catLabel, { color: cat.color }]}>{trCat.groups?.[cat.key] || cat.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* STEP 1: Sub-category */}
        {step === 1 && (
          <>
            <Text style={styles.sectionTitle}>{tr.selectIssueType}</Text>
            {(SUB_CATEGORIES[category] || []).map((sub, i) => (
              <TouchableOpacity key={sub} style={[styles.subCard, subCategory === sub && styles.subCardActive]}
                onPress={() => {
                  setSubCategory(sub); set('title', sub);
                  if (sub === MENTAL_HEALTH_SUBCATEGORY) setShowMentalHealthHelp(true);
                  else setStep(2);
                }}>
                <Text style={[styles.subText, subCategory === sub && styles.subTextActive]}>{trCat.subs?.[category]?.[i] || sub}</Text>
                <MaterialIcons name="chevron-right" size={20} color={subCategory === sub ? '#FFF' : COLORS.textLight} />
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.backBtn} onPress={() => setStep(0)}>
              <Text style={styles.backText}>{tr.changeCategory}</Text>
            </TouchableOpacity>
          </>
        )}

        {/* STEP 2: Details */}
        {step === 2 && (
          <>
            <Text style={styles.sectionTitle}>{tr.issueDetails}</Text>
            <Text style={styles.label}>{tr.titleLabel}</Text>
            <TextInput style={styles.input} value={form.title} onChangeText={v => set('title', v)} placeholder={tr.titlePlaceholder} />

            <View style={styles.labelRow}>
              <Text style={styles.label}>{tr.descriptionLabel}</Text>
              <TouchableOpacity style={[styles.micBtn, listening && styles.micBtnActive]} onPress={toggleVoiceInput}>
                <MaterialIcons name={listening ? 'mic' : 'mic-none'} size={18} color={listening ? '#FFF' : COLORS.primary} />
                <Text style={[styles.micBtnText, listening && { color: '#FFF' }]}>{listening ? tr.listening : tr.voice}</Text>
              </TouchableOpacity>
            </View>
            <TextInput style={[styles.input, styles.textarea]} value={form.description} onChangeText={v => set('description', v)}
              placeholder={tr.descriptionPlaceholder} multiline numberOfLines={4} />

            <Text style={styles.label}>{tr.locationLabel}</Text>
            <View style={styles.row}>
              <TextInput style={[styles.input, { flex: 1 }]} value={form.locationText} onChangeText={v => set('locationText', v)} placeholder={tr.locationPlaceholder} />
              <TouchableOpacity style={styles.gpsBtn} onPress={autoLocation} accessibilityLabel="Use current GPS location">
                <MaterialIcons name="gps-fixed" size={22} color={COLORS.primary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>{tr.priorityLabel}</Text>
            <View style={styles.row}>
              {['low','medium','high','critical'].map(p => (
                <TouchableOpacity key={p} style={[styles.priorityChip, { borderColor: PRIORITY_COLORS[p] }, form.priority === p && { backgroundColor: PRIORITY_COLORS[p] }]}
                  onPress={() => set('priority', p)}>
                  <Text style={[styles.priorityText, form.priority === p && { color: '#FFF' }]}>{tr[`priority${p.charAt(0).toUpperCase()+p.slice(1)}`]}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {category === 'women_safety' && <Text style={styles.autoAlert}>{tr.autoEscalate}</Text>}
            {isFeeExempt && <Text style={styles.noFeeAlert}>{tr.noFeeNote}</Text>}

            <Text style={styles.label}>{tr.attachments}</Text>
            <View style={styles.row}>
              <MediaBtn icon="photo-camera" label={tr.photo} onPress={() => pickMedia('photo')} />
              <MediaBtn icon="videocam"    label={tr.video} onPress={() => pickMedia('video')} />
              <MediaBtn icon="mic"         label={tr.audio} onPress={() => Alert.alert('Coming soon')} />
            </View>
            {media.length > 0 && <Text style={styles.mediaCount}>✅ {media.length} {tr.filesAttached}</Text>}

            <TouchableOpacity style={styles.anonRow} onPress={() => set('isAnonymous', !form.isAnonymous)}>
              <MaterialIcons name={form.isAnonymous ? 'check-box' : 'check-box-outline-blank'} size={22} color={COLORS.primary} />
              <Text style={styles.anonText}>{tr.anonymousLabel}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.nextBtn} onPress={submitTicket} disabled={loading}>
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.nextBtnText}>{isFeeExempt ? tr.submitIssue : tr.proceedToPayment}</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.backBtn} onPress={() => setStep(1)}>
              <Text style={styles.backText}>{tr.back}</Text>
            </TouchableOpacity>
          </>
        )}

        {/* STEP 3: Confirmation */}
        {step === 3 && (
          <View style={styles.confirmCard}>
            <Text style={styles.confirmEmoji}>✅</Text>
            <Text style={styles.confirmTitle}>{tr.issueSubmitted}</Text>
            <Text style={styles.confirmSub}>
              {paymentRequired ? tr.submittedSuccess : tr.submittedNoFee}
            </Text>

            {paymentRequired ? (
              <>
                <View style={styles.refBox}>
                  <Text style={styles.refLabel}>{tr.paymentReference}</Text>
                  <Text style={styles.refNum}>{paymentRef}</Text>
                  <Text style={styles.refInstr}>{tr.visitOffice}</Text>
                  <Text style={styles.refAddr}>📍 {OFFICE_ADDRESS}</Text>
                </View>

                <View style={styles.feeInfo}>
                  <MaterialIcons name="info" size={18} color={COLORS.secondary} />
                  <Text style={styles.feeText}> {tr.feeNote}</Text>
                </View>

                <View style={styles.onlineNote}>
                  <Text style={styles.onlineNoteText}>{tr.onlineComingSoon}</Text>
                </View>
              </>
            ) : (
              <View style={[styles.refBox, { backgroundColor: '#E8F5E9' }]}>
                <Text style={[styles.refLabel, { color: COLORS.success }]}>{tr.statusLabel}</Text>
                <Text style={[styles.refNum, { color: COLORS.success }]}>{tr.statusOpenValue}</Text>
                <Text style={styles.refInstr}>{tr.freeCategoryNote}</Text>
              </View>
            )}

            <TouchableOpacity style={styles.nextBtn} onPress={() => navigation.replace('CitizenTabs')}>
              <Text style={styles.nextBtnText}>{tr.goToMyTickets}</Text>
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
  labelRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  micBtn:          { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: COLORS.primary, borderRadius: 16, paddingVertical: 4, paddingHorizontal: 10, marginBottom: 6 },
  micBtnActive:    { backgroundColor: COLORS.primary },
  micBtnText:      { fontSize: 12, fontWeight: '600', color: COLORS.primary },
  input:           { borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12, fontSize: 15, backgroundColor: '#FFF', marginBottom: 14 },
  textarea:        { height: 100, textAlignVertical: 'top' },
  row:             { flexDirection: 'row', gap: 8, marginBottom: 14, alignItems: 'center' },
  gpsBtn:          { padding: 12, backgroundColor: '#FFF', borderRadius: 10, borderWidth: 1, borderColor: COLORS.border },
  priorityChip:    { flex: 1, borderWidth: 2, borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  priorityText:    { fontSize: 13, fontWeight: '600', color: COLORS.text },
  autoAlert:       { backgroundColor: '#FFF3E0', borderRadius: 8, padding: 10, marginBottom: 14, color: COLORS.warning, fontSize: 13 },
  noFeeAlert:      { backgroundColor: '#E8F5E9', borderRadius: 8, padding: 10, marginBottom: 14, color: COLORS.success, fontSize: 13 },
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
  refAddr:         { fontSize: 12, color: COLORS.textLight, lineHeight: 18, marginTop: 8 },
  feeInfo:         { flexDirection: 'row', alignItems: 'flex-start', padding: 12, backgroundColor: '#E3F2FD', borderRadius: 10, marginBottom: 12 },
  feeText:         { fontSize: 13, color: COLORS.secondary, flex: 1 },
  onlineNote:      { backgroundColor: '#F5F5F5', borderRadius: 8, padding: 10, marginBottom: 16 },
  onlineNoteText:  { color: COLORS.textLight, fontSize: 13, textAlign: 'center' },
  mhCard:          { flex: 1, justifyContent: 'center', padding: 24, alignItems: 'center' },
  mhEmoji:         { fontSize: 56, marginBottom: 12 },
  mhTitle:         { fontSize: 22, fontWeight: 'bold', color: COLORS.text, marginBottom: 10 },
  mhBody:          { fontSize: 14, color: COLORS.textLight, textAlign: 'center', lineHeight: 21, marginBottom: 28 },
  mhCallBtn:       { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#00695C', borderRadius: 12, paddingVertical: 15, paddingHorizontal: 24, marginBottom: 14 },
  mhCallBtnText:   { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
  mhContinueBtn:   { padding: 12, marginBottom: 4 },
  mhContinueBtnText:{ color: COLORS.secondary, fontSize: 14, fontWeight: '600' },
});

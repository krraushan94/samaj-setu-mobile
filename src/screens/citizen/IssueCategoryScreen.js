import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert, ActivityIndicator, Linking } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useAudioRecorder, useAudioRecorderState, RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync } from 'expo-audio';
import { MaterialIcons } from '@expo/vector-icons';
import AppText from '../../components/AppText';
import { useTheme } from '../../store/themeStore';
import { COLORS, ISSUE_CATEGORIES, SUB_CATEGORIES, PRIORITY_COLORS, PAYMENT_EXEMPT_GROUPS, PAYMENT_EXEMPT_SUBCATEGORY_LABELS, MENTAL_HEALTH_SUBCATEGORY, OFFICE_ADDRESS, OFFICE_EMAIL, MAX_MEDIA_ATTACHMENTS } from '../../constants';
import { ticketAPI, paymentAPI, mediaAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useT } from '../../i18n';

export default function IssueCategoryScreen({ navigation, route }) {
  const th = useTheme();
  const tr = useT().issueForm;
  const user = useAuthStore((s) => s.user);
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
  const [showMentalHealthHelp, setShowMentalHealthHelp] = useState(false);
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);

  // BMS/labour entry gate — shown once, right when the citizen taps the Labour category card,
  // before they even pick a worker type. Pre-filled from the account where possible, since
  // most citizens are reporting their own situation — but every field stays editable, since a
  // BMS volunteer/caregiver may be filing on behalf of a different worker entirely.
  const [showBmsIntake, setShowBmsIntake] = useState(false);
  const [bmsDetails, setBmsDetails] = useState({
    fullName: '', aadharNumber: '', voterIdNumber: '', organisationName: '',
    idCardNumber: '', sector: '', monthlyWage: '', employmentDuration: '',
    employerContact: '', isBmsMember: false, bmsMembershipNumber: '',
  });
  const setBms = (k, v) => setBmsDetails(d => ({ ...d, [k]: v }));

  const isFeeExempt = PAYMENT_EXEMPT_GROUPS.includes(category) || PAYMENT_EXEMPT_SUBCATEGORY_LABELS.includes(subCategory);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const addPickedAssets = (result, type) => {
    if (result.canceled) return;
    const room = MAX_MEDIA_ATTACHMENTS - media.length;
    if (room <= 0) return Alert.alert(trCommon.error, tr.maxAttachmentsReached || `You can attach up to ${MAX_MEDIA_ATTACHMENTS} files per report.`);
    const picked = result.assets.slice(0, room);
    if (result.assets.length > room) Alert.alert(trCommon.error, tr.maxAttachmentsReached || `You can attach up to ${MAX_MEDIA_ATTACHMENTS} files per report.`);
    setMedia(m => [...m, ...picked.map(a => ({ ...a, mediaType: type }))]);
  };

  const pickFromGallery = async (type) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return Alert.alert(trCommon.error, tr.mediaPermissionNeeded || 'Allow media access');
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: type === 'photo' ? ImagePicker.MediaTypeOptions.Images : ImagePicker.MediaTypeOptions.Videos,
      allowsMultipleSelection: true, selectionLimit: Math.max(1, MAX_MEDIA_ATTACHMENTS - media.length), quality: 0.7,
    });
    addPickedAssets(result, type);
  };

  const captureFromCamera = async (type) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return Alert.alert(trCommon.error, tr.cameraPermissionNeeded || 'Allow camera access');
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: type === 'photo' ? ImagePicker.MediaTypeOptions.Images : ImagePicker.MediaTypeOptions.Videos,
      quality: 0.7,
    });
    addPickedAssets(result, type);
  };

  const pickMedia = (type) => {
    Alert.alert(
      type === 'photo' ? tr.photo : tr.video,
      tr.chooseSource || 'Choose a source',
      [
        { text: tr.takePhotoLive || 'Use Camera', onPress: () => captureFromCamera(type) },
        { text: tr.chooseFromGallery || 'Choose from Gallery', onPress: () => pickFromGallery(type) },
        { text: trCommon.cancel || 'Cancel', style: 'cancel' },
      ],
    );
  };

  const startRecording = async () => {
    if (media.length >= MAX_MEDIA_ATTACHMENTS) {
      return Alert.alert(trCommon.error, tr.maxAttachmentsReached || `You can attach up to ${MAX_MEDIA_ATTACHMENTS} files per report.`);
    }
    const { granted } = await requestRecordingPermissionsAsync();
    if (!granted) return Alert.alert(trCommon.error, tr.microphonePermissionNeeded || 'Allow microphone access to record audio');
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await audioRecorder.prepareToRecordAsync();
    audioRecorder.record();
  };

  const stopRecording = async () => {
    await audioRecorder.stop();
    if (audioRecorder.uri) setMedia(m => [...m, { uri: audioRecorder.uri, mediaType: 'audio' }]);
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
    if (!form.locationText.trim()) return Alert.alert(trCommon.error, tr.locationRequired || 'Location is required — type an address or tap GPS');
    if (!user) {
      return Alert.alert(
        tr.loginRequiredTitle || 'Login required',
        tr.loginRequiredBody || 'You can browse Samaj Setu as a guest, but you need to log in with a verified account to submit an issue report.',
        [
          { text: trCommon.cancel || 'Cancel', style: 'cancel' },
          { text: tr.goToLogin || 'Log In / Sign Up', onPress: () => navigation.navigate('Login') },
        ],
      );
    }
    setLoading(true);
    try {
      const { data: ticket } = await ticketAPI.create({
        category, subCategory, ...form,
        ...(category === 'labour' ? { labourDetails: bmsDetails } : {}),
      });

      // Upload any attached media files (non-blocking — failure doesn't abort submission).
      // Grouped by mediaType since the backend stores one `type` per upload request —
      // a mix of e.g. photos and an audio note needs one request per type.
      if (media.length > 0) {
        const MIME_BY_TYPE = { photo: 'image/jpeg', video: 'video/mp4', audio: 'audio/m4a' };
        const groups = media.reduce((acc, asset) => {
          const t = asset.mediaType || 'photo';
          (acc[t] = acc[t] || []).push(asset);
          return acc;
        }, {});
        Object.entries(groups).forEach(([type, assets]) => {
          const formData = new FormData();
          formData.append('ticketId', ticket.ticketId);
          formData.append('type', type);
          assets.forEach((asset, i) => {
            const ext = asset.uri.split('.').pop()?.toLowerCase() || (type === 'video' ? 'mp4' : type === 'audio' ? 'm4a' : 'jpg');
            formData.append('files', {
              uri:  asset.uri,
              type: MIME_BY_TYPE[type] || 'application/octet-stream',
              name: `attachment-${i}.${ext}`,
            });
          });
          mediaAPI.upload(formData).catch(() => {}); // silent — ticket already created
        });
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

  if (showBmsIntake) {
    // If the account already has Aadhaar or Voter ID on file from registration, reuse it
    // silently rather than asking a second time — only accounts missing both (e.g. very old
    // ones from before it was mandatory) need to provide one here.
    const hasIdOnFile = !!(user?.aadhar_number || user?.voter_id_number);
    const canContinue = bmsDetails.fullName.trim() && bmsDetails.organisationName.trim()
      && (hasIdOnFile || bmsDetails.aadharNumber.trim() || bmsDetails.voterIdNumber.trim());
    return (
      <View style={[styles.container, { backgroundColor: th.background }]}>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <AppText style={[styles.sectionTitle, { color: th.text }]}>{tr.bmsTitle}</AppText>
          <AppText style={[styles.bmsIntro, { color: th.textLight }]}>{tr.bmsIntro}</AppText>

          <AppText style={[styles.label, { color: th.text }]}>{tr.bmsFullName}</AppText>
          <TextInput style={[styles.input, { borderColor: th.border, backgroundColor: th.inputBg, color: th.text }]} placeholderTextColor={th.textLight} value={bmsDetails.fullName} onChangeText={(v) => setBms('fullName', v)} placeholder={tr.bmsFullNamePlaceholder} />

          {hasIdOnFile ? (
            <View style={styles.bmsIdOnFileRow}>
              <MaterialIcons name="verified" size={18} color={COLORS.success} />
              <AppText style={styles.bmsIdOnFileText}>{tr.bmsIdOnFile}</AppText>
            </View>
          ) : (
            <>
              <AppText style={[styles.label, { color: th.text }]}>{tr.bmsIdProofNote}</AppText>
              <TextInput style={[styles.input, { borderColor: th.border, backgroundColor: th.inputBg, color: th.text }]} placeholderTextColor={th.textLight} value={bmsDetails.aadharNumber} onChangeText={(v) => setBms('aadharNumber', v.replace(/[^0-9]/g, ''))} placeholder={tr.bmsAadhar} keyboardType="number-pad" maxLength={12} />
              <TextInput style={[styles.input, { borderColor: th.border, backgroundColor: th.inputBg, color: th.text }]} placeholderTextColor={th.textLight} value={bmsDetails.voterIdNumber} onChangeText={(v) => setBms('voterIdNumber', v.toUpperCase())} placeholder={tr.bmsVoterId} autoCapitalize="characters" maxLength={10} />
            </>
          )}

          <AppText style={[styles.label, { color: th.text }]}>{tr.bmsOrgName}</AppText>
          <TextInput style={[styles.input, { borderColor: th.border, backgroundColor: th.inputBg, color: th.text }]} placeholderTextColor={th.textLight} value={bmsDetails.organisationName} onChangeText={(v) => setBms('organisationName', v)} placeholder={tr.bmsOrgNamePlaceholder} />

          <AppText style={[styles.label, { color: th.text }]}>{tr.bmsIdCard}</AppText>
          <TextInput style={[styles.input, { borderColor: th.border, backgroundColor: th.inputBg, color: th.text }]} placeholderTextColor={th.textLight} value={bmsDetails.idCardNumber} onChangeText={(v) => setBms('idCardNumber', v)} placeholder={tr.bmsIdCardPlaceholder} />

          <AppText style={[styles.label, { color: th.text }]}>{tr.bmsSector}</AppText>
          <View style={styles.priorityRow}>
            {['private', 'government_psu', 'unorganized', 'self_employed'].map((s) => (
              <TouchableOpacity key={s} style={[styles.priorityChip, { borderColor: th.border }, bmsDetails.sector === s && { backgroundColor: th.primary, borderColor: th.primary }]}
                onPress={() => setBms('sector', bmsDetails.sector === s ? '' : s)}>
                <AppText style={[styles.priorityText, { color: th.text }, bmsDetails.sector === s && { color: '#FFF' }]}>{tr.bmsSectorOptions?.[s]}</AppText>
              </TouchableOpacity>
            ))}
          </View>

          <AppText style={[styles.label, { color: th.text }]}>{tr.bmsDuration}</AppText>
          <View style={styles.priorityRow}>
            {['lt_6m', '6m_2y', '2y_5y', 'gt_5y'].map((d) => (
              <TouchableOpacity key={d} style={[styles.priorityChip, { borderColor: th.border }, bmsDetails.employmentDuration === d && { backgroundColor: th.primary, borderColor: th.primary }]}
                onPress={() => setBms('employmentDuration', bmsDetails.employmentDuration === d ? '' : d)}>
                <AppText style={[styles.priorityText, { color: th.text }, bmsDetails.employmentDuration === d && { color: '#FFF' }]}>{tr.bmsDurationOptions?.[d]}</AppText>
              </TouchableOpacity>
            ))}
          </View>

          <AppText style={[styles.label, { color: th.text }]}>{tr.bmsWage}</AppText>
          <TextInput style={[styles.input, { borderColor: th.border, backgroundColor: th.inputBg, color: th.text }]} placeholderTextColor={th.textLight} value={bmsDetails.monthlyWage} onChangeText={(v) => setBms('monthlyWage', v.replace(/[^0-9]/g, ''))} placeholder={tr.bmsWagePlaceholder} keyboardType="number-pad" />

          <AppText style={[styles.label, { color: th.text }]}>{tr.bmsEmployerContact}</AppText>
          <TextInput style={[styles.input, { borderColor: th.border, backgroundColor: th.inputBg, color: th.text }]} placeholderTextColor={th.textLight} value={bmsDetails.employerContact} onChangeText={(v) => setBms('employerContact', v.replace(/[^0-9]/g, ''))} placeholder={tr.bmsEmployerContactPlaceholder} keyboardType="number-pad" maxLength={10} />

          <TouchableOpacity style={styles.anonRow} onPress={() => setBms('isBmsMember', !bmsDetails.isBmsMember)}>
            <MaterialIcons name={bmsDetails.isBmsMember ? 'check-box' : 'check-box-outline-blank'} size={22} color={th.primary} />
            <AppText style={[styles.anonText, { color: th.textLight }]}>{tr.bmsIsMember}</AppText>
          </TouchableOpacity>
          {bmsDetails.isBmsMember && (
            <TextInput style={[styles.input, { borderColor: th.border, backgroundColor: th.inputBg, color: th.text }]} placeholderTextColor={th.textLight} value={bmsDetails.bmsMembershipNumber} onChangeText={(v) => setBms('bmsMembershipNumber', v)} placeholder={tr.bmsMembershipNumberPlaceholder} />
          )}

          {!canContinue && <AppText style={styles.bmsRequiredNote}>{tr.bmsRequiredNote}</AppText>}

          <TouchableOpacity style={[styles.nextBtn, { backgroundColor: th.primary }, !canContinue && { opacity: 0.5 }]} disabled={!canContinue}
            onPress={() => { setShowBmsIntake(false); setStep(1); }}>
            <AppText style={styles.nextBtnText}>{tr.bmsContinue}</AppText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backBtn} onPress={() => { setShowBmsIntake(false); setCategory(''); }}>
            <AppText style={[styles.backText, { color: th.secondary }]}>{tr.changeCategory}</AppText>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  if (showMentalHealthHelp) {
    return (
      <View style={[styles.container, { backgroundColor: th.background }]}>
        <View style={styles.mhCard}>
          <Text style={styles.mhEmoji}>💚</Text>
          <AppText style={[styles.mhTitle, { color: th.text }]}>You're not alone</AppText>
          <AppText style={[styles.mhBody, { color: th.textLight }]}>
            If you or someone you know is going through a mental health crisis, free and confidential
            support is available right now — please reach out.
          </AppText>
          <TouchableOpacity style={styles.mhCallBtn} onPress={() => Linking.openURL('tel:14416')}>
            <MaterialIcons name="call" size={20} color="#FFF" />
            <AppText style={styles.mhCallBtnText}>Call Tele-MANAS Helpline (14416)</AppText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.mhContinueBtn} onPress={() => { setShowMentalHealthHelp(false); setStep(2); }}>
            <AppText style={[styles.mhContinueBtnText, { color: th.secondary }]}>Also report this privately to Social Welfare →</AppText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backBtn} onPress={() => setShowMentalHealthHelp(false)}>
            <AppText style={[styles.backText, { color: th.secondary }]}>{tr.back}</AppText>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: th.background }]}>
      {/* Step indicator */}
      <View style={[styles.steps, { backgroundColor: th.card }]}>
        {STEPS.map((s, i) => (
          <View key={s} style={styles.stepItem}>
            <View style={[styles.stepCircle, { backgroundColor: th.border }, i <= step && { backgroundColor: th.primary }]}>
              <AppText style={[styles.stepNum, { color: th.textLight }, i <= step && styles.stepNumActive]}>{i + 1}</AppText>
            </View>
            <AppText style={[styles.stepLabel, { color: th.textLight }, i === step && { color: th.primary, fontWeight: '600' }]}>{s}</AppText>
          </View>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">

        {/* STEP 0: Category */}
        {step === 0 && (
          <>
            <AppText style={[styles.sectionTitle, { color: th.text }]}>{tr.selectCategory}</AppText>
            <View style={styles.grid}>
              {ISSUE_CATEGORIES.map(cat => (
                <TouchableOpacity key={cat.key} style={[styles.catCard, { borderColor: cat.color, backgroundColor: cat.color + '15' }]}
                  onPress={() => {
                    setCategory(cat.key); setSubCategory('');
                    if (cat.key === 'labour') {
                      setBmsDetails(d => ({ ...d, fullName: d.fullName || user?.full_name || '', aadharNumber: d.aadharNumber || user?.aadhar_number || '', voterIdNumber: d.voterIdNumber || user?.voter_id_number || '' }));
                      setShowBmsIntake(true);
                    } else {
                      setStep(1);
                    }
                  }}>
                  <MaterialIcons name={cat.icon} size={28} color={cat.color} />
                  <AppText style={[styles.catLabel, { color: cat.color }]}>{trCat.groups?.[cat.key] || cat.label}</AppText>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* STEP 1: Sub-category */}
        {step === 1 && (
          <>
            <AppText style={[styles.sectionTitle, { color: th.text }]}>{tr.selectIssueType}</AppText>
            {Array.isArray(SUB_CATEGORIES[category]) ? (
              (SUB_CATEGORIES[category] || []).map((sub, i) => (
                <TouchableOpacity key={sub} style={[styles.subCard, { backgroundColor: th.card }, subCategory === sub && { backgroundColor: th.primary }]}
                  onPress={() => {
                    setSubCategory(sub); set('title', sub);
                    if (sub === MENTAL_HEALTH_SUBCATEGORY) setShowMentalHealthHelp(true);
                    else setStep(2);
                  }}>
                  <AppText style={[styles.subText, { color: th.text }, subCategory === sub && styles.subTextActive]}>{trCat.subs?.[category]?.[i] || sub}</AppText>
                  <MaterialIcons name="chevron-right" size={20} color={subCategory === sub ? '#FFF' : th.textLight} />
                </TouchableOpacity>
              ))
            ) : (
              // Grouped shape (worker type → issues), currently only used by the 'labour' category —
              // the selected value combines both, e.g. "Domestic Worker / Maid – Salary Delayed or Not Paid",
              // since the ticket has no separate worker-type column.
              Object.entries(SUB_CATEGORIES[category] || {}).map(([group, issues]) => (
                <View key={group} style={styles.subGroup}>
                  <AppText style={[styles.subGroupTitle, { color: th.textLight }]}>{trCat.labourGroups?.[group] || group}</AppText>
                  {issues.map((issue, j) => {
                    const combined = `${group} – ${issue}`;
                    return (
                      <TouchableOpacity key={issue} style={[styles.subCard, { backgroundColor: th.card }, subCategory === combined && { backgroundColor: th.primary }]}
                        onPress={() => { setSubCategory(combined); set('title', combined); setStep(2); }}>
                        <AppText style={[styles.subText, { color: th.text }, subCategory === combined && styles.subTextActive]}>{trCat.subs?.[category]?.[group]?.[j] || issue}</AppText>
                        <MaterialIcons name="chevron-right" size={20} color={subCategory === combined ? '#FFF' : th.textLight} />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))
            )}
            <TouchableOpacity style={styles.backBtn} onPress={() => setStep(0)}>
              <AppText style={[styles.backText, { color: th.secondary }]}>{tr.changeCategory}</AppText>
            </TouchableOpacity>
          </>
        )}

        {/* STEP 2: Details */}
        {step === 2 && (
          <>
            <AppText style={[styles.sectionTitle, { color: th.text }]}>{tr.issueDetails}</AppText>
            <AppText style={[styles.label, { color: th.text }]}>{tr.titleLabel}</AppText>
            <TextInput style={[styles.input, { borderColor: th.border, backgroundColor: th.inputBg, color: th.text }]} placeholderTextColor={th.textLight} value={form.title} onChangeText={v => set('title', v)} placeholder={tr.titlePlaceholder} />

            <AppText style={[styles.label, { color: th.text }]}>{tr.descriptionLabel}</AppText>
            <TextInput style={[styles.input, styles.textarea, { borderColor: th.border, backgroundColor: th.inputBg, color: th.text }]} placeholderTextColor={th.textLight} value={form.description} onChangeText={v => set('description', v)}
              placeholder={tr.descriptionPlaceholder} multiline numberOfLines={4} />

            <AppText style={[styles.label, { color: th.text }]}>{tr.locationLabel}</AppText>
            <View style={styles.row}>
              <TextInput style={[styles.input, { flex: 1, borderColor: th.border, backgroundColor: th.inputBg, color: th.text }]} placeholderTextColor={th.textLight} value={form.locationText} onChangeText={v => set('locationText', v)} placeholder={tr.locationPlaceholder} />
              <TouchableOpacity style={[styles.gpsBtn, { backgroundColor: th.card, borderColor: th.border }]} onPress={autoLocation} accessibilityLabel="Use current GPS location">
                <MaterialIcons name="gps-fixed" size={22} color={th.primary} />
              </TouchableOpacity>
            </View>

            <AppText style={[styles.label, { color: th.text }]}>{tr.priorityLabel}</AppText>
            <View style={styles.priorityRow}>
              {['low','medium','high','critical'].map(p => (
                <TouchableOpacity key={p} style={[styles.priorityChip, { borderColor: PRIORITY_COLORS[p] }, form.priority === p && { backgroundColor: PRIORITY_COLORS[p] }]}
                  onPress={() => set('priority', p)}>
                  <AppText style={[styles.priorityText, { color: th.text }, form.priority === p && { color: '#FFF' }]}>{tr[`priority${p.charAt(0).toUpperCase()+p.slice(1)}`]}</AppText>
                </TouchableOpacity>
              ))}
            </View>
            {category === 'women_safety' && <AppText style={styles.autoAlert}>{tr.autoEscalate}</AppText>}
            {isFeeExempt && <AppText style={styles.noFeeAlert}>{tr.noFeeNote}</AppText>}

            <AppText style={[styles.label, { color: th.text }]}>{tr.attachments}</AppText>
            <View style={styles.mediaRow}>
              <MediaBtn icon="photo-camera" label={tr.photo} onPress={() => pickMedia('photo')} theme={th} />
              <MediaBtn icon="videocam"    label={tr.video} onPress={() => pickMedia('video')} theme={th} />
              <MediaBtn icon={recorderState.isRecording ? 'stop' : 'mic'} label={recorderState.isRecording ? (tr.stopRecording || 'Stop') : tr.audio}
                onPress={recorderState.isRecording ? stopRecording : startRecording} active={recorderState.isRecording} theme={th} />
            </View>
            {recorderState.isRecording && (
              <AppText style={styles.recordingIndicator}>🔴 {tr.recording || 'Recording'}… {Math.round((recorderState.durationMillis || 0) / 1000)}s</AppText>
            )}
            {media.length > 0 && <AppText style={styles.mediaCount}>✅ {media.length}/{MAX_MEDIA_ATTACHMENTS} {tr.filesAttached}</AppText>}

            <TouchableOpacity style={styles.anonRow} onPress={() => set('isAnonymous', !form.isAnonymous)}>
              <MaterialIcons name={form.isAnonymous ? 'check-box' : 'check-box-outline-blank'} size={22} color={th.primary} />
              <AppText style={[styles.anonText, { color: th.textLight }]}>{tr.anonymousLabel}</AppText>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.nextBtn, { backgroundColor: th.primary }]} onPress={submitTicket} disabled={loading}>
              {loading ? <ActivityIndicator color="#FFF" /> : <AppText style={styles.nextBtnText}>{isFeeExempt ? tr.submitIssue : tr.proceedToPayment}</AppText>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.backBtn} onPress={() => setStep(1)}>
              <AppText style={[styles.backText, { color: th.secondary }]}>{tr.back}</AppText>
            </TouchableOpacity>
          </>
        )}

        {/* STEP 3: Confirmation */}
        {step === 3 && (
          <View style={[styles.confirmCard, { backgroundColor: th.card }]}>
            <Text style={styles.confirmEmoji}>✅</Text>
            <AppText style={[styles.confirmTitle, { color: th.success }]}>{tr.issueSubmitted}</AppText>
            <AppText style={[styles.confirmSub, { color: th.textLight }]}>
              {paymentRequired ? tr.submittedSuccess : tr.submittedNoFee}
            </AppText>

            {paymentRequired ? (
              <>
                <View style={styles.refBox}>
                  <AppText style={[styles.refLabel, { color: th.textLight }]}>{tr.paymentReference}</AppText>
                  <AppText style={[styles.refNum, { color: th.secondary }]}>{paymentRef}</AppText>
                  <AppText style={[styles.refInstr, { color: th.text }]}>{tr.visitOffice}</AppText>
                  <AppText style={[styles.refAddr, { color: th.textLight }]}>📍 {OFFICE_ADDRESS}</AppText>
                  <AppText style={[styles.refAddr, { color: th.textLight }]}>✉️ {OFFICE_EMAIL}</AppText>
                </View>

                <View style={styles.feeInfo}>
                  <MaterialIcons name="info" size={18} color={th.secondary} />
                  <AppText style={[styles.feeText, { color: th.secondary }]}> {tr.feeNote}</AppText>
                </View>

                <View style={styles.onlineNote}>
                  <AppText style={[styles.onlineNoteText, { color: th.textLight }]}>{tr.onlineComingSoon}</AppText>
                </View>
              </>
            ) : (
              <View style={[styles.refBox, { backgroundColor: '#E8F5E9' }]}>
                <AppText style={[styles.refLabel, { color: COLORS.success }]}>{tr.statusLabel}</AppText>
                <AppText style={[styles.refNum, { color: COLORS.success }]}>{tr.statusOpenValue}</AppText>
                <AppText style={[styles.refInstr, { color: th.text }]}>{tr.freeCategoryNote}</AppText>
              </View>
            )}

            <TouchableOpacity style={[styles.nextBtn, { backgroundColor: th.primary }]} onPress={() => navigation.replace('CitizenTabs')}>
              <AppText style={styles.nextBtnText}>{tr.goToMyTickets}</AppText>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const MediaBtn = ({ icon, label, onPress, active, theme }) => (
  <TouchableOpacity style={[styles.mediaBtn, { backgroundColor: theme.card, borderColor: theme.border }, active && { backgroundColor: '#FFF3F3', borderColor: theme.danger }]} onPress={onPress}>
    <MaterialIcons name={icon} size={22} color={active ? theme.danger : theme.primary} />
    <AppText style={[styles.mediaBtnText, { color: theme.text }, active && { color: theme.danger }]}>{label}</AppText>
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
  bmsIntro:        { fontSize: 13, color: COLORS.textLight, marginBottom: 16, lineHeight: 19 },
  bmsRequiredNote: { fontSize: 12, color: COLORS.warning, marginBottom: 12 },
  bmsIdOnFileRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#E8F5E9', borderRadius: 8, padding: 10, marginBottom: 14 },
  bmsIdOnFileText: { flex: 1, fontSize: 13, color: COLORS.success },
  grid:            { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  catCard:         { width: '47%', borderRadius: 12, borderWidth: 1.5, padding: 14, alignItems: 'center', gap: 6 },
  catLabel:        { fontSize: 12, fontWeight: '600', textAlign: 'center' },
  subGroup:        { marginBottom: 10 },
  subGroupTitle:   { fontSize: 13, fontWeight: 'bold', color: COLORS.textLight, textTransform: 'uppercase', marginBottom: 6, marginTop: 4 },
  subCard:         { backgroundColor: '#FFF', borderRadius: 10, padding: 14, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 1 },
  subCardActive:   { backgroundColor: COLORS.primary },
  subText:         { flex: 1, flexShrink: 1, marginRight: 8, fontSize: 15, color: COLORS.text },
  subTextActive:   { color: '#FFF', fontWeight: '600' },
  label:           { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 6 },
  input:           { borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12, fontSize: 15, backgroundColor: '#FFF', marginBottom: 14 },
  textarea:        { height: 100, textAlignVertical: 'top' },
  row:             { flexDirection: 'row', gap: 8, marginBottom: 14, alignItems: 'center' },
  gpsBtn:          { padding: 12, backgroundColor: '#FFF', borderRadius: 10, borderWidth: 1, borderColor: COLORS.border },
  priorityRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  priorityChip:    { flexGrow: 1, flexBasis: 70, minWidth: 70, borderWidth: 2, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 4, alignItems: 'center' },
  priorityText:    { fontSize: 13, fontWeight: '600', color: COLORS.text, textAlign: 'center' },
  autoAlert:       { backgroundColor: '#FFF3E0', borderRadius: 8, padding: 10, marginBottom: 14, color: COLORS.warning, fontSize: 13 },
  noFeeAlert:      { backgroundColor: '#E8F5E9', borderRadius: 8, padding: 10, marginBottom: 14, color: COLORS.success, fontSize: 13 },
  mediaRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  mediaBtn:        { flexGrow: 1, flexBasis: 90, minWidth: 90, backgroundColor: '#FFF', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 6, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, gap: 4 },
  mediaBtnActive:  { backgroundColor: '#FFF3F3', borderColor: COLORS.danger },
  mediaBtnText:    { fontSize: 12, color: COLORS.text, textAlign: 'center' },
  recordingIndicator: { color: COLORS.danger, fontSize: 13, fontWeight: '600', marginBottom: 8 },
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

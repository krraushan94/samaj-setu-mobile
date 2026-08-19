import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, RefreshControl, TextInput, Image, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../store/themeStore';
import AppText from '../../components/AppText';
import { communityAPI, mediaAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export default function MissingScreen({ navigation }) {
  const t = useTheme();
  const user = useAuthStore(s => s.user);
  const [persons, setPersons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', age: '', gender: '', lastSeen: '', description: '', contact: '' });
  const [photo, setPhoto] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const load = async () => {
    setLoadError(false);
    try { const { data } = await communityAPI.getMissing(); setPersons(data.persons || []); } catch { setLoadError(true); }
  };
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };
  useEffect(() => { setLoading(true); load().finally(() => setLoading(false)); }, []);

  const pickPhoto = () => {
    Alert.alert('Add a Photo', 'A recent photo makes it much easier for the community to help identify the person.', [
      { text: 'Use Camera', onPress: () => launchPicker('camera') },
      { text: 'Choose from Gallery', onPress: () => launchPicker('gallery') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const launchPicker = async (source) => {
    const perm = source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== 'granted') return Alert.alert('Error', 'Permission is needed to add a photo.');
    const result = source === 'camera'
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    if (result.canceled) return;
    setPhoto(result.assets[0]);
  };

  const submit = async () => {
    if (!form.name || !form.contact) return Alert.alert('Error', 'Name and contact number are required');
    if (!user) return navigation.navigate('Login');
    setSubmitting(true);
    try {
      let photoUrl;
      if (photo) {
        setUploadingPhoto(true);
        const data = new FormData();
        const ext = photo.uri.split('.').pop()?.toLowerCase() || 'jpg';
        data.append('photo', { uri: photo.uri, type: 'image/jpeg', name: `missing-person.${ext}` });
        try {
          const { data: uploadRes } = await mediaAPI.uploadPhoto(data);
          photoUrl = uploadRes.url;
        } catch {
          Alert.alert('Photo upload failed', 'Continuing without the photo — you can try again later.');
        } finally { setUploadingPhoto(false); }
      }
      await communityAPI.reportMissing({ ...form, photoUrl });
      Alert.alert('Reported', 'Missing person alert has been sent to the area. Thank you.');
      setShowForm(false);
      setForm({ name: '', age: '', gender: '', lastSeen: '', description: '', contact: '' });
      setPhoto(null);
      load();
    } catch { Alert.alert('Error', 'Could not submit report'); } finally { setSubmitting(false); }
  };

  return (
    <View style={[styles.container, { backgroundColor: t.background }]}>
      <View style={[styles.banner, { backgroundColor: '#BF360C' }]}>
        <MaterialIcons name="person-search" size={24} color="#FFF" />
        <View style={styles.bannerText}>
          <AppText style={styles.bannerTitle}>Missing Persons</AppText>
          <AppText style={styles.bannerSub}>Alert the community — every second counts</AppText>
        </View>
        <TouchableOpacity style={styles.reportBtn} onPress={() => setShowForm(!showForm)}>
          <AppText style={styles.reportBtnText}>{showForm ? 'Cancel' : '+ Report'}</AppText>
        </TouchableOpacity>
      </View>

      {showForm && (
        <View style={[styles.form, { backgroundColor: t.card }]}>
          <TouchableOpacity style={[styles.photoPicker, { borderColor: t.border, backgroundColor: t.inputBg }]} onPress={pickPhoto} accessibilityLabel="Add a photo" accessibilityRole="button">
            {photo ? (
              <Image source={{ uri: photo.uri }} style={styles.photoPreview} />
            ) : (
              <>
                <MaterialIcons name="add-a-photo" size={28} color={t.textLight} />
                <AppText style={{ color: t.textLight, fontSize: 12, marginTop: 4 }}>Add a Photo (recommended)</AppText>
              </>
            )}
          </TouchableOpacity>
          <TextInput style={[styles.input, { backgroundColor: t.inputBg, borderColor: t.border, color: t.text }]} placeholder="Name of missing person *" placeholderTextColor={t.textLight} value={form.name} onChangeText={v => set('name', v)} />
          <TextInput style={[styles.input, { backgroundColor: t.inputBg, borderColor: t.border, color: t.text }]} placeholder="Age" keyboardType="number-pad" placeholderTextColor={t.textLight} value={form.age} onChangeText={v => set('age', v)} />
          <TextInput style={[styles.input, { backgroundColor: t.inputBg, borderColor: t.border, color: t.text }]} placeholder="Last seen location" placeholderTextColor={t.textLight} value={form.lastSeen} onChangeText={v => set('lastSeen', v)} />
          <TextInput style={[styles.input, { backgroundColor: t.inputBg, borderColor: t.border, color: t.text }]} placeholder="Contact number *" keyboardType="phone-pad" placeholderTextColor={t.textLight} value={form.contact} onChangeText={v => set('contact', v)} />
          <TextInput style={[styles.input, styles.textarea, { backgroundColor: t.inputBg, borderColor: t.border, color: t.text }]} placeholder="Description (what were they wearing, any details)" placeholderTextColor={t.textLight} value={form.description} onChangeText={v => set('description', v)} multiline numberOfLines={3} />
          <TouchableOpacity style={[styles.submitBtn, { backgroundColor: '#BF360C' }, submitting && { opacity: 0.6 }]} onPress={submit} disabled={submitting}>
            {submitting ? <ActivityIndicator color="#FFF" /> : <AppText style={styles.submitBtnText}>🚨 Send Alert to Community</AppText>}
          </TouchableOpacity>
          {uploadingPhoto && <AppText style={{ color: t.textLight, fontSize: 12, textAlign: 'center', marginTop: 6 }}>Uploading photo…</AppText>}
        </View>
      )}

      {loading ? (
        <ActivityIndicator color="#BF360C" style={styles.loadingSpinner} />
      ) : loadError ? (
        <View style={styles.errorBox}>
          <AppText style={[styles.errorText, { color: t.danger }]}>Couldn't load missing person reports — the server may be waking up.</AppText>
          <TouchableOpacity onPress={load}><AppText style={[styles.retryText, { color: t.secondary }]}>Retry</AppText></TouchableOpacity>
        </View>
      ) : (
      <FlatList
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        data={persons}
        keyExtractor={p => p.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<AppText style={[styles.empty, { color: t.textLight }]}>No active missing person reports</AppText>}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: t.card }]}>
            {item.photo_url ? (
              <Image source={{ uri: item.photo_url }} style={styles.personPhoto} />
            ) : (
              <View style={[styles.personPhoto, styles.personPhotoPlaceholder, { backgroundColor: t.background }]}>
                <MaterialIcons name="person" size={40} color={t.textLight} />
              </View>
            )}
            <View style={styles.personInfo}>
              <AppText style={[styles.personName, { color: t.text }]}>{item.name}{item.age ? `, ${item.age} yrs` : ''}</AppText>
              {item.last_seen && <AppText style={[styles.detail, { color: t.textLight }]}>📍 Last seen: {item.last_seen}</AppText>}
              {item.description && <AppText style={[styles.detail, { color: t.textLight }]}>{item.description}</AppText>}
              <AppText style={[styles.contact, { color: '#BF360C' }]}>📞 Contact: {item.contact}</AppText>
              <AppText style={[styles.reportedAt, { color: t.textLight }]}>Reported: {new Date(item.created_at).toLocaleDateString('en-IN')}</AppText>
            </View>
          </View>
        )}
      />
      )}
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
  photoPicker:   { height: 100, borderRadius: 10, borderWidth: 1, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  photoPreview:  { width: '100%', height: '100%' },
  input:         { borderWidth: 1, borderRadius: 10, padding: 10, fontSize: 14 },
  textarea:      { height: 80, textAlignVertical: 'top' },
  submitBtn:     { borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 4 },
  submitBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  list:          { padding: 12, gap: 10, paddingBottom: 32 },
  loadingSpinner:{ marginTop: 40 },
  errorBox:      { alignItems: 'center', padding: 24, gap: 8 },
  errorText:     { fontSize: 14, textAlign: 'center' },
  retryText:     { fontSize: 14, fontWeight: '700' },
  empty:         { textAlign: 'center', marginTop: 40, fontSize: 14 },
  card:          { flexDirection: 'row', borderRadius: 14, padding: 14, gap: 12, elevation: 2, alignItems: 'flex-start' },
  personPhoto:   { width: 56, height: 56, borderRadius: 10 },
  personPhotoPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  personInfo:    { flex: 1, gap: 4 },
  personName:    { fontSize: 16, fontWeight: '700' },
  detail:        { fontSize: 13 },
  contact:       { fontSize: 13, fontWeight: '600' },
  reportedAt:    { fontSize: 11, marginTop: 4 },
});

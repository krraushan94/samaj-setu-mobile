import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants';
import { useTheme } from '../../store/themeStore';
import AppText from '../../components/AppText';
import { authAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useT } from '../../i18n';

const STEP_OTP      = 0;
const STEP_VERIFY   = 1;
const STEP_PROFILE  = 2;
const STEP_LOCATION = 3;

export default function RegisterScreen({ navigation }) {
  const t = useTheme();
  const setAuth  = useAuthStore((s) => s.setAuth);
  const tr       = useT().register;
  const trCommon = useT().common;
  const [step,      setStep]      = useState(STEP_OTP);
  const [loading,   setLoading]   = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    mobile: '', otp: '', firstName: '', lastName: '', email: '', gender: '',
    ageGroup: '', pincode: '', mandal: '', ward: '', colony: '', voterIdNumber: '', aadharNumber: '', password: '',
    isCaregiverSignup: false, caregiverName: '', caregiverMobile: '',
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const sendOtp = async () => {
    if (!/^\d{10}$/.test(form.mobile)) return Alert.alert(trCommon.error, 'Enter a valid 10-digit mobile number');
    setLoading(true);
    try {
      await authAPI.sendOtp(form.mobile);
      setStep(STEP_VERIFY);
    } catch (e) {
      Alert.alert(trCommon.error, e.response?.data?.message || 'Failed to send OTP');
    } finally { setLoading(false); }
  };

  const verifyOtp = async () => {
    setLoading(true);
    try {
      const { data } = await authAPI.verifyOtp(form.mobile, form.otp);
      if (data.alreadyRegistered) {
        // OTP is a one-time registration step, not a repeat login method —
        // an already-registered mobile logs in with its password instead.
        Alert.alert(
          tr.alreadyRegisteredTitle || 'Already registered',
          tr.alreadyRegisteredBody || 'This number is already registered. Please log in with your username/mobile and password.',
          [{ text: trCommon.ok || 'OK', onPress: () => navigation.replace('Login') }],
        );
      } else {
        setTempToken(data.tempToken);
        setStep(STEP_PROFILE);
      }
    } catch (e) {
      Alert.alert(trCommon.error, e.response?.data?.message || 'Invalid OTP');
    } finally { setLoading(false); }
  };

  const complete = async () => {
    if (!form.firstName.trim() || !form.lastName.trim()) return Alert.alert(trCommon.error, 'First and last name are required');
    if (!form.pincode.trim() || !form.ward.trim() || !form.colony.trim()) {
      return Alert.alert(trCommon.error, 'Pincode, ward number and area/colony are required');
    }
    if (!form.password || form.password.length < 8) {
      return Alert.alert(trCommon.error, tr.passwordRequired || 'A password of at least 8 characters is required');
    }
    if (!form.aadharNumber.trim() && !form.voterIdNumber.trim()) {
      return Alert.alert(trCommon.error, tr.idRequired || 'Aadhaar number or Voter ID is required');
    }
    setLoading(true);
    try {
      const { data } = await authAPI.register({ ...form, tempToken });
      setAuth(data.user, data.accessToken, data.refreshToken, 'citizen');
      navigation.replace('CitizenTabs');
    } catch (e) {
      Alert.alert(trCommon.error, e.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: t.background }]} keyboardShouldPersistTaps="handled">
      {/* Progress bar */}
      <View style={styles.progress}>
        {[0,1,2,3].map(i => <View key={i} style={[styles.dot, { backgroundColor: t.border }, i <= step && { backgroundColor: t.primary }]} />)}
      </View>

      {step === STEP_OTP && (
        <View style={[styles.card, { backgroundColor: t.card }]}>
          <AppText style={[styles.title, { color: t.text }]}>{tr.mobileTitle}</AppText>
          <AppText style={[styles.sub, { color: t.textLight }]}>{tr.mobileSub}</AppText>
          <TextInput style={[styles.input, { borderColor: t.border, backgroundColor: t.inputBg, color: t.text }]} placeholder={tr.mobilePlaceholder} placeholderTextColor={t.textLight} keyboardType="phone-pad"
            maxLength={10} value={form.mobile} onChangeText={v => set('mobile', v)} />
          <Btn title={tr.sendOtp} onPress={sendOtp} loading={loading} theme={t} />
        </View>
      )}

      {step === STEP_VERIFY && (
        <View style={[styles.card, { backgroundColor: t.card }]}>
          <AppText style={[styles.title, { color: t.text }]}>{tr.otpTitle}</AppText>
          <AppText style={[styles.sub, { color: t.textLight }]}>{tr.otpSentTo}{form.mobile}</AppText>
          <TextInput style={[styles.input, styles.otpInput, { borderColor: t.border, backgroundColor: t.inputBg, color: t.text }]} placeholder={tr.otpPlaceholder} placeholderTextColor={t.textLight} keyboardType="number-pad"
            maxLength={6} value={form.otp} onChangeText={v => set('otp', v)} />
          <Btn title={tr.verifyOtp} onPress={verifyOtp} loading={loading} theme={t} />
          <TouchableOpacity onPress={sendOtp}><AppText style={[styles.resend, { color: t.secondary }]}>{tr.resendOtp}</AppText></TouchableOpacity>
        </View>
      )}

      {step === STEP_PROFILE && (
        <View style={[styles.card, { backgroundColor: t.card }]}>
          <AppText style={[styles.title, { color: t.text }]}>{tr.profileTitle}</AppText>
          <TextInput style={[styles.input, { borderColor: t.border, backgroundColor: t.inputBg, color: t.text }]} placeholder={tr.firstName} placeholderTextColor={t.textLight} value={form.firstName} onChangeText={v => set('firstName', v)} />
          <TextInput style={[styles.input, { borderColor: t.border, backgroundColor: t.inputBg, color: t.text }]} placeholder={tr.lastName} placeholderTextColor={t.textLight} value={form.lastName} onChangeText={v => set('lastName', v)} />
          <TextInput style={[styles.input, { borderColor: t.border, backgroundColor: t.inputBg, color: t.text }]} placeholder={tr.email} placeholderTextColor={t.textLight} keyboardType="email-address" value={form.email} onChangeText={v => set('email', v)} />
          <View style={styles.passwordRow}>
            <TextInput style={[styles.input, styles.passwordInput, { borderColor: t.border, backgroundColor: t.inputBg, color: t.text }]} placeholder={tr.password} placeholderTextColor={t.textLight} secureTextEntry={!showPassword} value={form.password} onChangeText={v => set('password', v)} />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(s => !s)} accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}>
              <MaterialIcons name={showPassword ? 'visibility-off' : 'visibility'} size={22} color={t.textLight} />
            </TouchableOpacity>
          </View>
          <AppText style={[styles.label, { color: t.text }]}>{tr.gender}</AppText>
          <View style={styles.row}>
            {[
              { key: 'male',   label: tr.male },
              { key: 'female', label: tr.female },
              { key: 'other',  label: tr.other },
            ].map(g => (
              <TouchableOpacity key={g.key} style={[styles.chip, { borderColor: t.border }, form.gender===g.key && { backgroundColor: t.primary, borderColor: t.primary }]} onPress={() => set('gender', g.key)}>
                <AppText style={[styles.chipText, { color: t.text }, form.gender===g.key && styles.chipTextActive]}>{g.label}</AppText>
              </TouchableOpacity>
            ))}
          </View>
          <AppText style={[styles.label, { color: t.text }]}>{tr.ageGroup}</AppText>
          <View style={styles.row}>
            {['Under 18','18-35','36-60','60+'].map(ag => (
              <TouchableOpacity key={ag} style={[styles.chip, { borderColor: t.border }, form.ageGroup===ag && { backgroundColor: t.primary, borderColor: t.primary }]} onPress={() => set('ageGroup', ag)}>
                <AppText style={[styles.chipText, { color: t.text }, form.ageGroup===ag && styles.chipTextActive]}>{ag}</AppText>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.caregiverRow} onPress={() => set('isCaregiverSignup', !form.isCaregiverSignup)}>
            <View style={[styles.checkbox, { borderColor: t.border }, form.isCaregiverSignup && { backgroundColor: t.primary, borderColor: t.primary }]} />
            <AppText style={[styles.caregiverText, { color: t.textLight }]}>I'm registering this account on behalf of an elderly family member</AppText>
          </TouchableOpacity>
          {form.isCaregiverSignup && (
            <>
              <TextInput style={[styles.input, { borderColor: t.border, backgroundColor: t.inputBg, color: t.text }]} placeholder="Caregiver Full Name" placeholderTextColor={t.textLight} value={form.caregiverName} onChangeText={v => set('caregiverName', v)} />
              <TextInput style={[styles.input, { borderColor: t.border, backgroundColor: t.inputBg, color: t.text }]} placeholder="Caregiver Mobile Number" placeholderTextColor={t.textLight} keyboardType="phone-pad" maxLength={10} value={form.caregiverMobile} onChangeText={v => set('caregiverMobile', v)} />
            </>
          )}
          <Btn title={tr.nextBtn} onPress={() => setStep(STEP_LOCATION)} theme={t} />
        </View>
      )}

      {step === STEP_LOCATION && (
        <View style={[styles.card, { backgroundColor: t.card }]}>
          <AppText style={[styles.title, { color: t.text }]}>{tr.locationTitle}</AppText>
          <TextInput style={[styles.input, { borderColor: t.border, backgroundColor: t.inputBg, color: t.text }]} placeholder={tr.pincode} placeholderTextColor={t.textLight} keyboardType="number-pad" maxLength={6} value={form.pincode} onChangeText={v => set('pincode', v)} />
          <TextInput style={[styles.input, { borderColor: t.border, backgroundColor: t.inputBg, color: t.text }]} placeholder={tr.mandal} placeholderTextColor={t.textLight} value={form.mandal} onChangeText={v => set('mandal', v)} />
          <TextInput style={[styles.input, { borderColor: t.border, backgroundColor: t.inputBg, color: t.text }]} placeholder={tr.ward} placeholderTextColor={t.textLight} value={form.ward} onChangeText={v => set('ward', v)} />
          <TextInput style={[styles.input, { borderColor: t.border, backgroundColor: t.inputBg, color: t.text }]} placeholder={tr.colony} placeholderTextColor={t.textLight} value={form.colony} onChangeText={v => set('colony', v)} />
          <AppText style={[styles.idNote, { color: t.textLight }]}>{tr.idNote || 'Aadhaar number or Voter ID is required — at least one:'}</AppText>
          <TextInput style={[styles.input, { borderColor: t.border, backgroundColor: t.inputBg, color: t.text }]} placeholder={tr.aadharNumber} placeholderTextColor={t.textLight} keyboardType="number-pad" maxLength={12} value={form.aadharNumber} onChangeText={v => set('aadharNumber', v)} />
          <TextInput style={[styles.input, { borderColor: t.border, backgroundColor: t.inputBg, color: t.text }]} placeholder={tr.voterIdNumber} placeholderTextColor={t.textLight} value={form.voterIdNumber} onChangeText={v => set('voterIdNumber', v.toUpperCase())} autoCapitalize="characters" />
          <Btn title={tr.createAccount} onPress={complete} loading={loading} theme={t} />
        </View>
      )}
    </ScrollView>
  );
}

const Btn = ({ title, onPress, loading, theme }) => (
  <TouchableOpacity style={[styles.btn, { backgroundColor: theme.primary }]} onPress={onPress} disabled={loading}>
    {loading ? <ActivityIndicator color="#FFF" /> : <AppText style={styles.btnText}>{title}</AppText>}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container:    { flexGrow: 1, backgroundColor: COLORS.background, padding: 20 },
  progress:     { flexDirection: 'row', gap: 8, marginVertical: 16, justifyContent: 'center' },
  dot:          { width: 32, height: 6, borderRadius: 3, backgroundColor: COLORS.border },
  dotActive:    { backgroundColor: COLORS.primary },
  card:         { backgroundColor: '#FFF', borderRadius: 16, padding: 20, elevation: 2 },
  title:        { fontSize: 22, fontWeight: 'bold', color: COLORS.text, marginBottom: 6 },
  sub:          { fontSize: 14, color: COLORS.textLight, marginBottom: 20 },
  input:        { borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 14, fontSize: 16, marginBottom: 12 },
  passwordRow:  { position: 'relative' },
  passwordInput:{ paddingRight: 44 },
  eyeBtn:       { position: 'absolute', right: 12, top: 12, padding: 4 },
  otpInput:     { fontSize: 24, textAlign: 'center', letterSpacing: 8 },
  label:        { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 8 },
  row:          { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  chip:         { borderWidth: 1, borderColor: COLORS.border, borderRadius: 20, paddingVertical: 6, paddingHorizontal: 14 },
  chipActive:   { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText:     { color: COLORS.text, fontSize: 13 },
  chipTextActive:{ color: '#FFF' },
  btn:          { backgroundColor: COLORS.primary, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  btnText:      { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  resend:       { textAlign: 'center', color: COLORS.secondary, marginTop: 12, fontSize: 14 },
  caregiverRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  checkbox:     { width: 20, height: 20, borderRadius: 4, borderWidth: 1.5, borderColor: COLORS.border },
  checkboxActive:{ backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  caregiverText:{ flex: 1, fontSize: 13, color: COLORS.textLight },
  idNote:       { fontSize: 12, color: COLORS.textLight, marginBottom: 8 },
});

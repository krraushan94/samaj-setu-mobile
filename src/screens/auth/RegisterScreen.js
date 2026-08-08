import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants';
import { authAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useT } from '../../i18n';

const STEP_OTP      = 0;
const STEP_VERIFY   = 1;
const STEP_PROFILE  = 2;
const STEP_LOCATION = 3;

export default function RegisterScreen({ navigation }) {
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
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {/* Progress bar */}
      <View style={styles.progress}>
        {[0,1,2,3].map(i => <View key={i} style={[styles.dot, i <= step && styles.dotActive]} />)}
      </View>

      {step === STEP_OTP && (
        <View style={styles.card}>
          <Text style={styles.title}>{tr.mobileTitle}</Text>
          <Text style={styles.sub}>{tr.mobileSub}</Text>
          <TextInput style={styles.input} placeholder={tr.mobilePlaceholder} keyboardType="phone-pad"
            maxLength={10} value={form.mobile} onChangeText={v => set('mobile', v)} />
          <Btn title={tr.sendOtp} onPress={sendOtp} loading={loading} />
        </View>
      )}

      {step === STEP_VERIFY && (
        <View style={styles.card}>
          <Text style={styles.title}>{tr.otpTitle}</Text>
          <Text style={styles.sub}>{tr.otpSentTo}{form.mobile}</Text>
          <TextInput style={[styles.input, styles.otpInput]} placeholder={tr.otpPlaceholder} keyboardType="number-pad"
            maxLength={6} value={form.otp} onChangeText={v => set('otp', v)} />
          <Btn title={tr.verifyOtp} onPress={verifyOtp} loading={loading} />
          <TouchableOpacity onPress={sendOtp}><Text style={styles.resend}>{tr.resendOtp}</Text></TouchableOpacity>
        </View>
      )}

      {step === STEP_PROFILE && (
        <View style={styles.card}>
          <Text style={styles.title}>{tr.profileTitle}</Text>
          <TextInput style={styles.input} placeholder={tr.firstName} value={form.firstName} onChangeText={v => set('firstName', v)} />
          <TextInput style={styles.input} placeholder={tr.lastName} value={form.lastName} onChangeText={v => set('lastName', v)} />
          <TextInput style={styles.input} placeholder={tr.email} keyboardType="email-address" value={form.email} onChangeText={v => set('email', v)} />
          <View style={styles.passwordRow}>
            <TextInput style={[styles.input, styles.passwordInput]} placeholder={tr.password} secureTextEntry={!showPassword} value={form.password} onChangeText={v => set('password', v)} />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(s => !s)} accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}>
              <MaterialIcons name={showPassword ? 'visibility-off' : 'visibility'} size={22} color={COLORS.textLight} />
            </TouchableOpacity>
          </View>
          <Text style={styles.label}>{tr.gender}</Text>
          <View style={styles.row}>
            {[
              { key: 'male',   label: tr.male },
              { key: 'female', label: tr.female },
              { key: 'other',  label: tr.other },
            ].map(g => (
              <TouchableOpacity key={g.key} style={[styles.chip, form.gender===g.key && styles.chipActive]} onPress={() => set('gender', g.key)}>
                <Text style={[styles.chipText, form.gender===g.key && styles.chipTextActive]}>{g.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.label}>{tr.ageGroup}</Text>
          <View style={styles.row}>
            {['Under 18','18-35','36-60','60+'].map(ag => (
              <TouchableOpacity key={ag} style={[styles.chip, form.ageGroup===ag && styles.chipActive]} onPress={() => set('ageGroup', ag)}>
                <Text style={[styles.chipText, form.ageGroup===ag && styles.chipTextActive]}>{ag}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.caregiverRow} onPress={() => set('isCaregiverSignup', !form.isCaregiverSignup)}>
            <View style={[styles.checkbox, form.isCaregiverSignup && styles.checkboxActive]} />
            <Text style={styles.caregiverText}>I'm registering this account on behalf of an elderly family member</Text>
          </TouchableOpacity>
          {form.isCaregiverSignup && (
            <>
              <TextInput style={styles.input} placeholder="Caregiver Full Name" value={form.caregiverName} onChangeText={v => set('caregiverName', v)} />
              <TextInput style={styles.input} placeholder="Caregiver Mobile Number" keyboardType="phone-pad" maxLength={10} value={form.caregiverMobile} onChangeText={v => set('caregiverMobile', v)} />
            </>
          )}
          <Btn title={tr.nextBtn} onPress={() => setStep(STEP_LOCATION)} />
        </View>
      )}

      {step === STEP_LOCATION && (
        <View style={styles.card}>
          <Text style={styles.title}>{tr.locationTitle}</Text>
          <TextInput style={styles.input} placeholder={tr.pincode} keyboardType="number-pad" maxLength={6} value={form.pincode} onChangeText={v => set('pincode', v)} />
          <TextInput style={styles.input} placeholder={tr.mandal} value={form.mandal} onChangeText={v => set('mandal', v)} />
          <TextInput style={styles.input} placeholder={tr.ward} value={form.ward} onChangeText={v => set('ward', v)} />
          <TextInput style={styles.input} placeholder={tr.colony} value={form.colony} onChangeText={v => set('colony', v)} />
          <Text style={styles.idNote}>{tr.idNote || 'Aadhaar number or Voter ID is required — at least one:'}</Text>
          <TextInput style={styles.input} placeholder={tr.aadharNumber} keyboardType="number-pad" maxLength={12} value={form.aadharNumber} onChangeText={v => set('aadharNumber', v)} />
          <TextInput style={styles.input} placeholder={tr.voterIdNumber} value={form.voterIdNumber} onChangeText={v => set('voterIdNumber', v.toUpperCase())} autoCapitalize="characters" />
          <Btn title={tr.createAccount} onPress={complete} loading={loading} />
        </View>
      )}
    </ScrollView>
  );
}

const Btn = ({ title, onPress, loading }) => (
  <TouchableOpacity style={styles.btn} onPress={onPress} disabled={loading}>
    {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>{title}</Text>}
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

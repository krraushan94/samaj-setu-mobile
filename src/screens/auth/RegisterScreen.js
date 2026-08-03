import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { COLORS } from '../../constants';
import { authAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

const STEP_OTP    = 0;
const STEP_VERIFY = 1;
const STEP_PROFILE= 2;
const STEP_LOCATION=3;

export default function RegisterScreen({ navigation }) {
  const setAuth = useAuthStore((s) => s.setAuth);
  const [step, setStep] = useState(STEP_OTP);
  const [loading, setLoading] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [form, setForm] = useState({
    mobile: '', otp: '', fullName: '', email: '', gender: '',
    ageGroup: '', pincode: '', mandal: '', ward: '', colony: '', password: '',
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const sendOtp = async () => {
    if (!/^\d{10}$/.test(form.mobile)) return Alert.alert('Error', 'Enter a valid 10-digit mobile number');
    setLoading(true);
    try {
      await authAPI.sendOtp(form.mobile);
      setStep(STEP_VERIFY);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to send OTP');
    } finally { setLoading(false); }
  };

  const verifyOtp = async () => {
    setLoading(true);
    try {
      const { data } = await authAPI.verifyOtp(form.mobile, form.otp);
      if (!data.isNewUser) {
        setAuth(data.user, data.accessToken, data.refreshToken, 'citizen');
        navigation.replace('CitizenTabs');
      } else {
        setTempToken(data.tempToken);
        setStep(STEP_PROFILE);
      }
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Invalid OTP');
    } finally { setLoading(false); }
  };

  const complete = async () => {
    if (!form.fullName.trim()) return Alert.alert('Error', 'Full name is required');
    setLoading(true);
    try {
      const { data } = await authAPI.register({ ...form, tempToken });
      setAuth(data.user, data.accessToken, data.refreshToken, 'citizen');
      navigation.replace('CitizenTabs');
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Registration failed');
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
          <Text style={styles.title}>Your Mobile Number</Text>
          <Text style={styles.sub}>We'll send a 6-digit OTP to verify</Text>
          <TextInput style={styles.input} placeholder="+91 Mobile Number" keyboardType="phone-pad"
            maxLength={10} value={form.mobile} onChangeText={v => set('mobile', v)} />
          <Btn title="Send OTP" onPress={sendOtp} loading={loading} />
        </View>
      )}

      {step === STEP_VERIFY && (
        <View style={styles.card}>
          <Text style={styles.title}>Enter OTP</Text>
          <Text style={styles.sub}>Sent to +91 {form.mobile}</Text>
          <TextInput style={[styles.input, styles.otpInput]} placeholder="6-digit OTP" keyboardType="number-pad"
            maxLength={6} value={form.otp} onChangeText={v => set('otp', v)} />
          <Btn title="Verify OTP" onPress={verifyOtp} loading={loading} />
          <TouchableOpacity onPress={sendOtp}><Text style={styles.resend}>Resend OTP</Text></TouchableOpacity>
        </View>
      )}

      {step === STEP_PROFILE && (
        <View style={styles.card}>
          <Text style={styles.title}>Tell us about you</Text>
          <TextInput style={styles.input} placeholder="Full Name *" value={form.fullName} onChangeText={v => set('fullName', v)} />
          <TextInput style={styles.input} placeholder="Email (optional)" keyboardType="email-address" value={form.email} onChangeText={v => set('email', v)} />
          <TextInput style={styles.input} placeholder="Password (optional)" secureTextEntry value={form.password} onChangeText={v => set('password', v)} />
          <Text style={styles.label}>Gender</Text>
          <View style={styles.row}>
            {['male','female','other'].map(g => (
              <TouchableOpacity key={g} style={[styles.chip, form.gender===g && styles.chipActive]} onPress={() => set('gender', g)}>
                <Text style={[styles.chipText, form.gender===g && styles.chipTextActive]}>{g.charAt(0).toUpperCase()+g.slice(1)}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.label}>Age Group</Text>
          <View style={styles.row}>
            {['Under 18','18-35','36-60','60+'].map(ag => (
              <TouchableOpacity key={ag} style={[styles.chip, form.ageGroup===ag && styles.chipActive]} onPress={() => set('ageGroup', ag)}>
                <Text style={[styles.chipText, form.ageGroup===ag && styles.chipTextActive]}>{ag}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Btn title="Next →" onPress={() => setStep(STEP_LOCATION)} />
        </View>
      )}

      {step === STEP_LOCATION && (
        <View style={styles.card}>
          <Text style={styles.title}>Where do you live?</Text>
          <TextInput style={styles.input} placeholder="Pincode *" keyboardType="number-pad" maxLength={6} value={form.pincode} onChangeText={v => set('pincode', v)} />
          <TextInput style={styles.input} placeholder="Mandal / Block" value={form.mandal} onChangeText={v => set('mandal', v)} />
          <TextInput style={styles.input} placeholder="Ward Number (optional)" value={form.ward} onChangeText={v => set('ward', v)} />
          <TextInput style={styles.input} placeholder="Colony / Area Name" value={form.colony} onChangeText={v => set('colony', v)} />
          <Btn title="Create My Account ✅" onPress={complete} loading={loading} />
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
});

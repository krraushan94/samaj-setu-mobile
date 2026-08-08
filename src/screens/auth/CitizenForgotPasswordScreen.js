import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants';
import { authAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

// Self-service password reset for citizens — an OTP is sent to their mobile.
// This is the ONLY place OTP is used again after initial registration, and
// only when someone genuinely forgot their password, not as a routine login
// method (each OTP costs real SMS credit).
export default function CitizenForgotPasswordScreen({ navigation }) {
  const setAuth = useAuthStore((s) => s.setAuth);
  const [step, setStep] = useState('request'); // request | reset
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const requestOtp = async () => {
    if (!/^\d{10}$/.test(mobile)) return Alert.alert('Error', 'Enter a valid 10-digit mobile number');
    setLoading(true);
    try {
      await authAPI.sendOtp(mobile);
      setStep('reset');
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to send OTP');
    } finally { setLoading(false); }
  };

  const resetPassword = async () => {
    if (!otp || !newPassword) return Alert.alert('Error', 'Enter the OTP and a new password');
    if (newPassword.length < 8) return Alert.alert('Error', 'Password must be at least 8 characters');
    setLoading(true);
    try {
      const { data } = await authAPI.resetCitizenPassword(mobile, otp, newPassword);
      setAuth(data.user, data.accessToken, data.refreshToken, 'citizen');
      navigation.replace('CitizenTabs');
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Could not reset password');
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <Text style={styles.emoji}>🔑</Text>
        <Text style={styles.title}>Forgot Password</Text>
        <Text style={styles.sub}>{step === 'request' ? 'An OTP will be sent to your registered mobile number' : 'Enter the OTP and a new password'}</Text>
      </View>
      <View style={styles.card}>
        {step === 'request' ? (
          <>
            <TextInput style={styles.input} placeholder="+91 Mobile Number" keyboardType="phone-pad" maxLength={10} value={mobile} onChangeText={setMobile} />
            <TouchableOpacity style={styles.btn} onPress={requestOtp} disabled={loading}>
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>Send OTP</Text>}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TextInput style={[styles.input, styles.otpInput]} placeholder="6-digit OTP" keyboardType="number-pad" maxLength={6} value={otp} onChangeText={setOtp} />
            <View style={styles.passwordRow}>
              <TextInput style={[styles.input, styles.passwordInput]} placeholder="New password (8+ characters)" secureTextEntry={!showPassword} value={newPassword} onChangeText={setNewPassword} />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(s => !s)} accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}>
                <MaterialIcons name={showPassword ? 'visibility-off' : 'visibility'} size={22} color={COLORS.textLight} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.btn} onPress={resetPassword} disabled={loading}>
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>Reset Password</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={requestOtp}>
              <Text style={styles.link}>Resend OTP</Text>
            </TouchableOpacity>
          </>
        )}
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.link, { marginTop: 4 }]}>← Back to Login</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', padding: 24 },
  header:    { alignItems: 'center', marginBottom: 32 },
  emoji:     { fontSize: 48, marginBottom: 8 },
  title:     { fontSize: 22, fontWeight: 'bold', color: COLORS.text, textAlign: 'center' },
  sub:       { fontSize: 13, color: COLORS.textLight, marginTop: 4, textAlign: 'center' },
  card:      { backgroundColor: '#FFF', borderRadius: 16, padding: 24, elevation: 2 },
  input:     { borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 14, fontSize: 16, marginBottom: 14 },
  otpInput:  { fontSize: 24, textAlign: 'center', letterSpacing: 8 },
  passwordRow:  { position: 'relative' },
  passwordInput:{ paddingRight: 44 },
  eyeBtn:       { position: 'absolute', right: 12, top: 12, padding: 4 },
  btn:       { backgroundColor: COLORS.primary, borderRadius: 12, padding: 16, alignItems: 'center' },
  btnText:   { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  link:      { textAlign: 'center', color: COLORS.secondary, marginTop: 16, fontSize: 14 },
});

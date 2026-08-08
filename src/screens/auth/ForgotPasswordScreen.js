import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants';
import { authAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

// Universal forgot-password — works for citizens, team leaders/members, and admin
// alike. The identifier can be a mobile number (OTP, same SMS path as registration)
// or an email address (a code emailed to that address) — auto-detected, and the
// server itself figures out which account (if any) actually matches it.
export default function ForgotPasswordScreen({ navigation }) {
  const setAuth = useAuthStore((s) => s.setAuth);
  const [step, setStep] = useState('request'); // request | reset
  const [identifier, setIdentifier] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const isMobile = /^\d{10}$/.test(identifier.trim());
  const isEmail = /^\S+@\S+\.\S+$/.test(identifier.trim());

  const requestCode = async () => {
    if (!isMobile && !isEmail) return Alert.alert('Error', 'Enter a valid 10-digit mobile number or email address');
    setLoading(true);
    try {
      await authAPI.forgotPassword(identifier.trim());
      setStep('reset');
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Something went wrong');
    } finally { setLoading(false); }
  };

  const resetPassword = async () => {
    if (!code || !newPassword) return Alert.alert('Error', 'Enter the code and a new password');
    if (newPassword.length < 8) return Alert.alert('Error', 'Password must be at least 8 characters');
    setLoading(true);
    try {
      const { data } = await authAPI.resetPassword(identifier.trim(), code, newPassword);
      setAuth(data.user || data.member || { username: data.role }, data.accessToken, data.refreshToken, data.role);
      if (data.role === 'admin') return navigation.replace('AdminTabs');
      if (data.role === 'leader' || data.role === 'member') return navigation.replace('TeamTabs');
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
        <Text style={styles.sub}>{step === 'request' ? 'A code will be sent to your mobile or email' : 'Enter the code and a new password'}</Text>
      </View>
      <View style={styles.card}>
        {step === 'request' ? (
          <>
            <TextInput style={styles.input} placeholder="Mobile number or email" autoCapitalize="none" keyboardType="email-address"
              value={identifier} onChangeText={setIdentifier} />
            <TouchableOpacity style={styles.btn} onPress={requestCode} disabled={loading}>
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>Send Code</Text>}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TextInput style={[styles.input, styles.codeInput]} placeholder="6-digit code" keyboardType="number-pad" maxLength={6} value={code} onChangeText={setCode} />
            <View style={styles.passwordRow}>
              <TextInput style={[styles.input, styles.passwordInput]} placeholder="New password (8+ characters)" secureTextEntry={!showPassword} value={newPassword} onChangeText={setNewPassword} />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(s => !s)} accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}>
                <MaterialIcons name={showPassword ? 'visibility-off' : 'visibility'} size={22} color={COLORS.textLight} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.btn} onPress={resetPassword} disabled={loading}>
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>Reset Password</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={requestCode}>
              <Text style={styles.link}>Resend code</Text>
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
  codeInput: { fontSize: 24, textAlign: 'center', letterSpacing: 8 },
  passwordRow:  { position: 'relative' },
  passwordInput:{ paddingRight: 44 },
  eyeBtn:       { position: 'absolute', right: 12, top: 12, padding: 4 },
  btn:       { backgroundColor: COLORS.primary, borderRadius: 12, padding: 16, alignItems: 'center' },
  btnText:   { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  link:      { textAlign: 'center', color: COLORS.secondary, marginTop: 16, fontSize: 14 },
});

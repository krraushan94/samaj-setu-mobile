import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants';
import { authAPI } from '../../services/api';

// Self-service password reset for Admin_Raushan only — a 6-digit code is emailed to the
// admin's registered recovery address (sihsraushandc@gmail.com), never shown here.
export default function AdminForgotPasswordScreen({ navigation }) {
  const [step, setStep] = useState('request'); // request | reset
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const requestCode = async () => {
    setLoading(true);
    try {
      await authAPI.forgotAdminPassword('Admin_Raushan');
      Alert.alert('Code sent', 'If this account exists, a reset code has been emailed to the registered recovery address.');
      setStep('reset');
    } catch {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally { setLoading(false); }
  };

  const resetPassword = async () => {
    if (!code || !newPassword) return Alert.alert('Error', 'Enter the code and a new password');
    if (newPassword.length < 8) return Alert.alert('Error', 'Password must be at least 8 characters');
    setLoading(true);
    try {
      await authAPI.resetAdminPassword('Admin_Raushan', code, newPassword);
      Alert.alert('Success', 'Password reset. Please log in with your new password.', [
        { text: 'OK', onPress: () => navigation.replace('Login') },
      ]);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Could not reset password');
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <Text style={styles.emoji}>🔑</Text>
        <Text style={styles.title}>Admin Password Reset</Text>
        <Text style={styles.sub}>{step === 'request' ? 'A code will be emailed to the registered recovery address' : 'Enter the code from your email and a new password'}</Text>
      </View>
      <View style={styles.card}>
        {step === 'request' ? (
          <TouchableOpacity style={styles.btn} onPress={requestCode} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>Send Reset Code</Text>}
          </TouchableOpacity>
        ) : (
          <>
            <TextInput style={styles.input} placeholder="6-digit code" keyboardType="number-pad" value={code} onChangeText={setCode} />
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
  passwordRow:  { position: 'relative' },
  passwordInput:{ paddingRight: 44 },
  eyeBtn:       { position: 'absolute', right: 12, top: 12, padding: 4 },
  btn:       { backgroundColor: COLORS.primary, borderRadius: 12, padding: 16, alignItems: 'center' },
  btnText:   { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  link:      { textAlign: 'center', color: COLORS.secondary, marginTop: 16, fontSize: 14 },
});

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants';
import { useTheme } from '../../store/themeStore';
import AppText from '../../components/AppText';
import { authAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useT } from '../../i18n';

// Universal forgot-password — works for citizens, team leaders/members, and admin
// alike. The identifier can be a mobile number (OTP, same SMS path as registration)
// or an email address (a code emailed to that address) — auto-detected, and the
// server itself figures out which account (if any) actually matches it.
export default function ForgotPasswordScreen({ navigation }) {
  const t = useTheme();
  const tr = useT().forgotPasswordScreen;
  const trCommon = useT().common;
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
    if (!isMobile && !isEmail) return Alert.alert(trCommon.error, tr.invalidIdentifier);
    setLoading(true);
    try {
      await authAPI.forgotPassword(identifier.trim());
      setStep('reset');
    } catch (e) {
      Alert.alert(trCommon.error, e.response?.data?.message || tr.genericError);
    } finally { setLoading(false); }
  };

  const resetPassword = async () => {
    if (!code || !newPassword) return Alert.alert(trCommon.error, tr.codeAndPasswordRequired);
    if (newPassword.length < 8) return Alert.alert(trCommon.error, tr.passwordTooShort);
    setLoading(true);
    try {
      const { data } = await authAPI.resetPassword(identifier.trim(), code, newPassword);
      setAuth(data.user || data.member || { username: data.role }, data.accessToken, data.refreshToken, data.role);
      if (data.role === 'admin') return navigation.replace('AdminTabs');
      if (data.role === 'leader' || data.role === 'member') return navigation.replace('TeamTabs');
      navigation.replace('CitizenTabs');
    } catch (e) {
      Alert.alert(trCommon.error, e.response?.data?.message || tr.resetFailed);
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: t.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <Text style={styles.emoji}>🔑</Text>
        <AppText style={[styles.title, { color: t.text }]}>{tr.title}</AppText>
        <AppText style={[styles.sub, { color: t.textLight }]}>{step === 'request' ? tr.subRequest : tr.subReset}</AppText>
      </View>
      <View style={[styles.card, { backgroundColor: t.card }]}>
        {step === 'request' ? (
          <>
            <TextInput style={[styles.input, { borderColor: t.border, backgroundColor: t.inputBg, color: t.text }]} placeholder={tr.identifierPlaceholder} placeholderTextColor={t.textLight} autoCapitalize="none" keyboardType="email-address"
              value={identifier} onChangeText={setIdentifier} />
            <TouchableOpacity style={[styles.btn, { backgroundColor: t.primary }]} onPress={requestCode} disabled={loading}>
              {loading ? <ActivityIndicator color="#FFF" /> : <AppText style={styles.btnText}>{tr.sendCode}</AppText>}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TextInput style={[styles.input, styles.codeInput, { borderColor: t.border, backgroundColor: t.inputBg, color: t.text }]} placeholder={tr.codePlaceholder} placeholderTextColor={t.textLight} keyboardType="number-pad" maxLength={6} value={code} onChangeText={setCode} />
            <View style={styles.passwordRow}>
              <TextInput style={[styles.input, styles.passwordInput, { borderColor: t.border, backgroundColor: t.inputBg, color: t.text }]} placeholder={tr.newPasswordPlaceholder} placeholderTextColor={t.textLight} secureTextEntry={!showPassword} value={newPassword} onChangeText={setNewPassword} />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(s => !s)} accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}>
                <MaterialIcons name={showPassword ? 'visibility-off' : 'visibility'} size={22} color={t.textLight} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={[styles.btn, { backgroundColor: t.primary }]} onPress={resetPassword} disabled={loading}>
              {loading ? <ActivityIndicator color="#FFF" /> : <AppText style={styles.btnText}>{tr.resetPassword}</AppText>}
            </TouchableOpacity>
            <TouchableOpacity onPress={requestCode}>
              <AppText style={[styles.link, { color: t.secondary }]}>{tr.resendCode}</AppText>
            </TouchableOpacity>
          </>
        )}
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <AppText style={[styles.link, { color: t.secondary, marginTop: 4 }]}>{tr.backToLogin}</AppText>
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

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants';
import { useTheme } from '../../store/themeStore';
import AppText from '../../components/AppText';
import { authAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useT } from '../../i18n';

// Self-service "change my password" — any logged-in role. Team leaders/members
// were only ever given a username+password by whoever created them, with no
// email/mobile on file, so the backend requires both here the first time one of
// them uses this screen; needsContactDetails (passed from CompleteTeamAccountScreen,
// or computed from the stored user record) decides whether those fields show.
export default function ChangePasswordScreen({ navigation, needsContactDetails: forcedNeedsContactDetails, onDone }) {
  const t = useTheme();
  const tr = useT().changePasswordScreen;
  const trCommon = useT().common;
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.role);
  const setAuth = useAuthStore((s) => s.setAuth);
  const token = useAuthStore((s) => s.token);
  const refreshToken = useAuthStore((s) => s.refreshToken);

  const needsContactDetails = forcedNeedsContactDetails ?? ((role === 'leader' || role === 'member') && !user?.password_set_at);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [mobile, setMobile] = useState(user?.mobile || '');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!currentPassword) return Alert.alert(trCommon.error, tr.currentPasswordRequired);
    if (!newPassword || newPassword.length < 8) return Alert.alert(trCommon.error, tr.newPasswordTooShort);
    if (needsContactDetails) {
      if (!/^\S+@\S+\.\S+$/.test(email.trim())) return Alert.alert(trCommon.error, tr.invalidEmail);
      if (!/^\d{10}$/.test(mobile.trim())) return Alert.alert(trCommon.error, tr.invalidMobile);
    }
    setLoading(true);
    try {
      await authAPI.changePassword({
        currentPassword, newPassword,
        ...(needsContactDetails ? { email: email.trim(), mobile: mobile.trim() } : {}),
      });
      if (needsContactDetails) {
        setAuth({ ...user, email: email.trim(), mobile: mobile.trim(), password_set_at: new Date().toISOString() }, token, refreshToken, role);
      }
      Alert.alert(tr.successTitle, tr.successBody, [{ text: 'OK', onPress: () => (onDone ? onDone() : navigation.goBack()) }]);
    } catch (e) {
      Alert.alert(trCommon.error, e.response?.data?.message || tr.updateFailed);
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: t.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.card, { backgroundColor: t.card }]}>
        {needsContactDetails && (
          <AppText style={[styles.notice, { color: t.textLight }]}>{tr.firstTimeNotice}</AppText>
        )}
        <View style={styles.passwordRow}>
          <TextInput style={[styles.input, styles.passwordInput, { borderColor: t.border, backgroundColor: t.inputBg, color: t.text }]} placeholder={tr.currentPasswordPlaceholder} placeholderTextColor={t.textLight} secureTextEntry={!showCurrent}
            value={currentPassword} onChangeText={setCurrentPassword} />
          <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowCurrent(s => !s)} accessibilityLabel={showCurrent ? 'Hide password' : 'Show password'}>
            <MaterialIcons name={showCurrent ? 'visibility-off' : 'visibility'} size={22} color={t.textLight} />
          </TouchableOpacity>
        </View>
        <View style={styles.passwordRow}>
          <TextInput style={[styles.input, styles.passwordInput, { borderColor: t.border, backgroundColor: t.inputBg, color: t.text }]} placeholder={tr.newPasswordPlaceholder} placeholderTextColor={t.textLight} secureTextEntry={!showNew}
            value={newPassword} onChangeText={setNewPassword} />
          <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowNew(s => !s)} accessibilityLabel={showNew ? 'Hide password' : 'Show password'}>
            <MaterialIcons name={showNew ? 'visibility-off' : 'visibility'} size={22} color={t.textLight} />
          </TouchableOpacity>
        </View>
        {needsContactDetails && (
          <>
            <TextInput style={[styles.input, { borderColor: t.border, backgroundColor: t.inputBg, color: t.text }]} placeholder={tr.emailPlaceholder} placeholderTextColor={t.textLight} autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
            <TextInput style={[styles.input, { borderColor: t.border, backgroundColor: t.inputBg, color: t.text }]} placeholder={tr.mobilePlaceholder} placeholderTextColor={t.textLight} keyboardType="phone-pad" maxLength={10} value={mobile} onChangeText={setMobile} />
          </>
        )}
        <TouchableOpacity style={[styles.btn, { backgroundColor: t.primary }]} onPress={submit} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFF" /> : <AppText style={styles.btnText}>{needsContactDetails ? tr.saveAndContinue : tr.updatePassword}</AppText>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', padding: 24 },
  card:      { backgroundColor: '#FFF', borderRadius: 16, padding: 24, elevation: 2 },
  notice:    { fontSize: 13, color: COLORS.textLight, marginBottom: 16, lineHeight: 18 },
  input:     { borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 14, fontSize: 16, marginBottom: 14 },
  passwordRow:  { position: 'relative' },
  passwordInput:{ paddingRight: 44 },
  eyeBtn:       { position: 'absolute', right: 12, top: 12, padding: 4 },
  btn:       { backgroundColor: COLORS.primary, borderRadius: 12, padding: 16, alignItems: 'center' },
  btnText:   { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});

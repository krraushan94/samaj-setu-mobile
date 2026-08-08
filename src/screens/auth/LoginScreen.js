import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants';
import { authAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useT } from '../../i18n';

export default function LoginScreen({ navigation }) {
  const setAuth  = useAuthStore((s) => s.setAuth);
  const tr       = useT().login;
  const trCommon = useT().common;
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading,  setLoading]  = useState(false);

  const login = async () => {
    if (!username || !password) return Alert.alert(trCommon.error, 'Enter username/mobile and password');
    setLoading(true);
    try {
      const isPhone = /^\d{10}$/.test(username);
      const { data } = await authAPI.login(isPhone ? { mobile: username, password } : { username, password });

      setAuth(data.user || data.member || { username }, data.accessToken, data.refreshToken, data.role);

      if (data.role === 'admin') return navigation.replace('AdminTabs');
      if (data.role === 'leader' || data.role === 'member') {
        // First login on an admin-issued password — force setting their own password
        // + contact details before they can use the app (see CompleteTeamAccountScreen).
        if (!data.member?.password_set_at) return navigation.replace('CompleteTeamAccount');
        return navigation.replace('TeamTabs');
      }
      navigation.replace('CitizenTabs');
    } catch (e) {
      Alert.alert('Login Failed', e.response?.data?.message || 'Invalid credentials');
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <Text style={styles.emoji}>🏛️</Text>
        <Text style={styles.title}>{tr.title}</Text>
        <Text style={styles.sub}>{tr.subtitle}</Text>
      </View>
      <View style={styles.card}>
        <TextInput style={styles.input} placeholder={tr.placeholder}
          value={username} onChangeText={setUsername} autoCapitalize="none" />
        <View style={styles.passwordRow}>
          <TextInput style={[styles.input, styles.passwordInput]} placeholder={tr.password} secureTextEntry={!showPassword}
            value={password} onChangeText={setPassword} />
          <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(s => !s)} accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}>
            <MaterialIcons name={showPassword ? 'visibility-off' : 'visibility'} size={22} color={COLORS.textLight} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.btn} onPress={login} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>{tr.loginBtn}</Text>}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.link}>{tr.signUp}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
          <Text style={[styles.link, { marginTop: 4 }]}>{tr.forgotPassword || 'Forgot password?'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', padding: 24 },
  header:    { alignItems: 'center', marginBottom: 32 },
  emoji:     { fontSize: 48, marginBottom: 8 },
  title:     { fontSize: 26, fontWeight: 'bold', color: COLORS.text },
  sub:       { fontSize: 13, color: COLORS.textLight, marginTop: 4 },
  card:      { backgroundColor: '#FFF', borderRadius: 16, padding: 24, elevation: 2 },
  input:     { borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 14, fontSize: 16, marginBottom: 14 },
  passwordRow:  { position: 'relative' },
  passwordInput:{ paddingRight: 44 },
  eyeBtn:       { position: 'absolute', right: 12, top: 12, padding: 4 },
  btn:       { backgroundColor: COLORS.primary, borderRadius: 12, padding: 16, alignItems: 'center' },
  btnText:   { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  link:      { textAlign: 'center', color: COLORS.secondary, marginTop: 16, fontSize: 14 },
});

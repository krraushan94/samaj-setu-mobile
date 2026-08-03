import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { COLORS } from '../../constants';
import { authAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export default function LoginScreen({ navigation }) {
  const setAuth = useAuthStore((s) => s.setAuth);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const login = async () => {
    if (!username || !password) return Alert.alert('Error', 'Enter username/mobile and password');
    setLoading(true);
    try {
      const isPhone = /^\d{10}$/.test(username);
      const { data } = await authAPI.login(isPhone ? { mobile: username, password } : { username, password });

      setAuth(data.user || data.member || { username }, data.accessToken, data.refreshToken, data.role);

      if (data.role === 'admin')  return navigation.replace('AdminTabs');
      if (data.role === 'leader') return navigation.replace('TeamTabs');
      navigation.replace('CitizenTabs');
    } catch (e) {
      Alert.alert('Login Failed', e.response?.data?.message || 'Invalid credentials');
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <Text style={styles.emoji}>🏛️</Text>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.sub}>Samaj Setu — New Town Hatiara</Text>
      </View>
      <View style={styles.card}>
        <TextInput style={styles.input} placeholder="Mobile Number or Username"
          value={username} onChangeText={setUsername} autoCapitalize="none" />
        <TextInput style={styles.input} placeholder="Password" secureTextEntry
          value={password} onChangeText={setPassword} />
        <TouchableOpacity style={styles.btn} onPress={login} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>Login</Text>}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.link}>Don't have an account? Sign Up</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={[styles.link, { marginTop: 4 }]}>Login with OTP instead</Text>
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
  btn:       { backgroundColor: COLORS.primary, borderRadius: 12, padding: 16, alignItems: 'center' },
  btnText:   { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  link:      { textAlign: 'center', color: COLORS.secondary, marginTop: 16, fontSize: 14 },
});

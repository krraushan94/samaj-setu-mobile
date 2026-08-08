import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants';
import ChangePasswordScreen from '../citizen/ChangePasswordScreen';

// Mandatory, non-skippable first step for a team leader/member logging in with the
// password an admin gave them — set a password only they know, plus an email and
// mobile so they can recover the account themselves later. Reached only when the
// login response shows password_set_at is still null (see LoginScreen).
export default function CompleteTeamAccountScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Set Up Your Account</Text>
      <Text style={styles.sub}>Before you continue, choose your own password and add contact details so you can recover your account later.</Text>
      <ChangePasswordScreen navigation={navigation} needsContactDetails onDone={() => navigation.replace('TeamTabs')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  title:     { fontSize: 20, fontWeight: 'bold', color: COLORS.text, textAlign: 'center', marginTop: 24 },
  sub:       { fontSize: 13, color: COLORS.textLight, textAlign: 'center', marginTop: 6, marginHorizontal: 24 },
});

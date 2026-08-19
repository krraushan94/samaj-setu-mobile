import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants';
import { useTheme } from '../../store/themeStore';
import AppText from '../../components/AppText';
import { useT } from '../../i18n';
import ChangePasswordScreen from '../citizen/ChangePasswordScreen';

// Mandatory, non-skippable first step for a team leader/member logging in with the
// password an admin gave them — set a password only they know, plus an email and
// mobile so they can recover the account themselves later. Reached only when the
// login response shows password_set_at is still null (see LoginScreen).
export default function CompleteTeamAccountScreen({ navigation }) {
  const t = useTheme();
  const tr = useT().completeTeamAccount;
  return (
    <View style={[styles.container, { backgroundColor: t.background }]}>
      <AppText style={[styles.title, { color: t.text }]}>{tr.title}</AppText>
      <AppText style={[styles.sub, { color: t.textLight }]}>{tr.subtitle}</AppText>
      <ChangePasswordScreen navigation={navigation} needsContactDetails onDone={() => navigation.replace('TeamTabs')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  title:     { fontSize: 20, fontWeight: 'bold', color: COLORS.text, textAlign: 'center', marginTop: 24 },
  sub:       { fontSize: 13, color: COLORS.textLight, textAlign: 'center', marginTop: 6, marginHorizontal: 24 },
});

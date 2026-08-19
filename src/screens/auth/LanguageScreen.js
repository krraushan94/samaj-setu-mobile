import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { COLORS, LANGUAGES } from '../../constants';
import AppText from '../../components/AppText';
import { useAuthStore } from '../../store/authStore';

export default function LanguageScreen({ navigation }) {
  const setLanguage = useAuthStore((s) => s.setLanguage);

  const select = (code) => {
    setLanguage(code);
    navigation.replace('Onboarding');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <View style={styles.header}>
        <Text style={styles.headerEmoji}>🌐</Text>
        <AppText style={styles.title}>Choose Language</AppText>
        <AppText style={styles.subtitle}>भाषा चुनें • ভাষা বেছে নিন</AppText>
      </View>
      <View style={styles.cards}>
        {LANGUAGES.map((lang) => (
          <TouchableOpacity key={lang.code} style={styles.card} onPress={() => select(lang.code)} activeOpacity={0.8} accessibilityLabel={lang.name} accessibilityRole="button">
            <AppText style={styles.cardLabel}>{lang.label}</AppText>
            <AppText style={styles.cardName}>{lang.name}</AppText>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', padding: 24 },
  header:    { alignItems: 'center', marginBottom: 48 },
  headerEmoji: { fontSize: 48, marginBottom: 12 },
  title:     { fontSize: 28, fontWeight: 'bold', color: '#FFF' },
  subtitle:  { fontSize: 15, color: 'rgba(255,255,255,0.75)', marginTop: 6 },
  cards:     { width: '100%', gap: 16 },
  card:      { backgroundColor: '#FFF', borderRadius: 16, paddingVertical: 20, paddingHorizontal: 24, alignItems: 'center', elevation: 4 },
  cardLabel: { fontSize: 28, fontWeight: 'bold', color: COLORS.primary },
  cardName:  { fontSize: 16, color: COLORS.textLight, marginTop: 4 },
});

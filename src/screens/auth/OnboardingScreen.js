import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { COLORS } from '../../constants';
import { useT } from '../../i18n';

const { width } = Dimensions.get('window');

const SLIDE_EMOJIS = ['📢', '🎯', '🔍', '🤝'];

export default function OnboardingScreen({ navigation }) {
  const tr = useT().onboarding;
  const [index, setIndex] = useState(0);
  const flatRef = useRef(null);

  const slides = tr.slides.map((s, i) => ({ ...s, emoji: SLIDE_EMOJIS[i] }));

  const next = () => {
    if (index < slides.length - 1) {
      flatRef.current?.scrollToIndex({ index: index + 1 });
      setIndex(index + 1);
    } else {
      navigation.replace('Welcome');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.skip} onPress={() => navigation.replace('Welcome')}>
        <Text style={styles.skipText}>{tr.skip}</Text>
      </TouchableOpacity>

      <FlatList
        ref={flatRef}
        data={slides}
        horizontal pagingEnabled scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <Text style={styles.emoji}>{item.emoji}</Text>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
          </View>
        )}
      />

      <View style={styles.dots}>
        {slides.map((_, i) => (
          <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>

      <TouchableOpacity style={styles.btn} onPress={next}>
        <Text style={styles.btnText}>{index === slides.length - 1 ? tr.letsStart : tr.next}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF', alignItems: 'center' },
  skip:      { alignSelf: 'flex-end', padding: 20, marginTop: 10 },
  skipText:  { color: COLORS.textLight, fontSize: 15 },
  slide:     { width, paddingHorizontal: 40, alignItems: 'center', justifyContent: 'center', flex: 1, paddingTop: 60 },
  emoji:     { fontSize: 80, marginBottom: 32 },
  title:     { fontSize: 26, fontWeight: 'bold', color: COLORS.text, textAlign: 'center', marginBottom: 16 },
  subtitle:  { fontSize: 16, color: COLORS.textLight, textAlign: 'center', lineHeight: 24 },
  dots:      { flexDirection: 'row', gap: 8, marginVertical: 32 },
  dot:       { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.border },
  dotActive: { backgroundColor: COLORS.primary, width: 24 },
  btn:       { backgroundColor: COLORS.primary, paddingHorizontal: 48, paddingVertical: 16, borderRadius: 30, marginBottom: 48, elevation: 4 },
  btnText:   { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});

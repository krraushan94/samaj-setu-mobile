import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

// All color tokens for light and dark modes
const LIGHT = {
  mode:        'light',
  primary:     '#C62828',
  secondary:   '#1565C0',
  success:     '#2E7D32',
  warning:     '#F57F17',
  danger:      '#B71C1C',
  critical:    '#D50000',
  sos:         '#FF1744',
  background:  '#F5F5F5',
  surface:     '#FFFFFF',
  card:        '#FFFFFF',
  text:        '#212121',
  textLight:   '#757575',
  textInverse: '#FFFFFF',
  border:      '#E0E0E0',
  inputBg:     '#FFFFFF',
  navBar:      '#FFFFFF',
  headerBg:    ['#C62828', '#7B1FA2'],
  shadow:      'rgba(0,0,0,0.08)',
};

const DARK = {
  mode:        'dark',
  primary:     '#EF9A9A',
  secondary:   '#90CAF9',
  success:     '#A5D6A7',
  warning:     '#FFE082',
  danger:      '#EF9A9A',
  critical:    '#FF5252',
  sos:         '#FF1744',
  background:  '#121212',
  surface:     '#1E1E1E',
  card:        '#2C2C2C',
  text:        '#F5F5F5',
  textLight:   '#BDBDBD',
  textInverse: '#212121',
  border:      '#3A3A3A',
  inputBg:     '#2C2C2C',
  navBar:      '#1E1E1E',
  headerBg:    ['#7B1A1A', '#4A148C'],
  shadow:      'rgba(0,0,0,0.3)',
};

// WCAG AA+ high-contrast palette — pure black/white/yellow, thick borders, no mid-greys.
// This wins over light/dark whenever it's enabled (accessibility setting, not a third
// "theme" the user picks alongside light/dark — it's a contrast boost on top of either).
const HIGH_CONTRAST = {
  mode:        'highContrast',
  primary:     '#FFD600',
  secondary:   '#00E5FF',
  success:     '#00E676',
  warning:     '#FFD600',
  danger:      '#FF1744',
  critical:    '#FF1744',
  sos:         '#FF1744',
  background:  '#000000',
  surface:     '#000000',
  card:        '#000000',
  text:        '#FFFFFF',
  textLight:   '#FFFFFF',
  textInverse: '#000000',
  border:      '#FFFFFF',
  inputBg:     '#000000',
  navBar:      '#000000',
  headerBg:    ['#000000', '#000000'],
  shadow:      'rgba(255,255,255,0.4)',
};

const pickTheme = (isDark, highContrast) => (highContrast ? HIGH_CONTRAST : isDark ? DARK : LIGHT);

export const useThemeStore = create((set, get) => ({
  theme: LIGHT,
  isDark: false,
  highContrast: false,

  toggleTheme: async () => {
    const nextDark = !get().isDark;
    set({ isDark: nextDark, theme: pickTheme(nextDark, get().highContrast) });
    await AsyncStorage.setItem('theme', nextDark ? 'dark' : 'light');
  },

  toggleHighContrast: async () => {
    const nextContrast = !get().highContrast;
    set({ highContrast: nextContrast, theme: pickTheme(get().isDark, nextContrast) });
    await AsyncStorage.setItem('highContrast', nextContrast ? 'true' : 'false');
  },

  loadTheme: async () => {
    const [savedMode, savedContrast] = await Promise.all([
      AsyncStorage.getItem('theme'),
      AsyncStorage.getItem('highContrast'),
    ]);
    const isDark = savedMode === 'dark';
    const highContrast = savedContrast === 'true';
    set({ isDark, highContrast, theme: pickTheme(isDark, highContrast) });
  },
}));

// Convenience hook — returns current theme colors
export const useTheme = () => useThemeStore((s) => s.theme);

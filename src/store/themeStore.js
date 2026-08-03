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

export const useThemeStore = create((set, get) => ({
  theme: LIGHT,
  isDark: false,

  toggleTheme: async () => {
    const next = get().isDark ? LIGHT : DARK;
    set({ theme: next, isDark: !get().isDark });
    await AsyncStorage.setItem('theme', next.mode);
  },

  loadTheme: async () => {
    const saved = await AsyncStorage.getItem('theme');
    if (saved === 'dark') set({ theme: DARK, isDark: true });
  },
}));

// Convenience hook — returns current theme colors
export const useTheme = () => useThemeStore((s) => s.theme);

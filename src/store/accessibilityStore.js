import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Font scale multipliers applied on top of each Text's own fontSize (see components/AppText.js)
export const FONT_SCALES = {
  small:  0.9,
  normal: 1.0,
  large:  1.2,
  xlarge: 1.45,
};

const STORAGE_KEY = 'accessibilitySettings';

export const useAccessibilityStore = create((set, get) => ({
  fontSize: 'normal',       // 'small' | 'normal' | 'large' | 'xlarge'
  simpleMode: false,        // big-icon, minimal-text Home layout for elderly/low-literacy users
  biometricEnabled: false,  // fingerprint/Face ID unlock, uses expo-local-authentication

  setFontSize: async (fontSize) => {
    set({ fontSize });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ ...get(), fontSize }));
  },

  toggleSimpleMode: async () => {
    const simpleMode = !get().simpleMode;
    set({ simpleMode });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ ...get(), simpleMode }));
  },

  setBiometricEnabled: async (biometricEnabled) => {
    set({ biometricEnabled });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ ...get(), biometricEnabled }));
  },

  loadAccessibilitySettings: async () => {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      try { set(JSON.parse(raw)); } catch { /* ignore corrupt storage */ }
    }
  },
}));

export const useFontScale = () => useAccessibilityStore((s) => FONT_SCALES[s.fontSize] ?? 1);

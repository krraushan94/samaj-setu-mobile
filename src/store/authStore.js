import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  refreshToken: null,
  role: null, // 'citizen' | 'leader' | 'admin'
  language: 'en',

  setAuth: (user, token, refreshToken, role) => {
    set({ user, token, refreshToken, role });
    AsyncStorage.setItem('auth', JSON.stringify({ user, token, refreshToken, role }));
  },

  setLanguage: (lang) => {
    set({ language: lang });
    AsyncStorage.setItem('language', lang);
  },

  loadFromStorage: async () => {
    const [authRaw, lang] = await Promise.all([
      AsyncStorage.getItem('auth'),
      AsyncStorage.getItem('language'),
    ]);
    if (authRaw) {
      const auth = JSON.parse(authRaw);
      set({ ...auth });
    }
    if (lang) set({ language: lang });
  },

  logout: () => {
    set({ user: null, token: null, refreshToken: null, role: null });
    AsyncStorage.removeItem('auth');
  },

  isAdmin: () => get().role === 'admin',
  isTeamLeader: () => get().role === 'leader',
  isCitizen: () => get().role === 'citizen',
}));

import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { useAuthStore } from './src/store/authStore';
import { useThemeStore, useTheme } from './src/store/themeStore';

export default function App() {
  const loadFromStorage = useAuthStore((s) => s.loadFromStorage);
  const loadTheme      = useThemeStore((s) => s.loadTheme);
  const isDark         = useThemeStore((s) => s.isDark);

  useEffect(() => {
    loadFromStorage();
    loadTheme();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <AppNavigator />
    </SafeAreaProvider>
  );
}

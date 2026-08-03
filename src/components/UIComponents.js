import React from 'react';
import { View, Text, Switch, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useThemeStore, useTheme } from '../store/themeStore';

// Reusable header bar shown on all main screens
export function AppHeader({ title, right, navigation }) {
  const t = useTheme();
  const { isDark, toggleTheme } = useThemeStore();
  return (
    <View style={[styles.header, { backgroundColor: t.surface, borderBottomColor: t.border }]}>
      {navigation?.canGoBack() && (
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} testID="header-back-btn">
          <MaterialIcons name="arrow-back" size={24} color={t.text} />
        </TouchableOpacity>
      )}
      <Text style={[styles.title, { color: t.text }]} numberOfLines={1} testID="header-title">{title}</Text>
      <View style={styles.rightRow}>
        {right}
        <TouchableOpacity onPress={toggleTheme} style={styles.themeBtn} testID="theme-toggle-btn" accessibilityLabel={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
          <MaterialIcons name={isDark ? 'light-mode' : 'dark-mode'} size={22} color={t.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Themed card wrapper
export function Card({ children, style, testID }) {
  const t = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: t.card, shadowColor: t.shadow }, style]} testID={testID}>
      {children}
    </View>
  );
}

// Themed primary button
export function PrimaryButton({ title, onPress, loading, disabled, testID, accessibilityLabel }) {
  const t = useTheme();
  return (
    <TouchableOpacity
      style={[styles.btn, { backgroundColor: t.primary, opacity: disabled ? 0.5 : 1 }]}
      onPress={onPress}
      disabled={disabled || loading}
      testID={testID}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityRole="button"
    >
      <Text style={[styles.btnText, { color: '#FFF' }]}>{loading ? 'Please wait…' : title}</Text>
    </TouchableOpacity>
  );
}

// Themed text input
export function ThemedInput({ style, ...props }) {
  const t = useTheme();
  return (
    <View style={[styles.inputWrap, { backgroundColor: t.inputBg, borderColor: t.border }, style]}>
      <Text
        style={{ color: t.text, fontSize: 16 }}
        {...props}
        // TextInput-compatible props pass through
      />
    </View>
  );
}

// Priority badge
export function PriorityBadge({ priority }) {
  const COLORS = { low: '#2E7D32', medium: '#F57F17', high: '#E65100', critical: '#D50000' };
  const color = COLORS[priority] || '#9E9E9E';
  return (
    <View style={[styles.badge, { backgroundColor: color + '22', borderColor: color }]} testID={`priority-badge-${priority}`}>
      <Text style={[styles.badgeText, { color }]}>{priority?.toUpperCase()}</Text>
    </View>
  );
}

// Status badge
export function StatusBadge({ status }) {
  const STATUS_COLORS = { payment_pending: '#757575', open: '#1565C0', in_progress: '#F57F17', resolved: '#2E7D32', closed: '#424242' };
  const STATUS_LABELS = { payment_pending: 'Payment Pending', open: 'Open', in_progress: 'In Progress', resolved: 'Resolved', closed: 'Closed' };
  const color = STATUS_COLORS[status] || '#9E9E9E';
  return (
    <View style={[styles.badge, { backgroundColor: color + '22', borderColor: color }]} testID={`status-badge-${status}`}>
      <Text style={[styles.badgeText, { color }]}>{STATUS_LABELS[status] || status}</Text>
    </View>
  );
}

// Empty state placeholder
export function EmptyState({ icon, message, testID }) {
  const t = useTheme();
  return (
    <View style={styles.emptyState} testID={testID || 'empty-state'}>
      <MaterialIcons name={icon || 'inbox'} size={48} color={t.textLight} />
      <Text style={[styles.emptyText, { color: t.textLight }]}>{message || 'Nothing here yet'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header:    { flexDirection: 'row', alignItems: 'center', paddingTop: 50, paddingBottom: 12, paddingHorizontal: 16, borderBottomWidth: 1, elevation: 2 },
  backBtn:   { marginRight: 8, padding: 4 },
  title:     { flex: 1, fontSize: 18, fontWeight: '700' },
  rightRow:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  themeBtn:  { padding: 6, borderRadius: 20 },
  card:      { borderRadius: 14, padding: 16, marginBottom: 10, elevation: 2, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4 },
  btn:       { borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  btnText:   { fontSize: 16, fontWeight: '700' },
  inputWrap: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 12 },
  badge:     { borderRadius: 8, paddingVertical: 3, paddingHorizontal: 8, borderWidth: 1 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  emptyState:{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 15, textAlign: 'center' },
});

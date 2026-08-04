import React from 'react';
import { Text } from 'react-native';
import { useFontScale } from '../store/accessibilityStore';

// Drop-in replacement for RN's <Text> that respects the user's chosen font size
// (Settings → Accessibility → Font Size). Multiplies whatever fontSize the caller's
// style already specifies, defaulting to 15 (this app's common body size) if none is set.
export default function AppText({ style, ...props }) {
  const scale = useFontScale();
  const flat = Array.isArray(style) ? Object.assign({}, ...style.filter(Boolean)) : (style || {});
  const baseSize = flat.fontSize ?? 15;
  return <Text {...props} style={[style, { fontSize: baseSize * scale }]} />;
}

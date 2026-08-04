import { renderHook, act } from '@testing-library/react-native';
import { useThemeStore, useTheme } from '../src/store/themeStore';

// ─── Theme Store ──────────────────────────────────────────────────────────────
describe('useThemeStore', () => {
  beforeEach(async () => {
    // Reset to light mode — toggle back if currently dark
    if (useThemeStore.getState().isDark) {
      await act(async () => { await useThemeStore.getState().toggleTheme(); });
    }
  });

  it('starts in light mode by default', async () => {
    const { result } = await renderHook(() => useThemeStore());
    expect(result.current.isDark).toBe(false);
    expect(result.current.theme.mode).toBe('light');
  });

  it('toggleTheme switches to dark mode', async () => {
    const { result } = await renderHook(() => useThemeStore());
    await act(async () => { await result.current.toggleTheme(); });
    expect(result.current.isDark).toBe(true);
    expect(result.current.theme.mode).toBe('dark');
  });

  it('toggleTheme switches back to light mode', async () => {
    const { result } = await renderHook(() => useThemeStore());
    await act(async () => { await result.current.toggleTheme(); });
    await act(async () => { await result.current.toggleTheme(); });
    expect(result.current.isDark).toBe(false);
    expect(result.current.theme.mode).toBe('light');
  });

  it('dark theme has accessible contrast — background is dark', async () => {
    const { result } = await renderHook(() => useThemeStore());
    await act(async () => { await result.current.toggleTheme(); });
    const { theme } = result.current;
    expect(theme.background).toBe('#121212');
    expect(theme.text).toBe('#F5F5F5');
  });

  it('light theme has white surface', async () => {
    const { result } = await renderHook(() => useThemeStore());
    expect(result.current.theme.surface).toBe('#FFFFFF');
  });

  it('both themes define all required color keys', async () => {
    const REQUIRED_KEYS = ['primary', 'secondary', 'background', 'surface', 'text', 'textLight', 'border', 'sos', 'card'];
    const { result } = await renderHook(() => useThemeStore());

    // Light
    REQUIRED_KEYS.forEach(k => expect(result.current.theme).toHaveProperty(k));

    // Dark
    await act(async () => { await result.current.toggleTheme(); });
    REQUIRED_KEYS.forEach(k => expect(result.current.theme).toHaveProperty(k));
  });
});

// ─── Auth Store ───────────────────────────────────────────────────────────────
describe('useAuthStore', () => {
  const { useAuthStore } = require('../src/store/authStore');

  beforeEach(() => {
    useAuthStore.setState({ user: null, token: null, refreshToken: null, role: null });
  });

  it('starts unauthenticated', async () => {
    const { result } = await renderHook(() => useAuthStore());
    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(result.current.role).toBeNull();
  });

  it('setAuth stores user, token, role', async () => {
    const { result } = await renderHook(() => useAuthStore());
    const mockUser = { id: 'u1', full_name: 'Test User', mobile: '9999900000' };
    await act(async () => { result.current.setAuth(mockUser, 'access-token', 'refresh-token', 'citizen'); });
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.token).toBe('access-token');
    expect(result.current.role).toBe('citizen');
  });

  it('logout clears all auth state', async () => {
    const { result } = await renderHook(() => useAuthStore());
    await act(async () => { result.current.setAuth({ id: 'u1' }, 'tok', 'refresh', 'citizen'); });
    await act(async () => { result.current.logout(); });
    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
  });

  it('isAdmin returns true only for admin role', async () => {
    const { result } = await renderHook(() => useAuthStore());
    await act(async () => { result.current.setAuth(null, 'tok', 'refresh', 'admin'); });
    expect(result.current.isAdmin()).toBe(true);
    expect(result.current.isCitizen()).toBe(false);
    expect(result.current.isTeamLeader()).toBe(false);
  });

  it('isTeamLeader returns true for leader role', async () => {
    const { result } = await renderHook(() => useAuthStore());
    await act(async () => { result.current.setAuth(null, 'tok', 'refresh', 'leader'); });
    expect(result.current.isTeamLeader()).toBe(true);
  });

  it('isCitizen returns true for citizen role', async () => {
    const { result } = await renderHook(() => useAuthStore());
    await act(async () => { result.current.setAuth(null, 'tok', 'refresh', 'citizen'); });
    expect(result.current.isCitizen()).toBe(true);
  });
});


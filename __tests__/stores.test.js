import { renderHook, act } from '@testing-library/react-native';
import { useThemeStore, useTheme } from '../../src/store/themeStore';

// ─── Theme Store ──────────────────────────────────────────────────────────────
describe('useThemeStore', () => {
  beforeEach(() => {
    // Reset to light mode
    useThemeStore.setState({ isDark: false });
  });

  it('starts in light mode by default', () => {
    const { result } = renderHook(() => useThemeStore());
    expect(result.current.isDark).toBe(false);
    expect(result.current.theme.mode).toBe('light');
  });

  it('toggleTheme switches to dark mode', async () => {
    const { result } = renderHook(() => useThemeStore());
    await act(async () => { await result.current.toggleTheme(); });
    expect(result.current.isDark).toBe(true);
    expect(result.current.theme.mode).toBe('dark');
  });

  it('toggleTheme switches back to light mode', async () => {
    const { result } = renderHook(() => useThemeStore());
    await act(async () => { await result.current.toggleTheme(); });
    await act(async () => { await result.current.toggleTheme(); });
    expect(result.current.isDark).toBe(false);
    expect(result.current.theme.mode).toBe('light');
  });

  it('dark theme has accessible contrast — background is dark', () => {
    const { result } = renderHook(() => useThemeStore());
    act(() => result.current.toggleTheme());
    const { theme } = result.current;
    expect(theme.background).toBe('#121212');
    expect(theme.text).toBe('#F5F5F5');
  });

  it('light theme has white surface', () => {
    const { result } = renderHook(() => useThemeStore());
    expect(result.current.theme.surface).toBe('#FFFFFF');
  });

  it('both themes define all required color keys', () => {
    const REQUIRED_KEYS = ['primary', 'secondary', 'background', 'surface', 'text', 'textLight', 'border', 'sos', 'card'];
    const { result } = renderHook(() => useThemeStore());

    // Light
    REQUIRED_KEYS.forEach(k => expect(result.current.theme).toHaveProperty(k));

    // Dark
    act(() => result.current.toggleTheme());
    REQUIRED_KEYS.forEach(k => expect(result.current.theme).toHaveProperty(k));
  });
});

// ─── Auth Store ───────────────────────────────────────────────────────────────
describe('useAuthStore', () => {
  const { useAuthStore } = require('../../src/store/authStore');

  beforeEach(() => {
    useAuthStore.setState({ user: null, token: null, refreshToken: null, role: null });
  });

  it('starts unauthenticated', () => {
    const { result } = renderHook(() => useAuthStore());
    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(result.current.role).toBeNull();
  });

  it('setAuth stores user, token, role', () => {
    const { result } = renderHook(() => useAuthStore());
    const mockUser = { id: 'u1', full_name: 'Test User', mobile: '9999900000' };
    act(() => result.current.setAuth(mockUser, 'access-token', 'refresh-token', 'citizen'));
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.token).toBe('access-token');
    expect(result.current.role).toBe('citizen');
  });

  it('logout clears all auth state', () => {
    const { result } = renderHook(() => useAuthStore());
    act(() => result.current.setAuth({ id: 'u1' }, 'tok', 'refresh', 'citizen'));
    act(() => result.current.logout());
    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
  });

  it('isAdmin returns true only for admin role', () => {
    const { result } = renderHook(() => useAuthStore());
    act(() => result.current.setAuth(null, 'tok', 'refresh', 'admin'));
    expect(result.current.isAdmin()).toBe(true);
    expect(result.current.isCitizen()).toBe(false);
    expect(result.current.isTeamLeader()).toBe(false);
  });

  it('isTeamLeader returns true for leader role', () => {
    const { result } = renderHook(() => useAuthStore());
    act(() => result.current.setAuth(null, 'tok', 'refresh', 'leader'));
    expect(result.current.isTeamLeader()).toBe(true);
  });

  it('isCitizen returns true for citizen role', () => {
    const { result } = renderHook(() => useAuthStore());
    act(() => result.current.setAuth(null, 'tok', 'refresh', 'citizen'));
    expect(result.current.isCitizen()).toBe(true);
  });
});

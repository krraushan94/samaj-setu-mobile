import React from 'react';
import { render, screen, fireEvent, waitFor, act, cleanup } from '@testing-library/react-native';

jest.mock('../src/navigation/navigationRef', () => ({ navigationRef: { current: null } }));

beforeEach(async () => { await cleanup(); });

const mockNavigate = jest.fn();
const mockReplace  = jest.fn();
const mockGoBack   = jest.fn();
const mockNavigation = { navigate: mockNavigate, replace: mockReplace, goBack: mockGoBack, canGoBack: () => true };

jest.mock('../src/services/api', () => ({
  authAPI: {
    login:          jest.fn(),
    changePassword: jest.fn().mockResolvedValue({ data: { success: true } }),
    forgotPassword: jest.fn().mockResolvedValue({ data: { success: true } }),
    resetPassword:  jest.fn(),
  },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null), setItem: jest.fn().mockResolvedValue(null),
  removeItem: jest.fn().mockResolvedValue(null), clear: jest.fn().mockResolvedValue(null),
  getAllKeys: jest.fn().mockResolvedValue([]), multiGet: jest.fn().mockResolvedValue([]),
  multiSet: jest.fn().mockResolvedValue(null), multiRemove: jest.fn().mockResolvedValue(null),
}));

const { authAPI } = require('../src/services/api');
const { useAuthStore } = require('../src/store/authStore');

beforeEach(() => jest.clearAllMocks());
afterEach(() => useAuthStore.getState().logout());

// ─── Login Screen — forgot-password link + first-time team gate ───────────────
describe('LoginScreen', () => {
  const LoginScreen = require('../src/screens/auth/LoginScreen').default;

  it('has a single "Forgot password?" link that goes to the universal ForgotPassword screen', async () => {
    await render(<LoginScreen navigation={mockNavigation} />);
    await act(async () => { fireEvent.press(screen.getByText('Forgot password?')); });
    expect(mockNavigate).toHaveBeenCalledWith('ForgotPassword');
  });

  it("routes a leader who hasn't set their own password yet to CompleteTeamAccount", async () => {
    authAPI.login.mockResolvedValue({
      data: { success: true, role: 'leader', accessToken: 'tok', refreshToken: 'ref',
        member: { id: 'leader-1', department_id: 'dept-1', password_set_at: null } },
    });
    await render(<LoginScreen navigation={mockNavigation} />);
    await act(async () => { fireEvent.changeText(screen.getByPlaceholderText(/Username/i), 'leader.x'); });
    await act(async () => { fireEvent.changeText(screen.getByPlaceholderText(/Password/i), 'Admin-Issued-1'); });
    await act(async () => { fireEvent.press(screen.getByText(/^Login$/)); });
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('CompleteTeamAccount'));
  });

  it('routes a leader who already set their own password straight to TeamTabs', async () => {
    authAPI.login.mockResolvedValue({
      data: { success: true, role: 'leader', accessToken: 'tok', refreshToken: 'ref',
        member: { id: 'leader-1', department_id: 'dept-1', password_set_at: '2026-01-01T00:00:00Z' } },
    });
    await render(<LoginScreen navigation={mockNavigation} />);
    await act(async () => { fireEvent.changeText(screen.getByPlaceholderText(/Username/i), 'leader.x'); });
    await act(async () => { fireEvent.changeText(screen.getByPlaceholderText(/Password/i), 'MyOwnPass1'); });
    await act(async () => { fireEvent.press(screen.getByText(/^Login$/)); });
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('TeamTabs'));
  });
});

// ─── Change Password Screen ────────────────────────────────────────────────────
describe('ChangePasswordScreen', () => {
  const ChangePasswordScreen = require('../src/screens/citizen/ChangePasswordScreen').default;

  it('citizen sees no email/mobile fields and can change password with just current+new', async () => {
    useAuthStore.getState().setAuth({ id: 'citizen-1', mobile: '9800011111' }, 'tok', 'ref', 'citizen');
    await render(<ChangePasswordScreen navigation={mockNavigation} />);
    expect(screen.queryByPlaceholderText('Email address')).toBeNull();
    await act(async () => { fireEvent.changeText(screen.getByPlaceholderText('Current password'), 'OldPass1'); });
    await act(async () => { fireEvent.changeText(screen.getByPlaceholderText(/New password/), 'NewPass123'); });
    await act(async () => { fireEvent.press(screen.getByText('Update Password')); });
    expect(authAPI.changePassword).toHaveBeenCalledWith({ currentPassword: 'OldPass1', newPassword: 'NewPass123' });
  });

  it("leader's first-ever change shows the contact-details notice and requires email + mobile", async () => {
    useAuthStore.getState().setAuth({ id: 'leader-1', password_set_at: null }, 'tok', 'ref', 'leader');
    await render(<ChangePasswordScreen navigation={mockNavigation} />);
    expect(screen.getByText(/first time changing your password/)).toBeTruthy();
    await act(async () => { fireEvent.changeText(screen.getByPlaceholderText('Current password'), 'Admin-Issued-1'); });
    await act(async () => { fireEvent.changeText(screen.getByPlaceholderText(/New password/), 'MyOwnPass1'); });
    await act(async () => { fireEvent.press(screen.getByText('Save & Continue')); });
    // blocked — no email/mobile filled in yet
    expect(authAPI.changePassword).not.toHaveBeenCalled();

    await act(async () => { fireEvent.changeText(screen.getByPlaceholderText('Email address'), 'leader@example.com'); });
    await act(async () => { fireEvent.changeText(screen.getByPlaceholderText('Mobile number'), '9812345678'); });
    await act(async () => { fireEvent.press(screen.getByText('Save & Continue')); });
    expect(authAPI.changePassword).toHaveBeenCalledWith({
      currentPassword: 'Admin-Issued-1', newPassword: 'MyOwnPass1', email: 'leader@example.com', mobile: '9812345678',
    });
  });
});

// ─── Forgot Password Screen (universal) ────────────────────────────────────────
describe('ForgotPasswordScreen', () => {
  const ForgotPasswordScreen = require('../src/screens/auth/ForgotPasswordScreen').default;

  it('sends a code then resets the password and routes by the returned role', async () => {
    authAPI.resetPassword.mockResolvedValue({
      data: { success: true, role: 'citizen', accessToken: 'tok', refreshToken: 'ref', user: { id: 'citizen-1' } },
    });
    await render(<ForgotPasswordScreen navigation={mockNavigation} />);
    await act(async () => { fireEvent.changeText(screen.getByPlaceholderText('Mobile number or email'), '9812345678'); });
    await act(async () => { fireEvent.press(screen.getByText('Send Code')); });
    expect(authAPI.forgotPassword).toHaveBeenCalledWith('9812345678');

    await act(async () => { fireEvent.changeText(await screen.findByPlaceholderText('6-digit code'), '654321'); });
    await act(async () => { fireEvent.changeText(screen.getByPlaceholderText(/New password/), 'BrandNewPass1'); });
    await act(async () => { fireEvent.press(screen.getByText('Reset Password')); });
    expect(authAPI.resetPassword).toHaveBeenCalledWith('9812345678', '654321', 'BrandNewPass1');
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('CitizenTabs'));
  });
});

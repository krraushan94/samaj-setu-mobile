import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react-native';
import { useThemeStore } from '../src/store/themeStore';
import { PriorityBadge, StatusBadge, EmptyState, AppHeader, PrimaryButton } from '../src/components/UIComponents';

beforeEach(async () => {
  if (useThemeStore.getState().isDark) {
    await act(async () => { await useThemeStore.getState().toggleTheme(); });
  }
});

// ─── PriorityBadge ────────────────────────────────────────────────────────────
describe('PriorityBadge', () => {
  ['low', 'medium', 'high', 'critical'].forEach(priority => {
    it(`renders ${priority} badge`, async () => {
      const { getByTestId } = await render(<PriorityBadge priority={priority} />);
      expect(getByTestId(`priority-badge-${priority}`)).toBeTruthy();
    });
    it(`displays ${priority} label in uppercase`, async () => {
      const { getByText } = await render(<PriorityBadge priority={priority} />);
      expect(getByText(priority.toUpperCase())).toBeTruthy();
    });
  });

  it('handles undefined priority gracefully', async () => {
    await render(<PriorityBadge priority={undefined} />);
    expect(true).toBe(true);
  });
});

// ─── StatusBadge ──────────────────────────────────────────────────────────────
describe('StatusBadge', () => {
  const STATUSES = ['payment_pending', 'open', 'in_progress', 'resolved', 'closed'];
  const LABELS   = { payment_pending: 'Payment Pending', open: 'Open', in_progress: 'In Progress', resolved: 'Resolved', closed: 'Closed' };

  STATUSES.forEach(status => {
    it(`renders ${status} status badge`, async () => {
      const { getByTestId, getByText } = await render(<StatusBadge status={status} />);
      expect(getByTestId(`status-badge-${status}`)).toBeTruthy();
      expect(getByText(LABELS[status])).toBeTruthy();
    });
  });
});

// ─── EmptyState ───────────────────────────────────────────────────────────────
describe('EmptyState', () => {
  it('renders default message when no props given', async () => {
    const { getByTestId, getByText } = await render(<EmptyState />);
    expect(getByTestId('empty-state')).toBeTruthy();
    expect(getByText('Nothing here yet')).toBeTruthy();
  });

  it('renders custom message', async () => {
    const { getByText } = await render(<EmptyState message="No tickets found" />);
    expect(getByText('No tickets found')).toBeTruthy();
  });

  it('uses custom testID', async () => {
    const { getByTestId } = await render(<EmptyState testID="my-empty" />);
    expect(getByTestId('my-empty')).toBeTruthy();
  });
});

// ─── PrimaryButton ────────────────────────────────────────────────────────────
describe('PrimaryButton', () => {
  it('renders title and calls onPress', async () => {
    const onPress = jest.fn();
    const { getByText } = await render(<PrimaryButton title="Submit" onPress={onPress} testID="submit-btn" />);
    fireEvent.press(getByText('Submit'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('shows loading text when loading=true', async () => {
    const { getByText } = await render(<PrimaryButton title="Submit" onPress={jest.fn()} loading />);
    expect(getByText('Please wait\u2026')).toBeTruthy();
  });

  it('does not call onPress when disabled', async () => {
    const onPress = jest.fn();
    const { getByText } = await render(<PrimaryButton title="Submit" onPress={onPress} disabled />);
    fireEvent.press(getByText('Submit'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('has correct accessibility label', async () => {
    const { getByLabelText } = await render(<PrimaryButton title="Submit Issue" onPress={jest.fn()} accessibilityLabel="Submit Issue" />);
    expect(getByLabelText('Submit Issue')).toBeTruthy();
  });
});

// ─── Theme Toggle (AppHeader) ─────────────────────────────────────────────────
describe('Theme Toggle (AppHeader)', () => {
  const mockNavigation = { canGoBack: () => false };

  it('renders theme toggle button', async () => {
    const { getByTestId } = await render(<AppHeader title="Test" navigation={mockNavigation} />);
    expect(getByTestId('theme-toggle-btn')).toBeTruthy();
  });

  it('has correct accessibility label for light mode', async () => {
    const { getByLabelText } = await render(<AppHeader title="Test" navigation={mockNavigation} />);
    expect(getByLabelText('Switch to dark mode')).toBeTruthy();
  });

  it('toggles theme on press and updates accessibility label', async () => {
    const { getByTestId, getByLabelText } = await render(<AppHeader title="Test" navigation={mockNavigation} />);
    expect(getByLabelText('Switch to dark mode')).toBeTruthy();
    await act(async () => { fireEvent.press(getByTestId('theme-toggle-btn')); });
    expect(getByLabelText('Switch to light mode')).toBeTruthy();
  });

  it('shows back button when navigation can go back', async () => {
    const nav = { canGoBack: () => true, goBack: jest.fn() };
    const { getByTestId } = await render(<AppHeader title="Detail" navigation={nav} />);
    fireEvent.press(getByTestId('header-back-btn'));
    expect(nav.goBack).toHaveBeenCalledTimes(1);
  });

  it('does not show back button when cannot go back', async () => {
    const { queryByTestId } = await render(<AppHeader title="Home" navigation={mockNavigation} />);
    expect(queryByTestId('header-back-btn')).toBeNull();
  });

  it('displays correct title', async () => {
    const { getByTestId } = await render(<AppHeader title="My Tickets" navigation={mockNavigation} />);
    expect(getByTestId('header-title').props.children).toBe('My Tickets');
  });
});

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { useThemeStore, useTheme } from '../../src/store/themeStore';
import { PriorityBadge, StatusBadge, EmptyState, AppHeader, PrimaryButton } from '../../src/components/UIComponents';

// Reset theme store between tests
beforeEach(() => useThemeStore.setState({ isDark: false, theme: require('../../src/store/themeStore').useThemeStore.getState().theme }));

// ─── PriorityBadge ─────────────────────────────────────────────────────────────
describe('PriorityBadge', () => {
  ['low', 'medium', 'high', 'critical'].forEach(priority => {
    it(`renders ${priority} badge with correct testID`, () => {
      const { getByTestId } = render(<PriorityBadge priority={priority} />);
      expect(getByTestId(`priority-badge-${priority}`)).toBeTruthy();
    });

    it(`displays ${priority.toUpperCase()} label`, () => {
      const { getByText } = render(<PriorityBadge priority={priority} />);
      expect(getByText(priority.toUpperCase())).toBeTruthy();
    });
  });

  it('handles undefined priority gracefully', () => {
    const { queryByTestId } = render(<PriorityBadge priority={undefined} />);
    // Should render without crashing
    expect(true).toBe(true);
  });
});

// ─── StatusBadge ──────────────────────────────────────────────────────────────
describe('StatusBadge', () => {
  const STATUSES = ['payment_pending', 'open', 'in_progress', 'resolved', 'closed'];
  const LABELS   = { payment_pending: 'Payment Pending', open: 'Open', in_progress: 'In Progress', resolved: 'Resolved', closed: 'Closed' };

  STATUSES.forEach(status => {
    it(`renders "${status}" status with label "${LABELS[status]}"`, () => {
      const { getByTestId, getByText } = render(<StatusBadge status={status} />);
      expect(getByTestId(`status-badge-${status}`)).toBeTruthy();
      expect(getByText(LABELS[status])).toBeTruthy();
    });
  });
});

// ─── EmptyState ───────────────────────────────────────────────────────────────
describe('EmptyState', () => {
  it('renders default message when no props given', () => {
    const { getByTestId, getByText } = render(<EmptyState />);
    expect(getByTestId('empty-state')).toBeTruthy();
    expect(getByText('Nothing here yet')).toBeTruthy();
  });

  it('renders custom message', () => {
    const { getByText } = render(<EmptyState message="No tickets found" />);
    expect(getByText('No tickets found')).toBeTruthy();
  });

  it('uses custom testID', () => {
    const { getByTestId } = render(<EmptyState testID="my-empty" />);
    expect(getByTestId('my-empty')).toBeTruthy();
  });
});

// ─── PrimaryButton ────────────────────────────────────────────────────────────
describe('PrimaryButton', () => {
  it('renders title and calls onPress', () => {
    const onPress = jest.fn();
    const { getByText } = render(<PrimaryButton title="Submit" onPress={onPress} testID="submit-btn" />);
    fireEvent.press(getByText('Submit'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('shows loading text when loading=true', () => {
    const { getByText } = render(<PrimaryButton title="Submit" onPress={jest.fn()} loading />);
    expect(getByText('Please wait…')).toBeTruthy();
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    const { getByText } = render(<PrimaryButton title="Submit" onPress={onPress} disabled />);
    fireEvent.press(getByText('Submit'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('has correct accessibility label', () => {
    const { getByLabelText } = render(<PrimaryButton title="Submit Issue" onPress={jest.fn()} accessibilityLabel="Submit Issue" />);
    expect(getByLabelText('Submit Issue')).toBeTruthy();
  });
});

// ─── Theme Toggle ─────────────────────────────────────────────────────────────
describe('Theme Toggle (AppHeader)', () => {
  const mockNavigation = { canGoBack: () => false };

  it('renders theme toggle button', () => {
    const { getByTestId } = render(<AppHeader title="Test" navigation={mockNavigation} />);
    expect(getByTestId('theme-toggle-btn')).toBeTruthy();
  });

  it('has correct accessibility label for light mode', () => {
    const { getByLabelText } = render(<AppHeader title="Test" navigation={mockNavigation} />);
    expect(getByLabelText('Switch to dark mode')).toBeTruthy();
  });

  it('toggles theme on press and updates accessibility label', async () => {
    const { getByTestId, getByLabelText } = render(<AppHeader title="Test" navigation={mockNavigation} />);
    const toggleBtn = getByTestId('theme-toggle-btn');

    // Initially light mode
    expect(getByLabelText('Switch to dark mode')).toBeTruthy();

    await act(async () => { fireEvent.press(toggleBtn); });

    // After toggle — dark mode
    expect(getByLabelText('Switch to light mode')).toBeTruthy();
  });

  it('shows back button when navigation can go back', () => {
    const nav = { canGoBack: () => true, goBack: jest.fn() };
    const { getByTestId } = render(<AppHeader title="Detail" navigation={nav} />);
    const backBtn = getByTestId('header-back-btn');
    fireEvent.press(backBtn);
    expect(nav.goBack).toHaveBeenCalledTimes(1);
  });

  it('does not show back button when cannot go back', () => {
    const { queryByTestId } = render(<AppHeader title="Home" navigation={mockNavigation} />);
    expect(queryByTestId('header-back-btn')).toBeNull();
  });

  it('displays correct title', () => {
    const { getByTestId } = render(<AppHeader title="My Tickets" navigation={mockNavigation} />);
    expect(getByTestId('header-title').props.children).toBe('My Tickets');
  });
});

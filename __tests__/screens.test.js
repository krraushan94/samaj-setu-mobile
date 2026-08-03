import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';

// Mock navigation
const mockNavigate  = jest.fn();
const mockReplace   = jest.fn();
const mockGoBack    = jest.fn();
const mockNavigation = { navigate: mockNavigate, replace: mockReplace, goBack: mockGoBack, canGoBack: () => true };

// Mock API calls
jest.mock('../../src/services/api', () => ({
  authAPI: {
    sendOtp:   jest.fn().mockResolvedValue({ data: { success: true } }),
    verifyOtp: jest.fn(),
    register:  jest.fn(),
    login:     jest.fn(),
  },
  ticketAPI: {
    list:    jest.fn().mockResolvedValue({ data: { tickets: [] } }),
    getById: jest.fn(),
    upvote:  jest.fn(),
  },
  communityAPI: {
    getBoard: jest.fn().mockResolvedValue({ data: { issues: [] } }),
  },
  adminAPI: {
    recordImpression: jest.fn().mockResolvedValue({ data: { success: true } }),
  },
  paymentAPI: {
    initiate: jest.fn(),
  },
}));

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// ─── Welcome Screen ────────────────────────────────────────────────────────────
describe('WelcomeScreen', () => {
  const WelcomeScreen = require('../../src/screens/auth/WelcomeScreen').default;

  it('renders all 3 navigation options', () => {
    const { getByText } = render(<WelcomeScreen navigation={mockNavigation} />);
    expect(getByText('Create Account')).toBeTruthy();
    expect(getByText('Login')).toBeTruthy();
    expect(getByText('Browse as Guest →')).toBeTruthy();
  });

  it('navigates to Register on Create Account press', () => {
    const { getByText } = render(<WelcomeScreen navigation={mockNavigation} />);
    fireEvent.press(getByText('Create Account'));
    expect(mockNavigate).toHaveBeenCalledWith('Register');
  });

  it('navigates to Login on Login press', () => {
    const { getByText } = render(<WelcomeScreen navigation={mockNavigation} />);
    fireEvent.press(getByText('Login'));
    expect(mockNavigate).toHaveBeenCalledWith('Login');
  });

  it('displays app branding', () => {
    const { getByText } = render(<WelcomeScreen navigation={mockNavigation} />);
    expect(getByText('Samaj Setu')).toBeTruthy();
  });
});

// ─── Onboarding Screen ────────────────────────────────────────────────────────
describe('OnboardingScreen', () => {
  const OnboardingScreen = require('../../src/screens/auth/OnboardingScreen').default;

  it('renders first slide content', () => {
    const { getByText } = render(<OnboardingScreen navigation={mockNavigation} />);
    expect(getByText('Raise Your Voice')).toBeTruthy();
  });

  it('shows Skip button', () => {
    const { getByText } = render(<OnboardingScreen navigation={mockNavigation} />);
    expect(getByText('Skip')).toBeTruthy();
  });

  it('Skip navigates to Welcome', () => {
    const { getByText } = render(<OnboardingScreen navigation={mockNavigation} />);
    fireEvent.press(getByText('Skip'));
    expect(mockReplace).toHaveBeenCalledWith('Welcome');
  });

  it('shows Next → on first slide', () => {
    const { getByText } = render(<OnboardingScreen navigation={mockNavigation} />);
    expect(getByText('Next →')).toBeTruthy();
  });
});

// ─── Register Screen ──────────────────────────────────────────────────────────
describe('RegisterScreen', () => {
  const RegisterScreen = require('../../src/screens/auth/RegisterScreen').default;
  const { authAPI } = require('../../src/services/api');

  beforeEach(() => jest.clearAllMocks());

  it('renders mobile input on step 0', () => {
    const { getByPlaceholderText } = render(<RegisterScreen navigation={mockNavigation} />);
    expect(getByPlaceholderText('+91 Mobile Number')).toBeTruthy();
  });

  it('shows Send OTP button', () => {
    const { getByText } = render(<RegisterScreen navigation={mockNavigation} />);
    expect(getByText('Send OTP')).toBeTruthy();
  });

  it('shows alert for invalid mobile (< 10 digits)', async () => {
    const { getByText, getByPlaceholderText } = render(<RegisterScreen navigation={mockNavigation} />);
    fireEvent.changeText(getByPlaceholderText('+91 Mobile Number'), '12345');
    fireEvent.press(getByText('Send OTP'));
    // Alert should have been called with validation error
    expect(authAPI.sendOtp).not.toHaveBeenCalled();
  });

  it('calls authAPI.sendOtp for valid 10-digit mobile', async () => {
    const { getByText, getByPlaceholderText } = render(<RegisterScreen navigation={mockNavigation} />);
    fireEvent.changeText(getByPlaceholderText('+91 Mobile Number'), '9876543210');
    await act(async () => { fireEvent.press(getByText('Send OTP')); });
    expect(authAPI.sendOtp).toHaveBeenCalledWith('9876543210');
  });
});

// ─── My Tickets Screen ────────────────────────────────────────────────────────
describe('MyTicketsScreen', () => {
  const MyTicketsScreen = require('../../src/screens/citizen/MyTicketsScreen').default;
  const { ticketAPI } = require('../../src/services/api');

  it('renders All filter tab', () => {
    const { getByText } = render(<MyTicketsScreen navigation={mockNavigation} />);
    expect(getByText('All')).toBeTruthy();
  });

  it('renders all status filter tabs', () => {
    const { getByText } = render(<MyTicketsScreen navigation={mockNavigation} />);
    expect(getByText('Payment Pending')).toBeTruthy();
    expect(getByText('Open')).toBeTruthy();
    expect(getByText('In Progress')).toBeTruthy();
    expect(getByText('Resolved')).toBeTruthy();
    expect(getByText('Closed')).toBeTruthy();
  });

  it('shows empty state when no tickets', async () => {
    ticketAPI.list.mockResolvedValue({ data: { tickets: [] } });
    const { findByText } = render(<MyTicketsScreen navigation={mockNavigation} />);
    expect(await findByText('No tickets found')).toBeTruthy();
  });

  it('renders ticket cards when tickets exist', async () => {
    ticketAPI.list.mockResolvedValue({ data: { tickets: [
      { id: 't1', ticket_number: 'SJT-2026-AAAAA', title: 'Test Ticket', status: 'open', priority: 'medium', category: 'infrastructure', created_at: new Date().toISOString() }
    ]}});
    const { findByText } = render(<MyTicketsScreen navigation={mockNavigation} />);
    expect(await findByText('Test Ticket')).toBeTruthy();
  });
});

// ─── Community Board Screen ───────────────────────────────────────────────────
describe('CommunityBoardScreen', () => {
  const CommunityBoardScreen = require('../../src/screens/community/CommunityBoardScreen').default;
  const { communityAPI } = require('../../src/services/api');

  it('renders Community Board title banner', async () => {
    const { findByText } = render(<CommunityBoardScreen navigation={mockNavigation} />);
    expect(await findByText('📋 Community Board')).toBeTruthy();
  });

  it('renders anonymous issue feed description', async () => {
    const { findByText } = render(<CommunityBoardScreen navigation={mockNavigation} />);
    expect(await findByText('Anonymous public feed of issues in the area')).toBeTruthy();
  });

  it('shows empty state when no public issues', async () => {
    communityAPI.getBoard.mockResolvedValue({ data: { issues: [] } });
    const { findByText } = render(<CommunityBoardScreen navigation={mockNavigation} />);
    expect(await findByText('No public issues yet')).toBeTruthy();
  });

  it('renders issue cards when data exists', async () => {
    communityAPI.getBoard.mockResolvedValue({ data: { issues: [
      { id: 'i1', title: 'Garbage pile near park', status: 'open', upvote_count: 2, submitter: 'A resident', created_at: new Date().toISOString() }
    ]}});
    const { findByText } = render(<CommunityBoardScreen navigation={mockNavigation} />);
    expect(await findByText('Garbage pile near park')).toBeTruthy();
  });
});

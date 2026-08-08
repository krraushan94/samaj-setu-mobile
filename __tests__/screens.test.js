import React from 'react';
import { render, screen, fireEvent, waitFor, act, cleanup } from '@testing-library/react-native';

// Stub navigationRef so api.js interceptor doesn't crash without a real navigator
jest.mock('../src/navigation/navigationRef', () => ({
  navigationRef: { current: null },
}));

// Ensure clean state before each test
beforeEach(async () => {
  await cleanup();
});

// Mock navigation
const mockNavigate  = jest.fn();
const mockReplace   = jest.fn();
const mockGoBack    = jest.fn();
const mockNavigation = { navigate: mockNavigate, replace: mockReplace, goBack: mockGoBack, canGoBack: () => true };

// Mock API calls
jest.mock('../src/services/api', () => ({
  authAPI: {
    sendOtp:   jest.fn().mockResolvedValue({ data: { success: true } }),
    verifyOtp: jest.fn(),
    register:  jest.fn(),
    login:     jest.fn(),
  },
  ticketAPI: {
    create:  jest.fn().mockResolvedValue({ data: { ticketId: 'ticket-abc-123' } }),
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
    initiate: jest.fn().mockResolvedValue({ data: { referenceNumber: 'REF-TEST-001' } }),
  },
  mediaAPI: {
    upload: jest.fn().mockResolvedValue({ data: { success: true, uploaded: [] } }),
  },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem:     jest.fn().mockResolvedValue(null),
  setItem:     jest.fn().mockResolvedValue(null),
  removeItem:  jest.fn().mockResolvedValue(null),
  clear:       jest.fn().mockResolvedValue(null),
  getAllKeys:   jest.fn().mockResolvedValue([]),
  multiGet:    jest.fn().mockResolvedValue([]),
  multiSet:    jest.fn().mockResolvedValue(null),
  multiRemove: jest.fn().mockResolvedValue(null),
}));

// ─── Welcome Screen ────────────────────────────────────────────────────────────
describe('WelcomeScreen', () => {
  const WelcomeScreen = require('../src/screens/auth/WelcomeScreen').default;

  it('renders all 3 navigation options', async () => {
    const { getByText } = await render(<WelcomeScreen navigation={mockNavigation} />);
    expect(getByText('Create Account')).toBeTruthy();
    expect(getByText('Login')).toBeTruthy();
    expect(getByText('Browse as Guest →')).toBeTruthy();
  });

  it('navigates to Register on Create Account press', async () => {
    const { getByText } = await render(<WelcomeScreen navigation={mockNavigation} />);
    fireEvent.press(getByText('Create Account'));
    expect(mockNavigate).toHaveBeenCalledWith('Register');
  });

  it('navigates to Login on Login press', async () => {
    const { getByText } = await render(<WelcomeScreen navigation={mockNavigation} />);
    fireEvent.press(getByText('Login'));
    expect(mockNavigate).toHaveBeenCalledWith('Login');
  });

  it('displays app branding', async () => {
    const { getByText } = await render(<WelcomeScreen navigation={mockNavigation} />);
    expect(getByText('Samaj Setu')).toBeTruthy();
  });
});

// ─── Onboarding Screen ────────────────────────────────────────────────────────
describe('OnboardingScreen', () => {
  const OnboardingScreen = require('../src/screens/auth/OnboardingScreen').default;

  it('renders first slide content', async () => {
    const { getByText } = await render(<OnboardingScreen navigation={mockNavigation} />);
    expect(getByText('Raise Your Voice')).toBeTruthy();
  });

  it('shows Skip button', async () => {
    const { getByText } = await render(<OnboardingScreen navigation={mockNavigation} />);
    expect(getByText('Skip')).toBeTruthy();
  });

  it('Skip navigates to Welcome', async () => {
    const { getByText } = await render(<OnboardingScreen navigation={mockNavigation} />);
    fireEvent.press(getByText('Skip'));
    expect(mockReplace).toHaveBeenCalledWith('Welcome');
  });

  it('shows Next → on first slide', async () => {
    const { getByText } = await render(<OnboardingScreen navigation={mockNavigation} />);
    expect(getByText('Next →')).toBeTruthy();
  });
});

// ─── Register Screen ──────────────────────────────────────────────────────────
describe('RegisterScreen', () => {
  const RegisterScreen = require('../src/screens/auth/RegisterScreen').default;
  const { authAPI } = require('../src/services/api');

  beforeEach(() => jest.clearAllMocks());

  it('renders mobile input on step 0', async () => {
    const { getByPlaceholderText } = await render(<RegisterScreen navigation={mockNavigation} />);
    expect(getByPlaceholderText('+91 Mobile Number')).toBeTruthy();
  });

  it('shows Send OTP button', async () => {
    const { getByText } = await render(<RegisterScreen navigation={mockNavigation} />);
    expect(getByText('Send OTP')).toBeTruthy();
  });

  it('shows alert for invalid mobile (< 10 digits)', async () => {
    const { getByText, getByPlaceholderText } = await render(<RegisterScreen navigation={mockNavigation} />);
    await act(async () => {
      fireEvent.changeText(getByPlaceholderText('+91 Mobile Number'), '12345');
      fireEvent.press(getByText('Send OTP'));
    });
    expect(authAPI.sendOtp).not.toHaveBeenCalled();
  });

  it('calls authAPI.sendOtp for valid 10-digit mobile', async () => {
    authAPI.sendOtp.mockResolvedValueOnce({ data: { success: true } });
    await render(<RegisterScreen navigation={mockNavigation} />);
    // Each fireEvent needs explicit act() to flush state in React 19
    await act(async () => {
      fireEvent.changeText(screen.getByPlaceholderText('+91 Mobile Number'), '9876543210');
    });
    await act(async () => {
      fireEvent.press(screen.getByText('Send OTP'));
    });
    // OTP step appears after successful sendOtp
    expect(await screen.findByText('Verify OTP')).toBeTruthy();
  });
});

// ─── My Tickets Screen ────────────────────────────────────────────────────────
describe('MyTicketsScreen', () => {
  const MyTicketsScreen = require('../src/screens/citizen/MyTicketsScreen').default;
  const { ticketAPI } = require('../src/services/api');

  it('renders All filter tab', async () => {
    const { findByText } = await render(<MyTicketsScreen navigation={mockNavigation} />);
    expect(await findByText('All')).toBeTruthy();
  });

  it('renders all status filter tabs', async () => {
    const { findByText } = await render(<MyTicketsScreen navigation={mockNavigation} />);
    expect(await findByText('Payment Pending')).toBeTruthy();
    expect(await findByText('Open')).toBeTruthy();
    expect(await findByText('In Progress')).toBeTruthy();
    expect(await findByText('Resolved')).toBeTruthy();
    expect(await findByText('Closed')).toBeTruthy();
  });

  it('shows empty state when no tickets', async () => {
    ticketAPI.list.mockResolvedValue({ data: { tickets: [] } });
    const { findByText } = await render(<MyTicketsScreen navigation={mockNavigation} />);
    expect(await findByText('No tickets found')).toBeTruthy();
  });

  it('renders ticket cards when tickets exist', async () => {
    ticketAPI.list.mockResolvedValue({ data: { tickets: [
      { id: 't1', ticket_number: 'SJT-2026-AAAAA', title: 'Test Ticket', status: 'open', priority: 'medium', category: 'infrastructure', created_at: new Date().toISOString() }
    ]}});
    const { findByText } = await render(<MyTicketsScreen navigation={mockNavigation} />);
    expect(await findByText('Test Ticket')).toBeTruthy();
  });
});

// ─── Community Board Screen ───────────────────────────────────────────────────
describe('CommunityBoardScreen', () => {
  const CommunityBoardScreen = require('../src/screens/community/CommunityBoardScreen').default;
  const { communityAPI } = require('../src/services/api');

  it('renders Community Board title banner', async () => {
    const { findByText } = await render(<CommunityBoardScreen navigation={mockNavigation} />);
    expect(await findByText('📋 Community Board')).toBeTruthy();
  });

  it('renders anonymous issue feed description', async () => {
    const { findByText } = await render(<CommunityBoardScreen navigation={mockNavigation} />);
    expect(await findByText('Anonymous public feed of issues in the area')).toBeTruthy();
  });

  it('shows empty state when no public issues', async () => {
    communityAPI.getBoard.mockResolvedValue({ data: { issues: [] } });
    const { findByText } = await render(<CommunityBoardScreen navigation={mockNavigation} />);
    expect(await findByText('No public issues yet')).toBeTruthy();
  });

  it('renders issue cards when data exists', async () => {
    communityAPI.getBoard.mockResolvedValue({ data: { issues: [
      { id: 'i1', title: 'Garbage pile near park', status: 'open', upvote_count: 2, submitter: 'A resident', created_at: new Date().toISOString() }
    ]}});
    const { findByText } = await render(<CommunityBoardScreen navigation={mockNavigation} />);
    expect(await findByText('Garbage pile near park')).toBeTruthy();
  });
});

// ─── Helplines Screen ─────────────────────────────────────────────────────────
describe('HelplinesScreen', () => {
  const HelplinesScreen = require('../src/screens/community/HelplinesScreen').default;
  const Location = require('expo-location');
  const RN = require('react-native');

  let openURLSpy;
  beforeEach(() => {
    jest.clearAllMocks();
    openURLSpy = jest.spyOn(RN.Linking, 'openURL').mockResolvedValue(null);
  });
  afterEach(() => {
    openURLSpy.mockRestore();
  });

  it('renders Emergency tab by default', async () => {
    const { getByTestId } = await render(<HelplinesScreen />);
    expect(getByTestId('tab-emergency')).toBeTruthy();
  });

  it('shows both tab buttons', async () => {
    const { getByTestId } = await render(<HelplinesScreen />);
    expect(getByTestId('tab-emergency')).toBeTruthy();
    expect(getByTestId('tab-all')).toBeTruthy();
  });

  it('shows Medical emergency card on Emergency tab', async () => {
    const { getByTestId } = await render(<HelplinesScreen />);
    expect(getByTestId('card-medical')).toBeTruthy();
  });

  it('shows Police emergency card on Emergency tab', async () => {
    const { getByTestId } = await render(<HelplinesScreen />);
    expect(getByTestId('card-police')).toBeTruthy();
  });

  it('Call Ambulance button dials tel:102', async () => {
    const { getByTestId } = await render(<HelplinesScreen />);
    fireEvent.press(getByTestId('btn-call-ambulance'));
    expect(openURLSpy).toHaveBeenCalledWith('tel:102');
  });

  it('Call Police button dials tel:100', async () => {
    const { getByTestId } = await render(<HelplinesScreen />);
    fireEvent.press(getByTestId('btn-call-police'));
    expect(openURLSpy).toHaveBeenCalledWith('tel:100');
  });

  it('Map hospital button requests location and opens Google Maps', async () => {
    const { getByTestId } = await render(<HelplinesScreen />);
    fireEvent.press(getByTestId('btn-map-hospital'));
    await waitFor(() => expect(Location.requestForegroundPermissionsAsync).toHaveBeenCalled());
    expect(Location.getCurrentPositionAsync).toHaveBeenCalled();
    await waitFor(() => expect(openURLSpy).toHaveBeenCalledWith(
      expect.stringContaining('google.com/maps/search/hospital')
    ));
  });

  it('Map police button requests location and opens Google Maps', async () => {
    const { getByTestId } = await render(<HelplinesScreen />);
    fireEvent.press(getByTestId('btn-map-police'));
    await waitFor(() => expect(Location.requestForegroundPermissionsAsync).toHaveBeenCalled());
    await waitFor(() => expect(openURLSpy).toHaveBeenCalledWith(
      expect.stringContaining('google.com/maps/search/police')
    ));
  });

  it('map button shows alert when location permission denied', async () => {
    Location.requestForegroundPermissionsAsync.mockResolvedValueOnce({ status: 'denied' });
    const alertSpy = jest.spyOn(require('react-native').Alert, 'alert');
    const { getByTestId } = await render(<HelplinesScreen />);
    fireEvent.press(getByTestId('btn-map-hospital'));
    await waitFor(() => expect(alertSpy).toHaveBeenCalled());
    expect(openURLSpy).not.toHaveBeenCalledWith(expect.stringContaining('maps'));
    alertSpy.mockRestore();
  });

  it('switches to All Helplines tab and shows helpline grid', async () => {
    const { getByTestId } = await render(<HelplinesScreen />);
    await act(async () => { fireEvent.press(getByTestId('tab-all')); });
    expect(getByTestId('helpline-100')).toBeTruthy();
    expect(getByTestId('helpline-102')).toBeTruthy();
    expect(getByTestId('helpline-1091')).toBeTruthy();
    expect(getByTestId('helpline-1930')).toBeTruthy();
  });

  it('tapping a helpline card dials that number', async () => {
    const { getByTestId } = await render(<HelplinesScreen />);
    await act(async () => { fireEvent.press(getByTestId('tab-all')); });
    fireEvent.press(getByTestId('helpline-101'));
    expect(openURLSpy).toHaveBeenCalledWith('tel:101');
  });

  it('includes all 8 helplines in All tab', async () => {
    const { getByTestId } = await render(<HelplinesScreen />);
    await act(async () => { fireEvent.press(getByTestId('tab-all')); });
    ['100','101','102','1091','1098','108','1930','1064'].forEach(n => {
      expect(getByTestId(`helpline-${n}`)).toBeTruthy();
    });
  });
});

// ─── IssueCategoryScreen ──────────────────────────────────────────────────────
describe('IssueCategoryScreen', () => {
  const IssueCategoryScreen = require('../src/screens/citizen/IssueCategoryScreen').default;
  const { ticketAPI, paymentAPI, mediaAPI } = require('../src/services/api');
  const { useAuthStore } = require('../src/store/authStore');

  // Only the final submit is gated behind login (guests can browse the whole
  // form freely) — simulate a logged-in citizen for these submit-flow tests;
  // the guest-can-browse-but-not-submit behavior itself is covered separately below.
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.getState().setAuth({ id: 'user-1' }, 'tok', 'refresh', 'citizen');
  });
  afterEach(() => useAuthStore.getState().logout());

  const mockRoute = { params: {} };

  // Helper — navigates from step 0 → 1 → 2 via pressing category + sub-category, then
  // fills the now-mandatory location field via the (mocked) GPS button.
  // Uses "Land & Property" (not fee-exempt) so the paid flow is actually exercised —
  // "Infrastructure" is fee-exempt per PAYMENT_EXEMPT_GROUPS (see below for that flow).
  const goToDetailsStep = async () => {
    await render(<IssueCategoryScreen navigation={mockNavigation} route={mockRoute} />);
    await act(async () => { fireEvent.press(screen.getByText('Land & Property')); });
    await act(async () => { fireEvent.press(screen.getByText('Land Dispute')); });
    await act(async () => { fireEvent.press(screen.getByLabelText('Use current GPS location')); });
  };

  it('renders category grid on step 0', async () => {
    const { findByText } = await render(<IssueCategoryScreen navigation={mockNavigation} route={mockRoute} />);
    expect(await findByText('Select Category')).toBeTruthy();
  });

  it('navigates to sub-category step on category press', async () => {
    await render(<IssueCategoryScreen navigation={mockNavigation} route={mockRoute} />);
    await act(async () => { fireEvent.press(screen.getByText('Infrastructure')); });
    expect(await screen.findByText('Select Issue Type')).toBeTruthy();
  });

  it('submits ticket and shows payment reference on success', async () => {
    ticketAPI.create.mockResolvedValueOnce({ data: { ticketId: 'tk-xyz', paymentRequired: true } });
    paymentAPI.initiate.mockResolvedValueOnce({ data: { referenceNumber: 'PAY-REF-789' } });
    await goToDetailsStep();
    await act(async () => { fireEvent.press(screen.getByText('Proceed to Payment →')); });
    expect(await screen.findByText('PAY-REF-789')).toBeTruthy();
    expect(ticketAPI.create).toHaveBeenCalled();
    expect(paymentAPI.initiate).toHaveBeenCalledWith('tk-xyz');
  });

  it('does NOT call mediaAPI.upload when no media attached', async () => {
    ticketAPI.create.mockResolvedValueOnce({ data: { ticketId: 'tk-xyz', paymentRequired: true } });
    paymentAPI.initiate.mockResolvedValueOnce({ data: { referenceNumber: 'PAY-REF-000' } });
    await goToDetailsStep();
    await act(async () => { fireEvent.press(screen.getByText('Proceed to Payment →')); });
    await screen.findByText('PAY-REF-000');
    expect(mediaAPI.upload).not.toHaveBeenCalled();
  });

  it('shows Issue Submitted confirmation heading', async () => {
    ticketAPI.create.mockResolvedValueOnce({ data: { ticketId: 'tk-xyz', paymentRequired: true } });
    paymentAPI.initiate.mockResolvedValueOnce({ data: { referenceNumber: 'REF-TEST-001' } });
    await goToDetailsStep();
    await act(async () => { fireEvent.press(screen.getByText('Proceed to Payment →')); });
    expect(await screen.findByText('Issue Submitted!')).toBeTruthy();
  });

  it('skips payment for fee-exempt categories (Infrastructure) and shows OPEN status', async () => {
    ticketAPI.create.mockResolvedValueOnce({ data: { ticketId: 'tk-free', paymentRequired: false, status: 'open' } });
    await render(<IssueCategoryScreen navigation={mockNavigation} route={mockRoute} />);
    await act(async () => { fireEvent.press(screen.getByText('Infrastructure')); });
    await act(async () => { fireEvent.press(screen.getByText('Street Light')); });
    await act(async () => { fireEvent.press(screen.getByLabelText('Use current GPS location')); });
    await act(async () => { fireEvent.press(screen.getByText('Submit Issue →')); });
    expect(await screen.findByText('Issue Submitted!')).toBeTruthy();
    expect(paymentAPI.initiate).not.toHaveBeenCalled();
  });

  describe('as a guest (no logged-in account)', () => {
    beforeEach(() => useAuthStore.getState().logout());

    it('can browse category and sub-category selection freely', async () => {
      await render(<IssueCategoryScreen navigation={mockNavigation} route={mockRoute} />);
      await act(async () => { fireEvent.press(screen.getByText('Infrastructure')); });
      expect(await screen.findByText('Street Light')).toBeTruthy();
      await act(async () => { fireEvent.press(screen.getByText('Street Light')); });
      // Reaches the Details step (title/description/location/attachments) same as a logged-in user
      expect(await screen.findByText('Issue Details')).toBeTruthy();
    });

    it('blocks only the final submit and never calls ticketAPI.create', async () => {
      const alertSpy = jest.spyOn(require('react-native').Alert, 'alert');
      await render(<IssueCategoryScreen navigation={mockNavigation} route={mockRoute} />);
      await act(async () => { fireEvent.press(screen.getByText('Land & Property')); });
      await act(async () => { fireEvent.press(screen.getByText('Land Dispute')); });
      await act(async () => { fireEvent.press(screen.getByLabelText('Use current GPS location')); });
      await act(async () => { fireEvent.press(screen.getByText('Proceed to Payment →')); });
      expect(alertSpy).toHaveBeenCalledWith('Login required', expect.any(String), expect.any(Array));
      expect(ticketAPI.create).not.toHaveBeenCalled();
      alertSpy.mockRestore();
    });
  });
});


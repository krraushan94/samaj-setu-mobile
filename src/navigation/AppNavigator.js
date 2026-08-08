import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import { navigationRef } from './navigationRef';

// Auth screens
import SplashScreen        from '../screens/auth/SplashScreen';
import LanguageScreen      from '../screens/auth/LanguageScreen';
import OnboardingScreen    from '../screens/auth/OnboardingScreen';
import WelcomeScreen       from '../screens/auth/WelcomeScreen';
import LoginScreen         from '../screens/auth/LoginScreen';
import AdminForgotPasswordScreen from '../screens/auth/AdminForgotPasswordScreen';
import CitizenForgotPasswordScreen from '../screens/auth/CitizenForgotPasswordScreen';
import RegisterScreen      from '../screens/auth/RegisterScreen';

// Citizen screens
import HomeScreen          from '../screens/citizen/HomeScreen';
import IssueCategoryScreen from '../screens/citizen/IssueCategoryScreen';
import SOSScreen from '../screens/citizen/SOSScreen';
import MyTicketsScreen     from '../screens/citizen/MyTicketsScreen';
import TicketDetailScreen  from '../screens/citizen/TicketDetailScreen';
import AccessibilitySettingsScreen from '../screens/citizen/AccessibilitySettingsScreen';
import AboutScreen from '../screens/citizen/AboutScreen';
import OfficeVisitScreen from '../screens/citizen/OfficeVisitScreen';
import AdminVisitsScreen from '../screens/admin/AdminVisitsScreen';

// Community screens
import CommunityBoardScreen from '../screens/community/CommunityBoardScreen';
import EventsScreen        from '../screens/community/EventsScreen';
import MissingScreen       from '../screens/community/MissingScreen';
import HelplinesScreen     from '../screens/community/HelplinesScreen';

// Admin screens
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminDBScreen        from '../screens/admin/AdminDBScreen';
import AdminTeamsScreen     from '../screens/admin/AdminTeamsScreen';
import AdminReportedPostsScreen from '../screens/admin/AdminReportedPostsScreen';
import AdminManageAdminsScreen from '../screens/admin/AdminManageAdminsScreen';

// Team screens
import TeamDashboardScreen  from '../screens/team/TeamDashboardScreen';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

const tabBarIcon = (name) => ({ color, size }) => <MaterialIcons name={name} size={size} color={color} />;

function CitizenTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarActiveTintColor: COLORS.primary, tabBarStyle: { paddingBottom: 4 } }}>
      <Tab.Screen name="Home"          component={HomeScreen}           options={{ title: 'Home',      tabBarIcon: tabBarIcon('home') }} />
      <Tab.Screen name="IssueCategory" component={IssueCategoryScreen}  options={{ title: 'Report',    tabBarIcon: tabBarIcon('add-circle'), tabBarActiveTintColor: COLORS.danger }} />
      <Tab.Screen name="MyTickets"     component={MyTicketsScreen}      options={{ title: 'My Tickets',tabBarIcon: tabBarIcon('list-alt') }} />
      <Tab.Screen name="CommunityBoard"component={CommunityBoardScreen} options={{ title: 'Community', tabBarIcon: tabBarIcon('people') }} />
    </Tab.Navigator>
  );
}

function AdminTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarActiveTintColor: '#1A237E', tabBarStyle: { paddingBottom: 4 } }}>
      <Tab.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ title: 'Dashboard', tabBarIcon: tabBarIcon('dashboard') }} />
      <Tab.Screen name="AdminTickets"   component={MyTicketsScreen}      options={{ title: 'Tickets',   tabBarIcon: tabBarIcon('list-alt') }} />
      <Tab.Screen name="AdminDB"        component={AdminDBScreen}        options={{ title: 'Database',  tabBarIcon: tabBarIcon('storage') }} />
    </Tab.Navigator>
  );
}

function TeamTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarActiveTintColor: '#00695C', tabBarStyle: { paddingBottom: 4 } }}>
      <Tab.Screen name="TeamDashboard"    component={TeamDashboardScreen}  options={{ title: 'Dashboard', tabBarIcon: tabBarIcon('dashboard') }} />
      <Tab.Screen name="TeamTickets"      component={MyTicketsScreen}      options={{ title: 'Tickets',   tabBarIcon: tabBarIcon('list-alt') }} />
      <Tab.Screen name="TeamTicketDetail" component={TicketDetailScreen}   options={{ title: 'Detail',    tabBarIcon: tabBarIcon('info'), tabBarButton: () => null }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Splash">
        {/* Auth flow */}
        <Stack.Screen name="Splash"       component={SplashScreen} />
        <Stack.Screen name="Language"     component={LanguageScreen} />
        <Stack.Screen name="Onboarding"   component={OnboardingScreen} />
        <Stack.Screen name="Welcome"      component={WelcomeScreen} />
        <Stack.Screen name="Login"        component={LoginScreen} options={{ headerShown: true, title: 'Login' }} />
        <Stack.Screen name="AdminForgotPassword" component={AdminForgotPasswordScreen} options={{ headerShown: true, title: 'Reset Admin Password' }} />
        <Stack.Screen name="CitizenForgotPassword" component={CitizenForgotPasswordScreen} options={{ headerShown: true, title: 'Reset Password' }} />
        <Stack.Screen name="Register"     component={RegisterScreen} options={{ headerShown: true, title: 'Create Account' }} />

        {/* Citizen app */}
        <Stack.Screen name="CitizenTabs"    component={CitizenTabs} />
        <Stack.Screen name="TicketDetail"   component={TicketDetailScreen}  options={{ headerShown: true, title: 'Ticket Detail' }} />
        <Stack.Screen name="IssueCategory"  component={IssueCategoryScreen} options={{ headerShown: true, title: 'Report Issue' }} />
        <Stack.Screen name="CommunityBoard" component={CommunityBoardScreen}options={{ headerShown: true, title: 'Community Board' }} />
        <Stack.Screen name="Events"         component={EventsScreen}       options={{ headerShown: true, title: 'Community Events' }} />
        <Stack.Screen name="Missing"        component={MissingScreen}      options={{ headerShown: true, title: 'Missing Persons' }} />
        <Stack.Screen name="Helplines"      component={HelplinesScreen}    options={{ headerShown: true, title: 'Emergency Helplines' }} />
        <Stack.Screen name="SOS"            component={SOSScreen}          options={{ headerShown: true, title: '🚨 SOS Emergency', headerLeft: () => null, gestureEnabled: false }} />
        <Stack.Screen name="AccessibilitySettings" component={AccessibilitySettingsScreen} options={{ headerShown: true, title: 'Settings' }} />
        <Stack.Screen name="About" component={AboutScreen} options={{ headerShown: true, title: 'About Us' }} />
        <Stack.Screen name="OfficeVisit" component={OfficeVisitScreen} options={{ headerShown: true, title: 'Visit the Office' }} />

        {/* Admin app */}
        <Stack.Screen name="AdminTabs" component={AdminTabs} />
        <Stack.Screen name="AdminDB"   component={AdminDBScreen} options={{ headerShown: true, title: '🗄️ Database Explorer' }} />
        <Stack.Screen name="AdminTeams" component={AdminTeamsScreen} options={{ headerShown: true, title: '👥 Manage Teams' }} />
        <Stack.Screen name="AdminReportedPosts" component={AdminReportedPostsScreen} options={{ headerShown: true, title: '🚩 Reported Posts' }} />
        <Stack.Screen name="AdminManageAdmins" component={AdminManageAdminsScreen} options={{ headerShown: true, title: '🛡️ Manage Admins' }} />
        <Stack.Screen name="AdminVisits" component={AdminVisitsScreen} options={{ headerShown: true, title: '🏢 Office Visits' }} />

        {/* Team app */}
        <Stack.Screen name="TeamTabs"        component={TeamTabs} />
        <Stack.Screen name="TeamTicketDetail"component={TicketDetailScreen} options={{ headerShown: true, title: 'Ticket Detail' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

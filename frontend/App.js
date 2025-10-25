import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, StyleSheet, StatusBar } from 'react-native';

// CONTEXT & CONSTANTS
// NOTE: useAuth.js must be created (see instructions below)
import { AuthProvider, useAuth } from './src/hooks/useAuth';
import colors from './src/constants/colors';

// AUTH SCREENS
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import OTPVerificationScreen from './src/screens/auth/OTPVerificationScreen';
// The following screen is referenced in LoginScreen but not provided, so we use a placeholder
const ForgotPasswordScreen = () => <PlaceholderScreen name="Forgot Password" />;

// MAIN SCREENS
import HomeScreen from './src/screens/main/HomeScreen';
import ProfileScreen from './src/screens/main/ProfileScreen';

// PLACEHOLDERS for screens linked from HomeScreen.js quick actions
const SearchRidesScreen = (props) => <PlaceholderScreen name="Search Rides" {...props} />;
const OfferRideScreen = () => <PlaceholderScreen name="Offer Ride" />;
const MyBookingsScreen = () => <PlaceholderScreen name="My Bookings" />;
const RideHistoryScreen = () => <PlaceholderScreen name="Ride History" />;

// Helper component for screens that haven't been implemented yet
const PlaceholderScreen = ({ name, route }) => (
  <View style={styles.screen}>
    <Text style={styles.text}>{name}</Text>
    {route?.params && <Text style={styles.paramsText}>Params: {JSON.stringify(route.params)}</Text>}
  </View>
);

const AuthStack = createNativeStackNavigator();
const MainStack = createNativeStackNavigator();

// --- AUTH FLOW ---
const AuthNavigator = () => (
  <AuthStack.Navigator
    screenOptions={{
      headerShown: false,
      contentStyle: { backgroundColor: colors.background }
    }}
  >
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="Register" component={RegisterScreen} />
    <AuthStack.Screen name="OTPVerification" component={OTPVerificationScreen} />
    <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
  </AuthStack.Navigator>
);

// --- MAIN APP FLOW ---
const MainNavigator = () => (
  <MainStack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: colors.primary },
      headerTintColor: colors.textLight, // White
      headerTitleStyle: { fontWeight: '600' },
    }}
  >
    {/* HomeScreen is set to no header since it has a custom header design */}
    <MainStack.Screen
      name="Home"
      component={HomeScreen}
      options={{ headerShown: false }}
    />
    <MainStack.Screen name="Profile" component={ProfileScreen} options={{ title: 'My Profile' }}/>
    
    {/* Routes called from HomeScreen.js */}
    <MainStack.Screen name="SearchRides" component={SearchRidesScreen} options={{ title: 'Find Rides' }} />
    <MainStack.Screen name="Offer" component={OfferRideScreen} options={{ title: 'Offer a Ride' }} />
    <MainStack.Screen name="Bookings" component={MyBookingsScreen} options={{ title: 'My Bookings' }} />
    <MainStack.Screen name="History" component={RideHistoryScreen} options={{ title: 'Ride History' }} />
    
    {/* Search is sometimes a dedicated screen */}
    <MainStack.Screen name="Search" component={SearchRidesScreen} options={{ title: 'Search' }} /> 
  </MainStack.Navigator>
);

// --- ROOT NAVIGATOR (Auth Switch) ---
const RootNavigator = () => {
  // useAuth is used to switch between Auth and Main application flow
  const { authToken, loading } = useAuth();

  // Show a loading screen while auth state is being determined
  if (loading) {
    return <View style={styles.root}><PlaceholderScreen name="Loading App..." /></View>;
  }

  return (
    <View style={styles.root}>
      {/* Renders Main App if authToken exists, otherwise shows Auth screens */}
      {authToken ? <MainNavigator /> : <AuthNavigator />}
    </View>
  );
};


const App = () => {
  return (
    <NavigationContainer>
      {/* Use primaryDark for the status bar background */}
      <StatusBar barStyle="light-content" backgroundColor={colors.primaryDark} />
      {/* AuthProvider must wrap the entire application to provide context */}
      <AuthProvider> 
        <RootNavigator />
      </AuthProvider>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background
  },
  text: {
    fontSize: 20,
    color: colors.textPrimary,
    fontWeight: 'bold'
  },
  paramsText: {
    marginTop: 10,
    fontSize: 14,
    color: colors.textSecondary
  }
});

export default App;
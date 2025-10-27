import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, StyleSheet, StatusBar } from 'react-native';

// CONTEXT & CONSTANTS
import { AuthProvider, useAuth } from './src/hooks/useAuth';
import colors from './src/constants/colors';

// AUTH SCREENS
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import OTPVerificationScreen from './src/screens/auth/OTPVerificationScreen';

// Placeholder for ForgotPassword
const ForgotPasswordScreen = () => (
  <View style={styles.screen}>
    <Text style={styles.text}>Forgot Password Screen</Text>
    <Text style={styles.paramsText}>Coming Soon!</Text>
  </View>
);

// MAIN SCREENS
import HomeScreen from './src/screens/main/HomeScreen';
import ProfileScreen from './src/screens/main/ProfileScreen';

// PLACEHOLDERS for screens linked from HomeScreen.js
const SearchRidesScreen = (props) => (
  <View style={styles.screen}>
    <Text style={styles.text}>Search Rides</Text>
    {props.route?.params && (
      <Text style={styles.paramsText}>
        Params: {JSON.stringify(props.route.params)}
      </Text>
    )}
  </View>
);

const OfferRideScreen = () => (
  <View style={styles.screen}>
    <Text style={styles.text}>Offer Ride</Text>
  </View>
);

const MyBookingsScreen = () => (
  <View style={styles.screen}>
    <Text style={styles.text}>My Bookings</Text>
  </View>
);

const RideHistoryScreen = () => (
  <View style={styles.screen}>
    <Text style={styles.text}>Ride History</Text>
  </View>
);

const AuthStack = createNativeStackNavigator();
const MainStack = createNativeStackNavigator();

// --- AUTH FLOW ---
const AuthNavigator = () => {
  console.log('Rendering AuthNavigator');
  return (
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
};

// --- MAIN APP FLOW ---
const MainNavigator = () => {
  console.log('Rendering MainNavigator');
  return (
    <MainStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.textLight,
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <MainStack.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <MainStack.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ title: 'My Profile' }}
      />
      <MainStack.Screen 
        name="SearchRides" 
        component={SearchRidesScreen} 
        options={{ title: 'Find Rides' }} 
      />
      <MainStack.Screen 
        name="Offer" 
        component={OfferRideScreen} 
        options={{ title: 'Offer a Ride' }} 
      />
      <MainStack.Screen 
        name="Bookings" 
        component={MyBookingsScreen} 
        options={{ title: 'My Bookings' }} 
      />
      <MainStack.Screen 
        name="History" 
        component={RideHistoryScreen} 
        options={{ title: 'Ride History' }} 
      />
      <MainStack.Screen 
        name="Search" 
        component={SearchRidesScreen} 
        options={{ title: 'Search' }} 
      />
    </MainStack.Navigator>
  );
};

// --- ROOT NAVIGATOR (Auth Switch) ---
const RootNavigator = () => {
  const { authToken, loading } = useAuth();
  
  console.log('RootNavigator - authToken:', authToken);
  console.log('RootNavigator - loading:', loading);

  // Show a loading screen while auth state is being determined
  if (loading) {
    console.log('Showing loading screen');
    return (
      <View style={styles.root}>
        <View style={styles.screen}>
          <Text style={styles.text}>Loading App...</Text>
        </View>
      </View>
    );
  }

  console.log('Rendering:', authToken ? 'MainNavigator' : 'AuthNavigator');
  
  return (
    <View style={styles.root}>
      {authToken ? <MainNavigator /> : <AuthNavigator />}
    </View>
  );
};

const App = () => {
  console.log('App component rendering');
  
  return (
    <NavigationContainer
      onReady={() => console.log('Navigation ready')}
      onStateChange={(state) => console.log('Navigation state:', state)}
    >
      <StatusBar barStyle="light-content" backgroundColor={colors.primaryDark} />
      <AuthProvider> 
        <RootNavigator />
      </AuthProvider>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 20,
  },
  text: {
    fontSize: 20,
    color: colors.textPrimary,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  paramsText: {
    marginTop: 10,
    fontSize: 14,
    color: colors.textSecondary,
  }
});

export default App;
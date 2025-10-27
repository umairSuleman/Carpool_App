import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // const [loaded] = useFonts({
  //   SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  // });

  // This is the new/uncommented part
  useEffect(() => {
    // Hide the splash screen now that the layout is loaded.
    // If you add font loading back, you should move this inside
    // the `if (loaded)` check.
    SplashScreen.hideAsync();
  }, []); // Empty dependency array means this runs once on mount

  // if (!loaded) {
  //   return null;
  // }

  return (
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ title: 'Login' }} />
      </Stack>
  );
}


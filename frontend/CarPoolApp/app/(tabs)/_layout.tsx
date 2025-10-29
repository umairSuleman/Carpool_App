import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    // Stack is used here to define a default wrapper for the app structure
    <Stack>
      {/* This is a placeholder. By default, it finds the (drawer)/_layout.tsx.
        You can hide the header if you want the Drawer layout to manage it. 
      */}
      <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
    </Stack>
  );
}


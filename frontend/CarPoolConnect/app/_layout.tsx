import { Stack } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
// import { GestureHandlerRootView } from 'react-native-gesture-handler';
// const Drawer = createDrawerNavigator(); #manually create drawer using react native - hard pass

export default function RootLayout() {
  return (
    <Drawer>
      <Drawer.Screen name="index" options={{ title: 'Home' }} />
      <Drawer.Screen name="about" options={{ title: 'About' }} />
      <Drawer.Screen name="UserDetails" options={{ title: 'User_Profile' }} />
    </Drawer>
  );
}

// export default function RootLayout() {
//   return (
//     <Stack>
//       <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
//       {/* <Stack.Screen name="index" options={{ title: 'Home' }} />
//       <Stack.Screen name="about" options={{ title: 'About' }} /> */}
//     </Stack>
//   );
// }

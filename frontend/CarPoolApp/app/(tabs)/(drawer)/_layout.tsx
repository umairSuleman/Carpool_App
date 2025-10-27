import { Stack } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
// import { GestureHandlerRootView } from 'react-native-gesture-handler';
// const Drawer = createDrawerNavigator(); #manually create drawer using react native - hard pass

export default function RootLayout() {
  return (
    <Drawer>
      <Drawer.Screen name="home_screen" options={{ title: 'Home' }} />
      <Drawer.Screen name="about" options={{ title: 'About' }} />
      <Drawer.Screen name="user_profile" options={{ title: 'User_Profile' }}/>
      <Drawer.Screen name = "payments" options={{ title: 'Payment History' }}/>
    </Drawer>
  );
}
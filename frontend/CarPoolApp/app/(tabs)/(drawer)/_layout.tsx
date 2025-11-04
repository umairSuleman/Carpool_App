import { Stack } from 'expo-router';
import { Drawer } from 'expo-router/drawer';

export default function RootLayout() {
  return (
    <Drawer>
      <Drawer.Screen name="home_screen" options={{ title: 'Home' }} />
      <Drawer.Screen name="existing_rides" options={{ title: 'Available Rides' }} />
      <Drawer.Screen name="my_bookings" options={{ title: 'My Bookings' }} />
      <Drawer.Screen name="new_ride" options={{ title: 'Create New Ride' }} />
      <Drawer.Screen name="about" options={{ title: 'About' }} />
      <Drawer.Screen name="user_profile" options={{ title: 'User Profile' }}/>
      <Drawer.Screen name="payments" options={{ title: 'Payment History' }}/>
    </Drawer>
  );
}
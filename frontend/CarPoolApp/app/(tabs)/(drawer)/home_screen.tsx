import { StyleSheet, Text, View, TouchableOpacity } from 'react-native'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'expo-router'
import ApiService from '../../../services/api'
import { SafeAreaView } from 'react-native-safe-area-context';

const ListIcon = () => (
  <View style={styles.iconContainer}>
    <Text style={styles.iconText}>📄</Text>
  </View>
);

const PlusIcon = () => (
  <View style={styles.iconContainer}>
    <Text style={styles.iconText}>➕</Text>
  </View>
);

const BookingsIcon = () => (
  <View style={styles.iconContainer}>
    <Text style={styles.iconText}>🎫</Text>
  </View>
);

const Page = () => {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(true);

  useEffect(() => {
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    try {
      const isAuth = await ApiService.isAuthenticated();
      if (!isAuth) {
        setIsGuest(true);
        return;
      }

      const response = await ApiService.getProfile();
      if (response.success && response.user) {
        setIsGuest(false);
        setUserRole(response.user.role || 'passenger');
      } else {
        setIsGuest(true);
      }
    } catch (error) {
      console.error('Error checking user role:', error);
      setIsGuest(true);
    }
  };

  const isDriver = userRole === 'driver' && !isGuest;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Manage Your Rides</Text>
        <Text style={styles.subtitle}>
          {isGuest ? 'Browse available rides' : isDriver ? 'Offer and manage rides' : 'Find and book rides'}
        </Text>

        {/* View Existing Rides - Available to all users */}
        <TouchableOpacity 
          style={styles.card} 
          onPress={() => router.push('/(tabs)/(drawer)/existing_rides')}
        >
          <ListIcon />
          <View style={styles.cardTextContainer}>
            <Text style={styles.cardTitle}>View Available Rides</Text>
            <Text style={styles.cardSubtitle}>
              {isGuest ? 'Browse rides without booking' : 'See upcoming trips and book seats'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* My Bookings - Only for authenticated passengers/drivers */}
        {!isGuest && (
          <TouchableOpacity 
            style={styles.card} 
            onPress={() => router.push('/(tabs)/(drawer)/my_bookings')}
          >
            <BookingsIcon />
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitle}>My Bookings</Text>
              <Text style={styles.cardSubtitle}>View your booked rides</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Create New Ride - Only for drivers */}
        {isDriver && (
          <TouchableOpacity 
            style={styles.card} 
            onPress={() => router.push({ pathname: '/(tabs)/(drawer)/new_ride', params: { presentation: 'modal' } })}
          >
            <PlusIcon />
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitle}>Create a New Ride</Text>
              <Text style={styles.cardSubtitle}>Offer a ride to other users</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Guest Message */}
        {isGuest && (
          <View style={styles.guestNotice}>
            <Text style={styles.guestNoticeText}>
              Sign in to book rides or become a driver to offer rides
            </Text>
            <TouchableOpacity 
              style={styles.signInButton}
              onPress={() => router.push('/login')}
            >
              <Text style={styles.signInButtonText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  )
}

export default Page

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f4f7f8',
  },
  container: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1A1A1A',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF1A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  iconText: {
    fontSize: 24,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  guestNotice: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  guestNoticeText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 15,
  },
  signInButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  signInButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})
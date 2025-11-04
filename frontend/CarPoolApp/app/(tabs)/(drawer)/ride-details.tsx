import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import RideService from '../../../services/rideService';
import BookingService from '../../../services/bookingService';
import ApiService from '../../../services/api';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

/* -------------------- INTERFACES -------------------- */
interface DriverProfile {
  rating: string | number | null;
  total_rides: number;
  smoking: boolean;
  pets: boolean;
  music: boolean;
  chatty: boolean;
}

interface DriverInfo {
  vehicle_model: string;
  vehicle_type: string;
  vehicle_color: string;
  total_seats: number;
}

interface Driver {
  id: string;
  name: string;
  phone: string;
  profile?: DriverProfile | null;
  driverInfo?: DriverInfo | null;
}

interface RideDetails {
  id: string;
  source_address: string;
  destination_address: string;
  source_lat: string | number;
  source_lng: string | number;
  destination_lat: string | number;
  destination_lng: string | number;
  departure_time: string;
  available_seats: number;
  booked_seats: number;
  price_per_seat: string | number;
  distance_km: string | number;
  duration_minutes: number;
  waypoints?: any[];
  driver: Driver;
  bookings?: Array<{
    id: string;
    passenger: {
      id: string;
      name: string;
    };
    seats_booked: number;
  }>;
}

/* -------------------- COMPONENT -------------------- */
const RideDetailsScreen = () => {
  const { rideId } = useLocalSearchParams();
  const router = useRouter();
  const [ride, setRide] = useState<RideDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [seatsToBook, setSeatsToBook] = useState(1);
  const [isGuest, setIsGuest] = useState(true);

  /* -------------------- LOAD DATA -------------------- */
  useEffect(() => {
    checkAuthAndLoadRide();
  }, [rideId]);

  const checkAuthAndLoadRide = async () => {
    try {
      const isAuth = await ApiService.isAuthenticated();
      setIsGuest(!isAuth);
      if (rideId) await loadRideDetails();
    } catch (error) {
      console.error('Auth check failed:', error);
    }
  };

  const loadRideDetails = async () => {
    try {
      setLoading(true);
      console.log('Fetching ride details for:', rideId);

      const response = await RideService.getRideDetails(rideId as string);
      console.log('Raw response:', JSON.stringify(response, null, 2));

      if (response?.success && response?.ride) {
        setRide(response.ride);
      } else {
        throw new Error('Invalid response format.');
      }
    } catch (error: any) {
      console.error('Error loading ride details:', error);
      Alert.alert('Error', error.message || 'Failed to load ride details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  /* -------------------- SAFE ACCESSORS -------------------- */
  const getDriverProfile = (): DriverProfile | null =>
    ride?.driver?.profile || null;

  const getDriverInfo = (): DriverInfo | null =>
    ride?.driver?.driverInfo || null;

  const getRatingDisplay = (): string => {
    const profile = getDriverProfile();
    if (profile?.rating != null) {
      const ratingValue =
        typeof profile.rating === 'string'
          ? parseFloat(profile.rating)
          : profile.rating;
      if (!isNaN(ratingValue)) return ratingValue.toFixed(1);
    }
    return 'New';
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  /* -------------------- BOOKING HANDLERS -------------------- */
  const handleBookRide = () => {
    if (isGuest) {
      Alert.alert('Sign In Required', 'Please sign in to book a ride.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => router.push('/login') },
      ]);
      return;
    }

    if (!ride) return;

    const availableSeats =
      (ride.available_seats ?? 0) - (ride.booked_seats ?? 0);

    if (availableSeats <= 0) {
      Alert.alert('Fully Booked', 'This ride is fully booked.');
      return;
    }

    if (seatsToBook > availableSeats) {
      Alert.alert('Error', `Only ${availableSeats} seat(s) available.`);
      return;
    }

    const pricePerSeat = parseFloat(ride.price_per_seat.toString());
    const totalAmount = pricePerSeat * seatsToBook;

    Alert.alert(
      'Confirm Booking',
      `This will confirm your ${seatsToBook} seat(s) for ₹${totalAmount}.\n\nYou can choose to pay now or pay later from the "My Bookings" screen.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: () => processBooking() },
      ]
    );
  };

  const processBooking = async () => {
    if (!ride) return;

    setBooking(true);
    try {
      const response = await BookingService.createBooking({
        ride_id: ride.id,
        seats_booked: seatsToBook,
        pickup_location: ride.source_address,
        dropoff_location: ride.destination_address,
      });

      if (response.success && response.booking) {
        const{ id: newBookingId, total_amount }= response.booking.booking;

        Alert.alert(
          'Booking Successful!',
          'Your ride is confirmed. Would you like to pay now?',
          [
            {
              text: 'Pay Later',
              style:'cancel',
              onPress: () => router.push('/(tabs)/(drawer)/my_bookings'),
            },
            {
              text: 'Pay Now',
              onPress: () => router.push({
                pathname:'/payment',
                params:{
                  bookingId: newBookingId,
                  amount: total_amount
                }
              }),
            },
          ]
        );
        //await loadRideDetails();
      }
    } catch (error: any) {
      Alert.alert(
        'Booking Failed',
        error.message || 'Could not complete booking.'
      );
    } finally {
      setBooking(false);
    }
  };

  /* -------------------- SEAT COUNTERS -------------------- */
  const incrementSeats = () => {
    const available =
      (ride?.available_seats ?? 0) - (ride?.booked_seats ?? 0);
    if (seatsToBook < available) setSeatsToBook(seatsToBook + 1);
  };

  const decrementSeats = () => {
    if (seatsToBook > 1) setSeatsToBook(seatsToBook - 1);
  };

  /* -------------------- CONDITIONAL RENDER -------------------- */
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading ride details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!ride) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Ride not found</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.canGoBack() && router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  /* -------------------- MAP SAFE VALUES -------------------- */
  const sourceLat = Number(ride.source_lat);
  const sourceLng = Number(ride.source_lng);
  const destLat = Number(ride.destination_lat);
  const destLng = Number(ride.destination_lng);

  const availableSeats =
    (ride.available_seats ?? 0) - (ride.booked_seats ?? 0);
  const pricePerSeat = parseFloat(ride.price_per_seat?.toString() ?? '0');
  const totalAmount = pricePerSeat * seatsToBook;

  const driverProfile = getDriverProfile();
  const driverInfo = getDriverInfo();
  const ratingDisplay = getRatingDisplay();

  /* -------------------- UI -------------------- */
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        {/* Map */}
        {!isNaN(sourceLat) && !isNaN(sourceLng) && (
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              provider={PROVIDER_GOOGLE}
              initialRegion={{
                latitude: sourceLat,
                longitude: sourceLng,
                latitudeDelta: 0.1,
                longitudeDelta: 0.1,
              }}
            >
              <Marker
                coordinate={{ latitude: sourceLat, longitude: sourceLng }}
                title="Pickup"
                pinColor="green"
              />
              {!isNaN(destLat) && !isNaN(destLng) && (
                <Marker
                  coordinate={{ latitude: destLat, longitude: destLng }}
                  title="Drop-off"
                  pinColor="red"
                />
              )}
            </MapView>
          </View>
        )}

        {/* Trip Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trip Details</Text>
          <View style={styles.detailsGrid}>
            <View style={styles.detailCard}>
              <Text style={styles.detailLabel}>Departure</Text>
              <Text style={styles.detailValue}>
                {ride.departure_time ? formatDate(ride.departure_time) : 'N/A'}
              </Text>
            </View>
            <View style={styles.detailCard}>
              <Text style={styles.detailLabel}>Duration</Text>
              <Text style={styles.detailValue}>
                {ride.duration_minutes
                  ? `${Math.floor(ride.duration_minutes / 60)}h ${
                      ride.duration_minutes % 60
                    }m`
                  : 'N/A'}
              </Text>
            </View>
            <View style={styles.detailCard}>
              <Text style={styles.detailLabel}>Distance</Text>
              <Text style={styles.detailValue}>
                {ride.distance_km ? `${ride.distance_km} km` : 'N/A'}
              </Text>
            </View>
            <View style={styles.detailCard}>
              <Text style={styles.detailLabel}>Available</Text>
              <Text
                style={[
                  styles.detailValue,
                  availableSeats === 0 && styles.fullSeats,
                ]}
              >
                {availableSeats} / {ride.available_seats}
              </Text>
            </View>
          </View>
        </View>

        {/* Driver Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Driver</Text>
          <View style={styles.driverCard}>
            <View style={styles.driverAvatar}>
              <Text style={styles.driverInitial}>
                {ride.driver?.name?.charAt(0)?.toUpperCase() ?? '?'}
              </Text>
            </View>
            <View style={styles.driverInfo}>
              <Text style={styles.driverName}>
                {ride.driver?.name ?? 'Unknown'}
              </Text>
              {driverProfile && (
                <View style={styles.ratingRow}>
                  <Text style={styles.rating}>⭐ {ratingDisplay}</Text>
                  <Text style={styles.totalRides}>
                    • {driverProfile.total_rides ?? 0} rides
                  </Text>
                </View>
              )}
              {driverInfo && (
                <Text style={styles.vehicleInfo}>
                  {driverInfo.vehicle_model} • {driverInfo.vehicle_color}
                </Text>
              )}
            </View>
          </View>

          {/* Preferences */}
          {driverProfile && (
            <View style={styles.preferencesContainer}>
              <Text style={styles.preferencesTitle}>Preferences</Text>
              <View style={styles.preferencesGrid}>
                <Preference
                  icon={driverProfile.smoking ? '🚬' : '🚭'}
                  text={driverProfile.smoking ? 'Smoking OK' : 'No Smoking'}
                />
                <Preference
                  icon={driverProfile.pets ? '🐕' : '🚫🐕'}
                  text={driverProfile.pets ? 'Pets OK' : 'No Pets'}
                />
                <Preference
                  icon={driverProfile.music ? '🎵' : '🔇'}
                  text={driverProfile.music ? 'Music' : 'Quiet'}
                />
                <Preference
                  icon={driverProfile.chatty ? '💬' : '🤫'}
                  text={driverProfile.chatty ? 'Chatty' : 'Quiet Ride'}
                />
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Booking Bar */}
      <View style={styles.bottomBar}>
        {availableSeats > 0 ? (
          <TouchableOpacity
            style={[styles.bookButton, booking && styles.bookButtonDisabled]}
            onPress={handleBookRide}
            disabled={booking}
          >
            {booking ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.bookButtonText}>
                {isGuest
                  ? 'Sign In to Book'
                  : `Book Ride - ₹${totalAmount}`}
              </Text>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.fullyBookedContainer}>
            <Text style={styles.fullyBookedText}>This ride is fully booked</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

/* -------------------- SMALL COMPONENT -------------------- */
const Preference = ({
  icon,
  text,
}: {
  icon: string;
  text: string;
}) => (
  <View style={styles.preferenceItem}>
    <Text style={styles.preferenceIcon}>{icon}</Text>
    <Text style={styles.preferenceText}>{text}</Text>
  </View>
);

export default RideDetailsScreen;

/* -------------------- STYLES -------------------- */
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
  },
  backButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  backButtonText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: '600' 
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 18,
    color: '#FF3B30',
  },
  mapContainer: {
    height: 200,
    backgroundColor: '#f0f0f0',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  section: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 15,
  },
  routeInfo: {
    paddingVertical: 10,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  locationText: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: '#007AFF',
    marginLeft: 5,
    marginVertical: 4,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  detailCard: {
    width: '50%',
    padding: 10,
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 5,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  fullSeats: {
    color: '#FF3B30',
  },
  driverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
  },
  driverAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  driverInitial: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  rating: {
    fontSize: 14,
    color: '#666',
  },
  totalRides: {
    fontSize: 14,
    color: '#666',
  },
  vehicleInfo: {
    fontSize: 14,
    color: '#007AFF',
    marginTop: 4,
  },
  preferencesContainer: {
    marginTop: 15,
  },
  preferencesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 10,
  },
  preferencesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  preferenceItem: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  preferenceIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  preferenceText: {
    fontSize: 14,
    color: '#666',
  },
  bookingCard: {
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
  },
  seatsSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  seatsSelectorLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  seatsControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seatsButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  seatsButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  seatsValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginHorizontal: 20,
    minWidth: 30,
    textAlign: 'center',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  priceLabel: {
    fontSize: 16,
    color: '#666',
  },
  priceValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  bottomBar: {
    padding: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  bookButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  bookButtonDisabled: {
    backgroundColor: '#ccc',
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  fullyBookedContainer: {
    padding: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    alignItems: 'center',
  },
  fullyBookedText: {
    fontSize: 16,
    color: '#666',
  },
});
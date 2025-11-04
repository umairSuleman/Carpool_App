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
import RideService from '../services/rideService';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import polyline from '@mapbox/polyline';

interface RideDetails {
  id: string;
  source_address: string;
  destination_address: string;
  source_lat: number;
  source_lng: number;
  destination_lat: number;
  destination_lng: number;
  departure_time: string;
  available_seats: number;
  booked_seats: number;
  price_per_seat: number;
  distance_km: number;
  duration_minutes: number;
  waypoints?: any[];
  driver: {
    id: string;
    name: string;
    phone: string;
    profile?: {
      rating: number | null;
      total_rides: number;
      smoking: boolean;
      pets: boolean;
      music: boolean;
      chatty: boolean;
    };
    driverInfo?: {
      vehicle_model: string;
      vehicle_type: string;
      vehicle_color: string;
      total_seats: number;
    };
  };
  bookings?: Array<{
    id: string;
    passenger: {
      id: string;
      name: string;
    };
    seats_booked: number;
  }>;
}

const RideDetailsScreen = () => {
  const { rideId } = useLocalSearchParams();
  const router = useRouter();
  const [ride, setRide] = useState<RideDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [seatsToBook, setSeatsToBook] = useState(1);

  useEffect(() => {
    if (rideId) {
      loadRideDetails();
    }
  }, [rideId]);

  const loadRideDetails = async () => {
    try {
      setLoading(true);
      const response = await RideService.getRideDetails(rideId as string);
      
      if (response.success && response.ride) {
        setRide(response.ride);
      }
    } catch (error: any) {
      console.error('Error loading ride details:', error);
      Alert.alert('Error', 'Failed to load ride details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleBookRide = () => {
    if (!ride) return;

    const availableSeats = ride.available_seats - ride.booked_seats;
    
    if (availableSeats === 0) {
      Alert.alert('Fully Booked', 'This ride is fully booked');
      return;
    }

    if (seatsToBook > availableSeats) {
      Alert.alert('Error', `Only ${availableSeats} seat(s) available`);
      return;
    }

    const totalAmount = ride.price_per_seat * seatsToBook;

    Alert.alert(
      'Confirm Booking',
      `Book ${seatsToBook} seat(s) for ₹${totalAmount}?\n\nFrom: ${ride.source_address}\nTo: ${ride.destination_address}\nDate: ${formatDate(ride.departure_time)}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => processBooking(),
        },
      ]
    );
  };

  const processBooking = async () => {
    // TODO: Implement booking API call
    setBooking(true);
    
    // Simulated booking - replace with actual API call
    setTimeout(() => {
      setBooking(false);
      Alert.alert(
        'Booking Successful!',
        'Your ride has been booked. The driver will contact you shortly.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    }, 1500);
  };

  const incrementSeats = () => {
    if (ride) {
      const available = ride.available_seats - ride.booked_seats;
      if (seatsToBook < available) {
        setSeatsToBook(seatsToBook + 1);
      }
    }
  };

  const decrementSeats = () => {
    if (seatsToBook > 1) {
      setSeatsToBook(seatsToBook - 1);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading ride details...</Text>
      </View>
    );
  }

  if (!ride) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Ride not found</Text>
      </View>
    );
  }

  const availableSeats = ride.available_seats - ride.booked_seats;
  const totalAmount = ride.price_per_seat * seatsToBook;
  
  // Safely get rating display value
  const ratingDisplay = (ride.driver.profile?.rating != null && typeof ride.driver.profile.rating === 'number')
    ? ride.driver.profile.rating.toFixed(1) 
    : 'New';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        {/* Map */}
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={{
              latitude: ride.source_lat,
              longitude: ride.source_lng,
              latitudeDelta: 0.1,
              longitudeDelta: 0.1,
            }}
          >
            <Marker
              coordinate={{
                latitude: ride.source_lat,
                longitude: ride.source_lng,
              }}
              title="Pickup"
              pinColor="green"
            />
            <Marker
              coordinate={{
                latitude: ride.destination_lat,
                longitude: ride.destination_lng,
              }}
              title="Drop-off"
              pinColor="red"
            />
          </MapView>
        </View>

        {/* Route Info */}
        <View style={styles.section}>
          <View style={styles.routeInfo}>
            <View style={styles.locationContainer}>
                <View style={[styles.locationDot, { backgroundColor: '#34C759' }]} />
                <Text style={styles.locationText} numberOfLines={2}>
                    {ride.source_address}
                </Text>
            </View>
            <View style={styles.routeLine} />
            <View style={styles.locationContainer}>
                <View style={[styles.locationDot, { backgroundColor: '#FF3B30' }]} />
                <Text style={styles.locationText} numberOfLines={2}>
                    {ride.destination_address}
                </Text>
            </View>
          </View>
        </View>

        {/* Trip Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trip Details</Text>
          <View style={styles.detailsGrid}>
            <View style={styles.detailCard}>
              <Text style={styles.detailLabel}>Departure</Text>
              <Text style={styles.detailValue}>{formatDate(ride.departure_time)}</Text>
            </View>
            <View style={styles.detailCard}>
              <Text style={styles.detailLabel}>Duration</Text>
              <Text style={styles.detailValue}>
                {Math.floor(ride.duration_minutes / 60)}h {ride.duration_minutes % 60}m
              </Text>
            </View>
            <View style={styles.detailCard}>
              <Text style={styles.detailLabel}>Distance</Text>
              <Text style={styles.detailValue}>{ride.distance_km} km</Text>
            </View>
            <View style={styles.detailCard}>
              <Text style={styles.detailLabel}>Available</Text>
              <Text style={[styles.detailValue, availableSeats === 0 && styles.fullSeats]}>
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
                {ride.driver.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.driverInfo}>
              <Text style={styles.driverName}>{ride.driver.name}</Text>
              {ride.driver.profile && (
                <View style={styles.ratingRow}>
                  <Text style={styles.rating}>
                    ⭐ {ratingDisplay}
                  </Text>
                  <Text style={styles.totalRides}>
                    • {ride.driver.profile.total_rides || 0} rides
                  </Text>
                </View>
              )}
              {ride.driver.driverInfo && (
                <Text style={styles.vehicleInfo}>
                  {ride.driver.driverInfo.vehicle_model} • {ride.driver.driverInfo.vehicle_color}
                </Text>
              )}
            </View>
          </View>

          {/* Preferences */}
          {ride.driver.profile && (
            <View style={styles.preferencesContainer}>
              <Text style={styles.preferencesTitle}>Preferences</Text>
              <View style={styles.preferencesGrid}>
                <View style={styles.preferenceItem}>
                  <Text style={styles.preferenceIcon}>
                    {ride.driver.profile.smoking ? '🚬' : '🚭'}
                  </Text>
                  <Text style={styles.preferenceText}>
                    {ride.driver.profile.smoking ? 'Smoking OK' : 'No Smoking'}
                  </Text>
                </View>
                <View style={styles.preferenceItem}>
                  <Text style={styles.preferenceIcon}>
                    {ride.driver.profile.pets ? '🐕' : '🚫🐕'}
                  </Text>
                  <Text style={styles.preferenceText}>
                    {ride.driver.profile.pets ? 'Pets OK' : 'No Pets'}
                  </Text>
                </View>
                <View style={styles.preferenceItem}>
                  <Text style={styles.preferenceIcon}>
                    {ride.driver.profile.music ? '🎵' : '🔇'}
                  </Text>
                  <Text style={styles.preferenceText}>
                    {ride.driver.profile.music ? 'Music' : 'Quiet'}
                  </Text>
                </View>
                <View style={styles.preferenceItem}>
                  <Text style={styles.preferenceIcon}>
                    {ride.driver.profile.chatty ? '💬' : '🤫'}
                  </Text>
                  <Text style={styles.preferenceText}>
                    {ride.driver.profile.chatty ? 'Chatty' : 'Quiet Ride'}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Booking Section */}
        {availableSeats > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Book Your Ride</Text>
            <View style={styles.bookingCard}>
              <View style={styles.seatsSelector}>
                <Text style={styles.seatsSelectorLabel}>Number of seats:</Text>
                <View style={styles.seatsControls}>
                  <TouchableOpacity
                    style={styles.seatsButton}
                    onPress={decrementSeats}
                    disabled={seatsToBook <= 1}
                  >
                    <Text style={styles.seatsButtonText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.seatsValue}>{seatsToBook}</Text>
                  <TouchableOpacity
                    style={styles.seatsButton}
                    onPress={incrementSeats}
                    disabled={seatsToBook >= availableSeats}
                  >
                    <Text style={styles.seatsButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Total Amount:</Text>
                <Text style={styles.priceValue}>₹{totalAmount}</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Action Button */}
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
              <Text style={styles.bookButtonText}>Book Ride - ₹{totalAmount}</Text>
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

export default RideDetailsScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
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
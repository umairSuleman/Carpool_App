import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  TouchableOpacity, 
  RefreshControl,
  ActivityIndicator,
  Alert
} from 'react-native'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'expo-router'
import BookingService from '../../../services/bookingService'

interface Booking {
  id: string;
  ride_id: string;
  seats_booked: number;
  total_price: number;
  status: string;
  created_at: string;
  ride: {
    id: string;
    source_address: string;
    destination_address: string;
    departure_time: string;
    price_per_seat: number;
    distance_km: number;
    duration_minutes: number;
    driver: {
      id: string;
      name: string;
      profile?: {
        rating: number | null;
        total_rides: number;
      };
      driverInfo?: {
        vehicle_model: string;
        vehicle_type: string;
        vehicle_color: string;
      };
    };
  };
}

const MyBookingsScreen = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed' | 'cancelled'>('upcoming');
  const router = useRouter();

  useEffect(() => {
    loadBookings();
  }, [filter]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const status = filter === 'all' ? undefined : filter;
      const response = await BookingService.getMyBookings(status);
      
      if (response.success && response.bookings) {
        setBookings(response.bookings);
      }
    } catch (error: any) {
      console.error('Error loading bookings:', error);
      Alert.alert('Error', 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBookings();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleTimeString('en-IN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })}`;
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow, ${date.toLocaleTimeString('en-IN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })}`;
    } else {
      return date.toLocaleDateString('en-IN', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const handleCancelBooking = (bookingId: string) => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking? This action cannot be undone.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await BookingService.cancelBooking(bookingId, {
                reason: 'User requested cancellation'
              });

              if (response.success) {
                Alert.alert('Success', 'Booking cancelled successfully');
                loadBookings();
              }
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to cancel booking');
            }
          }
        }
      ]
    );
  };

  const handleViewDetails = (booking: Booking) => {
    router.push({
      pathname: '/ride-details',
      params: { rideId: booking.ride_id }
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return '#34C759';
      case 'pending':
        return '#FF9500';
      case 'cancelled':
        return '#FF3B30';
      case 'completed':
        return '#007AFF';
      default:
        return '#666';
    }
  };

  const renderBookingItem = ({ item }: { item: Booking }) => {
    const ratingDisplay = (item.ride.driver.profile?.rating != null && typeof item.ride.driver.profile.rating === 'number')
      ? item.ride.driver.profile.rating.toFixed(1) 
      : 'New';
    
    const canCancel = item.status.toLowerCase() === 'confirmed' || item.status.toLowerCase() === 'pending';
    
    return (
      <TouchableOpacity 
        style={styles.bookingCard}
        onPress={() => handleViewDetails(item)}
      >
        <View style={styles.statusBadge}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>

        <View style={styles.routeContainer}>
          <View style={styles.locationRow}>
            <View style={[styles.locationDot, { backgroundColor: '#34C759' }]} />
            <Text style={styles.address} numberOfLines={1}>
              {item.ride.source_address}
            </Text>
          </View>
          <View style={styles.routeLine} />
          <View style={styles.locationRow}>
            <View style={[styles.locationDot, { backgroundColor: '#FF3B30' }]} />
            <Text style={styles.address} numberOfLines={1}>
              {item.ride.destination_address}
            </Text>
          </View>
        </View>

        <View style={styles.bookingDetails}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Departure</Text>
            <Text style={styles.detailValue}>{formatDate(item.ride.departure_time)}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Seats</Text>
            <Text style={styles.detailValue}>{item.seats_booked}</Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Total</Text>
            <Text style={styles.priceValue}>₹{item.total_price}</Text>
          </View>
        </View>

        <View style={styles.driverInfo}>
          <View style={styles.driverAvatar}>
            <Text style={styles.driverInitial}>
              {item.ride.driver.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.driverDetails}>
            <Text style={styles.driverName}>{item.ride.driver.name}</Text>
            {item.ride.driver.profile && (
              <View style={styles.ratingContainer}>
                <Text style={styles.rating}>⭐ {ratingDisplay}</Text>
                <Text style={styles.totalRides}>
                  • {item.ride.driver.profile.total_rides || 0} rides
                </Text>
              </View>
            )}
          </View>
          {item.ride.driver.driverInfo && (
            <View style={styles.vehicleInfo}>
              <Text style={styles.vehicleText} numberOfLines={1}>
                {item.ride.driver.driverInfo.vehicle_model}
              </Text>
            </View>
          )}
        </View>

        {canCancel && (
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => handleCancelBooking(item.id)}
          >
            <Text style={styles.cancelButtonText}>Cancel Booking</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading bookings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Bookings</Text>
        <View style={styles.filterContainer}>
          {['all', 'upcoming', 'completed', 'cancelled'].map((filterOption) => (
            <TouchableOpacity
              key={filterOption}
              style={[
                styles.filterButton,
                filter === filterOption && styles.filterButtonActive
              ]}
              onPress={() => setFilter(filterOption as any)}
            >
              <Text style={[
                styles.filterButtonText,
                filter === filterOption && styles.filterButtonTextActive
              ]}>
                {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={bookings}
        renderItem={renderBookingItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No bookings found</Text>
            <Text style={styles.emptySubtext}>
              {filter === 'upcoming' 
                ? 'Book a ride to get started' 
                : 'No bookings in this category'}
            </Text>
          </View>
        }
      />
    </View>
  );
};

export default MyBookingsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 15,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: 15,
  },
  bookingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  routeContainer: {
    marginBottom: 15,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  locationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  address: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  routeLine: {
    width: 2,
    height: 16,
    backgroundColor: '#007AFF',
    marginLeft: 4,
    marginVertical: 2,
  },
  bookingDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
    marginBottom: 15,
  },
  detailItem: {
    flex: 1,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  priceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  driverAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  driverInitial: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  rating: {
    fontSize: 13,
    color: '#666',
  },
  totalRides: {
    fontSize: 13,
    color: '#666',
  },
  vehicleInfo: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  vehicleText: {
    fontSize: 12,
    color: '#666',
    maxWidth: 100,
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
  },
});
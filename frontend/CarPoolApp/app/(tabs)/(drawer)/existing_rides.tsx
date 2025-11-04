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
import RideService from '../../../services/rideService'

interface Ride {
  id: string;
  source_address: string;
  destination_address: string;
  departure_time: string;
  available_seats: number;
  booked_seats: number;
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
}

const ExistingRidesScreen = () => {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadRides();
  }, []);

  const loadRides = async () => {
    try {
      setLoading(true);
      const response = await RideService.getUpcomingRides(50);
      
      if (response.success && response.rides) {
        setRides(response.rides);
      }
    } catch (error: any) {
      console.error('Error loading rides:', error);
      Alert.alert('Error', 'Failed to load rides');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRides();
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

  const handleRidePress = (ride: Ride) => {
    // Navigate to ride details screen 
    router.push({
      pathname: '/(tabs)/(drawer)/ride-details',
      params: { rideId: ride.id }
    });
  };

  const renderRideItem = ({ item }: { item: Ride }) => {
    const availableSeats = item.available_seats - item.booked_seats;
    
    // Safely get rating display value
    const ratingDisplay = (item.driver.profile?.rating != null)
    ? (typeof item.driver.profile.rating === 'string' 
        ? parseFloat(item.driver.profile.rating).toFixed(1)
        : item.driver.profile.rating.toFixed(1))
    : 'New';
    
    return (
      <TouchableOpacity 
        style={styles.rideCard}
        onPress={() => handleRidePress(item)}
      >
        <View style={styles.rideHeader}>
          <View style={styles.routeContainer}>
            <Text style={styles.address} numberOfLines={1}>
              {item.source_address}
            </Text>
            <Text style={styles.arrow}>→</Text>
            <Text style={styles.address} numberOfLines={1}>
              {item.destination_address}
            </Text>
          </View>
          <Text style={styles.price}>₹{item.price_per_seat}</Text>
        </View>

        <View style={styles.rideDetails}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Departure</Text>
            <Text style={styles.detailValue}>{formatDate(item.departure_time)}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Duration</Text>
            <Text style={styles.detailValue}>
              {Math.floor(item.duration_minutes / 60)}h {item.duration_minutes % 60}m
            </Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Available</Text>
            <Text style={[
              styles.detailValue,
              availableSeats === 0 && styles.fullSeats
            ]}>
              {availableSeats} seat{availableSeats !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        <View style={styles.driverInfo}>
          <View style={styles.driverAvatar}>
            <Text style={styles.driverInitial}>
              {item.driver.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.driverDetails}>
            <Text style={styles.driverName}>{item.driver.name}</Text>
            {item.driver.profile && (
              <View style={styles.ratingContainer}>
                <Text style={styles.rating}>
                  ⭐ {ratingDisplay}
                </Text>
                <Text style={styles.totalRides}>
                  • {item.driver.profile.total_rides || 0} rides
                </Text>
              </View>
            )}
          </View>
          {item.driver.driverInfo && (
            <View style={styles.vehicleInfo}>
              <Text style={styles.vehicleText} numberOfLines={1}>
                {item.driver.driverInfo.vehicle_model}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading rides...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Available Rides</Text>
        <Text style={styles.subtitle}>{rides.length} ride{rides.length !== 1 ? 's' : ''} found</Text>
      </View>

      <FlatList
        data={rides}
        renderItem={renderRideItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No rides available</Text>
            <Text style={styles.emptySubtext}>Check back later or create a ride</Text>
          </View>
        }
      />
    </View>
  );
};

export default ExistingRidesScreen;

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
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  listContent: {
    padding: 15,
  },
  rideCard: {
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
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  routeContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  address: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  arrow: {
    fontSize: 18,
    color: '#007AFF',
    marginHorizontal: 8,
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  rideDetails: {
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
  fullSeats: {
    color: '#FF3B30',
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
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
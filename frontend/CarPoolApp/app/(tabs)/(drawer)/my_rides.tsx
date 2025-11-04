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
import RideService from '../../../services/rideService' // Using existing service
import ApiService from '../../../services/api' // To get user ID

interface Ride {
  id: string;
  source_address: string;
  destination_address: string;
  departure_time: string;
  available_seats: number;
  booked_seats: number;
  price_per_seat: number;
  status: 'active' | 'in_progress' | 'completed' | 'cancelled';
  // Add other fields as needed
}

const MyRidesScreen = () => {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    try {
      setLoading(true);
      // Get current user's ID
      const profile = await ApiService.getProfile();
      if (profile.success && profile.user) {
        setUserId(profile.user.id);
        
        // Fetch driver's rides
        const response = await RideService.getMyRides('active'); // Fetch active rides
        
        if (response.success && response.rides) {
          setRides(response.rides);
        }
      } else {
        throw new Error('Could not get user profile');
      }
    } catch (error: any) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load your rides');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleRidePress = (ride: Ride) => {
    if (!userId) {
      Alert.alert("Error", "User ID not found");
      return;
    }
    
    // Navigate to the live tracking screen
    router.push({
      pathname: '/live-tracking', // Use the root-level screen
      params: { 
        rideId: ride.id,
        role: 'driver',
        userId: userId
      }
    });
  };
  
  const getStatusColor = (status: string) => {
    if (status === 'in_progress') return '#007AFF'; // Blue
    if (status === 'active') return '#34C759'; // Green
    return '#666';
  };

  const renderRideItem = ({ item }: { item: Ride }) => {
    const available = item.available_seats - item.booked_seats;
    
    return (
      <TouchableOpacity 
        style={styles.rideCard}
        onPress={() => handleRidePress(item)}
      >
        <View style={styles.rideHeader}>
          <Text style={styles.address} numberOfLines={1}>
            {item.source_address} → {item.destination_address}
          </Text>
          <Text style={styles.price}>₹{item.price_per_seat}</Text>
        </View>

        <View style={styles.rideDetails}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Departure</Text>
            <Text style={styles.detailValue}>{formatDate(item.departure_time)}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Status</Text>
            <Text style={[styles.detailValue, { color: getStatusColor(item.status) }]}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Booked</Text>
            <Text style={styles.detailValue}>
              {item.booked_seats} / {item.available_seats}
            </Text>
          </View>
        </View>
        
        <Text style={styles.tapToTrack}>
          {item.status === 'active' ? 'Tap to start ride' : 'Tap to view live tracking'}
        </Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading your rides...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Rides (Driver)</Text>
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
            <Text style={styles.emptyText}>No active rides</Text>
            <Text style={styles.emptySubtext}>Create a new ride to get started</Text>
          </View>
        }
      />
    </View>
  );
};

export default MyRidesScreen;

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
    marginBottom: 10,
  },
  address: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    marginLeft: 10,
  },
  rideDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: '#eee',
    marginBottom: 10,
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
  tapToTrack: {
    textAlign: 'center',
    color: '#007AFF',
    fontWeight: '500',
    fontSize: 14,
    marginTop: 5,
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
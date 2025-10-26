import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput
} from 'react-native';

const HomeScreen = ({ navigation }) => {
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');

  const quickActions = [
    { icon: '🔍', label: 'Find Ride', color: '#10b981', action: 'Search' },
    { icon: '🚗➕', label: 'Offer Ride', color: '#3b82f6', action: 'Offer' },
    { icon: '📅', label: 'My Bookings', color: '#f59e0b', action: 'Bookings' },
    { icon: '📜', label: 'Ride History', color: '#8b5cf6', action: 'History' },
  ];

  const recentRides = [
    {
      id: '1',
      from: 'Koramangala',
      to: 'Whitefield',
      date: 'Today, 6:30 PM',
      price: '₹150',
      driver: 'Rajesh Kumar',
      rating: 4.8,
    },
    {
      id: '2',
      from: 'Indiranagar',
      to: 'Electronic City',
      date: 'Today, 7:00 PM',
      price: '₹200',
      driver: 'Priya Sharma',
      rating: 4.9,
    },
  ];

  const handleSearch = () => {
    navigation.navigate('SearchRides', { source, destination });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Welcome back! 👋</Text>
        <Text style={styles.subtitle}>Where do you want to go?</Text>
      </View>

      <View style={styles.searchCard}>
        <View style={styles.searchInput}>
          <Text style={styles.locationIcon}>📍</Text>
          <TextInput
            style={styles.input}
            placeholder="Pickup location"
            value={source}
            onChangeText={setSource}
            placeholderTextColor="#9ca3af"
          />
        </View>
        
        <View style={styles.searchDivider} />
        
        <View style={styles.searchInput}>
          <Text style={styles.locationIcon}>🎯</Text>
          <TextInput
            style={styles.input}
            placeholder="Drop-off location"
            value={destination}
            onChangeText={setDestination}
            placeholderTextColor="#9ca3af"
          />
        </View>

        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchIcon}>🔍</Text>
          <Text style={styles.searchButtonText}>Search Rides</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.quickActionsContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.actionCard}
              onPress={() => navigation.navigate(action.action)}
            >
              <View style={[styles.actionIcon, { backgroundColor: action.color + '20' }]}>
                <Text style={styles.actionEmoji}>{action.icon}</Text>
              </View>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.recentRidesContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Available Rides</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {recentRides.map((ride) => (
          <TouchableOpacity key={ride.id} style={styles.rideCard}>
            <View style={styles.rideHeader}>
              <View style={styles.driverInfo}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{ride.driver.charAt(0)}</Text>
                </View>
                <View>
                  <Text style={styles.driverName}>{ride.driver}</Text>
                  <View style={styles.ratingRow}>
                    <Text style={styles.star}>⭐</Text>
                    <Text style={styles.ratingText}>{ride.rating}</Text>
                  </View>
                </View>
              </View>
              <Text style={styles.price}>{ride.price}</Text>
            </View>

            <View style={styles.rideRoute}>
              <View style={styles.locationRow}>
                <Text style={styles.dot}>🟢</Text>
                <Text style={styles.locationText}>{ride.from}</Text>
              </View>
              <View style={styles.routeLine} />
              <View style={styles.locationRow}>
                <Text style={styles.dot}>🔴</Text>
                <Text style={styles.locationText}>{ride.to}</Text>
              </View>
            </View>

            <Text style={styles.rideTime}>{ride.date}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    padding: 20,
    backgroundColor: '#10b981',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#dcfce7',
    marginTop: 4,
  },
  searchCard: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: -30,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  locationIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
  },
  searchDivider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginVertical: 8,
  },
  searchButton: {
    flexDirection: 'row',
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  searchIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  quickActionsContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionEmoji: {
    fontSize: 28,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    textAlign: 'center',
  },
  recentRidesContainer: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seeAll: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '600',
  },
  rideCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
    marginBottom: 12,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  driverName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  star: {
    fontSize: 14,
  },
  ratingText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10b981',
  },
  rideRoute: {
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  dot: {
    fontSize: 10,
  },
  locationText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
  },
  routeLine: {
    width: 2,
    height: 12,
    backgroundColor: '#d1d5db',
    marginLeft: 4,
    marginVertical: 2,
  },
  rideTime: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
});

export default HomeScreen;
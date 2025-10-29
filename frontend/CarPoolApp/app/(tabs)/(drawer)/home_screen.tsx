

import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView } from 'react-native'
import React from 'react'
import { useRouter } from 'expo-router'

// Simple inline SVG components for icons
const ListIcon = () => (
  <View style={styles.iconContainer}>
    <Text style={styles.iconText}>📄</Text> 
    {/* Using an emoji as a simple, effective icon */}
  </View>
);

const PlusIcon = () => (
  <View style={styles.iconContainer}>
    <Text style={styles.iconText}>➕</Text> 
  </View>
);

const Page = () => {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Manage Your Rides</Text>
        <Text style={styles.subtitle}>What would you like to do?</Text>

        <TouchableOpacity 
          style={styles.card} 
          onPress={() => router.push('/(tabs)/(drawer)/existing_rides')}
        >
          <ListIcon />
          <View style={styles.cardTextContainer}>
            <Text style={styles.cardTitle}>View Existing Rides</Text>
            <Text style={styles.cardSubtitle}>See your upcoming and past trips</Text>
          </View>
        </TouchableOpacity>

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
      </View>
    </SafeAreaView>
  )
}

export default Page

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f4f7f8', // A light grey background
  },
  container: {
    flex: 1,
    justifyContent: "flex-start", // Align items to the top
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
    // Shadow
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
    backgroundColor: '#007AFF1A', // Light blue background
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
})


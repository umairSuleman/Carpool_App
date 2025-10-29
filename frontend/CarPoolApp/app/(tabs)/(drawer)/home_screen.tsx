import { StyleSheet, Text, View, TouchableOpacity } from 'react-native'
import React from 'react'
import { useRouter } from 'expo-router'

type Props = {}

const Page = (props: Props) => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Manage Your Rides</Text>
      <Text style={styles.subtitle}>What would you like to do?</Text>

      <TouchableOpacity 
        style={styles.button} 
        onPress={() => router.push('/(tabs)/(drawer)/existing_rides')}
      >
        <Text style={styles.buttonText}>View Existing Rides</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, styles.createButton]} 
        onPress={() => router.push('/(tabs)/(drawer)/new_ride')}
      >
        <Text style={styles.buttonText}>Create a New Ride</Text>
      </TouchableOpacity>
    </View>
  )
}

export default Page

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
    marginBottom: 20,
  },
  createButton: {
    backgroundColor: '#34C759', // A green color for "create"
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
})

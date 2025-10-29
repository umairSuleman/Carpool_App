import { StyleSheet, Text, View } from 'react-native'
import React from 'react'

const ExistingRidesScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Existing Rides</Text>
      <Text>A list of all available rides will go here.</Text>
    </View>
  )
}

export default ExistingRidesScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
  }
})

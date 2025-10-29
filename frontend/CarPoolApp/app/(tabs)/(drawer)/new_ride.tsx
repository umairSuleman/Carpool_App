import { StyleSheet, TextInput, View, Text, Button, ScrollView } from 'react-native'
// Import useRef, useState and PROVIDER_GOOGLE
import React, { useState, useRef } from 'react'
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps'; 
// Import the new directions library
import MapViewDirections from 'react-native-maps-directions';

const Page = () => {
  // --- ADD YOUR GOOGLE MAPS API KEY HERE ---
  const apiKey = 'AIzaSyBwyBTlQX4vbh1jf49SnKVzHdA6HOH1fjo'; // Make sure this is your valid key

  // --- MAP REFERENCE ---
  const mapRef = useRef<MapView>(null); // Used to control the map's camera

  // --- STATE FOR ADDRESS INPUTS ---
  const [startAddress, setStartAddress] = useState('');
  const [endAddress, setEndAddress] = useState('');
  const [waypoints, setWaypoints] = useState<string[]>([]); // Holds waypoint addresses

  // --- STATE FOR MAPVIEWDIRECTIONS ---
  // These are set when the user presses "Find Route" to trigger the component
  const [origin, setOrigin] = useState<string | null>(null);
  const [destination, setDestination] = useState<string | null>(null);
  const [routeWaypoints, setRouteWaypoints] = useState<string[]>([]);

  /**
   * Triggers the MapViewDirections component to draw the route
   */
  const handleFindRoute = () => {
    if (apiKey === 'YOUR_GOOGLE_MAPS_API_KEY') {
      alert("Please add your Google Maps API key to the code.");
      return;
    }

    if (!startAddress || !endAddress) {
      alert("Please enter a start and end address.");
      return;
    }

    // Set the state that will be passed to MapViewDirections
    setOrigin(startAddress);
    setDestination(endAddress);
    setRouteWaypoints(waypoints.filter(wp => wp.length > 0));
  };

  /**
   * Adds a new empty text input for a waypoint
   */
  const addWaypointInput = () => {
    setWaypoints([...waypoints, '']);
  };

  /**
   * Updates the specific waypoint text when user types
   */
  const updateWaypoint = (text: string, index: number) => {
    const newWaypoints = [...waypoints];
    newWaypoints[index] = text;
    setWaypoints(newWaypoints);
  };

  /**
   * Resets the entire map and all inputs
   */
  const resetMap = () => {
    setStartAddress('');
    setEndAddress('');
    setWaypoints([]);
    setOrigin(null);
    setDestination(null);
    setRouteWaypoints([]);
  };

  return (
    <View style={styles.container}>
      {/* --- CONTROL PANEL --- */}
      <View style={styles.controlsContainer}>
        <ScrollView>
          <TextInput
            style={styles.input}
            placeholder="Start Address"
            value={startAddress}
            onChangeText={setStartAddress}
          />
          {waypoints.map((wp, index) => (
            <TextInput
              key={index}
              style={styles.input}
              placeholder={`Stop ${index + 1}`}
              value={wp}
              onChangeText={(text) => updateWaypoint(text, index)}
            />
          ))}
          <Button title="Add Stop" onPress={addWaypointInput} />
          <TextInput
            style={styles.input}
            placeholder="End Address"
            value={endAddress}
            onChangeText={setEndAddress}
          />
          <View style={styles.buttonRow}>
            <Button title="Find Route" onPress={handleFindRoute} />
            <Button title="Reset" onPress={resetMap} color="red" />
          </View>
        </ScrollView>
      </View>

      <MapView 
        ref={mapRef} // Add the ref to the map
        style={styles.map} 
        provider={PROVIDER_GOOGLE} // Use Google Maps
        initialRegion={{
          latitude: 37.78825,
          longitude: -122.4324,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      >
        {/* --- GOOGLE MAPS DIRECTIONS --- */}
        {/* This component handles all API calls and route drawing */}
        {origin && destination && (
          <MapViewDirections
            origin={origin}
            destination={destination}
            waypoints={routeWaypoints}
            apikey={apiKey}
            strokeWidth={5}
            strokeColor="#007AFF"
            onReady={result => {
              // This callback gives us route info
              console.log(`Duration: ${result.duration} min. Distance: ${result.distance} km.`);
              
              // Zoom the map to fit the route
              mapRef.current?.fitToCoordinates(result.coordinates, {
                edgePadding: {
                  top: 50,
                  right: 50,
                  bottom: 50,
                  left: 50,
                },
              });
            }}
            onError={(errorMessage) => {
              console.error("MapViewDirections Error:", errorMessage);
              alert("Error finding route. Check console for details.");
            }}
          />
        )}
      </MapView>

      {/* Attribution is no longer needed, Google Maps adds its own logo */}
    </View>
  )
}

export default Page

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // --- STYLES FOR CONTROLS ---
  controlsContainer: {
    maxHeight: '45%', // Limit height of controls
    backgroundColor: 'white',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  input: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  // --- END NEW STYLES ---
  map: {
    width: '100%',
    height: '100%', // Map will fill remaining space
  },
  // --- ATTRIBUTION STYLES REMOVED ---
})


import { 
  StyleSheet, 
  TextInput, 
  View, 
  Text, 
  TouchableOpacity, 
  Platform,
  SafeAreaView
} from 'react-native'
// Import new gesture handler
import { GestureHandlerRootView } from 'react-native-gesture-handler';
// Import useRef, useState, and useMemo
import React, { useState, useRef, useMemo } from 'react'
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps'; 
// Import the new directions library
import MapViewDirections from 'react-native-maps-directions';
// Import the new Bottom Sheet components
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';

const Page = () => {
  // --- ADD YOUR GOOGLE MAPS API KEY HERE ---
  const apiKey = 'AIzaSyBwyBTlQX4vbh1jf49SnKVzHdA6HOH1fjo'; // Make sure this is your valid key

  // --- REFS ---
  const mapRef = useRef<MapView>(null); // For the map
  const bottomSheetRef = useRef<BottomSheet>(null); // For the bottom sheet

  // --- STATE FOR ADDRESS INPUTS ---
  const [startAddress, setStartAddress] = useState('');
  const [endAddress, setEndAddress] = useState('');
  const [waypoints, setWaypoints] = useState<string[]>([]); // Holds waypoint addresses

  // --- STATE FOR MAPVIEWDIRECTIONS ---
  const [origin, setOrigin] = useState<string | null>(null);
  const [destination, setDestination] = useState<string | null>(null);
  const [routeWaypoints, setRouteWaypoints] = useState<string[]>([]);

  // --- RIDE INFO STATE ---
  const [rideInfo, setRideInfo] = useState<{ duration: number, distance: number } | null>(null);
  const [spots, setSpots] = useState(1); // State for available spots
  
  // --- UI State ---
  const [isRouteFound, setIsRouteFound] = useState(false);

  // --- BOTTOM SHEET CONFIG ---
  // Snap points for the drawer: 30% (collapsed), 75% (expanded)
  const snapPoints = useMemo(() => ['30%', '75%'], []);

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
    setRideInfo(null); 
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
   * Removes a waypoint input
   */
  const removeWaypoint = (index: number) => {
    const newWaypoints = [...waypoints];
    newWaypoints.splice(index, 1);
    setWaypoints(newWaypoints);
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
    setRideInfo(null); 
    setSpots(1); 
    setIsRouteFound(false); // Go back to input state
    bottomSheetRef.current?.snapToIndex(1); // Expand sheet
  };

  // --- Helper functions for spots stepper ---
  const incrementSpots = () => setSpots(s => s + 1);
  const decrementSpots = () => setSpots(s => (s > 1 ? s - 1 : 1)); // Don't allow less than 1 spot

  // --- Confirm Ride Logic ---
  const handleConfirmRide = () => {
    // ---
    // Add logic here to save the ride (startAddress, endAddress, waypoints, spots, rideInfo)
    // ---
    alert(`Ride Confirmed! You are offering ${spots} spot(s).`);
    resetMap();
  };

  return (
    // This wrapper is required for the bottom sheet
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <MapView 
          ref={mapRef} 
          style={StyleSheet.absoluteFillObject} 
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: 37.78825,
            longitude: -122.4324,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
        >
          {origin && destination && (
            <MapViewDirections
              origin={origin}
              destination={destination}
              waypoints={routeWaypoints}
              apikey={apiKey}
              strokeWidth={6}
              strokeColor="#007AFF"
              onReady={result => {
                setRideInfo({
                  duration: Math.round(result.duration),
                  distance: parseFloat(result.distance.toFixed(1))
                });
                setIsRouteFound(true); // Switch to confirmation UI
                
                // Snap sheet to collapsed state to show confirmation
                bottomSheetRef.current?.snapToIndex(0); 

                mapRef.current?.fitToCoordinates(result.coordinates, {
                  edgePadding: { 
                    top: 50, 
                    right: 50, 
                    // Adjust padding to account for the collapsed (30%) bottom sheet
                    bottom: 300, 
                    left: 50 
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

        {/* --- NEW DRAGGABLE BOTTOM SHEET --- */}
        <BottomSheet
          ref={bottomSheetRef}
          index={1} // Start expanded (index 1 = '75%')
          snapPoints={snapPoints}
          // handleIndicatorStyle={{ backgroundColor: '#ccc' }}
          backgroundStyle={{ backgroundColor: 'white' }}
        >
          {/* Use BottomSheetScrollView for scrollable content inside sheet */}
          <BottomSheetScrollView contentContainerStyle={styles.scrollContainer}>
            {!isRouteFound ? (
                /* --- STATE 1: ROUTE INPUT --- */
                <View style={styles.contentContainer}>
                  <Text style={styles.sheetTitle}>Create Your Ride</Text>
                  
                  <TextInput
                    style={styles.input}
                    placeholder="Start Address"
                    value={startAddress}
                    onChangeText={setStartAddress}
                  />
                  
                  {waypoints.map((wp, index) => (
                    <View key={index} style={styles.waypointContainer}>
                      <TextInput
                        style={styles.waypointInput}
                        placeholder={`Stop ${index + 1}`}
                        value={wp}
                        onChangeText={(text) => updateWaypoint(text, index)}
                      />
                      <TouchableOpacity onPress={() => removeWaypoint(index)} style={styles.removeButton}>
                        <Text style={styles.removeButtonText}>−</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                  
                  <TextInput
                    style={styles.input}
                    placeholder="End Address"
                    value={endAddress}
                    onChangeText={setEndAddress}
                  />
                  
                  <TouchableOpacity onPress={addWaypointInput} style={styles.addStopButton}>
                    <Text style={styles.addStopButtonText}>+ Add Stop</Text>
                  </TouchableOpacity>

                  {/* --- Spots Stepper --- */}
                  <View style={styles.stepperContainer}>
                    <Text style={styles.stepperLabel}>Available Spots:</Text>
                    <View style={styles.stepperControls}>
                      <TouchableOpacity onPress={decrementSpots} style={styles.stepperButton}>
                        <Text style={styles.stepperButtonText}>-</Text>
                      </TouchableOpacity>
                      <Text style={styles.stepperValue}>{spots}</Text>
                      <TouchableOpacity onPress={incrementSpots} style={styles.stepperButton}>
                        <Text style={styles.stepperButtonText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* --- Action Button --- */}
                  <TouchableOpacity style={styles.actionButton} onPress={handleFindRoute}>
                    <Text style={styles.actionButtonText}>Find Route</Text>
                  </TouchableOpacity>
                </View>

              ) : (
                /* --- STATE 2: ROUTE CONFIRMATION --- */
                <View style={styles.contentContainer}>
                  <Text style={styles.sheetTitle}>Your Trip</Text>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Distance:</Text>
                    <Text style={styles.infoValue}>{rideInfo?.distance} km</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Est. Duration:</Text>
                    <Text style={styles.infoValue}>{rideInfo?.duration} min</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Available Spots:</Text>
                    <Text style={styles.infoValue}>{spots}</Text>
                  </View>
                  
                  <TouchableOpacity style={styles.actionButton} onPress={handleConfirmRide}>
                    <Text style={styles.actionButtonText}>Confirm Ride</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.resetButton} onPress={resetMap}>
                    <Text style={styles.resetButtonText}>Clear Route</Text>
                  </TouchableOpacity>
                </View>
              )}
          </BottomSheetScrollView>
        </BottomSheet>
      </View>
    </GestureHandlerRootView>
  )
}

export default Page

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // This container is for the content *inside* the bottom sheet
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30, // Add padding for home bar
  },
  scrollContainer: {
    backgroundColor: 'white', // Ensure scroll view has white background
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#1A1A1A',
  },
  input: {
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    fontSize: 16,
  },
  waypointContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  waypointInput: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginRight: 10,
  },
  removeButton: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 20,
  },
  removeButtonText: {
    color: '#FF3B30',
    fontWeight: 'bold',
    fontSize: 20,
  },
  addStopButton: {
    padding: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  addStopButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  stepperContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    marginVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  stepperLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepperButton: {
    backgroundColor: '#e0e0e0',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  stepperValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 15,
  },
  actionButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  resetButton: {
    padding: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  resetButtonText: {
    color: '#FF3B30',
    fontSize: 16,
  },
})


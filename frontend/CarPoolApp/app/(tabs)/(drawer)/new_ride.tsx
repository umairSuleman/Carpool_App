import { 
  StyleSheet, 
  TextInput, 
  View, 
  Text, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator
} from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import React, { useState, useRef, useMemo } from 'react'
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps'; 
import MapViewDirections from 'react-native-maps-directions';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import RideService from '../../../services/rideService';

const CreateRidePage = () => {
  // --- ADD YOUR GOOGLE MAPS API KEY HERE ---
  const apiKey = 'apikey';

  // --- REFS ---
  const mapRef = useRef<MapView>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);

  // --- STATE FOR ADDRESS INPUTS ---
  const [startAddress, setStartAddress] = useState('');
  const [endAddress, setEndAddress] = useState('');
  const [waypoints, setWaypoints] = useState<string[]>([]);

  // --- STATE FOR COORDINATES (will be set when user confirms route) ---
  const [sourceCoords, setSourceCoords] = useState<{lat: number, lng: number} | null>(null);
  const [destCoords, setDestCoords] = useState<{lat: number, lng: number} | null>(null);

  // --- STATE FOR MAPVIEWDIRECTIONS ---
  const [origin, setOrigin] = useState<string | null>(null);
  const [destination, setDestination] = useState<string | null>(null);
  const [routeWaypoints, setRouteWaypoints] = useState<string[]>([]);

  // --- RIDE INFO STATE ---
  const [rideInfo, setRideInfo] = useState<{ duration: number, distance: number } | null>(null);
  const [spots, setSpots] = useState(1);
  const [pricePerSeat, setPricePerSeat] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  
  // --- UI State ---
  const [isRouteFound, setIsRouteFound] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- BOTTOM SHEET CONFIG ---
  const snapPoints = useMemo(() => ['35%', '75%'], []);

  /**
   * Triggers the MapViewDirections component to draw the route
   */
  const handleFindRoute = () => {
    if (apiKey === 'apikey') {
      Alert.alert("Error", "Please add your Google Maps API key to the code.");
      return;
    }
    if (!startAddress || !endAddress) {
      Alert.alert("Error", "Please enter a start and end address.");
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
    if (waypoints.length >= 5) {
      Alert.alert("Limit Reached", "Maximum 5 stops allowed");
      return;
    }
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
    setPricePerSeat('');
    setDepartureDate('');
    setDepartureTime('');
    setSourceCoords(null);
    setDestCoords(null);
    setIsRouteFound(false);
    bottomSheetRef.current?.snapToIndex(1);
  };

  // --- Helper functions for spots stepper ---
  const incrementSpots = () => setSpots(s => s + 1);
  const decrementSpots = () => setSpots(s => (s > 1 ? s - 1 : 1));

  /**
   * Submit ride to backend
   */
  const handleConfirmRide = async () => {
    // Validation
    if (!departureDate || !departureTime) {
      Alert.alert("Error", "Please select departure date and time");
      return;
    }

    if (!pricePerSeat || parseFloat(pricePerSeat) <= 0) {
      Alert.alert("Error", "Please enter a valid price per seat");
      return;
    }

    if (!sourceCoords || !destCoords) {
      Alert.alert("Error", "Could not get coordinates. Please try finding the route again.");
      return;
    }

    if (!rideInfo) {
      Alert.alert("Error", "Route information missing. Please find route first.");
      return;
    }

    // Combine date and time
    const departureDateTime = new Date(`${departureDate}T${departureTime}`);
    
    if (departureDateTime <= new Date()) {
      Alert.alert("Error", "Departure time must be in the future");
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare waypoints data
      const waypointsData = routeWaypoints.map(wp => ({
        address: wp,
        lat: 0, // Google will geocode these
        lng: 0
      }));

      // Create ride data
      const rideData = {
        source_address: startAddress,
        source_lat: sourceCoords.lat,
        source_lng: sourceCoords.lng,
        destination_address: endAddress,
        destination_lat: destCoords.lat,
        destination_lng: destCoords.lng,
        departure_time: departureDateTime.toISOString(),
        available_seats: spots,
        price_per_seat: parseFloat(pricePerSeat),
        distance_km: rideInfo.distance,
        duration_minutes: rideInfo.duration,
        waypoints: waypointsData.length > 0 ? waypointsData : undefined
      };

      console.log('Creating ride:', rideData);

      const response = await RideService.createRide(rideData);

      if (response.success) {
        Alert.alert(
          "Success!", 
          `Your ride has been created successfully!\n\nRoute: ${startAddress} → ${endAddress}\nSpots: ${spots}\nPrice: ₹${pricePerSeat}/seat`,
          [
            {
              text: "OK",
              onPress: () => resetMap()
            }
          ]
        );
      }
    } catch (error: any) {
      console.error('Error creating ride:', error);
      Alert.alert(
        "Failed to Create Ride",
        error.message || "Something went wrong. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <MapView 
          ref={mapRef} 
          style={StyleSheet.absoluteFillObject} 
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: 28.6139,
            longitude: 77.2090,
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
                
                // Store coordinates from the result
                const coords = result.coordinates;
                setSourceCoords({
                  lat: coords[0].latitude,
                  lng: coords[0].longitude
                });
                setDestCoords({
                  lat: coords[coords.length - 1].latitude,
                  lng: coords[coords.length - 1].longitude
                });

                setIsRouteFound(true);
                bottomSheetRef.current?.snapToIndex(0); 

                mapRef.current?.fitToCoordinates(result.coordinates, {
                  edgePadding: { 
                    top: 50, 
                    right: 50, 
                    bottom: 300, 
                    left: 50 
                  }, 
                });
              }}
              onError={(errorMessage) => {
                console.error("MapViewDirections Error:", errorMessage);
                Alert.alert("Route Error", "Could not find route. Please check addresses.");
              }}
            />
          )}
        </MapView>

        <BottomSheet
          ref={bottomSheetRef}
          index={1}
          snapPoints={snapPoints}
          backgroundStyle={{ backgroundColor: 'white' }}
        >
          <BottomSheetScrollView contentContainerStyle={styles.scrollContainer}>
            {!isRouteFound ? (
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

                  <TouchableOpacity style={styles.actionButton} onPress={handleFindRoute}>
                    <Text style={styles.actionButtonText}>Find Route</Text>
                  </TouchableOpacity>
                </View>

              ) : (
                <View style={styles.contentContainer}>
                  <Text style={styles.sheetTitle}>Confirm Your Ride</Text>
                  
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Distance:</Text>
                    <Text style={styles.infoValue}>{rideInfo?.distance} km</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Duration:</Text>
                    <Text style={styles.infoValue}>{rideInfo?.duration} min</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Spots:</Text>
                    <Text style={styles.infoValue}>{spots}</Text>
                  </View>

                  <TextInput
                    style={styles.input}
                    placeholder="Price per seat (₹)"
                    value={pricePerSeat}
                    onChangeText={setPricePerSeat}
                    keyboardType="numeric"
                  />

                  <TextInput
                    style={styles.input}
                    placeholder="Departure Date (YYYY-MM-DD)"
                    value={departureDate}
                    onChangeText={setDepartureDate}
                  />

                  <TextInput
                    style={styles.input}
                    placeholder="Departure Time (HH:MM)"
                    value={departureTime}
                    onChangeText={setDepartureTime}
                  />
                  
                  <TouchableOpacity 
                    style={[styles.actionButton, isSubmitting && styles.disabledButton]} 
                    onPress={handleConfirmRide}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.actionButtonText}>Confirm Ride</Text>
                    )}
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.resetButton} 
                    onPress={resetMap}
                    disabled={isSubmitting}
                  >
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

export default CreateRidePage

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  scrollContainer: {
    backgroundColor: 'white',
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
  disabledButton: {
    backgroundColor: '#ccc',
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
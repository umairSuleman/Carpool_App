// frontend/CarPoolApp/app/live-tracking.tsx
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import trackingService from '../services/trackingService';
import polyline from '@mapbox/polyline'; // Import polyline decoder

const LiveTrackingScreen = () => {
  const { rideId, role, userId } = useLocalSearchParams();
  const router = useRouter();
  const mapRef = useRef<MapView>(null);

  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [driverLocation, setDriverLocation] = useState<any>(null);
  const [eta, setEta] = useState<any>(null);
  const [rideStatus, setRideStatus] = useState('active');
  const [participants, setParticipants] = useState<any>(null);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  
  // --- ADDED FOR ROUTE ---
  const [routeCoords, setRouteCoords] = useState<{latitude: number, longitude: number}[]>([]);
  const [rideDetails, setRideDetails] = useState<{
    source: any,
    destination: any,
    waypoints: any[]
  } | null>(null);
  // -------------------------

  useEffect(() => {
    initializeTracking();

    return () => {
      trackingService.disconnect();
    };
  }, []);

  const initializeTracking = async () => {
    try {
      setLoading(true);

      // Connect to tracking server
      await trackingService.connect(userId as string, rideId as string);
      setConnected(true);

      // Load participants and ride coords
      const participantsData = await trackingService.getRideParticipants(rideId as string);

      if (participantsData.success) {

        const waypoints = participantsData.waypoints || [];

        setParticipants(participantsData);
        setRideDetails({
          source: participantsData.source,
          destination: participantsData.destination,
          waypoints: waypoints //use the safe array
        });
        
        // Now fetch the route navigation
        await fetchRoute(
          participantsData.source, 
          participantsData.destination, 
          waypoints
        );
      }

      // Set up listeners
      trackingService.onDriverLocationUpdate((data) => {
        console.log('Driver location update:', data);
        setDriverLocation({
          latitude: data.latitude,
          longitude: data.longitude,
          heading: data.heading
        });
        
        if (data.eta) {
          setEta(data.eta);
        }

        // Center map on driver (only if passenger)
        if (mapRef.current && role === 'passenger') {
          mapRef.current.animateCamera({
            center: {
              latitude: data.latitude,
              longitude: data.longitude
            },
            zoom: 15
          });
        }
      });

      trackingService.onRideStatusUpdate((data) => {
        console.log('Ride status update:', data);
        if (data.rideId === rideId) {
          Alert.alert('Ride Update', data.message);
          setRideStatus(data.rideId.includes('completed') ? 'completed' : 'in_progress');
        }
      });

      trackingService.onNotification((notification) => {
        console.log('Notification:', notification);
        Alert.alert(notification.title, notification.message);
      });

      trackingService.onEmergencyAlert((alert) => {
        console.log('Emergency alert:', alert);
        Alert.alert(
          '🚨 EMERGENCY ALERT',
          'An emergency alert has been triggered. Support has been notified.',
          [{ text: 'OK' }]
        );
      });

      // If driver, start location tracking
      if (role === 'driver') {
        await trackingService.startDriverTracking(rideId as string);
      }

      setLoading(false);
    } catch (error: any) {
      console.error('Error initializing tracking:', error);
      Alert.alert('Connection Error', 'Failed to connect to tracking server');
      setLoading(false);
    }
  };

  /**
   * Fetch and draw the navigation route
   */
  const fetchRoute = async (origin: any, destination: any, waypoints: any[]) => {
    try {

      // --- THIS IS THE FIX ---
      // Re-map keys from { latitude, longitude } to { lat, lng }
      const originFormatted = { lat: origin.latitude, lng: origin.longitude };
      const destFormatted = { lat: destination.latitude, lng: destination.longitude };

      // Ensure waypoints is an array before mapping
      const waypointAddresses = Array.isArray(waypoints) ? waypoints.map(wp => wp.address) : [];

      const nav = await trackingService.getNavigation(
        originFormatted as any, 
        destFormatted as any, 
        waypointAddresses
      );
      
      if (nav.success && nav.route.polyline) {
        const coords = polyline.decode(nav.route.polyline).map(([lat, lng]) => ({
          latitude: lat,
          longitude: lng
        }));
        setRouteCoords(coords);
        
        // Fit map to route
        if (mapRef.current) {
          mapRef.current.fitToCoordinates(coords, {
            edgePadding: { top: 150, right: 50, bottom: 300, left: 50 },
            animated: true
          });
        }
      }
    } catch (error) {
      console.error('Failed to get navigation route:', error);
    }
  };

  const handleStartRide = () => {
    Alert.alert(
      'Start Ride',
      'Are you ready to start this ride?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start',
          onPress: () => {
            trackingService.startRide(rideId as string);
            setRideStatus('in_progress');
          }
        }
      ]
    );
  };

  const handleCompleteRide = () => {
    Alert.alert(
      'Complete Ride',
      'Have you reached the destination?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Complete',
          onPress: () => {
            trackingService.completeRide(rideId as string);
            trackingService.stopDriverTracking();
            Alert.alert('Success', 'Ride completed successfully!', [
              { text: 'OK', onPress: () => router.back() }
            ]);
          }
        }
      ]
    );
  };

  const handleEmergency = () => {
    setShowEmergencyModal(true);
  };

  const sendEmergency = async () => {
    try {
      await trackingService.sendEmergencyAlert(rideId as string);
      setShowEmergencyModal(false);
      Alert.alert('Alert Sent', 'Emergency services have been notified');
    } catch (error) {
      Alert.alert('Error', 'Failed to send emergency alert');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Connecting to tracking...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Map */}
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: rideDetails?.source?.latitude || 28.6139,
            longitude: rideDetails?.source?.longitude || 77.2090,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05
          }}
          showsUserLocation={role === 'driver'} // Only show driver's blue dot if they are the user
          showsMyLocationButton={true}
          followsUserLocation={role === 'driver'}
        >
          {/* --- ROUTE POLYLINE --- */}
          {routeCoords.length > 0 && (
            <Polyline
              coordinates={routeCoords}
              strokeWidth={5}
              strokeColor="#007AFF"
            />
          )}

          {/* --- Start & End Markers --- */}
          {rideDetails?.source && (
            <Marker
              coordinate={rideDetails.source}
              title="Start"
              pinColor="green"
            />
          )}
          {rideDetails?.destination && (
            <Marker
              coordinate={rideDetails.destination}
              title="End"
              pinColor="red"
            />
          )}

          {/* --- Driver Marker --- */}
          {driverLocation && (
            <Marker
              coordinate={driverLocation}
              title="Driver"
              description="Current location"
              rotation={driverLocation.heading || 0}
              anchor={{ x: 0.5, y: 0.5 }} // Center marker on coordinate
            >
              <View style={styles.driverMarker}>
                <Text style={styles.driverMarkerText}>🚗</Text>
              </View>
            </Marker>
          )}
        </MapView>

        {/* Connection Status */}
        <View style={styles.statusBar}>
          <View style={[styles.statusIndicator, connected && styles.statusConnected]} />
          <Text style={styles.statusText}>
            {connected ? 'Live Tracking Active' : 'Connecting...'}
          </Text>
        </View>

        {/* ETA Card */}
        {eta && role === 'passenger' && (
          <View style={styles.etaCard}>
            <Text style={styles.etaLabel}>Estimated Arrival</Text>
            <Text style={styles.etaValue}>{eta.eta_text}</Text>
            <Text style={styles.etaDistance}>{eta.distance_km} km away</Text>
          </View>
        )}

        {/* Participants Info */}
        {participants && (
          <View style={styles.participantsCard}>
            <Text style={styles.cardTitle}>Ride Participants</Text>
            <View style={styles.participantItem}>
              <Text style={styles.participantRole}>👨‍✈️ Driver</Text>
              <Text style={styles.participantName}>{participants.driver?.name}</Text>
            </View>
            {participants.passengers?.map((passenger: any, index: number) => (
              <View key={index} style={styles.participantItem}>
                <Text style={styles.participantRole}>🧑‍🦰 Passenger</Text>
                <Text style={styles.participantName}>
                  {passenger.name} ({passenger.seats_booked} seat{passenger.seats_booked > 1 ? 's' : ''})
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Control Buttons */}
        <View style={styles.controls}>
          {/* Emergency Button (always visible) */}
          <TouchableOpacity
            style={styles.emergencyButton}
            onPress={handleEmergency}
          >
            <Text style={styles.emergencyButtonText}>🚨 Emergency</Text>
          </TouchableOpacity>

          {/* Driver Controls */}
          {role === 'driver' && (
            <View style={styles.driverControls}>
              {rideStatus === 'active' && (
                <TouchableOpacity
                  style={styles.startButton}
                  onPress={handleStartRide}
                >
                  <Text style={styles.buttonText}>Start Ride</Text>
                </TouchableOpacity>
              )}
              
              {rideStatus === 'in_progress' && (
                <TouchableOpacity
                  style={styles.completeButton}
                  onPress={handleCompleteRide}
                >
                  <Text style={styles.buttonText}>Complete Ride</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Emergency Modal */}
        <Modal
          visible={showEmergencyModal}
          transparent
          animationType="slide"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>🚨 Emergency Alert</Text>
              <Text style={styles.modalText}>
                This will send your location to emergency services and all ride participants.
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => setShowEmergencyModal(false)}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonDanger]}
                  onPress={sendEmergency}
                >
                  <Text style={[styles.modalButtonText, styles.modalButtonTextWhite]}>
                    Send Alert
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

export default LiveTrackingScreen;

// Styles are unchanged from your provided file
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff'
  },
  container: {
    flex: 1
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666'
  },
  map: {
    ...StyleSheet.absoluteFillObject
  },
  statusBar: {
    position: 'absolute',
    top: 10,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF3B30',
    marginRight: 10
  },
  statusConnected: {
    backgroundColor: '#34C759'
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A'
  },
  etaCard: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  etaLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5
  },
  etaValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF'
  },
  etaDistance: {
    fontSize: 14,
    color: '#666',
    marginTop: 5
  },
  participantsCard: {
    position: 'absolute',
    bottom: 180,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1A1A1A'
  },
  participantItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  participantRole: {
    fontSize: 14,
    color: '#666'
  },
  participantName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A'
  },
  controls: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20
  },
  emergencyButton: {
    backgroundColor: '#FF3B30',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10
  },
  emergencyButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold'
  },
  driverControls: {
    flexDirection: 'row',
    gap: 10
  },
  startButton: {
    flex: 1,
    backgroundColor: '#34C759',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center'
  },
  completeButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center'
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  },
  driverMarker: {
    width: 40,
    height: 40,
    backgroundColor: '#007AFF',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white'
  },
  driverMarkerText: {
    fontSize: 20
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center'
  },
  modalText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    alignItems: 'center'
  },
  modalButtonDanger: {
    backgroundColor: '#FF3B30'
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A'
  },
  modalButtonTextWhite: {
    color: 'white'
  }
});``
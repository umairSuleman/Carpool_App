//frontend/CarPoolApp/services/trackingService.ts
import { io, Socket } from 'socket.io-client';
import * as Location from 'expo-location';
import ApiService from './api';

interface LocationUpdate {
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
}

interface ETAUpdate {
  distance_km: string;
  eta_minutes: number;
  eta_text: string;
}

class TrackingService {
  private socket: Socket | null = null;
  private locationSubscription: any = null;
  private isTracking: boolean = false;
  private currentRideId: string | null = null;

  /**
   * Connect to tracking server
   */
  connect(userId: string, rideId: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        // Connect to Socket.IO server
        this.socket = io('http://10.142.150.45:5000', {
          transports: ['websocket'],
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionAttempts: 5
        });

        this.socket.on('connect', () => {
          console.log('✅ Connected to tracking server');
          
          // Authenticate
          this.socket?.emit('authenticate', { userId, rideId });
        });

        this.socket.on('authenticated', (data) => {
          if (data.success) {
            this.currentRideId = rideId;
            console.log('✅ Authenticated with tracking server');
            resolve(true);
          } else {
            reject(new Error('Authentication failed'));
          }
        });

        this.socket.on('connect_error', (error) => {
          console.error('❌ Connection error:', error);
          reject(error);
        });

        this.socket.on('error', (error) => {
          console.error('❌ Socket error:', error);
        });

        this.socket.on('disconnect', () => {
          console.log('⚠️ Disconnected from tracking server');
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect from tracking server
   */
  disconnect() {
    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
    }
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.isTracking = false;
    this.currentRideId = null;
    console.log('🔌 Disconnected from tracking');
  }

  /**
   * Start tracking driver location (for drivers)
   */
  async startDriverTracking(rideId: string): Promise<boolean> {
    try {
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission denied');
      }

      // Request background permissions for continuous tracking
      const bgStatus = await Location.requestBackgroundPermissionsAsync();
      if (bgStatus.status !== 'granted') {
        console.warn('Background location permission denied');
      }

      this.isTracking = true;

      // Start watching location
      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 5000, // Update every 5 seconds
          distanceInterval: 10 // Or every 10 meters
        },
        (location) => {
          if (this.socket && this.isTracking) {
            this.socket.emit('location:update', {
              rideId,
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              heading: location.coords.heading,
              speed: location.coords.speed
            });
          }
        }
      );

      console.log('✅ Started driver tracking');
      return true;
    } catch (error) {
      console.error('Error starting driver tracking:', error);
      throw error;
    }
  }

  /**
   * Stop tracking driver location
   */
  stopDriverTracking() {
    this.isTracking = false;
    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
    }
    console.log('⏹️ Stopped driver tracking');
  }

  /**
   * Listen for driver location updates (for passengers)
   */
  onDriverLocationUpdate(callback: (data: LocationUpdate & { eta?: ETAUpdate }) => void) {
    if (!this.socket) {
      console.error('Socket not connected');
      return;
    }

    this.socket.on('location:driver', callback);
  }

  /**
   * Listen for ride status updates
   */
  onRideStatusUpdate(callback: (data: any) => void) {
    if (!this.socket) return;

    this.socket.on('ride:started', callback);
    this.socket.on('ride:completed', callback);
  }

  /**
   * Listen for notifications
   */
  onNotification(callback: (notification: any) => void) {
    if (!this.socket) return;

    this.socket.on('notification', callback);
  }

  /**
   * Listen for emergency alerts
   */
  onEmergencyAlert(callback: (alert: any) => void) {
    if (!this.socket) return;

    this.socket.on('emergency:alert', callback);
  }

  /**
   * Start ride (driver)
   */
  startRide(rideId: string) {
    if (!this.socket) {
      throw new Error('Not connected to tracking server');
    }

    this.socket.emit('ride:start', { rideId });
  }

  /**
   * Complete ride (driver)
   */
  completeRide(rideId: string) {
    if (!this.socket) {
      throw new Error('Not connected to tracking server');
    }

    this.socket.emit('ride:complete', { rideId });
  }

  /**
   * Send emergency alert
   */
  async sendEmergencyAlert(rideId: string, message?: string) {
    try {
      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });

      if (!this.socket) {
        throw new Error('Not connected to tracking server');
      }

      this.socket.emit('emergency:alert', {
        rideId,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        message: message || 'Emergency alert triggered'
      });

      return { success: true };
    } catch (error) {
      console.error('Error sending emergency alert:', error);
      throw error;
    }
  }

  /**
   * Get driver's current location (REST API fallback)
   */
  async getDriverLocation(rideId: string) {
    try {
      const response = await ApiService.request(`/tracking/${rideId}/location`, {
        method: 'GET'
      });

      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get driver location');
    }
  }

  /**
   * Get ride participants
   */
  async getRideParticipants(rideId: string) {
    try {
      const response = await ApiService.request(`/tracking/${rideId}/participants`, {
        method: 'GET'
      });

      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get participants');
    }
  }

  /**
   * Get navigation route
   */
  async getNavigation(origin: string, destination: string, waypoints?: string[]) {
    try {
      const response = await ApiService.request('/tracking/navigation', {
        method: 'POST',
        body: JSON.stringify({
          origin,
          destination,
          waypoints
        })
      });

      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get navigation');
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Check if tracking
   */
  isCurrentlyTracking(): boolean {
    return this.isTracking;
  }
}

export default new TrackingService();

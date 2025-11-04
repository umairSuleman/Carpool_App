//backend/services/trackingService.js
import { Server } from 'socket.io';
import { Ride, Booking, User } from '../models/associations.js';
import googleMapsService from './googleMapsService.js'; 
import polyline from '@mapbox/polyline';

class TrackingService {
  constructor() {
    this.io = null;
    this.activeRides = new Map(); // rideId -> { driverId, passengerIds, lastLocation }
    this.userSockets = new Map(); // userId -> socketId

    // --- NEW: For simulation ---
    this.simulationIntervals = new Map(); // rideId -> setInterval ID
    this.activeRoutes = new Map(); // rideId -> { coords: [], index: 0 }
    // ---------------------------
  }

  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    });

    this.io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      // Handle user authentication
      socket.on('authenticate', async (data) => {
        const { userId, rideId } = data;
        this.userSockets.set(userId, socket.id);
        socket.userId = userId;
        socket.rideId = rideId;
        
        // Join ride-specific room
        if (rideId) {
          socket.join(`ride:${rideId}`);
          console.log(`User ${userId} joined ride ${rideId}`);
        }

        socket.emit('authenticated', { success: true });
      });

      // Handle location updates from driver (real data)
      socket.on('location:update', async (data) => {
        const { rideId, latitude, longitude, heading, speed } = data;
        
        if (!socket.userId || !rideId) {
          return socket.emit('error', { message: 'Not authenticated' });
        }

        // **IMPORTANT**: Real data stops the simulation
        this.stopSimulation(rideId);

        // Verify user is the driver
        const ride = await this.verifyDriver(rideId, socket.userId);
        if (!ride) {
          return socket.emit('error', { message: 'Unauthorized' });
        }

        // Update location in memory
        this.activeRides.set(rideId, {
          driverId: socket.userId,
          location: { latitude, longitude, heading, speed },
          lastUpdate: new Date()
        });

        // Calculate real-time ETA
        const eta = await this.calculateETA(latitude, longitude, ride);

        // Broadcast to all passengers in the ride
        this.io.to(`ride:${rideId}`).emit('location:driver', {
          latitude,
          longitude,
          heading,
          speed,
          eta, // <-- Send new real-time ETA
          timestamp: new Date().toISOString()
        });

        // Send notifications if significant changes
        await this.checkAndSendNotifications(rideId, { latitude, longitude }, eta);
      });

      // Handle ride start
      socket.on('ride:start', async (data) => {
        const { rideId } = data;
        
        const ride = await this.verifyDriver(rideId, socket.userId);
        if (!ride) {
          return socket.emit('error', { message: 'Unauthorized' });
        }

        // Update ride status
        await ride.update({ status: 'in_progress' });

        // Notify all passengers
        this.io.to(`ride:${rideId}`).emit('ride:started', {
          rideId,
          message: 'Your ride has started!',
          timestamp: new Date().toISOString()
        });

        // Send push notifications
        await this.sendRideStatusNotification(rideId, 'started');

        // --- NEW: Start the simulation ---
        this.startSimulation(rideId, ride);
        // ---------------------------------
      });

      // Handle ride completion
      socket.on('ride:complete', async (data) => {
        const { rideId } = data;
        
        const ride = await this.verifyDriver(rideId, socket.userId);
        if (!ride) {
          return socket.emit('error', { message: 'Unauthorized' });
        }

        // --- NEW: Stop the simulation ---
        this.stopSimulation(rideId);
        // --------------------------------

        // Update ride status
        await ride.update({ status: 'completed' });

        // Notify all passengers
        this.io.to(`ride:${rideId}`).emit('ride:completed', {
          rideId,
          message: 'Ride completed successfully!',
          timestamp: new Date().toISOString()
        });

        // Clean up active ride data
        this.activeRides.delete(rideId);

        // Send push notifications
        await this.sendRideStatusNotification(rideId, 'completed');
      });

      // Handle SOS/Emergency
      socket.on('emergency:alert', async (data) => {
        const { rideId, latitude, longitude, message } = data;
        
        console.log('EMERGENCY ALERT:', {
          userId: socket.userId,
          rideId,
          location: { latitude, longitude },
          message
        });

        // Broadcast to all participants
        this.io.to(`ride:${rideId}`).emit('emergency:alert', {
          userId: socket.userId,
          latitude,
          longitude,
          message,
          timestamp: new Date().toISOString()
        });

        // Send emergency notifications
        await this.sendEmergencyNotifications(rideId, socket.userId, { latitude, longitude });
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        if (socket.userId) {
          this.userSockets.delete(socket.userId);
        }
      });
    });

    console.log('✅ Socket.IO server initialized');
  }

  // --- NEW: Function to start the simulation loop ---
  async startSimulation(rideId, ride) {
    this.stopSimulation(rideId); // Stop any existing simulation first

    console.log(`[Simulation] Starting for ride ${rideId}`);

    // 1. Get the route polyline from Google Maps
    const routeDetails = await googleMapsService.getRouteDetails(
      { lat: ride.source_lat, lng: ride.source_lng },
      { lat: ride.destination_lat, lng: ride.destination_lng },
      ride.waypoints ? ride.waypoints.map(wp => wp.address) : []
    );

    if (!routeDetails.success || !routeDetails.polyline) {
      console.error(`[Simulation] Could not get route for ride ${rideId}`);
      return;
    }

    // 2. Decode the polyline into coordinates
    const coords = polyline.decode(routeDetails.polyline).map(([lat, lng]) => {
      return { latitude: lat, longitude: lng };
    });

    if (coords.length === 0) {
      console.error(`[Simulation] Route has no coordinates for ride ${rideId}`);
      return;
    }
    
    this.activeRoutes.set(rideId, { coords, index: 0 });

    // 3. Start the interval loop
    const interval = setInterval(async () => {
      const route = this.activeRoutes.get(rideId);
      if (!route) {
        this.stopSimulation(rideId); // Stop if route was removed
        return;
      }

      // 4. Get the next coordinate
      const currentLoc = route.coords[route.index];
      
      // Calculate a "rough" ETA based on remaining steps
      const remainingCoords = route.coords.length - route.index;
      const totalSteps = route.coords.length;
      const percentComplete = route.index / totalSteps;
      const totalDuration = routeDetails.duration_minutes;
      const remainingMinutes = Math.round(totalDuration * (1 - percentComplete));
      const remainingDistance = (routeDetails.distance_km * (1 - percentComplete)).toFixed(2);
      
      const eta = {
        distance_km: remainingDistance,
        eta_minutes: remainingMinutes,
        eta_text: this.formatETA(remainingMinutes)
      };

      // 5. Broadcast this fake location
      this.io.to(`ride:${rideId}`).emit('location:driver', {
        latitude: currentLoc.latitude,
        longitude: currentLoc.longitude,
        heading: 0, // We can't easily fake heading, 0 is fine
        eta: eta,
        timestamp: new Date().toISOString()
      });
      
      // Update location in memory
      this.activeRides.set(rideId, {
        driverId: ride.driver_id,
        location: { latitude: currentLoc.latitude, longitude: currentLoc.longitude },
        lastUpdate: new Date()
      });

      // 6. Move to the next coordinate
      route.index++;

      // 7. If end of route, stop the simulation
      if (route.index >= route.coords.length) {
        console.log(`[Simulation] Finished for ride ${rideId}`);
        this.stopSimulation(rideId);
        // Note: We don't auto-complete the ride, we let the driver do that.
      }
    }, 5000); // Update every 5 seconds

    this.simulationIntervals.set(rideId, interval);
  }

  // --- NEW: Function to stop a simulation ---
  stopSimulation(rideId) {
    const interval = this.simulationIntervals.get(rideId);
    if (interval) {
      clearInterval(interval);
      this.simulationIntervals.delete(rideId);
      this.activeRoutes.delete(rideId);
      console.log(`[Simulation] Stopped for ride ${rideId}`);
    }
  }

  async verifyDriver(rideId, userId) {
    try {
      const ride = await Ride.findOne({
        where: {
          id: rideId,
          driver_id: userId
        }
      });
      return ride;
    } catch (error) {
      console.error('Error verifying driver:', error);
      return null;
    }
  }

  /**
   * Calculate ETA using Google Maps Service
   */
  async calculateETA(currentLat, currentLng, ride) {
    try {
      const origin = { lat: currentLat, lng: currentLng };
      const destination = { lat: ride.destination_lat, lng: ride.destination_lng };
      
      // Use the existing googleMapsService
      const routeDetails = await googleMapsService.getRouteDetails(origin, destination);

      if (!routeDetails.success) {
        return this.getFallbackETA(currentLat, currentLng, ride);
      }

      return {
        distance_km: routeDetails.distance_km,
        eta_minutes: routeDetails.duration_minutes,
        eta_text: this.formatETA(routeDetails.duration_minutes)
      };
      
    } catch (error) {
      console.error('Google Maps ETA error:', error);
      // Fallback to simple calculation if API fails
      return this.getFallbackETA(currentLat, currentLng, ride);
    }
  }
  
  /**
   * Fallback ETA calculation (as-the-crow-flies)
   */
  getFallbackETA(currentLat, currentLng, ride) {
    const R = 6371; // Earth's radius in km
    const dLat = (ride.destination_lat - currentLat) * Math.PI / 180;
    const dLon = (ride.destination_lng - currentLng) * Math.PI / 180;
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(currentLat * Math.PI / 180) * Math.cos(ride.destination_lat * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in km
    
    // Assuming average speed of 40 km/h in city
    const etaMinutes = Math.round((distance / 40) * 60);
    
    return {
      distance_km: distance.toFixed(2),
      eta_minutes: etaMinutes,
      eta_text: this.formatETA(etaMinutes)
    };
  }

  formatETA(minutes) {
    if (minutes < 1) return 'Less than a minute';
    if (minutes === 1) return '1 minute';
    if (minutes < 60) return `${minutes} minutes`;
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }

  async checkAndSendNotifications(rideId, location, eta) {
    // Check if ETA is close (< 5 minutes) and send notification
    if (eta.eta_minutes <= 5 && eta.eta_minutes > 0) {
      const ride = await Ride.findByPk(rideId, {
        include: [{ 
          model: Booking, 
          as: 'bookings',
          where: { booking_status: 'confirmed' },
          include: [{ model: User, as: 'passenger' }]
        }]
      });

      if (ride && ride.bookings) {
        ride.bookings.forEach(booking => {
          this.io.to(`ride:${rideId}`).emit('notification', {
            type: 'eta_update',
            title: 'Driver Nearby!',
            message: `Your driver will arrive in ${eta.eta_text}`,
            data: { eta }
          });
        });
      }
    }
  }

  async sendRideStatusNotification(rideId, status) {
    const ride = await Ride.findByPk(rideId, {
      include: [{ 
        model: Booking, 
        as: 'bookings',
        where: { booking_status: 'confirmed' },
        include: [{ model: User, as: 'passenger' }]
      }]
    });

    if (!ride || !ride.bookings) return;

    const messages = {
      'started': {
        title: 'Ride Started',
        message: 'Your ride has started. Track your driver in real-time!'
      },
      'completed': {
        title: 'Ride Completed',
        message: 'Thank you for riding with us! Please rate your experience.'
      }
    };

    const notification = messages[status];
    if (notification) {
      this.io.to(`ride:${rideId}`).emit('notification', {
        type: `ride_${status}`,
        ...notification
      });
    }
  }

  async sendEmergencyNotifications(rideId, userId, location) {
    // In production, send SMS/Email to emergency contacts
    console.log('Sending emergency notifications for ride:', rideId);
    
    this.io.to(`ride:${rideId}`).emit('notification', {
      type: 'emergency',
      title: '🚨 EMERGENCY ALERT',
      message: 'An emergency alert has been triggered. Support has been notified.',
      priority: 'high'
    });
  }

  // Get current location of driver for a ride
  getDriverLocation(rideId) {
    return this.activeRides.get(rideId);
  }

  // Check if driver is active
  isDriverActive(rideId) {
    const rideData = this.activeRides.get(rideId);
    if (!rideData) return false;
    
    // Consider active if updated in last 30 seconds
    const thirtySecondsAgo = new Date(Date.now() - 30000);
    return rideData.lastUpdate > thirtySecondsAgo;
  }
}

export default new TrackingService();
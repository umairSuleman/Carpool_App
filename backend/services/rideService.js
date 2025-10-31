import { Op } from 'sequelize';
import { Ride, User, UserProfile, DriverInfo, Booking } from '../models/associations.js';
import sequelize from '../config/database.js';
import googleMapsService from './googleMapsService.js';

class RideService {
  /**
   * R.0.1.1 Create Ride (Driver) - WITH ROUTE VALIDATION
   * Creates a new ride with backend route verification
   */
  async createRide(driverId, rideData) {
    const {
      source_address,
      source_lat,
      source_lng,
      destination_address,
      destination_lat,
      destination_lng,
      departure_time,
      available_seats,
      price_per_seat,
      is_recurring,
      recurrence_pattern,
      distance_km,
      duration_minutes,
      waypoints // Array of waypoint addresses/coordinates
    } = rideData;

    // Validate driver exists and is verified
    const driver = await User.findByPk(driverId, {
      include: [{
        model: DriverInfo,
        as: 'driverInfo'
      }]
    });

    if (!driver) {
      throw new Error('Driver not found');
    }

    if (!driver.driverInfo) {
      throw new Error('Driver information not found. Please complete driver registration.');
    }

    if (!driver.driverInfo.is_verified) {
      throw new Error('Driver is not verified. Please complete verification process.');
    }

    // Validate available seats don't exceed vehicle capacity
    if (available_seats > driver.driverInfo.total_seats) {
      throw new Error(`Cannot offer more seats than vehicle capacity (${driver.driverInfo.total_seats})`);
    }

    // Validate departure time is in future
    if (new Date(departure_time) <= new Date()) {
      throw new Error('Departure time must be in the future');
    }

    // BACKEND ROUTE VALIDATION
    // Verify the route data provided by frontend matches actual Google Maps calculation
    let validatedRoute = null;
    if (process.env.ENABLE_ROUTE_VALIDATION !== 'false') {
      console.log('Validating route with Google Maps...');
      
      const validation = await googleMapsService.validateRouteData({
        source_address,
        destination_address,
        waypoints,
        distance_km,
        duration_minutes
      });

      if (!validation.valid) {
        // Use actual calculated values instead
        console.log('Route validation failed, using actual values from Google Maps');
        validatedRoute = validation.actualRoute;
      } else {
        console.log('Route validation passed');
      }
    }

    // Use validated values if available, otherwise trust frontend
    const finalDistanceKm = validatedRoute ? parseFloat(validatedRoute.distance_km) : distance_km;
    const finalDurationMinutes = validatedRoute ? validatedRoute.duration_minutes : duration_minutes;

    // Calculate suggested price if not provided
    let finalPrice = price_per_seat;
    if (!finalPrice || finalPrice === 0) {
      finalPrice = googleMapsService.calculateEstimatedFare(finalDistanceKm);
    }

    // Create the ride
    const ride = await Ride.create({
      driver_id: driverId,
      source_address,
      source_lat,
      source_lng,
      destination_address,
      destination_lat,
      destination_lng,
      departure_time,
      available_seats,
      price_per_seat: finalPrice,
      is_recurring: is_recurring || false,
      recurrence_pattern: is_recurring ? recurrence_pattern : null,
      distance_km: finalDistanceKm,
      duration_minutes: finalDurationMinutes,
      waypoints: waypoints ? JSON.stringify(waypoints) : null,
      status: 'active'
    });

    return {
      success: true,
      message: 'Ride created successfully',
      ride: await this.getRideDetails(ride.id),
      validation: validatedRoute ? {
        route_verified: true,
        actual_distance: validatedRoute.distance_km,
        actual_duration: validatedRoute.duration_minutes
      } : {
        route_verified: false,
        message: 'Route validation skipped'
      }
    };
  }

  /**
   * Enhanced search with better matching
   */
  async searchRides(searchParams) {
    const {
      source_lat,
      source_lng,
      destination_lat,
      destination_lng,
      date,
      passengers = 1,
      radius = 5 // km radius for proximity search
    } = searchParams;

    // Build the where clause
    const whereClause = {
      status: 'active',
      available_seats: {
        [Op.gte]: passengers
      }
    };

    // Date filter
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      whereClause.departure_time = {
        [Op.between]: [startOfDay, endOfDay]
      };
    } else {
      // Only future rides
      whereClause.departure_time = {
        [Op.gte]: new Date()
      };
    }

    // Search for rides
    const rides = await Ride.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'driver',
          attributes: ['id', 'name'],
          include: [
            {
              model: UserProfile,
              as: 'profile',
              attributes: ['rating', 'total_rides']
            },
            {
              model: DriverInfo,
              as: 'driverInfo',
              attributes: ['vehicle_model', 'vehicle_color', 'vehicle_type']
            }
          ]
        }
      ],
      order: [['departure_time', 'ASC']]
    });

    // Filter by proximity using Haversine formula
    const nearbyRides = rides.filter(ride => {
      const sourceDistance = this.calculateDistance(
        source_lat,
        source_lng,
        ride.source_lat,
        ride.source_lng
      );
      const destDistance = this.calculateDistance(
        destination_lat,
        destination_lng,
        ride.destination_lat,
        ride.destination_lng
      );

      return sourceDistance <= radius && destDistance <= radius;
    });

    // Add calculated fields
    const enrichedRides = nearbyRides.map(ride => ({
      ...ride.toJSON(),
      available_seats_remaining: ride.available_seats - ride.booked_seats,
      total_fare: ride.price_per_seat * passengers,
      source_distance_km: this.calculateDistance(
        source_lat,
        source_lng,
        ride.source_lat,
        ride.source_lng
      ).toFixed(2),
      dest_distance_km: this.calculateDistance(
        destination_lat,
        destination_lng,
        ride.destination_lat,
        ride.destination_lng
      ).toFixed(2),
      waypoints: ride.waypoints ? JSON.parse(ride.waypoints) : []
    }));

    return {
      success: true,
      count: enrichedRides.length,
      rides: enrichedRides
    };
  }

  /**
   * Get suggested price for a route
   */
  async getSuggestedPrice(source, destination, waypoints = []) {
    const route = await googleMapsService.getRouteDetails(source, destination, waypoints);
    
    if (!route.success) {
      throw new Error('Unable to calculate route');
    }

    const suggestedPrice = googleMapsService.calculateEstimatedFare(parseFloat(route.distance_km));

    return {
      success: true,
      route: {
        distance_km: route.distance_km,
        duration_minutes: route.duration_minutes
      },
      suggested_price_per_seat: suggestedPrice,
      total_estimated_earnings: suggestedPrice * 4 // Assuming max 4 passengers
    };
  }

  /**
   * Get ride details with parsed waypoints
   */
  async getRideDetails(rideId) {
    const ride = await Ride.findByPk(rideId, {
      include: [
        {
          model: User,
          as: 'driver',
          attributes: ['id', 'name', 'phone'],
          include: [
            {
              model: UserProfile,
              as: 'profile',
              attributes: ['rating', 'total_rides', 'smoking', 'pets', 'music', 'chatty']
            },
            {
              model: DriverInfo,
              as: 'driverInfo'
            }
          ]
        },
        {
          model: Booking,
          as: 'bookings',
          where: { booking_status: 'confirmed' },
          required: false,
          include: [{
            model: User,
            as: 'passenger',
            attributes: ['id', 'name']
          }]
        }
      ]
    });

    if (!ride) {
      throw new Error('Ride not found');
    }

    const rideData = ride.toJSON();
    
    // Parse waypoints if they exist
    if (rideData.waypoints) {
      try {
        rideData.waypoints = JSON.parse(rideData.waypoints);
      } catch (e) {
        rideData.waypoints = [];
      }
    }

    return {
      ...rideData,
      available_seats_remaining: ride.available_seats - ride.booked_seats
    };
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of Earth in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return distance;
  }

  toRad(degrees) {
    return degrees * (Math.PI / 180);
  }

  // ... (keep all other methods from previous version)
}

export default new RideService();
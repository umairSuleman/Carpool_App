// backend/routes/tracking.js
import express from 'express';
import { authenticate } from '../middleware/auth.js';
import trackingService from '../services/trackingService.js';
import googleMapsService from '../services/googleMapsService.js';
import { Ride, Booking, User } from '../models/associations.js';

const router = express.Router();

/**
 * IMPORTANT: Static routes MUST come before parameterized routes
 * Otherwise Express will try to match 'navigation' as a :rideId
 */

/**
 * Get navigation route (NO authentication needed)
 * POST /api/tracking/navigation
 */
router.post('/navigation', async (req, res) => {
  try {
    const { origin, destination, waypoints } = req.body;

    console.log('[Navigation] Request received:', { origin, destination, waypoints });

    if (!origin || !destination) {
      return res.status(400).json({ 
        success: false, 
        error: 'Origin and destination are required' 
      });
    }

    // Call Google Maps service
    const routeDetails = await googleMapsService.getRouteDetails(
      origin,
      destination,
      waypoints || []
    );

    if (!routeDetails.success) {
      console.error('[Navigation] Route calculation failed:', routeDetails.error);
      return res.status(400).json({
        success: false,
        error: routeDetails.error || 'Failed to calculate route'
      });
    }

    console.log('[Navigation] Route calculated successfully');
    res.json({
      success: true,
      route: routeDetails
    });
    
  } catch (error) {
    console.error('[Navigation] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get navigation'
    });
  }
});

/**
 * Get driver's current location for a ride
 * GET /api/tracking/:rideId/location
 */
router.get('/:rideId/location', authenticate, async (req, res) => {
  try {
    const { rideId } = req.params;

    // Verify user is part of this ride
    const ride = await Ride.findByPk(rideId, {
      include: [{
        model: Booking,
        as: 'bookings',
        where: { booking_status: 'confirmed' },
        required: false
      }]
    });

    if (!ride) {
      return res.status(404).json({
        success: false,
        error: 'Ride not found'
      });
    }

    // Check if user is driver or passenger
    const isDriver = ride.driver_id === req.user.id;
    const isPassenger = ride.bookings?.some(b => b.passenger_id === req.user.id);

    if (!isDriver && !isPassenger) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized to track this ride'
      });
    }

    const locationData = trackingService.getDriverLocation(rideId);

    res.json({
      success: true,
      location: locationData ? locationData.location : null,
      isActive: trackingService.isDriverActive(rideId)
    });
  } catch (error) {
    console.error('Error getting location:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get location'
    });
  }
});

/**
 * Get ride participants for real-time updates
 * GET /api/tracking/:rideId/participants
 */
router.get('/:rideId/participants', authenticate, async (req, res) => {
  try {
    const { rideId } = req.params;

    const ride = await Ride.findByPk(rideId, {
      include: [
        {
          model: User,
          as: 'driver',
          attributes: ['id', 'name', 'phone']
        },
        {
          model: Booking,
          as: 'bookings',
          where: { booking_status: 'confirmed' },
          required: false,
          include: [{
            model: User,
            as: 'passenger',
            attributes: ['id', 'name', 'phone']
          }]
        }
      ]
    });

    if (!ride) {
      return res.status(404).json({
        success: false,
        error: 'Ride not found'
      });
    }

    // Verify user access
    const isDriver = ride.driver_id === req.user.id;
    const isPassenger = ride.bookings?.some(b => b.passenger_id === req.user.id);

    if (!isDriver && !isPassenger) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    res.json({
      success: true,
      driver: ride.driver,
      passengers: ride.bookings.map(b => ({
        ...b.passenger.toJSON(),
        seats_booked: b.seats_booked
      })),
      source: {
        latitude: ride.source_lat,
        longitude: ride.source_lng
      },
      destination: {
        latitude: ride.destination_lat,
        longitude: ride.destination_lng
      },
      waypoints: ride.waypoints || []
    });
  } catch (error) {
    console.error('Error getting participants:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get participants'
    });
  }
});

export default router;
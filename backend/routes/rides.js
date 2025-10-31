import express from 'express';
import { Op } from 'sequelize';
import { authenticate } from '../middleware/auth.js';
import rideService from '../services/rideService.js';
import { validateRideData, validateSearchParams } from '../utils/rideValidation.js';

const router = express.Router();

/**
 * R.0.1.1 Create Ride (Driver)
 * POST /api/rides
 */
router.post('/', authenticate, async (req, res) => {
  try {
    // Validate ride data
    const validation = validateRideData(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.errors
      });
    }

    const result = await rideService.createRide(req.user.id, req.body);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating ride:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * R.0.1.2 Set Recurring Rides
 * POST /api/rides/recurring
 */
router.post('/recurring', authenticate, async (req, res) => {
  try {
    const { rideData, recurrencePattern } = req.body;

    if (!recurrencePattern || !recurrencePattern.frequency) {
      return res.status(400).json({
        success: false,
        error: 'Recurrence pattern is required'
      });
    }

    const validation = validateRideData(rideData);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.errors
      });
    }

    const result = await rideService.createRecurringRides(
      req.user.id,
      rideData,
      recurrencePattern
    );

    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating recurring rides:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * R.0.1.3 Search Rides (Passenger)
 * GET /api/rides/search
 */
router.get('/search', async (req, res) => {
  try {
    const searchParams = {
      source_lat: parseFloat(req.query.source_lat),
      source_lng: parseFloat(req.query.source_lng),
      destination_lat: parseFloat(req.query.destination_lat),
      destination_lng: parseFloat(req.query.destination_lng),
      date: req.query.date,
      passengers: parseInt(req.query.passengers) || 1,
      radius: parseInt(req.query.radius) || 5
    };

    // Validate search parameters
    const validation = validateSearchParams(searchParams);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid search parameters',
        details: validation.errors
      });
    }

    const result = await rideService.searchRides(searchParams);
    res.json(result);
  } catch (error) {
    console.error('Error searching rides:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search rides'
    });
  }
});

/**
 * R.0.1.4 Filter and Sort Rides
 * POST /api/rides/search/filter
 */
router.post('/search/filter', async (req, res) => {
  try {
    const { searchParams, filterOptions } = req.body;

    if (!searchParams) {
      return res.status(400).json({
        success: false,
        error: 'Search parameters are required'
      });
    }

    const result = await rideService.filterAndSortRides(
      searchParams,
      filterOptions || {}
    );

    res.json(result);
  } catch (error) {
    console.error('Error filtering rides:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to filter rides'
    });
  }
});

/**
 * Get ride details
 * GET /api/rides/:rideId
 */
router.get('/:rideId', async (req, res) => {
  try {
    const ride = await rideService.getRideDetails(req.params.rideId);
    res.json({
      success: true,
      ride
    });
  } catch (error) {
    console.error('Error fetching ride:', error);
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get driver's rides
 * GET /api/rides/driver/my-rides
 */
router.get('/driver/my-rides', authenticate, async (req, res) => {
  try {
    const status = req.query.status || null;
    const result = await rideService.getDriverRides(req.user.id, status);
    res.json(result);
  } catch (error) {
    console.error('Error fetching driver rides:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch rides'
    });
  }
});

/**
 * Update ride
 * PUT /api/rides/:rideId
 */
router.put('/:rideId', authenticate, async (req, res) => {
  try {
    const rideId = req.params.rideId;
    
    // Check if user is the driver
    const ride = await rideService.getRideDetails(rideId);
    if (ride.driver_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Only the driver can update this ride'
      });
    }

    // Don't allow updates if ride has bookings
    if (ride.booked_seats > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot modify ride with existing bookings'
      });
    }

    // Validate update data
    const validation = validateRideData(req.body, true);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.errors
      });
    }

    // Update the ride
    const Ride = (await import('../models/Ride.js')).default;
    const updatedRide = await Ride.findByPk(rideId);
    await updatedRide.update(req.body);

    res.json({
      success: true,
      message: 'Ride updated successfully',
      ride: await rideService.getRideDetails(rideId)
    });
  } catch (error) {
    console.error('Error updating ride:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * R.0.1.6 Cancel Ride
 * DELETE /api/rides/:rideId
 */
router.delete('/:rideId', authenticate, async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        error: 'Cancellation reason is required'
      });
    }

    const result = await rideService.cancelRide(
      req.params.rideId,
      req.user.id,
      reason
    );

    res.json(result);
  } catch (error) {
    console.error('Error cancelling ride:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Update ride status
 * PATCH /api/rides/:rideId/status
 */
router.patch('/:rideId/status', authenticate, async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required'
      });
    }

    const result = await rideService.updateRideStatus(
      req.params.rideId,
      req.user.id,
      status
    );

    res.json(result);
  } catch (error) {
    console.error('Error updating ride status:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get upcoming rides (public)
 * GET /api/rides/public/upcoming
 */
router.get('/public/upcoming', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const Ride = (await import('../models/Ride.js')).default;
    const User = (await import('../models/User.js')).default;
    const UserProfile = (await import('../models/UserProfile.js')).default;
    const DriverInfo = (await import('../models/DriverInfo.js')).default;

    const rides = await Ride.findAll({
      where: {
        status: 'active',
        departure_time: {
          [Op.gte]: new Date()
        }
      },
      include: [{
        model: User,
        as: 'driver',
        attributes: ['id', 'name'],
        include: [
          {
            model: UserProfile,
            as: 'profile',
            attributes: ['rating']
          },
          {
            model: DriverInfo,
            as: 'driverInfo',
            attributes: ['vehicle_model', 'vehicle_type']
          }
        ]
      }],
      limit,
      order: [['departure_time', 'ASC']]
    });

    res.json({
      success: true,
      count: rides.length,
      rides
    });
  } catch (error) {
    console.error('Error fetching upcoming rides:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch upcoming rides'
    });
  }
});

/**
 * Get suggested price for a route
 * POST /api/rides/suggested-price
 */
router.post('/suggested-price', authenticate, async (req, res) => {
  try {
    const { source, destination, waypoints } = req.body;

    if (!source || !destination) {
      return res.status(400).json({
        success: false,
        error: 'Source and destination are required'
      });
    }

    const result = await rideService.getSuggestedPrice(source, destination, waypoints);
    res.json(result);
  } catch (error) {
    console.error('Error getting suggested price:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to calculate suggested price'
    });
  }
});

export default router;
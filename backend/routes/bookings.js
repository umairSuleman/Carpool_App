// backend/routes/bookings.js
import express from 'express';
import { authenticate } from '../middleware/auth.js';
import bookingService from '../services/bookingService.js';
import { 
  validateBookingData, 
  validateCancellationData,
  validateRatingData
} from '../utils/bookingValidation.js';

const router = express.Router();

// All booking routes require authentication
router.use(authenticate);

/**
 * Create a new booking
 * POST /api/bookings
 */
router.post('/', async (req, res) => {
  try {
    const validation = validateBookingData(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ 
        success: false, 
        error: 'Validation failed', 
        details: validation.errors 
      });
    }

    const result = await bookingService.createBooking(req.user.id, req.body);
    res.status(201).json(result);
  } catch (error) {
    console.error('Booking creation error:', error);
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * Get user's bookings (as passenger)
 * GET /api/bookings/my-bookings
 */
router.get('/my-bookings', async (req, res) => {
  try {
    const status = req.query.status; // e.g., 'upcoming', 'completed', 'cancelled'
    const result = await bookingService.getMyBookings(req.user.id, status);
    res.json(result);
  } catch (error) {
    console.error('Get my bookings error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve bookings' 
    });
  }
});

/**
 * Get booking details
 * GET /api/bookings/:bookingId
 */
router.get('/:bookingId', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const result = await bookingService.getBookingDetails(bookingId, req.user.id);
    res.json(result);
  } catch (error) {
    console.error('Get booking details error:', error);
    res.status(404).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * Cancel a booking (by passenger)
 * POST /api/bookings/:bookingId/cancel
 */
router.post('/:bookingId/cancel', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { reason } = req.body;
    
    const validation = validateCancellationData(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ 
        success: false, 
        error: 'Validation failed', 
        details: validation.errors 
      });
    }

    const result = await bookingService.cancelBooking(bookingId, req.user.id, reason);
    res.json(result);
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * Update booking status (by driver)
 * PATCH /api/bookings/:bookingId/status
 */
router.patch('/:bookingId/status', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status } = req.body; // e.g., 'completed', 'cancelled'

    if (!status) {
      return res.status(400).json({ success: false, error: 'Status is required' });
    }

    const result = await bookingService.updateBookingStatus(bookingId, req.user.id, status);
    res.json(result);
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * Rate a ride/driver (by passenger)
 * POST /api/bookings/:bookingId/rate
 */
router.post('/:bookingId/rate', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { rating, review } = req.body;

    const validation = validateRatingData(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ 
        success: false, 
        error: 'Validation failed', 
        details: validation.errors 
      });
    }
    
    const result = await bookingService.rateRide(bookingId, req.user.id, rating, review);
    res.json(result);
  } catch (error) {
    console.error('Rate ride error:', error);
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

export default router;
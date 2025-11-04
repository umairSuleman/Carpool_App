// backend/routes/payments.js
import express from 'express';
import { authenticate } from '../middleware/auth.js';
import paymentService from '../services/paymentService.js';

const router = express.Router();
router.use(authenticate);

/**
 * Create a Razorpay payment order for a booking
 * POST /api/payments/create-order
 */
router.post('/create-order', async (req, res) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId) {
      return res.status(400).json({ success: false, error: 'Booking ID is required' });
    }
    const orderDetails = await paymentService.createPaymentOrder(bookingId, req.user.id);
    res.json(orderDetails);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Verify a Razorpay payment
 * POST /api/payments/verify
 */
router.post('/verify', async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      booking_id
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !booking_id) {
      return res.status(400).json({ success: false, error: 'Missing payment details' });
    }
    
    const result = await paymentService.verifyPayment({
      ...req.body,
      user_id: req.user.id
    });
    res.json(result);
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * Pay for a booking using the internal wallet
 * POST /api/payments/pay-from-wallet
 */
router.post('/pay-from-wallet', async (req, res) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId) {
      return res.status(400).json({ success: false, error: 'Booking ID is required' });
    }
    const result = await paymentService.payFromWallet(bookingId, req.user.id);
    res.json(result);
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;
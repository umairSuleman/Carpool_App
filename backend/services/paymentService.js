// backend/services/paymentService.js
import Razorpay from 'razorpay';
import crypto from 'crypto';
import sequelize from '../config/database.js';
import {
  Booking,
  Wallet,
  Transaction,
  User,
  Ride
} from '../models/associations.js';

class PaymentService {
  constructor() {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.warn('Razorpay keys not configured. Payment gateway will not function.');
      this.razorpay = null;
    } else {
      this.razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });
    }
  }

  /**
   * Create a Razorpay payment order
   */
  async createPaymentOrder(bookingId, userId) {
    if (!this.razorpay) {
      throw new Error('Payment gateway is not configured');
    }

    const booking = await this.findValidBooking(bookingId, userId);
    const amountInPaise = Math.round(booking.total_amount * 100); // Razorpay expects amount in smallest currency unit

    // **FIX**: Find the user's wallet first to get wallet_id for the transaction
    const wallet = await Wallet.findOne({ where: { user_id: userId } });
    if (!wallet) {
      throw new Error('User wallet not found. Cannot create transaction.');
    }

    try {
      const options = {
        amount: amountInPaise,
        currency: 'INR',
        receipt: booking.id, // Use booking.id as receipt (it's unique and < 40 chars)
        notes: {
          booking_id: booking.id,
          user_id: userId,
          ride_id: booking.ride_id,
        },
      };
      const order = await this.razorpay.orders.create(options);
      
      // Log this order creation in our transactions
      await Transaction.create({
        user_id: userId,
        wallet_id: wallet.id, // <-- **FIX**: Added the wallet_id
        amount: booking.total_amount,
        transaction_type: 'debit',
        category: 'ride_payment',
        reference_id: booking.id,
        reference_type: 'booking',
        payment_method: 'gateway',
        payment_gateway_ref: order.id,
        status: 'pending',
        description: `Payment initiated for booking ${booking.id}`
      });

      return {
        success: true,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        key: process.env.RAZORPAY_KEY_ID
      };
    } catch (error) {
      console.error('Razorpay order creation error:', error);
      // Pass along the validation error if it happens
      if (error.name === 'SequelizeValidationError') {
         throw new Error(`Transaction validation failed: ${error.errors[0].message}`);
      }
      throw new Error('Failed to create payment order');
    }
  }

  /**
   * Verify a Razorpay payment and complete transaction
   */
  async verifyPayment(paymentDetails) {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      booking_id,
      user_id
    } = paymentDetails;

    if (!this.razorpay) {
      throw new Error('Payment gateway is not configured');
    }
    
    // 1. Verify Signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      throw new Error('Invalid payment signature');
    }

    // 2. Signature is valid, process the payment
    const t = await sequelize.transaction();
    try {
      // 3. Find booking and associated ride/driver
      const booking = await Booking.findByPk(booking_id, {
        include: [{ model: Ride, as: 'ride' }],
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!booking) throw new Error('Booking not found');
      if (booking.payment_status === 'completed') throw new Error('Payment already completed');
      
      // 4. Update booking and transaction status
      await booking.update({
        payment_status: 'completed',
        payment_method: 'gateway'
      }, { transaction: t });

      const transaction = await Transaction.findOne({
        where: {
          payment_gateway_ref: razorpay_order_id,
          user_id: user_id,
          status: 'pending'
        },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      
      if (transaction) {
        await transaction.update({ status: 'success' }, { transaction: t });
      }

      // 5. Transfer funds to driver's wallet (minus commission)
      await this.processPayout(booking, t);

      await t.commit();
      
      return { success: true, message: 'Payment verified and completed' };

    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  /**
   * Pay for a booking using the internal wallet
   */
  async payFromWallet(bookingId, userId) {
    const t = await sequelize.transaction();
    try {
      // 1. Find booking
      const booking = await this.findValidBooking(bookingId, userId, t);
      
      // 2. Find and lock user's wallet
      const wallet = await Wallet.findOne({
        where: { user_id: userId },
        transaction: t,
        lock: t.LOCK.UPDATE
      });

      if (!wallet) throw new Error('User wallet not found');
      if (wallet.balance < booking.total_amount) {
        throw new Error('Insufficient balance');
      }

      // 3. Debit user's wallet
      await wallet.decrement('balance', { by: booking.total_amount, transaction: t });

      // 4. Update booking status
      await booking.update({
        payment_status: 'completed',
        payment_method: 'wallet'
      }, { transaction: t });

      // 5. Log debit transaction
      await Transaction.create({
        user_id: userId,
        wallet_id: wallet.id,
        amount: booking.total_amount,
        transaction_type: 'debit',
        category: 'ride_payment',
        reference_id: booking.id,
        reference_type: 'booking',
        payment_method: 'wallet',
        status: 'success',
        description: `Wallet payment for booking ${booking.id}`
      }, { transaction: t });
      
      // 6. Transfer funds to driver's wallet
      await this.processPayout(booking, t);

      await t.commit();
      
      return { success: true, message: 'Payment from wallet successful' };

    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  /**
   * Helper to find a booking that is valid for payment
   */
  async findValidBooking(bookingId, userId, transaction = null) {
    const booking = await Booking.findOne({
      where: {
        id: bookingId,
        passenger_id: userId
      },
      include: [{ model: Ride, as: 'ride' }],
      transaction
    });

    if (!booking) {
      throw new Error('Booking not found or access denied');
    }
    if (booking.payment_status === 'completed') {
      throw new Error('This booking has already been paid for');
    }
    if (booking.booking_status === 'cancelled') {
      throw new Error('This booking has been cancelled');
    }

    return booking;
  }

  /**
   * Helper to handle driver payout and commission
   */
  async processPayout(booking, transaction) {
    const driverId = booking.ride.driver_id;
    const driverWallet = await Wallet.findOne({
      where: { user_id: driverId },
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!driverWallet) {
      throw new Error('Driver wallet not found. Cannot process payout.');
    }

    // TODO: Apply commission logic
    const commissionRate = 0.10; // 10%
    const commission = booking.total_amount * commissionRate;
    const earning = booking.total_amount - commission;

    // 1. Credit driver's wallet
    await driverWallet.increment('balance', { by: earning, transaction });

    // 2. Log driver earning transaction
    await Transaction.create({
      user_id: driverId,
      wallet_id: driverWallet.id,
      amount: earning,
      transaction_type: 'credit',
      category: 'ride_earning',
      reference_id: booking.id,
      reference_type: 'booking',
      status: 'success',
      description: `Earning from booking ${booking.id}`
    }, { transaction });
    
    // 3. Log commission transaction (to admin/platform wallet - not implemented here)
    console.log(`Commission of ${commission} earned from booking ${booking.id}`);
    
    return { success: true, earning };
  }
}

export default new PaymentService();
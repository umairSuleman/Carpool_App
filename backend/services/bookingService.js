// backend/services/bookingService.js
import { Op } from 'sequelize';
import sequelize from '../config/database.js';
import {
  Booking,
  Ride,
  User,
  Wallet,
  Transaction,
  UserProfile,
  DriverInfo
} from '../models/associations.js';

// Import the new payment service to handle payouts
import paymentService from './paymentService.js';

class BookingService {

  /**
   * Create a new booking (PAYMENT IS HANDLED SEPARATELY)
   */
  async createBooking(passengerId, bookingData) {
    const { ride_id, seats_booked, pickup_location, dropoff_location } = bookingData;

    const t = await sequelize.transaction();

    try {
      // 1. Find ride and lock it for update
      const ride = await Ride.findByPk(ride_id, {
        lock: t.LOCK.UPDATE,
        transaction: t
      });

      if (!ride) {
        throw new Error('Ride not found');
      }

      // 2. Check ride status and departure time
      if (ride.status !== 'active') {
        throw new Error('This ride is no longer active');
      }
      if (new Date(ride.departure_time) <= new Date()) {
        throw new Error('This ride has already departed');
      }

      // 3. Check if user is the driver
      if (ride.driver_id === passengerId) {
        throw new Error('Driver cannot book their own ride');
      }

      // 4. Check available seats
      const availableSeats = ride.available_seats - ride.booked_seats;
      if (seats_booked > availableSeats) {
        throw new Error(`Only ${availableSeats} seats are available`);
      }

      // 5. Check if passenger already booked
      const existingBooking = await Booking.findOne({
        where: { ride_id, passenger_id: passengerId },
        transaction: t
      });

      if (existingBooking && existingBooking.booking_status !== 'cancelled') {
        throw new Error('You have already booked this ride');
      }
      
      // 6. Calculate total amount
      const totalAmount = ride.price_per_seat * seats_booked;

      // 7. Create booking with pending payment
      const booking = await Booking.create({
        ride_id,
        passenger_id: passengerId,
        seats_booked,
        total_amount: totalAmount,
        booking_status: 'confirmed',  // Booking is confirmed
        payment_status: 'pending',    // Payment is pending
        payment_method: 'pending',
        pickup_location: pickup_location || ride.source_address,
        dropoff_location: dropoff_location || ride.destination_address
      }, { transaction: t });

      // 8. Update ride's booked_seats
      await ride.increment('booked_seats', { by: seats_booked, transaction: t });

      // 9. Commit transaction
      await t.commit();

      // 10. Return successful booking
      return {
        success: true,
        message: 'Booking confirmed. Please complete payment.',
        booking: await this.getBookingDetails(booking.id, passengerId)
      };

    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  // ... (getMyBookings and getBookingDetails remain the same) ...
  
  /**
   * Get all bookings for a user
   */
  async getMyBookings(passengerId, status) {
    const whereClause = {
      passenger_id: passengerId
    };

    if (status && status !== 'all') {
      if (status === 'upcoming') {
        whereClause.booking_status = { [Op.in]: ['pending', 'confirmed'] };
        // We also need to check ride departure time
      } else {
        whereClause.booking_status = status;
      }
    }

    const includeOptions = [
      {
        model: Ride,
        as: 'ride',
        include: [
          {
            model: User,
            as: 'driver',
            attributes: ['id', 'name'],
            include: [
              { model: UserProfile, as: 'profile', attributes: ['rating', 'total_rides'] },
              { model: DriverInfo, as: 'driverInfo', attributes: ['vehicle_model', 'vehicle_type', 'vehicle_color'] }
            ]
          }
        ]
      }
    ];

    // Handle 'upcoming' filter by joining on ride departure time
    if (status === 'upcoming') {
      includeOptions[0].where = {
        departure_time: { [Op.gte]: new Date() }
      };
      includeOptions[0].required = true; // Ensure only bookings with upcoming rides are returned
    }

    const bookings = await Booking.findAll({
      where: whereClause,
      include: includeOptions,
      order: [
        ['ride', 'departure_time', 'ASC']
      ]
    });
    
    // Format bookings to match frontend expectations
    const formattedBookings = bookings.map(b => ({
      id: b.id,
      ride_id: b.ride_id,
      seats_booked: b.seats_booked,
      total_price: b.total_amount, // Frontend expects total_price
      status: b.booking_status,
      // --- ADDED PAYMENT STATUS ---
      payment_status: b.payment_status,
      created_at: b.created_at,
      ride: b.ride // The ride object is already structured as needed
    }));

    return {
      success: true,
      count: formattedBookings.length,
      bookings: formattedBookings
    };
  }

  /**
   * Get details for a single booking
   */
  async getBookingDetails(bookingId, userId) {
    const booking = await Booking.findByPk(bookingId, {
      include: [
        {
          model: Ride,
          as: 'ride',
          include: [
            {
              model: User,
              as: 'driver',
              attributes: ['id', 'name', 'phone'],
              include: [
                { model: UserProfile, as: 'profile' },
                { model: DriverInfo, as: 'driverInfo' }
              ]
            }
          ]
        },
        {
          model: User,
          as: 'passenger',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    // Security check: only passenger or driver can view
    if (booking.passenger_id !== userId && booking.ride.driver_id !== userId) {
      throw new Error('Access denied');
    }

    return {
      success: true,
      booking: booking
    };
  }


  /**
   * Cancel a booking (by passenger)
   */
  async cancelBooking(bookingId, passengerId, reason) {
    const t = await sequelize.transaction();

    try {
      // 1. Find and lock booking
      const booking = await Booking.findByPk(bookingId, {
        include: [{ model: Ride, as: 'ride' }],
        lock: t.LOCK.UPDATE,
        transaction: t
      });

      if (!booking) {
        throw new Error('Booking not found');
      }

      // 2. Check ownership
      if (booking.passenger_id !== passengerId) {
        throw new Error('You are not authorized to cancel this booking');
      }

      // 3. Check if already cancelled or completed
      if (['cancelled', 'completed'].includes(booking.booking_status)) {
        throw new Error(`Booking is already ${booking.booking_status}`);
      }
      
      const ride = booking.ride;
      if (!ride) {
        throw new Error('Associated ride not found');
      }
      
      // 4. Check if payment was already made
      const isPaid = booking.payment_status === 'completed';

      // 5. Update booking status
      await booking.update({
        booking_status: 'cancelled',
        cancellation_reason: reason,
        cancelled_by: passengerId,
        cancelled_at: new Date(),
        payment_status: isPaid ? 'refunded' : 'cancelled' // Mark for refund if paid
      }, { transaction: t });

      // 6. Release seats on ride
      await ride.decrement('booked_seats', { by: booking.seats_booked, transaction: t });

      // 7. Refund passenger IF they already paid
      if (isPaid) {
        const passengerWallet = await Wallet.findOne({ where: { user_id: passengerId }, transaction: t });
        if (passengerWallet) {
          await passengerWallet.increment('balance', { by: booking.total_amount, transaction: t });
          
          // 8. Log refund transaction
          await Transaction.create({
            user_id: passengerId,
            wallet_id: passengerWallet.id,
            amount: booking.total_amount,
            transaction_type: 'credit',
            category: 'refund',
            reference_id: booking.id,
            reference_type: 'booking',
            status: 'success',
            description: `Refund for cancelled booking ${booking.id}`
          }, { transaction: t });
        }
      }

      await t.commit();
      
      return {
        success: true,
        message: isPaid ? 'Booking cancelled and refunded successfully' : 'Booking cancelled',
        booking
      };

    } catch (error) {
      await t.rollback();
      throw error;
    }
  }
  
  /**
   * Update booking status (by driver)
   */
  async updateBookingStatus(bookingId, driverId, status) {
    const validStatuses = ['completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid status update');
    }

    const t = await sequelize.transaction();
    try {
      const booking = await Booking.findByPk(bookingId, {
        include: [{ model: Ride, as: 'ride' }],
        lock: t.LOCK.UPDATE,
        transaction: t
      });

      if (!booking) {
        throw new Error('Booking not found');
      }

      // Check if user is the driver of this ride
      if (booking.ride.driver_id !== driverId) {
        throw new Error('Only the driver can update this booking status');
      }
      
      if (booking.booking_status === 'completed' || booking.booking_status === 'cancelled') {
         throw new Error(`Booking is already ${booking.booking_status}`);
      }

      // Handle 'completed'
      if (status === 'completed') {
        // Just mark as completed. Payment is handled by paymentService.
        await booking.update({ booking_status: 'completed' }, { transaction: t });
        
        // If payment is already completed, process payout
        if (booking.payment_status === 'completed') {
          await paymentService.processPayout(booking, t);
        }
        // If payment is pending, user will be prompted to pay.
        // Payout will happen upon payment verification.
      }
      
      // Handle 'cancelled' (by driver)
      if (status === 'cancelled') {
        const isPaid = booking.payment_status === 'completed';

        await booking.update({
          booking_status: 'cancelled',
          cancellation_reason: 'Cancelled by driver',
          cancelled_by: driverId,
          cancelled_at: new Date(),
          payment_status: isPaid ? 'refunded' : 'cancelled'
        }, { transaction: t });

        // Release seats
        await booking.ride.decrement('booked_seats', { by: booking.seats_booked, transaction: t });
        
        // Refund passenger if they paid
        if (isPaid) {
          const passengerWallet = await Wallet.findOne({ where: { user_id: booking.passenger_id }, transaction: t });
          if (passengerWallet) {
            await passengerWallet.increment('balance', { by: booking.total_amount, transaction: t });
            
            await Transaction.create({
              user_id: booking.passenger_id,
              wallet_id: passengerWallet.id,
              amount: booking.total_amount,
              transaction_type: 'credit',
              category: 'refund',
              reference_id: booking.id,
              reference_type: 'booking',
              status: 'success',
              description: `Refund for driver-cancelled booking ${booking.id}`
            }, { transaction: t });
          }
        }
      }

      await t.commit();
      
      return {
        success: true,
        message: `Booking status updated to ${status}`,
        booking
      };
      
    } catch(error) {
      await t.rollback();
      throw error;
    }
  }

  /**
   * Rate a ride (by passenger)
   */
  async rateRide(bookingId, passengerId, rating, review) {
    const t = await sequelize.transaction();
    try {
      const booking = await Booking.findOne({
        where: {
          id: bookingId,
          passenger_id: passengerId
        },
        include: [{ 
          model: Ride, 
          as: 'ride',
          include: [{
            model: User,
            as: 'driver',
            include: [{ model: UserProfile, as: 'profile' }]
          }]
        }],
        transaction: t
      });

      if (!booking) {
        throw new Error('Booking not found or you are not the passenger');
      }

      if (booking.booking_status !== 'completed') {
        throw new Error('Can only rate completed rides');
      }
      
      // Check if already rated (need to add 'rating' field to Booking model)
      // For now, we'll update the driver's profile directly.
      // A better approach is to have a separate 'Reviews' table.

      const driverProfile = booking.ride.driver.profile;
      if (!driverProfile) {
        throw new Error('Driver profile not found');
      }

      // Calculate new average rating
      const currentRating = driverProfile.rating || 0;
      const totalRides = driverProfile.total_rides || 0;
      
      const newTotalRatingPoints = (currentRating * totalRides) + rating;
      const newTotalRides = totalRides + 1;
      const newAverageRating = newTotalRatingPoints / newTotalRides;

      await driverProfile.update({
        rating: newAverageRating.toFixed(1),
        total_rides: newTotalRides
      }, { transaction: t });
      
      // TODO: Save the actual review text somewhere (e.g., a new 'Reviews' table)
      
      // Mark this booking as rated (add 'is_rated' to Booking model)
      // await booking.update({ is_rated: true }, { transaction: t });

      await t.commit();
      
      return {
        success: true,
        message: 'Rating submitted successfully',
        newRating: newAverageRating.toFixed(1)
      };

    } catch (error) {
      await t.rollback();
      throw error;
    }
  }
}

export default new BookingService();
import ApiService from './api';

interface BookingData {
  ride_id: string;
  seats_booked: number;
  pickup_location?: string;
  dropoff_location?: string;
}

interface CancelBookingData {
  reason: string;
}

class BookingService {
  /**
   * Create a new booking
   */
  async createBooking(bookingData: BookingData) {
    try {
      const response = await ApiService.request('/bookings', {
        method: 'POST',
        body: JSON.stringify(bookingData)
      });

      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create booking');
    }
  }

  /**
   * Get user's bookings
   */
  async getMyBookings(status?: string) {
    try {
      const url = status 
        ? `/bookings/my-bookings?status=${status}`
        : '/bookings/my-bookings';

      const response = await ApiService.request(url, {
        method: 'GET'
      });

      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get bookings');
    }
  }

  /**
   * Get booking details
   */
  async getBookingDetails(bookingId: string) {
    try {
      const response = await ApiService.request(`/bookings/${bookingId}`, {
        method: 'GET'
      });

      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get booking details');
    }
  }

  /**
   * Cancel booking
   */
  async cancelBooking(bookingId: string, data: CancelBookingData) {
    try {
      const response = await ApiService.request(`/bookings/${bookingId}/cancel`, {
        method: 'POST',
        body: JSON.stringify(data)
      });

      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to cancel booking');
    }
  }

  /**
   * Update booking status
   */
  async updateBookingStatus(bookingId: string, status: string) {
    try {
      const response = await ApiService.request(`/bookings/${bookingId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });

      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update booking status');
    }
  }

  /**
   * Rate a completed ride
   */
  async rateRide(bookingId: string, rating: number, review?: string) {
    try {
      const response = await ApiService.request(`/bookings/${bookingId}/rate`, {
        method: 'POST',
        body: JSON.stringify({ rating, review })
      });

      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to submit rating');
    }
  }
}

export default new BookingService();
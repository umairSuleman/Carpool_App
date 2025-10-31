import ApiService from './api';

interface CreateRideData {
  source_address: string;
  source_lat: number;
  source_lng: number;
  destination_address: string;
  destination_lat: number;
  destination_lng: number;
  departure_time: string;
  available_seats: number;
  price_per_seat: number;
  distance_km: number;
  duration_minutes: number;
  waypoints?: Array<{
    address: string;
    lat: number;
    lng: number;
  }>;
}

interface SearchParams {
  source_lat: number;
  source_lng: number;
  destination_lat: number;
  destination_lng: number;
  date?: string;
  passengers?: number;
  radius?: number;
}

interface FilterOptions {
  minRating?: number;
  maxPrice?: number;
  minPrice?: number;
  vehicleType?: string;
  sortBy?: 'price' | 'rating' | 'departure_time' | 'distance';
  sortOrder?: 'asc' | 'desc';
  timeRange?: {
    start: string;
    end: string;
  };
}

interface RouteDetails {
  distance_km: string;
  duration_minutes: number;
  polyline: string;
  start_address: string;
  end_address: string;
  bounds: any;
}

class RideService {
  /**
   * NEW: Calculate route on backend (no API key needed in frontend)
   */
  async calculateRoute(
    origin: string,
    destination: string,
    waypoints?: string[]
  ): Promise<RouteDetails> {
    try {
      const response = await ApiService.request('/rides/calculate-route', {
        method: 'POST',
        body: JSON.stringify({
          origin,
          destination,
          waypoints: waypoints || []
        })
      }) as any;

      if (!response.success || !response.route) {
        throw new Error(response.error || 'Failed to calculate route');
      }

      return response.route as RouteDetails;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to calculate route');
    }
  }

  /**
   * Create a new ride
   */
  async createRide(rideData: CreateRideData) {
    try {
      const response = await ApiService.request('/rides', {
        method: 'POST',
        body: JSON.stringify(rideData)
      });

      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create ride');
    }
  }

  /**
   * Create recurring rides
   */
  async createRecurringRides(
    rideData: CreateRideData,
    recurrencePattern: {
      frequency: 'daily' | 'weekly' | 'custom';
      daysOfWeek?: number[];
      endDate: string;
    }
  ) {
    try {
      const response = await ApiService.request('/rides/recurring', {
        method: 'POST',
        body: JSON.stringify({
          rideData,
          recurrencePattern
        })
      });

      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create recurring rides');
    }
  }

  /**
   * Search for rides
   */
  async searchRides(searchParams: SearchParams) {
    try {
      const queryParams = new URLSearchParams();
      
      queryParams.append('source_lat', searchParams.source_lat.toString());
      queryParams.append('source_lng', searchParams.source_lng.toString());
      queryParams.append('destination_lat', searchParams.destination_lat.toString());
      queryParams.append('destination_lng', searchParams.destination_lng.toString());
      
      if (searchParams.date) {
        queryParams.append('date', searchParams.date);
      }
      if (searchParams.passengers) {
        queryParams.append('passengers', searchParams.passengers.toString());
      }
      if (searchParams.radius) {
        queryParams.append('radius', searchParams.radius.toString());
      }

      const response = await ApiService.request(`/rides/search?${queryParams.toString()}`, {
        method: 'GET'
      });

      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to search rides');
    }
  }

  /**
   * Filter and sort rides
   */
  async filterAndSortRides(searchParams: SearchParams, filterOptions: FilterOptions) {
    try {
      const response = await ApiService.request('/rides/search/filter', {
        method: 'POST',
        body: JSON.stringify({
          searchParams,
          filterOptions
        })
      });

      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to filter rides');
    }
  }

  /**
   * Get ride details
   */
  async getRideDetails(rideId: string) {
    try {
      const response = await ApiService.request(`/rides/${rideId}`, {
        method: 'GET'
      });

      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get ride details');
    }
  }

  /**
   * Get driver's rides
   */
  async getMyRides(status?: string) {
    try {
      const url = status 
        ? `/rides/driver/my-rides?status=${status}`
        : '/rides/driver/my-rides';

      const response = await ApiService.request(url, {
        method: 'GET'
      });

      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get rides');
    }
  }

  /**
   * Update ride
   */
  async updateRide(rideId: string, updates: Partial<CreateRideData>) {
    try {
      const response = await ApiService.request(`/rides/${rideId}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });

      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update ride');
    }
  }

  /**
   * Cancel ride
   */
  async cancelRide(rideId: string, reason: string) {
    try {
      const response = await ApiService.request(`/rides/${rideId}`, {
        method: 'DELETE',
        body: JSON.stringify({ reason })
      });

      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to cancel ride');
    }
  }

  /**
   * Update ride status
   */
  async updateRideStatus(rideId: string, status: string) {
    try {
      const response = await ApiService.request(`/rides/${rideId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });

      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update ride status');
    }
  }

  /**
   * Get suggested price for a route
   */
  async getSuggestedPrice(
    source: string,
    destination: string,
    waypoints?: string[]
  ) {
    try {
      const response = await ApiService.request('/rides/suggested-price', {
        method: 'POST',
        body: JSON.stringify({
          source,
          destination,
          waypoints
        })
      });

      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get suggested price');
    }
  }

  /**
   * Get upcoming rides (public)
   */
  async getUpcomingRides(limit: number = 10) {
    try {
      const response = await ApiService.request(`/rides/public/upcoming?limit=${limit}`, {
        method: 'GET'
      });

      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get upcoming rides');
    }
  }
}

export default new RideService();
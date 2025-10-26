import config from '../constants/config';

const API_BASE_URL = config.API_URL;

const getAuthToken = async () => {
  // In a real app, you'd get this from AsyncStorage
  // For now, we'll get it from the auth context
  return null;
};

const handleResponse = async (response) => {
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || data.message || 'Request failed');
  }
  
  return data;
};

const api = {
  // ============================================
  // AUTH ENDPOINTS
  // ============================================
  
  register: async (userData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          password: userData.password,
          confirmPassword: userData.confirmPassword
        }),
      });
      return await handleResponse(response);
    } catch (error) {
      throw new Error(error.message || 'Registration failed');
    }
  },

  login: async (email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      return await handleResponse(response);
    } catch (error) {
      throw new Error(error.message || 'Login failed');
    }
  },

  verifyEmail: async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-email/${token}`, {
        method: 'GET',
      });
      return await handleResponse(response);
    } catch (error) {
      throw new Error(error.message || 'Email verification failed');
    }
  },

  forgotPassword: async (email) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      return await handleResponse(response);
    } catch (error) {
      throw new Error(error.message || 'Password reset request failed');
    }
  },

  resetPassword: async (token, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });
      return await handleResponse(response);
    } catch (error) {
      throw new Error(error.message || 'Password reset failed');
    }
  },

  refreshToken: async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return await handleResponse(response);
    } catch (error) {
      throw new Error(error.message || 'Token refresh failed');
    }
  },

  logout: async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return await handleResponse(response);
    } catch (error) {
      throw new Error(error.message || 'Logout failed');
    }
  },

  // ============================================
  // PROFILE ENDPOINTS
  // ============================================
  
  getProfile: async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return await handleResponse(response);
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch profile');
    }
  },

  updateProfile: async (token, data) => {
    try {
      const response = await fetch(`${API_BASE_URL}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      return await handleResponse(response);
    } catch (error) {
      throw new Error(error.message || 'Failed to update profile');
    }
  },

  uploadProfilePhoto: async (token, photoUrl) => {
    try {
      const response = await fetch(`${API_BASE_URL}/profile/photo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ photoUrl }),
      });
      return await handleResponse(response);
    } catch (error) {
      throw new Error(error.message || 'Failed to upload photo');
    }
  },

  getUserProfile: async (token, userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/profile/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return await handleResponse(response);
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch user profile');
    }
  },

  // ============================================
  // RIDE ENDPOINTS (Placeholder - needs backend implementation)
  // ============================================
  
  searchRides: async (token, source, destination, date) => {
    try {
      const params = new URLSearchParams({
        origin: source,
        destination: destination,
        ...(date && { date }),
      });
      
      const response = await fetch(`${API_BASE_URL}/rides/search?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return await handleResponse(response);
    } catch (error) {
      throw new Error(error.message || 'Failed to search rides');
    }
  },

  createRide: async (token, rideData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/rides`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(rideData),
      });
      return await handleResponse(response);
    } catch (error) {
      throw new Error(error.message || 'Failed to create ride');
    }
  },

  getUserRides: async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/rides/my-rides`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return await handleResponse(response);
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch rides');
    }
  },

  // ============================================
  // BOOKING ENDPOINTS (Placeholder - needs backend implementation)
  // ============================================
  
  createBooking: async (token, bookingData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bookingData),
      });
      return await handleResponse(response);
    } catch (error) {
      throw new Error(error.message || 'Failed to create booking');
    }
  },

  getUserBookings: async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/bookings/my-bookings`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return await handleResponse(response);
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch bookings');
    }
  },

  cancelBooking: async (token, bookingId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return await handleResponse(response);
    } catch (error) {
      throw new Error(error.message || 'Failed to cancel booking');
    }
  },

  // ============================================
  // WALLET ENDPOINTS (Placeholder - needs backend implementation)
  // ============================================
  
  getWalletBalance: async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/wallet/balance`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return await handleResponse(response);
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch wallet balance');
    }
  },

  getTransactions: async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/wallet/transactions`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return await handleResponse(response);
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch transactions');
    }
  },
};

export default api;
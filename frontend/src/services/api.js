const API_BASE_URL = 'http://localhost:5000/api';

const getAuthToken = async () => {
  return null;
};

const handleResponse = async (response) => {
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }
  
  return data;
};

const api = {
  // Auth endpoints
  register: async (userData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
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

  verifyOTP: async (otp, phone) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ otp, phone }),
      });
      return await handleResponse(response);
    } catch (error) {
      throw new Error(error.message || 'OTP verification failed');
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

  // Profile endpoints
  getProfile: async () => {
    try {
      const token = await getAuthToken();
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

  updateProfile: async (data) => {
    try {
      const token = await getAuthToken();
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

  uploadProfilePhoto: async (photoUrl) => {
    try {
      const token = await getAuthToken();
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

  // Ride endpoints
  searchRides: async (source, destination, date) => {
    try {
      const token = await getAuthToken();
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

  createRide: async (rideData) => {
    try {
      const token = await getAuthToken();
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

  getUserRides: async () => {
    try {
      const token = await getAuthToken();
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

  // Booking endpoints
  createBooking: async (bookingData) => {
    try {
      const token = await getAuthToken();
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

  getUserBookings: async () => {
    try {
      const token = await getAuthToken();
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

  cancelBooking: async (bookingId) => {
    try {
      const token = await getAuthToken();
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

  // Wallet endpoints
  getWalletBalance: async () => {
    try {
      const token = await getAuthToken();
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

  getTransactions: async () => {
    try {
      const token = await getAuthToken();
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
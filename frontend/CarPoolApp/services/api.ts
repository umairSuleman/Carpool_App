import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://10.239.58.45:5000/api'; // Replace with your backend IP
// For iOS simulator: http://localhost:5000/api
// For Android emulator: http://10.0.2.2:5000/api
// For real device: http://YOUR_COMPUTER_IP:5000/api

interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  token?: string;
  user?: any;
  error?: string;
  details?: any;
}

class ApiService {
  private token: string | null = null;

  constructor() {
    this.loadToken();
  }

  // Load token from AsyncStorage
  async loadToken() {
    try {
      this.token = await AsyncStorage.getItem('authToken');
    } catch (error) {
      console.error('Error loading token:', error);
    }
  }

  // Save token to AsyncStorage
  async saveToken(token: string) {
    try {
      this.token = token;
      await AsyncStorage.setItem('authToken', token);
    } catch (error) {
      console.error('Error saving token:', error);
    }
  }

  // Remove token from AsyncStorage
  async removeToken() {
    try {
      this.token = null;
      await AsyncStorage.removeItem('authToken');
    } catch (error) {
      console.error('Error removing token:', error);
    }
  }

  // Generic request method
  async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
      };

      // Add authorization header if token exists
      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      }

      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Register new user
  async register(userData: RegisterData): Promise<ApiResponse> {
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    if (response.success && response.token) {
      await this.saveToken(response.token);
    }

    return response;
  }

  // Login user
  async login(credentials: LoginData): Promise<ApiResponse> {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.success && response.token) {
      await this.saveToken(response.token);
    }

    return response;
  }

  // Logout user
  async logout(): Promise<void> {
    await this.removeToken();
    // Optionally call backend logout endpoint
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  // Get user profile
  async getProfile(): Promise<ApiResponse> {
    return this.request('/profile/profile', { method: 'GET' });
  }

  // Update user profile
  async updateProfile(profileData: any): Promise<ApiResponse> {
    return this.request('/profile/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  // Verify email
  async verifyEmail(token: string): Promise<ApiResponse> {
    return this.request(`/auth/verify-email/${token}`, { method: 'GET' });
  }

  // Request password reset
  async forgotPassword(email: string): Promise<ApiResponse> {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  // Reset password
  async resetPassword(token: string, password: string): Promise<ApiResponse> {
    return this.request(`/auth/reset-password/${token}`, {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    if (!this.token) {
      await this.loadToken();
    }
    return !!this.token;
  }
}

export default new ApiService();
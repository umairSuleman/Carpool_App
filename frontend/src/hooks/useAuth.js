import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import config from '../constants/config';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authToken, setAuthToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load token and user data from AsyncStorage on mount
  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem(config.STORAGE_KEYS.AUTH_TOKEN);
      const storedUser = await AsyncStorage.getItem(config.STORAGE_KEYS.USER_DATA);
      
      if (storedToken && storedUser) {
        setAuthToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveAuth = async (token, userData) => {
    try {
      await AsyncStorage.setItem(config.STORAGE_KEYS.AUTH_TOKEN, token);
      await AsyncStorage.setItem(config.STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
      setAuthToken(token);
      setUser(userData);
    } catch (error) {
      console.error('Error saving auth:', error);
    }
  };

  const clearAuth = async () => {
    try {
      await AsyncStorage.removeItem(config.STORAGE_KEYS.AUTH_TOKEN);
      await AsyncStorage.removeItem(config.STORAGE_KEYS.USER_DATA);
      setAuthToken(null);
      setUser(null);
    } catch (error) {
      console.error('Error clearing auth:', error);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await api.login(email, password);
      
      if (response.success && response.token && response.user) {
        await saveAuth(response.token, response.user);
        return { success: true };
      }
      
      return { success: false, error: response.error || 'Login failed' };
    } catch (error) {
      return { success: false, error: error.message || 'Login failed' };
    }
  };

  const register = async (formData) => {
    try {
      const response = await api.register(formData);
      
      if (response.success && response.token && response.user) {
        // Auto-login after successful registration
        await saveAuth(response.token, response.user);
        return { success: true, data: response };
      }
      
      return { success: false, error: response.error || 'Registration failed' };
    } catch (error) {
      return { success: false, error: error.message || 'Registration failed' };
    }
  };
  
  const verifyOTP = async (otp, phone) => {
    try {
      // Note: Your backend doesn't have a verify-otp endpoint yet
      // This is a placeholder - you'll need to implement this on the backend
      const response = await api.verifyOTP(otp, phone);
      
      if (response.success && response.token && response.user) {
        await saveAuth(response.token, response.user);
        return { success: true };
      }
      
      return { success: false, error: response.error || 'OTP verification failed' };
    } catch (error) {
      return { success: false, error: error.message || 'OTP verification failed' };
    }
  };

  const logout = async () => {
    try {
      if (authToken) {
        // Call backend logout endpoint
        await api.logout(authToken);
      }
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      // Clear local auth regardless of API call result
      await clearAuth();
    }
  };

  const updateUser = (userData) => {
    setUser(userData);
    AsyncStorage.setItem(config.STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
  };

  const refreshProfile = async () => {
    try {
      if (!authToken) return;
      
      const response = await api.getProfile(authToken);
      if (response.success && response.user) {
        updateUser(response.user);
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        authToken,
        user,
        loading,
        login,
        register,
        verifyOTP,
        logout,
        updateUser,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
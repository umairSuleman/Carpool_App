import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import config from '../constants/config';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authToken, setAuthToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load token and user data : logic removed.
  useEffect(() => {
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.login(email, password);
      
      // Assume the response contains { token: '...', user: { ... } }
      if (response.token && response.user) {
        setAuthToken(response.token);
        setUser(response.user);
        return { success: true };
      }
      return { success: false, error: 'Login data incomplete' };
    } catch (error) {
      return { success: false, error: error.message || 'Login failed' };
    }
  };

  const register = async (formData) => {
    try {
      const response = await api.register(formData);
      // Register typically succeeds without logging in, just initiating OTP
      return { success: true, data: response }; 
    } catch (error) {
      return { success: false, error: error.message || 'Registration failed' };
    }
  };
  
  const verifyOTP = async (otp, phone) => {
    try {
      const response = await api.verifyOTP(otp, phone);
      // After OTP, assume server returns a token and user data for auto-login
      if (response.token && response.user) {
        setAuthToken(response.token);
        setUser(response.user);
        return { success: true };
      }
      return { success: false, error: 'Verification data incomplete' };
    } catch (error) {
      return { success: false, error: error.message || 'OTP verification failed' };
    }
  };

  const logout = async () => {
    setAuthToken(null);
    setUser(null);
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
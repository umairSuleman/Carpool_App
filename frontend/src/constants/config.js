export default {
  API_URL: 'http://localhost:5000/api',
  API_TIMEOUT: 30000,
  
  // App info
  APP_NAME: 'Carpool Connect',
  APP_VERSION: '1.0.0',
  
  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  
  // Maps
  DEFAULT_LATITUDE: 12.9716,
  DEFAULT_LONGITUDE: 77.5946,
  
  // Validation
  MIN_PASSWORD_LENGTH: 8,
  MIN_NAME_LENGTH: 2,
  OTP_LENGTH: 6,
  OTP_EXPIRY_MINUTES: 10,
  
  // Ride
  MAX_SEATS: 8,
  MIN_SEATS: 1,
  
  // Wallet
  MIN_WALLET_BALANCE: 0,
  MAX_TOPUP_AMOUNT: 10000,
  
  // Storage keys
  STORAGE_KEYS: {
    AUTH_TOKEN: 'authToken',
    USER_DATA: 'user',
    DEVICE_ID: 'deviceId',
    FCM_TOKEN: 'fcmToken',
  },
};

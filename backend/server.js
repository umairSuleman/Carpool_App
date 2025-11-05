//backend/server.js
import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';

import sequelize from './config/database.js';
import './models/associations.js'; // Import associations
import { createServer } from 'http';

//Import services
import trackingService from './services/trackingService.js'

// Import routes
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import rideRoutes from './routes/rides.js';
import trackingRoutes from './routes/tracking.js';
import bookingRoutes from './routes/bookings.js';
import paymentRoutes from './routes/payment.js';
import walletRoutes from './routes/wallet.js';

// Load environment variables


const app = express();
const PORT = process.env.PORT || 5000;

//create HTTP server for Socket.IO
const httpServer = createServer(app);

// ============================================
// MIDDLEWARE
// ============================================

// CORS - Allow requests from your React Native app
app.use(cors({
  origin: '*', // In production, replace with your frontend domain
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware (development)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// ============================================
// INITIALIZE SOCKET.IO
// ============================================
console.log('Initializing Socket.IO server...');
trackingService.initialize(httpServer);

// ============================================
// ROUTES
// ============================================

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/wallet', walletRoutes);
// Add more routes here as you implement them:
// app.use('/api/bookings', bookingRoutes);
// app.use('/api/wallet', walletRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Carpool Connect API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      profile: '/api/profile',
      rides:'/api/rides',
      tracking:'/api/tracking',
      bookings:'/api/bookings',
      payments:'/api/payments',
      wallet:'/api/wallet'
    },
    features: {
      realTimeTracking: true,
      pushNotifications: true,
      liveUpdates: true
    }
  });
});

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler - must be after all routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.path
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ============================================
// DATABASE CONNECTION & SERVER START
// ============================================

const startServer = async () => {
  try {
    console.log('1️⃣ Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully');
    
    console.log('2️⃣ Loading models and associations...');
    // Sync models (in development)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: false });
      console.log('✅ Database models synchronized');
    }
    
    console.log('3️⃣ Starting HTTP server...');
    // Start server
    httpServer.listen(PORT, '0.0.0.0', () => {
      console.log(`\n🚀 Server is running on port ${PORT}`);
      console.log(`📍 Local: http://localhost:${PORT}`);
      console.log(`📍 Network: http://0.0.0.0:${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}\n`);
      console.log(`📡 Socket.IO: Active and listening`);
      console.log('4️⃣ Server fully initialized and listening for requests');
    });
  } catch (error) {
    console.error('❌ Unable to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:');
  console.error(err);
  console.error('Stack:', err.stack);
  // Close server & exit process
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:');
  console.error(err);
  console.error('Stack:', err?.stack);
  process.exit(1);
});

// Start the server
startServer();

export default app;
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sequelize from './config/database.js';
import './models/associations.js'; // Import associations

// Import routes
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import rideRoutes from './routes/rides.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

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
      profile: '/api/profile'
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
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`\n🚀 Server is running on port ${PORT}`);
      console.log(`📍 Local: http://localhost:${PORT}`);
      console.log(`📍 Network: http://0.0.0.0:${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}\n`);
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

// Handle normal exit
// process.on('exit', (code) => {
//   console.log(`❌ Process exiting with code: ${code}`);
// });

// // Handle SIGTERM
// process.on('SIGTERM', () => {
//   console.log('❌ SIGTERM received');
//   process.exit(0);
// });

// // Handle SIGINT (Ctrl+C)
// process.on('SIGINT', () => {
//   console.log('❌ SIGINT received');
//   process.exit(0);
// });

// process.on('exit', (code) => {
//   console.log(`❌ Process exiting with code: ${code}`);
//   console.trace('Exit stack trace:'); // This will show you WHERE the exit is being called from
// });

// Start the server
startServer();

export default app;
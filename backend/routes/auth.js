import express from 'express';
import authService from '../services/authService.js';
import { authenticate, rateLimitAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(rateLimitAuth());

router.post('/register', async (req, res) => {
  try {
    const result = await authService.register(req.body);
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please check your email for verification.',
      token: result.token,
      user: result.user
    });
  } catch (error) {
    if (error.details) {
      return res.status(400).json({ 
        success: false,
        error: 'Validation failed',
        details: error.details 
      });
    }
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        error: 'User with this email or phone already exists'
      });
    }
    
    res.status(400).json({ 
      success: false,
      error: error.message 
    });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'Email and password are required' 
      });
    }
    
    const result = await authService.login(email, password);
    
    res.json({
      success: true,
      message: 'Login successful',
      token: result.token,
      user: result.user
    });
  } catch (error) {
    res.status(400).json({ 
      success: false,
      error: error.message 
    });
  }
});

router.get('/verify-email/:token', async (req, res) => {
  try {
    const result = await authService.verifyEmail(req.params.token);
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(400).json({ 
      success: false,
      error: error.message 
    });
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        success: false,
        error: 'Email is required' 
      });
    }
    
    const result = await authService.requestPasswordReset(email);
    
    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

router.post('/reset-password/:token', async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ 
        success: false,
        error: 'Password is required' 
      });
    }
    
    const result = await authService.resetPassword(req.params.token, password);
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(400).json({ 
      success: false,
      error: error.message 
    });
  }
});

router.get('/profile', authenticate, (req, res) => {
  res.json({
    success: true,
    message: 'Profile retrieved successfully',
    user: req.user
  });
});

router.post('/refresh-token', authenticate, (req, res) => {
  try {
    const newToken = authService.generateToken(req.user.id);
    res.json({
      success: true,
      message: 'Token refreshed successfully',
      token: newToken
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: 'Failed to refresh token' 
    });
  }
});

router.post('/logout', authenticate, (req, res) => {
  res.json({ 
    success: true,
    message: 'Logged out successfully' 
  });
});

export default router;
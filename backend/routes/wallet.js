import express from 'express';
import { authenticate } from '../middleware/auth.js';
import walletService from '../services/walletService.js';

const router = express.Router();

// All wallet routes require authentication
router.use(authenticate);

/**
 * GET /api/wallet
 * Get user's wallet balance
 */
router.get('/', async (req, res) => {
  try {
    const result = await walletService.getWallet(req.user.id);
    res.json(result);
  } catch (error) {
    console.error('Get wallet error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve wallet' 
    });
  }
});

/**
 * GET /api/wallet/transactions
 * Get user's transaction history
 */
router.get('/transactions', async (req, res) => {
  try {
    const { page, limit } = req.query;
    const options = {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20
    };
    
    const result = await walletService.getTransactions(req.user.id, options);
    res.json(result);
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve transactions' 
    });
  }
});

// TODO: Add route for 'Add Funds' which would create a payment order

export default router;
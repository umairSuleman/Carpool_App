import { Op } from 'sequelize';
import { Wallet, Transaction } from '../models/associations.js';

class WalletService {
  /**
   * Get user's wallet, create if not exists
   */
  async getWallet(userId) {
    let [wallet, created] = await Wallet.findOrCreate({
      where: { user_id: userId },
      defaults: {
        user_id: userId,
        balance: 0.00,
        currency: 'INR'
      }
    });
    
    if (created) {
      console.log(`Created new wallet for user ${userId}`);
    }

    return {
      success: true,
      wallet
    };
  }

  /**
   * Get paginated transactions for a user
   */
  async getTransactions(userId, options = {}) {
    const { page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    const { count, rows } = await Transaction.findAndCountAll({
      where: { user_id: userId },
      limit,
      offset,
      order: [['created_at', 'DESC']]
    });

    return {
      success: true,
      transactions: rows,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit)
      }
    };
  }
}

export default new WalletService();
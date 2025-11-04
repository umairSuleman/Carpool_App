import ApiService from './api';

export interface Wallet {
  id: string;
  user_id: string;
  balance: string; // Balance is often a string from DECIMAL
  currency: string;
}

export interface Transaction {
  id: string;
  amount: string;
  transaction_type: 'credit' | 'debit';
  category: 'wallet_topup' | 'ride_payment' | 'ride_earning' | 'refund' | 'commission' | 'withdrawal';
  status: 'pending' | 'success' | 'failed' | 'refunded';
  description: string;
  created_at: string;
}

interface WalletResponse {
  success: boolean;
  wallet: Wallet;
}

interface TransactionsResponse {
  success: boolean;
  transactions: Transaction[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

class WalletService {
  /**
   * Get user's wallet
   */
  async getWallet(): Promise<WalletResponse> {
    try {
      const response = await ApiService.request('/wallet', {
        method: 'GET'
      });
      return response as WalletResponse;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get wallet');
    }
  }

  /**
   * Get user's transactions
   */
  async getTransactions(page = 1, limit = 20): Promise<TransactionsResponse> {
    try {
      const response = await ApiService.request(`/wallet/transactions?page=${page}&limit=${limit}`, {
        method: 'GET'
      });
      return response as TransactionsResponse;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get transactions');
    }
  }
}

export default new WalletService();
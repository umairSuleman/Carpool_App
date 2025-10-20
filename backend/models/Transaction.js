import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class Transaction extends Model {}

Transaction.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    field: 'user_id',
    onDelete: 'CASCADE'
  },
  wallet_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'wallets',
      key: 'id'
    },
    field: 'wallet_id',
    onDelete: 'CASCADE'
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: { args: 0.01, msg: 'Amount must be greater than 0' }
    }
  },
  transaction_type: {
    type: DataTypes.ENUM('credit', 'debit'),
    allowNull: false,
    field: 'transaction_type'
  },
  category: {
    type: DataTypes.ENUM('wallet_topup', 'ride_payment', 'ride_earning', 'refund', 'commission', 'withdrawal'),
    allowNull: false,
    validate: {
      isIn: {
        args: [['wallet_topup', 'ride_payment', 'ride_earning', 'refund', 'commission', 'withdrawal']],
        msg: 'Invalid category'
      }
    }
  },
  reference_id: {
    type: DataTypes.UUID,
    field: 'reference_id'
  },
  reference_type: {
    type: DataTypes.ENUM('booking', 'ride', 'topup', 'withdrawal'),
    field: 'reference_type'
  },
  payment_method: {
    type: DataTypes.ENUM('wallet', 'upi', 'card', 'netbanking', 'cash'),
    field: 'payment_method'
  },
  payment_gateway_ref: {
    type: DataTypes.STRING(100),
    field: 'payment_gateway_ref'
  },
  status: {
    type: DataTypes.ENUM('pending', 'success', 'failed', 'refunded'),
    defaultValue: 'pending'
  },
  description: {
    type: DataTypes.TEXT
  },
  metadata: {
    type: DataTypes.JSONB
  }
}, {
  sequelize,
  modelName: 'Transaction',
  tableName: 'transactions',
  indexes: [
    { fields: ['user_id', 'created_at'] },
    { fields: ['wallet_id'] },
    { fields: ['status'] },
    { fields: ['reference_id', 'reference_type'] }
  ]
});

export default Transaction;
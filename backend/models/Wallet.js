import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class Wallet extends Model {
  async addBalance(amount) {
    return this.increment('balance', { by: amount });
  }

  async deductBalance(amount) {
    if (this.balance < amount) {
      throw new Error('Insufficient balance');
    }
    return this.decrement('balance', { by: amount });
  }

  async canAfford(amount) {
    return this.balance >= amount;
  }
}

Wallet.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    references: {
      model: 'users',
      key: 'id'
    },
    field: 'user_id',
    onDelete: 'CASCADE'
  },
  balance: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    allowNull: false,
    validate: {
      min: { args: 0, msg: 'Balance cannot be negative' }
    }
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'INR',
    validate: {
      len: { args: [3, 3], msg: 'Currency code must be 3 characters' }
    }
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  }
}, {
  sequelize,
  modelName: 'Wallet',
  tableName: 'wallets',
  indexes: [
    { fields: ['user_id'] }
  ]
});

export default Wallet;
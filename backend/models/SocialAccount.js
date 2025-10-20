import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class SocialAccount extends Model {}

SocialAccount.init({
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
  provider: {
    type: DataTypes.ENUM('google', 'facebook', 'apple'),
    allowNull: false,
    validate: {
      isIn: {
        args: [['google', 'facebook', 'apple']],
        msg: 'Invalid provider'
      }
    }
  },
  provider_user_id: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'provider_user_id'
  },
  access_token: {
    type: DataTypes.TEXT,
    field: 'access_token'
  },
  refresh_token: {
    type: DataTypes.TEXT,
    field: 'refresh_token'
  }
}, {
  sequelize,
  modelName: 'SocialAccount',
  tableName: 'social_accounts',
  indexes: [
    { fields: ['user_id'] },
    { 
      unique: true, 
      fields: ['provider', 'provider_user_id'],
      name: 'unique_provider_user'
    }
  ]
});

export default SocialAccount;
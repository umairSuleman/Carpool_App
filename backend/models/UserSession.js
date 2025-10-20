import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class UserSession extends Model {
  get isExpired() {
    return new Date() > this.expires_at;
  }

  async refreshActivity() {
    return this.update({
      last_activity: new Date()
    });
  }

  async deactivate() {
    return this.update({
      is_active: false
    });
  }
}

UserSession.init({
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
  device_type: {
    type: DataTypes.STRING(20),
    allowNull: false,
    field: 'device_type',
    validate: {
      isIn: {
        args: [['ios', 'android', 'web', 'unknown']],
        msg: 'Invalid device type'
      }
    }
  },
  device_id: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'device_id'
  },
  fcm_token: {
    type: DataTypes.STRING(255),
    field: 'fcm_token'
  },
  ip_address: {
    type: DataTypes.STRING(45),
    field: 'ip_address',
    validate: {
      isIP: true
    }
  },
  user_agent: {
    type: DataTypes.STRING(255),
    field: 'user_agent'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  },
  last_activity: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'last_activity'
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'expires_at'
  }
}, {
  sequelize,
  modelName: 'UserSession',
  tableName: 'user_sessions',
  indexes: [
    { fields: ['user_id', 'is_active'] },
    { fields: ['device_id'] },
    { fields: ['expires_at'] }
  ]
});

export default UserSession;
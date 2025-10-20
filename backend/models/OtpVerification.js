import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class OtpVerification extends Model {
  async markAsVerified() {
    return this.update({
      is_verified: true,
      verified_at: new Date()
    });
  }

  get isExpired() {
    return new Date() > this.expires_at;
  }

  get isValid() {
    return !this.is_verified && !this.isExpired;
  }
}

OtpVerification.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    field: 'user_id',
    onDelete: 'SET NULL'
  },
  contact: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Email or phone number'
  },
  otp_code: {
    type: DataTypes.STRING(6),
    allowNull: false,
    field: 'otp_code'
  },
  otp_type: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'otp_type',
    validate: {
      isIn: {
        args: [['registration', 'login', 'password_reset', 'phone_verification']],
        msg: 'Invalid OTP type'
      }
    }
  },
  is_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_verified'
  },
  verified_at: {
    type: DataTypes.DATE,
    field: 'verified_at'
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'expires_at'
  },
  attempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  }
}, {
  sequelize,
  modelName: 'OtpVerification',
  tableName: 'otp_verifications',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['contact', 'otp_type'] },
    { fields: ['is_verified'] },
    { fields: ['expires_at'] }
  ]
});

export default OtpVerification;
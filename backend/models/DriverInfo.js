import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class DriverInfo extends Model {}

DriverInfo.init({
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
  license_number: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    field: 'license_number',
    validate: {
      notEmpty: { msg: 'License number is required' }
    }
  },
  license_expiry: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'license_expiry',
    validate: {
      isDate: true,
      isFutureDate(value) {
        if (new Date(value) < new Date()) {
          throw new Error('License expiry date must be in the future');
        }
      }
    }
  },
  vehicle_number: {
    type: DataTypes.STRING(15),
    allowNull: false,
    field: 'vehicle_number',
    validate: {
      notEmpty: { msg: 'Vehicle number is required' }
    },
    set(value) {
      this.setDataValue('vehicle_number', value.toUpperCase().trim());
    }
  },
  vehicle_model: {
    type: DataTypes.STRING(30),
    allowNull: false,
    field: 'vehicle_model'
  },
  vehicle_color: {
    type: DataTypes.STRING(20),
    field: 'vehicle_color'
  },
  total_seats: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'total_seats',
    validate: {
      min: { args: 1, msg: 'Vehicle must have at least 1 seat' },
      max: { args: 8, msg: 'Vehicle cannot have more than 8 seats' }
    }
  },
  vehicle_type: {
    type: DataTypes.ENUM('sedan', 'suv', 'hatchback', 'mini', 'luxury'),
    field: 'vehicle_type',
    validate: {
      isIn: {
        args: [['sedan', 'suv', 'hatchback', 'mini', 'luxury']],
        msg: 'Invalid vehicle type'
      }
    }
  },
  is_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_verified'
  },
  verification_date: {
    type: DataTypes.DATE,
    field: 'verification_date'
  }
}, {
  sequelize,
  modelName: 'DriverInfo',
  tableName: 'driver_info',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['license_number'] },
    { fields: ['is_verified'] }
  ]
});

export default DriverInfo;
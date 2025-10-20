import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class Booking extends Model {}

Booking.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  ride_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'rides',
      key: 'id'
    },
    field: 'ride_id',
    onDelete: 'CASCADE'
  },
  passenger_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    field: 'passenger_id',
    onDelete: 'CASCADE'
  },
  seats_booked: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'seats_booked',
    validate: {
      min: 1
    }
  },
  total_amount: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: false,
    field: 'total_amount',
    validate: {
      min: 0
    }
  },
  booking_status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'cancelled', 'completed'),
    defaultValue: 'pending',
    field: 'booking_status'
  },
  payment_status: {
    type: DataTypes.ENUM('pending', 'completed', 'refunded', 'failed'),
    defaultValue: 'pending',
    field: 'payment_status'
  },
  pickup_location: {
    type: DataTypes.STRING(200),
    field: 'pickup_location'
  },
  dropoff_location: {
    type: DataTypes.STRING(200),
    field: 'dropoff_location'
  },
  cancellation_reason: {
    type: DataTypes.TEXT,
    field: 'cancellation_reason'
  },
  cancelled_by: {
    type: DataTypes.UUID,
    references: {
      model: 'users',
      key: 'id'
    },
    field: 'cancelled_by'
  },
  cancelled_at: {
    type: DataTypes.DATE,
    field: 'cancelled_at'
  }
}, {
  sequelize,
  modelName: 'Booking',
  tableName: 'bookings',
  indexes: [
    { fields: ['ride_id'] },
    { fields: ['passenger_id'] },
    { fields: ['booking_status'] },
    { fields: ['payment_status'] }
  ]
});

export default Booking;
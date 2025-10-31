import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class Ride extends Model {
  get availableSeatsCount() {
    return this.available_seats - this.booked_seats;
  }

  async bookSeats(count) {
    if (this.availableSeatsCount < count) {
      throw new Error('Not enough available seats');
    }
    return this.increment('booked_seats', { by: count });
  }

  async releaseSeats(count) {
    return this.decrement('booked_seats', { by: count });
  }
}

Ride.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  driver_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    field: 'driver_id',
    onDelete: 'CASCADE'
  },
  source_address: {
    type: DataTypes.STRING(200),
    allowNull: false,
    field: 'source_address'
  },
  source_lat: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: false,
    field: 'source_lat',
    validate: {
      min: -90,
      max: 90
    }
  },
  source_lng: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: false,
    field: 'source_lng',
    validate: {
      min: -180,
      max: 180
    }
  },
  destination_address: {
    type: DataTypes.STRING(200),
    allowNull: false,
    field: 'destination_address'
  },
  destination_lat: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: false,
    field: 'destination_lat',
    validate: {
      min: -90,
      max: 90
    }
  },
  destination_lng: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: false,
    field: 'destination_lng',
    validate: {
      min: -180,
      max: 180
    }
  },
  departure_time: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'departure_time'
  },
  available_seats: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'available_seats',
    validate: {
      min: 1
    }
  },
  booked_seats: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'booked_seats',
    validate: {
      min: 0
    }
  },
  price_per_seat: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: false,
    field: 'price_per_seat',
    validate: {
      min: 0
    }
  },
  status: {
    type: DataTypes.ENUM('active', 'completed', 'cancelled', 'in_progress'),
    defaultValue: 'active'
  },
  is_recurring: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_recurring'
  },
  recurrence_pattern: {
    type: DataTypes.JSONB,
    field: 'recurrence_pattern'
  },
  distance_km: {
    type: DataTypes.DECIMAL(8, 2),
    field: 'distance_km'
  },
  duration_minutes: {
    type: DataTypes.INTEGER,
    field: 'duration_minutes'
  },
  waypoints: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const rawValue = this.getDataValue('waypoints');
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(value) {
      this.setDataValue('waypoints', JSON.stringify(value));
    }
  }
}, {
  sequelize,
  modelName: 'Ride',
  tableName: 'rides',
  indexes: [
    { fields: ['driver_id', 'status'] },
    { fields: ['departure_time'] },
    { fields: ['status'] },
    { fields: ['source_lat', 'source_lng', 'destination_lat', 'destination_lng'] }
  ]
});

export default Ride;
import { DataTypes, Model } from 'sequelize';
import { hash, compare } from 'bcryptjs';
import sequelize from '../config/database.js';

class User extends Model {
  // Instance methods
  async comparePassword(password) {
    return compare(password, this.password_hash);
  }

  async incrementLoginAttempts() {
    if (this.locked_until && this.locked_until < new Date()) {
      // Lock has expired, reset attempts
      return this.update({
        login_attempts: 1,
        locked_until: null
      });
    }

    const updates = { login_attempts: this.login_attempts + 1 };
    
    // Lock account after 5 failed attempts
    if (this.login_attempts + 1 >= 5 && !this.isLocked) {
      updates.locked_until = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
    }

    return this.update(updates);
  }

  async resetLoginAttempts() {
    return this.update({
      login_attempts: 0,
      locked_until: null,
      last_login: new Date()
    });
  }

  // Virtual getters
  get isLocked() {
    return !!(this.locked_until && this.locked_until > new Date());
  }

  get isActive() {
    return this.is_verified && !this.isLocked;
  }

  // Remove sensitive data
  toSafeJSON() {
    const values = { ...this.get() };
    delete values.password_hash;
    delete values.email_verification_token;
    delete values.email_verification_expires;
    delete values.password_reset_token;
    delete values.password_reset_expires;
    delete values.login_attempts;
    delete values.locked_until;
    return values;
  }

  // Static methods
  static async findByCredentials(email, password) {
    const user = await User.findOne({
      where: { email: email.toLowerCase() },
      include: [{
        model: UserProfile,
        as: 'profile'
      }]
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (user.isLocked) {
      await user.incrementLoginAttempts();
      throw new Error('Account temporarily locked due to too many failed login attempts');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await user.incrementLoginAttempts();
      throw new Error('Invalid credentials');
    }

    if (user.login_attempts > 0) {
      await user.resetLoginAttempts();
    }

    return user;
  }

  static async hashPassword(password) {
    return hash(password, 12);
  }
}

User.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Name is required' },
      len: {
        args: [2, 100],
        msg: 'Name must be between 2 and 100 characters'
      }
    },
    set(value) {
      this.setDataValue('name', value.trim());
    }
  },
  email: {
    type: DataTypes.CITEXT,
    allowNull: false,
    unique: {
      msg: 'Email address is already registered'
    },
    validate: {
      isEmail: { msg: 'Invalid email format' },
      notEmpty: { msg: 'Email is required' }
    },
    set(value) {
      this.setDataValue('email', value.toLowerCase().trim());
    }
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: {
      msg: 'Phone number is already registered'
    },
    validate: {
      notEmpty: { msg: 'Phone number is required' },
      is: {
        args: /^[\+]?[1-9][\d]{0,15}$/,
        msg: 'Invalid phone number format'
      }
    },
    set(value) {
      this.setDataValue('phone', value.replace(/[\s\-\(\)]/g, ''));
    }
  },
  password_hash: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'password_hash'
  },
  is_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_verified'
  },
  email_verification_token: {
    type: DataTypes.STRING,
    field: 'email_verification_token'
  },
  email_verification_expires: {
    type: DataTypes.DATE,
    field: 'email_verification_expires'
  },
  password_reset_token: {
    type: DataTypes.STRING,
    field: 'password_reset_token'
  },
  password_reset_expires: {
    type: DataTypes.DATE,
    field: 'password_reset_expires'
  },
  role: {
    type: DataTypes.ENUM('driver', 'passenger', 'both'),
    defaultValue: 'passenger',
    validate: {
      isIn: {
        args: [['driver', 'passenger', 'both']],
        msg: 'Role must be driver, passenger, or both'
      }
    }
  },
  login_attempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'login_attempts'
  },
  locked_until: {
    type: DataTypes.DATE,
    field: 'locked_until'
  },
  last_login: {
    type: DataTypes.DATE,
    field: 'last_login'
  }
}, {
  sequelize,
  modelName: 'User',
  tableName: 'users',
  indexes: [
    { fields: ['email'] },
    { fields: ['phone'] },
    { fields: ['email_verification_token'] },
    { fields: ['password_reset_token'] },
    { fields: ['is_verified'] },
    { fields: ['created_at'] }
  ]
});
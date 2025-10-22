import { User, UserProfile, DriverInfo } from '../models/associations.js';
import { validateEmail, validatePhone } from '../utils/validation.js';
import { Op } from 'sequelize';

class ProfileService {
  // Get user profile with all related data
  async getUserProfile(userId, includePrivate = false) {
    const attributes = includePrivate 
      ? { exclude: ['password_hash'] }
      : ['id', 'name', 'role', 'created_at'];

    const user = await User.findByPk(userId, {
      attributes,
      include: [
        {
          model: UserProfile,
          as: 'profile'
        },
        {
          model: DriverInfo,
          as: 'driverInfo',
          required: false
        }
      ]
    });

    if (!user) {
      throw new Error('User not found');
    }

    return includePrivate ? user.toSafeJSON() : this.formatPublicProfile(user);
  }

  // Format public profile (for viewing other users)
  formatPublicProfile(user) {
    return {
      id: user.id,
      name: user.name,
      role: user.role,
      memberSince: user.created_at,
      profile: user.profile ? {
        gender: user.profile.gender,
        bio: user.profile.bio,
        smoking: user.profile.smoking,
        pets: user.profile.pets,
        music: user.profile.music,
        chatty: user.profile.chatty,
        rating: user.profile.rating,
        totalRides: user.profile.total_rides
      } : null,
      driverInfo: user.driverInfo && user.driverInfo.is_verified ? {
        vehicleModel: user.driverInfo.vehicle_model,
        vehicleColor: user.driverInfo.vehicle_color,
        vehicleType: user.driverInfo.vehicle_type,
        totalSeats: user.driverInfo.total_seats,
        isVerified: user.driverInfo.is_verified
      } : null
    };
  }

  // Update user profile
  async updateProfile(userId, updates) {
    const user = await User.findByPk(userId, {
      include: [{
        model: UserProfile,
        as: 'profile'
      }]
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Separate user fields from profile fields
    const userFields = ['name', 'email', 'phone'];
    const profileFields = ['age', 'gender', 'bio', 'smoking', 'pets', 'music', 'chatty'];

    const userUpdates = {};
    const profileUpdates = {};

    // Validate and prepare updates
    for (const [key, value] of Object.entries(updates)) {
      if (value === undefined) continue;

      if (userFields.includes(key)) {
        // Validate email
        if (key === 'email' && value !== user.email) {
          if (!validateEmail(value)) {
            throw new Error('Invalid email format');
          }
          const existingEmail = await User.findOne({ 
            where: { 
              email: value.toLowerCase(),
              id: { [Op.ne]: userId }
            } 
          });
          if (existingEmail) {
            throw new Error('Email already in use');
          }
        }

        // Validate phone
        if (key === 'phone' && value !== user.phone) {
          if (!validatePhone(value)) {
            throw new Error('Invalid phone format');
          }
          const existingPhone = await User.findOne({ 
            where: { 
              phone: value.replace(/[\s\-\(\)]/g, ''),
              id: { [Op.ne]: userId }
            } 
          });
          if (existingPhone) {
            throw new Error('Phone number already in use');
          }
        }

        userUpdates[key] = value;
      } else if (profileFields.includes(key)) {
        profileUpdates[key] = value;
      }
    }

    // Apply updates
    if (Object.keys(userUpdates).length > 0) {
      await user.update(userUpdates);
    }

    if (Object.keys(profileUpdates).length > 0 && user.profile) {
      await user.profile.update(profileUpdates);
    }

    // Reload and return updated user
    await user.reload({
      include: [{
        model: UserProfile,
        as: 'profile'
      }]
    });

    return user.toSafeJSON();
  }

  // Update profile preferences
  async updatePreferences(userId, preferences) {
    const user = await User.findByPk(userId, {
      include: [{
        model: UserProfile,
        as: 'profile'
      }]
    });

    if (!user || !user.profile) {
      throw new Error('User profile not found');
    }

    const allowedPreferences = ['smoking', 'pets', 'music', 'chatty'];
    const updates = {};

    for (const [key, value] of Object.entries(preferences)) {
      if (allowedPreferences.includes(key) && typeof value === 'boolean') {
        updates[key] = value;
      }
    }

    if (Object.keys(updates).length === 0) {
      throw new Error('No valid preferences to update');
    }

    await user.profile.update(updates);

    return {
      preferences: {
        smoking: user.profile.smoking,
        pets: user.profile.pets,
        music: user.profile.music,
        chatty: user.profile.chatty
      }
    };
  }

  // Search users (for admin or ride matching)
  async searchUsers(query, options = {}) {
    const { page = 1, limit = 20, role } = options;
    const offset = (page - 1) * limit;

    const where = {};
    
    if (query) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${query}%` } },
        { email: { [Op.iLike]: `%${query}%` } }
      ];
    }

    if (role) {
      where.role = role;
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: ['id', 'name', 'email', 'role', 'is_verified', 'created_at'],
      include: [{
        model: UserProfile,
        as: 'profile',
        attributes: ['rating', 'total_rides']
      }],
      limit,
      offset,
      order: [['created_at', 'DESC']]
    });

    return {
      users: rows.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.is_verified,
        rating: user.profile?.rating,
        totalRides: user.profile?.total_rides,
        memberSince: user.created_at
      })),
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  // Get user statistics
  async getUserStats(userId) {
    const user = await User.findByPk(userId, {
      include: [{
        model: UserProfile,
        as: 'profile'
      }]
    });

    if (!user) {
      throw new Error('User not found');
    }

    // These would be expanded with actual ride/booking queries
    return {
      rating: user.profile?.rating || null,
      totalRides: user.profile?.total_rides || 0,
      memberSince: user.created_at,
      isVerified: user.is_verified,
      role: user.role
    };
  }

  // Delete user account (soft delete or hard delete)
  async deleteAccount(userId, hardDelete = false) {
    const user = await User.findByPk(userId);

    if (!user) {
      throw new Error('User not found');
    }

    if (hardDelete) {
      await user.destroy();
      return { message: 'Account permanently deleted' };
    } else {
      // Implement soft delete logic
      await user.update({
        is_verified: false,
        email: `deleted_${userId}@deleted.com`,
        phone: `deleted_${userId}`
      });
      return { message: 'Account deactivated' };
    }
  }
}

export default new ProfileService();
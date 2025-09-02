import User from './User.js';
import UserProfile from './UserProfile.js';

// Define associations
User.hasOne(UserProfile, {
  foreignKey: 'user_id',
  as: 'profile',
  onDelete: 'CASCADE'
});

UserProfile.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});
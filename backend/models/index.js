import User from './User.js';
import UserProfile from './UserProfile.js';
import OtpVerification from './OtpVerification.js';
import SocialAccount from './SocialAccount.js';
import DriverInfo from './DriverInfo.js';
import UserVerificationDocument from './UserVerificationDocument.js';
import UserSession from './UserSession.js';

// User associations
User.hasOne(UserProfile, {
  foreignKey: 'user_id',
  as: 'profile',
  onDelete: 'CASCADE'
});

User.hasMany(OtpVerification, {
  foreignKey: 'user_id',
  as: 'otpVerifications',
  onDelete: 'SET NULL'
});

User.hasMany(SocialAccount, {
  foreignKey: 'user_id',
  as: 'socialAccounts',
  onDelete: 'CASCADE'
});

User.hasOne(DriverInfo, {
  foreignKey: 'user_id',
  as: 'driverInfo',
  onDelete: 'CASCADE'
});

User.hasMany(UserVerificationDocument, {
  foreignKey: 'user_id',
  as: 'verificationDocuments',
  onDelete: 'CASCADE'
});

User.hasMany(UserSession, {
  foreignKey: 'user_id',
  as: 'sessions',
  onDelete: 'CASCADE'
});

// Reverse associations
UserProfile.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
OtpVerification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
SocialAccount.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
DriverInfo.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
UserVerificationDocument.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
UserSession.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

export {
  User,
  UserProfile,
  OtpVerification,
  SocialAccount,
  DriverInfo,
  UserVerificationDocument,
  UserSession
};
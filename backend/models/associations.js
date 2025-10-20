import User from './User.js';
import UserProfile from './UserProfile.js';
import OtpVerification from './OtpVerification.js';
import SocialAccount from './SocialAccount.js';
import DriverInfo from './DriverInfo.js';
import UserVerificationDocument from './UserVerificationDocument.js';
import UserSession from './UserSession.js';
import Wallet from './Wallet.js';
import Transaction from './Transaction.js';
import Ride from './Ride.js';
import Booking from './Booking.js';

// USER ASSOCIATIONS

// User has one Profile
User.hasOne(UserProfile, {
  foreignKey: 'user_id',
  as: 'profile',
  onDelete: 'CASCADE'
});

UserProfile.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// User has many OTP Verifications
User.hasMany(OtpVerification, {
  foreignKey: 'user_id',
  as: 'otpVerifications',
  onDelete: 'SET NULL'
});

OtpVerification.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// User has many Social Accounts
User.hasMany(SocialAccount, {
  foreignKey: 'user_id',
  as: 'socialAccounts',
  onDelete: 'CASCADE'
});

SocialAccount.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// User has one Driver Info
User.hasOne(DriverInfo, {
  foreignKey: 'user_id',
  as: 'driverInfo',
  onDelete: 'CASCADE'
});

DriverInfo.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// User has many Verification Documents
User.hasMany(UserVerificationDocument, {
  foreignKey: 'user_id',
  as: 'verificationDocuments',
  onDelete: 'CASCADE'
});

UserVerificationDocument.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// Verified By (Admin)
UserVerificationDocument.belongsTo(User, {
  foreignKey: 'verified_by',
  as: 'verifiedBy'
});

// User has many Sessions
User.hasMany(UserSession, {
  foreignKey: 'user_id',
  as: 'sessions',
  onDelete: 'CASCADE'
});

UserSession.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// WALLET & TRANSACTION ASSOCIATIONS

// User has one Wallet
User.hasOne(Wallet, {
  foreignKey: 'user_id',
  as: 'wallet',
  onDelete: 'CASCADE'
});

Wallet.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// User has many Transactions
User.hasMany(Transaction, {
  foreignKey: 'user_id',
  as: 'transactions',
  onDelete: 'CASCADE'
});

Transaction.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// Wallet has many Transactions
Wallet.hasMany(Transaction, {
  foreignKey: 'wallet_id',
  as: 'transactions',
  onDelete: 'CASCADE'
});

Transaction.belongsTo(Wallet, {
  foreignKey: 'wallet_id',
  as: 'wallet'
});

// RIDE ASSOCIATIONS

// User (as Driver) has many Rides
User.hasMany(Ride, {
  foreignKey: 'driver_id',
  as: 'ridesAsDriver',
  onDelete: 'CASCADE'
});

Ride.belongsTo(User, {
  foreignKey: 'driver_id',
  as: 'driver'
});

// BOOKING ASSOCIATIONS

// Ride has many Bookings
Ride.hasMany(Booking, {
  foreignKey: 'ride_id',
  as: 'bookings',
  onDelete: 'CASCADE'
});

Booking.belongsTo(Ride, {
  foreignKey: 'ride_id',
  as: 'ride'
});

// User (as Passenger) has many Bookings
User.hasMany(Booking, {
  foreignKey: 'passenger_id',
  as: 'bookingsAsPassenger',
  onDelete: 'CASCADE'
});

Booking.belongsTo(User, {
  foreignKey: 'passenger_id',
  as: 'passenger'
});

// Cancelled By (User)
Booking.belongsTo(User, {
  foreignKey: 'cancelled_by',
  as: 'cancelledBy'
});

// EXPORT ALL MODELS

export {
  User,
  UserProfile,
  OtpVerification,
  SocialAccount,
  DriverInfo,
  UserVerificationDocument,
  UserSession,
  Wallet,
  Transaction,
  Ride,
  Booking
};

export default {
  User,
  UserProfile,
  OtpVerification,
  SocialAccount,
  DriverInfo,
  UserVerificationDocument,
  UserSession,
  Wallet,
  Transaction,
  Ride,
  Booking
};
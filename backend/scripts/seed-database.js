import dotenv from 'dotenv';
dotenv.config({ override: true }); // Ensure DB credentials are loaded

import sequelize from '../config/database.js';
import { User, UserProfile, DriverInfo, Wallet } from '../models/associations.js';

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...\n');
    const transaction = await sequelize.transaction();
    try {
      // Create test users
      console.log('👤 Creating test users...');
      
      // Since User.hashPassword is an asynchronous static method, 
      // it should be fine as long as the User model is correctly linked to bcrypt utils.

      // Passenger 1
      const passenger1 = await User.create({
        name: 'John Doe',
        email: 'john.passenger@example.com',
        phone: '+919876543210',
        password_hash: await User.hashPassword('Password123'),
        role: 'passenger',
        is_verified: true
      }, { transaction });
      // ... (rest of passenger1 creation)
      await UserProfile.create({
        user_id: passenger1.id,
        age: 28,
        gender: 'male',
        bio: 'Regular commuter, love to carpool!',
        rating: 4.8
      }, { transaction });
      await Wallet.create({
        user_id: passenger1.id,
        balance: 500.00
      }, { transaction });
      // Driver 1
      const driver1 = await User.create({
        name: 'Jane Smith',
        email: 'jane.driver@example.com',
        phone: '+919876543211',
        password_hash: await User.hashPassword('Password123'),
        role: 'driver',
        is_verified: true
      }, { transaction });
      // ... (rest of driver1 creation)
      await UserProfile.create({
        user_id: driver1.id,
        age: 32,
        gender: 'female',
        bio: 'Experienced driver, safe and reliable',
        rating: 4.9,
        total_rides: 150
      }, { transaction });
      await DriverInfo.create({
        user_id: driver1.id,
        license_number: 'DL1420110012345',
        license_expiry: new Date('2030-12-31'),
        vehicle_number: 'KA01AB1234',
        vehicle_model: 'Honda City',
        vehicle_color: 'Silver',
        total_seats: 4,
        vehicle_type: 'sedan',
        is_verified: true,
        verification_date: new Date()
      }, { transaction });
      await Wallet.create({
        user_id: driver1.id,
        balance: 1500.00
      }, { transaction });
      // Driver 2
      const driver2 = await User.create({
        name: 'Mike Johnson',
        email: 'mike.driver@example.com',
        phone: '+919876543212',
        password_hash: await User.hashPassword('Password123'),
        role: 'both',
        is_verified: true
      }, { transaction });
      // ... (rest of driver2 creation)
      await UserProfile.create({
        user_id: driver2.id,
        age: 35,
        gender: 'male',
        bio: 'Daily commuter from Whitefield to Koramangala',
        rating: 4.7,
        total_rides: 89
      }, { transaction });
      await DriverInfo.create({
        user_id: driver2.id,
        license_number: 'DL1420110067890',
        license_expiry: new Date('2029-06-30'),
        vehicle_number: 'KA02XY5678',
        vehicle_model: 'Hyundai Creta',
        vehicle_color: 'White',
        total_seats: 5,
        vehicle_type: 'suv',
        is_verified: true,
        verification_date: new Date()
      }, { transaction });
      await Wallet.create({
        user_id: driver2.id,
        balance: 750.00
      }, { transaction });
      // Passenger 2
      const passenger2 = await User.create({
        name: 'Sarah Williams',
        email: 'sarah.passenger@example.com',
        phone: '+919876543213',
        password_hash: await User.hashPassword('Password123'),
        role: 'passenger',
        is_verified: true
      }, { transaction });
      // ... (rest of passenger2 creation)
      await UserProfile.create({
        user_id: passenger2.id,
        age: 26,
        gender: 'female',
        bio: 'Tech professional, prefer quiet rides',
        rating: 4.6,
        chatty: false
      }, { transaction });
      await Wallet.create({
        user_id: passenger2.id,
        balance: 300.00
      }, { transaction });
      // Admin User
      const admin = await User.create({
        name: 'Admin User',
        email: 'admin@carpoolconnect.com',
        phone: '+919876543214',
        password_hash: await User.hashPassword('AdminPass123'),
        role: 'both',
        is_verified: true
      }, { transaction });
      // ... (rest of admin creation)
      await UserProfile.create({
        user_id: admin.id,
        age: 30,
        gender: 'prefer_not_to_say',
        bio: 'System Administrator'
      }, { transaction });
      await Wallet.create({
        user_id: admin.id,
        balance: 0.00
      }, { transaction });
      await transaction.commit();
      console.log('✅ Test users created successfully!\n');
      console.log('📋 Test Credentials:');
      console.log('  Passenger 1: john.passenger@example.com / Password123');
      console.log('  Driver 1: jane.driver@example.com / Password123');
      console.log('  Driver 2: mike.driver@example.com / Password123');
      console.log('  Passenger 2: sarah.passenger@example.com / Password123');
      console.log('  Admin: admin@carpoolconnect.com / AdminPass123');
      console.log('\n✅ Database seeding completed!');
      process.exit(0);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  }
}
seedDatabase();
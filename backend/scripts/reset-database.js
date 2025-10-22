// ============================================
// backend/scripts/reset-database.js
// ============================================
import dotenv from 'dotenv';
dotenv.config({ override: true }); // Ensure variables are loaded

import sequelize from '../config/database.js';
import '../models/associations.js';

async function resetDatabase() {
  try {
    console.log('⚠️  WARNING: This will delete all data in the database!');
    console.log('⚠️  Press Ctrl+C within 10 seconds to cancel...\n');

    await new Promise(resolve => setTimeout(resolve, 10000));

    console.log('🔄 Resetting database (Force Sync)...\n');

    // 🔑 FIX: Drop all tables and recreate them in one step
    // This avoids the low-level error in sequelize.drop()
    await sequelize.sync({ force: true });
    
    console.log('✅ Database fully reset and tables recreated');
    console.log('\n✅ Database reset completed!');
    console.log('💡 Run "npm run db:seed" to add test data');

    process.exit(0);
  } catch (error) {
    console.error('❌ Database reset failed:', error);
    process.exit(1);
  }
}
resetDatabase();
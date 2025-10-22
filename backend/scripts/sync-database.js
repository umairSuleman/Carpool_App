import dotenv from 'dotenv';
dotenv.config({ override: true }); // Ensure DB credentials are loaded

import sequelize from '../config/database.js';
import * as models from '../models/associations.js';

async function syncDatabase() {
  try {
    console.log('🔄 Starting database synchronization...\n');
    const isDevelopment = process.env.NODE_ENV === 'development';
    const forceSync = process.argv.includes('--force');
    const alterSync = process.argv.includes('--alter') || isDevelopment;
    if (forceSync) {
      console.log('⚠️  WARNING: Force sync will drop all tables!');
      console.log('⚠️  Press Ctrl+C within 5 seconds to cancel...\n');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    // Sync all models
    await sequelize.sync({ 
      force: forceSync,
      alter: alterSync && !forceSync
    });
    console.log('✅ Database synchronized successfully!');
    // List synced models
    console.log('\n📋 Synced models:');
    Object.keys(models).forEach(modelName => {
      if (modelName !== 'default') {
        console.log(`  ✓ ${modelName}`);
      }
    });
    console.log('\n✅ Sync completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database sync failed:', error);
    process.exit(1);
  }
}
syncDatabase();
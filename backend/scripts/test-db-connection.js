import dotenv from 'dotenv';
dotenv.config({ override: true }); // Ensure DB credentials are loaded

import sequelize from '../config/database.js';
import '../models/associations.js';

async function testConnection() {
  try {
    console.log('🔄 Testing database connection...\n');
    // Test authentication
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully!');
    // Get database info
    const [results] = await sequelize.query(`
      SELECT 
        current_database() as database,
        current_user as user,
        version() as version
    `);
    console.log('\n📊 Database Information:');
    console.log(`  Database: ${results[0].database}`);
    console.log(`  User: ${results[0].user}`);
    console.log(`  Version: ${results[0].version.split(',')[0]}`);
    // List all tables
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    console.log(`\n📋 Available tables (${tables.length}):`);
    tables.forEach(table => console.log(`  ✓ ${table.table_name}`));
    // Count records in key tables
    if (tables.length > 0) {
      console.log('\n📈 Record counts:');
      const countTables = ['users', 'user_profiles', 'rides', 'bookings', 'wallets'];
      for (const table of countTables) {
        const tableExists = tables.find(t => t.table_name === table);
        if (tableExists) {
          const [count] = await sequelize.query(`SELECT COUNT(*) as count FROM ${table}`);
          console.log(`  ${table}: ${count[0].count}`);
        }
      }
    }
    console.log('\n✅ Database test completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database connection test failed:');
    console.error(error.message);
    if (error.parent) {
      console.error('Parent error:', error.parent.message);
    }
    process.exit(1);
  }
}
testConnection();
testConnection();
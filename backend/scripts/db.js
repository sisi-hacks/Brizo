#!/usr/bin/env node

const DatabaseManager = require('../lib/database');
const path = require('path');

const dbPath = process.env.DB_PATH || './data/brizo.db';
const dbManager = new DatabaseManager(dbPath);

async function main() {
  const command = process.argv[2];

  try {
    await dbManager.connect();

    switch (command) {
      case 'backup':
        console.log('💾 Creating database backup...');
        const backupPath = await dbManager.backup();
        console.log(`✅ Backup created: ${backupPath}`);
        break;

      case 'stats':
        console.log('📊 Database Statistics:');
        const paymentStats = await dbManager.get('SELECT COUNT(*) as total, SUM(CASE WHEN status = "paid" THEN 1 ELSE 0 END) as paid FROM payments');
        const merchantStats = await dbManager.get('SELECT COUNT(*) as total FROM merchants');
        console.log(`Payments: ${paymentStats.total} total, ${paymentStats.paid || 0} paid`);
        console.log(`Merchants: ${merchantStats.total} total`);
        break;

      case 'migrate':
        console.log('🔄 Running migrations...');
        await dbManager.migrate();
        console.log('✅ Migrations completed');
        break;

      case 'reset':
        console.log('⚠️  Resetting database...');
        await dbManager.run('DELETE FROM payments');
        await dbManager.run('DELETE FROM merchants');
        await dbManager.run('DELETE FROM migrations');
        console.log('✅ Database reset complete');
        break;

      default:
        console.log('Available commands:');
        console.log('  backup  - Create database backup');
        console.log('  stats   - Show database statistics');
        console.log('  migrate - Run database migrations');
        console.log('  reset   - Reset database (WARNING: deletes all data)');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await dbManager.close();
  }
}

main();

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class DatabaseManager {
  constructor(dbPath) {
    this.dbPath = dbPath;
    this.db = null;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('Error opening database:', err.message);
          reject(err);
        } else {
          console.log('📊 Connected to SQLite database:', this.dbPath);
          resolve();
        }
      });
    });
  }

  async run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  }

  async get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  async all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async migrate() {
    console.log('🔄 Running database migrations...');
    
    try {
      // Create migrations table
      await this.run(`
        CREATE TABLE IF NOT EXISTS migrations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Migration 1: Initial schema
      const migration1 = '001_initial_schema';
      const hasMigration1 = await this.get('SELECT * FROM migrations WHERE name = ?', [migration1]);
      
      if (!hasMigration1) {
        console.log('📝 Running migration: Initial schema');
        
        await this.run(`
          CREATE TABLE IF NOT EXISTS payments (
            id TEXT PRIMARY KEY,
            amount REAL NOT NULL,
            description TEXT NOT NULL,
            merchantId TEXT NOT NULL,
            donation BOOLEAN DEFAULT FALSE,
            status TEXT DEFAULT 'pending',
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            paidAt DATETIME,
            sbtcTxId TEXT
          )
        `);

        await this.run(`
          CREATE TABLE IF NOT EXISTS merchants (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            walletAddress TEXT NOT NULL,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        await this.run('INSERT INTO migrations (name) VALUES (?)', [migration1]);
        console.log('✅ Migration 1 completed');
      }

      // Migration 2: Add indexes for performance
      const migration2 = '002_add_indexes';
      const hasMigration2 = await this.get('SELECT * FROM migrations WHERE name = ?', [migration2]);
      
      if (!hasMigration2) {
        console.log('📝 Running migration: Add indexes');
        
        await this.run('CREATE INDEX IF NOT EXISTS idx_payments_merchantId ON payments(merchantId)');
        await this.run('CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status)');
        await this.run('CREATE INDEX IF NOT EXISTS idx_payments_createdAt ON payments(createdAt)');
        await this.run('CREATE INDEX IF NOT EXISTS idx_merchants_walletAddress ON merchants(walletAddress)');
        
        await this.run('INSERT INTO migrations (name) VALUES (?)', [migration2]);
        console.log('✅ Migration 2 completed');
      }

      // Migration 3: Add demo data
      const migration3 = '003_demo_data';
      const hasMigration3 = await this.get('SELECT * FROM migrations WHERE name = ?', [migration3]);
      
      if (!hasMigration3) {
        console.log('📝 Running migration: Add demo data');
        
        await this.run(`
          INSERT OR IGNORE INTO merchants (id, name, walletAddress) VALUES 
          ('merchant123', 'Demo Merchant', 'ST1PQHQKV0RJXZFYVWE6CHS7NS4T3MG9XJVTQVAVSB')
        `);
        
        await this.run('INSERT INTO migrations (name) VALUES (?)', [migration3]);
        console.log('✅ Migration 3 completed');
      }

      console.log('🎉 All migrations completed successfully');
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }

  async backup() {
    const backupPath = this.dbPath.replace('.db', `_backup_${Date.now()}.db`);
    return new Promise((resolve, reject) => {
      const backup = new sqlite3.Database(backupPath);
      this.db.backup(backup)
        .then(() => {
          backup.close();
          console.log(`💾 Database backed up to: ${backupPath}`);
          resolve(backupPath);
        })
        .catch(reject);
    });
  }

  async close() {
    return new Promise((resolve) => {
      this.db.close((err) => {
        if (err) {
          console.error('Error closing database:', err.message);
        } else {
          console.log('📊 Database connection closed');
        }
        resolve();
      });
    });
  }
}

module.exports = DatabaseManager;

const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const pool = require('./config/db');
require('dotenv').config();

async function seed() {
  try {
    // Run update.sql migration
    const sql = fs.readFileSync(path.join(__dirname, 'migrations', 'update.sql'), 'utf8');
    const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0 && !s.startsWith('--'));
    for (const stmt of statements) {
      try {
        await pool.query(stmt);
      } catch (e) {
        // Ignore duplicate/already-exists errors
        if (!e.message.includes('Duplicate') && !e.message.includes('already exists')) {
          console.warn('Migration warning:', e.message);
        }
      }
    }
    console.log('✅ Migration applied');

    // Fix passwords
    const adminHash      = await bcrypt.hash('admin123', 10);
    const staffHash      = await bcrypt.hash('staff123', 10);
    const userHash       = await bcrypt.hash('user123', 10);
    const superAdminHash = await bcrypt.hash('superadmin123', 10);

    await pool.query('UPDATE users SET password = ? WHERE email = ?', [adminHash,      'admin@crm.com']);
    await pool.query('UPDATE users SET password = ? WHERE email = ?', [staffHash,      'staff@crm.com']);
    await pool.query('UPDATE users SET password = ? WHERE email = ?', [userHash,       'client@crm.com']);
    await pool.query('UPDATE users SET password = ? WHERE email = ?', [superAdminHash, 'superadmin@crm.com']);

    console.log('✅ Passwords updated');
    console.log('   admin@crm.com       → admin123');
    console.log('   staff@crm.com       → staff123');
    console.log('   client@crm.com      → user123');
    console.log('   superadmin@crm.com  → superadmin123');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

seed();

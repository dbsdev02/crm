const pool = require('../config/db');

const logActivity = async (userId, action, module, details, ipAddress) => {
  try {
    await pool.query(
      'INSERT INTO activity_logs (user_id, action, module, details, ip_address) VALUES (?, ?, ?, ?, ?)',
      [userId, action, module, details, ipAddress]
    );
  } catch (err) {
    console.error('Logging error:', err.message);
  }
};

module.exports = { logActivity };

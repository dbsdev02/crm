const pool = require('../config/db');

const createNotification = async (userId, title, message, type, referenceId, referenceType) => {
  try {
    await pool.query(
      'INSERT INTO notifications (user_id, title, message, type, reference_id, reference_type) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, title, message, type, referenceId, referenceType]
    );
  } catch (err) {
    console.error('Notification error:', err.message);
  }
};

module.exports = { createNotification };

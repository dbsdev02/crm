const pool = require('../config/db');

const sendPushToUser = async (userId, title, message) => {
  if (!process.env.ONESIGNAL_APP_ID || !process.env.ONESIGNAL_API_KEY) return;
  try {
    const [rows] = await pool.query(
      'SELECT player_id FROM user_onesignal WHERE user_id = ?',
      [userId]
    );
    if (!rows.length) return;

    await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${process.env.ONESIGNAL_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: process.env.ONESIGNAL_APP_ID,
        include_player_ids: rows.map(r => r.player_id),
        headings: { en: title },
        contents: { en: message },
      }),
    });
  } catch (err) {
    console.error('OneSignal push error:', err.message);
  }
};

const createNotification = async (userId, title, message, type, referenceId, referenceType) => {
  try {
    await pool.query(
      'INSERT INTO notifications (user_id, title, message, type, reference_id, reference_type) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, title, message, type, referenceId, referenceType]
    );
    await sendPushToUser(userId, title, message);
  } catch (err) {
    console.error('Notification error:', err.message);
  }
};

module.exports = { createNotification, sendPushToUser };

const express = require('express');
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

// Public — returns OneSignal App ID to frontend
router.get('/config', (req, res) => {
  if (!process.env.ONESIGNAL_APP_ID)
    return res.status(503).json({ error: 'OneSignal not configured' });
  res.json({ appId: process.env.ONESIGNAL_APP_ID });
});

router.use(authenticate);

// Save OneSignal player_id for logged-in user
router.post('/subscribe', async (req, res) => {
  const { playerId } = req.body;
  if (!playerId) return res.status(400).json({ error: 'playerId required' });
  try {
    await pool.query(
      `INSERT INTO user_onesignal (user_id, player_id)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE player_id = VALUES(player_id)`,
      [req.user.id, playerId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

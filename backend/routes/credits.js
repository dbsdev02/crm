const express = require('express');
const pool = require('../config/db');
const { authenticate, requireRole } = require('../middleware/auth');
const router = express.Router();

router.use(authenticate);

router.get('/leaderboard', async (req, res) => {
  try {
    const [board] = await pool.query(
      `SELECT sc.*, u.name, u.email FROM staff_credits sc
       JOIN users u ON sc.user_id = u.id ORDER BY sc.credits DESC, sc.points DESC`
    );
    res.json(board);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/my', async (req, res) => {
  try {
    const [credits] = await pool.query('SELECT * FROM staff_credits WHERE user_id = ?', [req.user.id]);
    const [history] = await pool.query(
      'SELECT * FROM credit_history WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]
    );
    res.json({ balance: credits[0] || { points: 0, credits: 0 }, history });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/redeem', async (req, res) => {
  try {
    const { credits_redeemed, description } = req.body;
    const [current] = await pool.query('SELECT credits FROM staff_credits WHERE user_id = ?', [req.user.id]);
    if (!current.length || current[0].credits < credits_redeemed) {
      return res.status(400).json({ error: 'Insufficient credits' });
    }
    await pool.query('INSERT INTO credit_redemptions (user_id, credits_redeemed, description) VALUES (?, ?, ?)',
      [req.user.id, credits_redeemed, description]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/redeem/:id', requireRole('admin'), async (req, res) => {
  try {
    const { status } = req.body;
    const [redemption] = await pool.query('SELECT * FROM credit_redemptions WHERE id = ?', [req.params.id]);
    if (!redemption.length) return res.status(404).json({ error: 'Not found' });
    await pool.query('UPDATE credit_redemptions SET status = ?, approved_by = ? WHERE id = ?',
      [status, req.user.id, req.params.id]);
    if (status === 'approved') {
      await pool.query('UPDATE staff_credits SET credits = credits - ? WHERE user_id = ?',
        [redemption[0].credits_redeemed, redemption[0].user_id]);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

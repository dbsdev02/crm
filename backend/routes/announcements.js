const express = require('express');
const pool = require('../config/db');
const { authenticate, requireRole } = require('../middleware/auth');
const router = express.Router();

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const [announcements] = await pool.query(
      'SELECT a.*, u.name as created_by_name FROM announcements a JOIN users u ON a.created_by = u.id WHERE a.is_active = TRUE AND (a.expires_at IS NULL OR a.expires_at > NOW()) ORDER BY a.created_at DESC'
    );
    res.json(announcements);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', requireRole('admin'), async (req, res) => {
  try {
    const { message, expires_at } = req.body;
    const [result] = await pool.query(
      'INSERT INTO announcements (message, created_by, expires_at) VALUES (?, ?, ?)',
      [message, req.user.id, expires_at]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', requireRole('admin'), async (req, res) => {
  try {
    await pool.query('UPDATE announcements SET is_active = FALSE WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

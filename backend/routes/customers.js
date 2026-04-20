const express = require('express');
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { logActivity } = require('../utils/logger');
const router = express.Router();

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM customers ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, company, email, phone, address, notes, status } = req.body;
    const [result] = await pool.query(
      'INSERT INTO customers (name, company, email, phone, address, notes, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [name, company, email, phone, address, notes, status || 'active', req.user.id]
    );
    await logActivity(req.user.id, 'create_customer', 'customers', `Created customer: ${name}`, req.ip);
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, company, email, phone, address, notes, status } = req.body;
    await pool.query(
      'UPDATE customers SET name=?, company=?, email=?, phone=?, address=?, notes=?, status=? WHERE id=?',
      [name, company, email, phone, address, notes, status, req.params.id]
    );
    await logActivity(req.user.id, 'update_customer', 'customers', `Updated customer ${req.params.id}`, req.ip);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM customers WHERE id = ?', [req.params.id]);
    await logActivity(req.user.id, 'delete_customer', 'customers', `Deleted customer ${req.params.id}`, req.ip);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

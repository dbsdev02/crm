const express = require('express');
const pool = require('../config/db');
const { authenticate, requireModule } = require('../middleware/auth');
const { logActivity } = require('../utils/logger');
const { createNotification } = require('../utils/notifications');
const router = express.Router();

router.use(authenticate, requireModule('leads'));

router.get('/', async (req, res) => {
  try {
    let query = `SELECT l.*, u.name as assigned_to_name, c.name as created_by_name
                 FROM leads l LEFT JOIN users u ON l.assigned_to = u.id
                 JOIN users c ON l.created_by = c.id`;
    const params = [];
    if (req.user.role === 'staff') {
      query += ' WHERE l.assigned_to = ? OR l.created_by = ?';
      params.push(req.user.id, req.user.id);
    }
    query += ' ORDER BY l.updated_at DESC';
    const [leads] = await pool.query(query, params);
    res.json(leads);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, email, phone, company, source, value, assigned_to, notes } = req.body;
    const [result] = await pool.query(
      `INSERT INTO leads (name, email, phone, company, source, value, assigned_to, created_by, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, email, phone, company, source, value || 0, assigned_to, req.user.id, notes]
    );
    await pool.query(
      'INSERT INTO lead_stage_history (lead_id, to_stage, comment, changed_by) VALUES (?, ?, ?, ?)',
      [result.insertId, 'lead_contacted', 'Lead created', req.user.id]
    );
    if (assigned_to) {
      await createNotification(assigned_to, 'New Lead Assigned', `Lead "${name}" assigned to you`, 'lead', result.insertId, 'lead');
    }
    await logActivity(req.user.id, 'create_lead', 'leads', `Created lead: ${name}`, req.ip);
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/stage', async (req, res) => {
  try {
    const { stage, comment } = req.body;
    if (!comment || !comment.trim()) {
      return res.status(400).json({ error: 'Comment is mandatory when changing lead stage' });
    }
    const [leads] = await pool.query('SELECT stage FROM leads WHERE id = ?', [req.params.id]);
    if (!leads.length) return res.status(404).json({ error: 'Lead not found' });

    await pool.query('UPDATE leads SET stage = ? WHERE id = ?', [stage, req.params.id]);
    await pool.query(
      'INSERT INTO lead_stage_history (lead_id, from_stage, to_stage, comment, changed_by) VALUES (?, ?, ?, ?, ?)',
      [req.params.id, leads[0].stage, stage, comment, req.user.id]
    );
    await logActivity(req.user.id, 'change_lead_stage', 'leads', `Lead ${req.params.id}: ${leads[0].stage} → ${stage}`, req.ip);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, email, phone, company, source, value, assigned_to, notes } = req.body;
    await pool.query(
      'UPDATE leads SET name=?, email=?, phone=?, company=?, source=?, value=?, assigned_to=?, notes=? WHERE id=?',
      [name, email, phone, company, source, value, assigned_to, notes, req.params.id]
    );
    await logActivity(req.user.id, 'update_lead', 'leads', `Updated lead ${req.params.id}`, req.ip);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/history', async (req, res) => {
  try {
    const [history] = await pool.query(
      `SELECT lsh.*, u.name as changed_by_name FROM lead_stage_history lsh
       JOIN users u ON lsh.changed_by = u.id WHERE lsh.lead_id = ? ORDER BY lsh.created_at DESC`,
      [req.params.id]
    );
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM leads WHERE id = ?', [req.params.id]);
    await logActivity(req.user.id, 'delete_lead', 'leads', `Deleted lead ${req.params.id}`, req.ip);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

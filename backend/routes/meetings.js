const express = require('express');
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { logActivity } = require('../utils/logger');
const { createNotification } = require('../utils/notifications');
const router = express.Router();

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    let query = `SELECT m.*, u.name as created_by_name FROM meetings m JOIN users u ON m.created_by = u.id`;
    const params = [];
    if (req.user.role !== 'admin') {
      query += ` WHERE m.created_by = ? OR m.id IN (SELECT meeting_id FROM meeting_participants WHERE user_id = ?)`;
      params.push(req.user.id, req.user.id);
    }
    query += ' ORDER BY m.meeting_date ASC';
    const [meetings] = await pool.query(query, params);
    res.json(meetings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, description, meeting_date, meeting_link, lead_id, project_id, participants } = req.body;
    const [result] = await pool.query(
      'INSERT INTO meetings (title, description, meeting_date, meeting_link, lead_id, project_id, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title, description, meeting_date, meeting_link, lead_id, project_id, req.user.id]
    );
    if (participants && participants.length) {
      for (const uid of participants) {
        await pool.query('INSERT INTO meeting_participants (meeting_id, user_id) VALUES (?, ?)', [result.insertId, uid]);
        await createNotification(uid, 'New Meeting', `Meeting "${title}" on ${meeting_date}`, 'meeting', result.insertId, 'meeting');
      }
    }
    await logActivity(req.user.id, 'create_meeting', 'calendar', `Created meeting: ${title}`, req.ip);
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { title, description, meeting_date, meeting_link } = req.body;
    await pool.query(
      'UPDATE meetings SET title=?, description=?, meeting_date=?, meeting_link=? WHERE id=?',
      [title, description, meeting_date, meeting_link, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM meetings WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

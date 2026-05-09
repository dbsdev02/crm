const express = require('express');
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { logActivity } = require('../utils/logger');
const { createNotification } = require('../utils/notifications');
const router = express.Router();

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    let query = `SELECT m.*, u.name as created_by_name, p.name as project_name FROM meetings m
      JOIN users u ON m.created_by = u.id
      LEFT JOIN projects p ON m.project_id = p.id`;
    const params = [];
    if (req.user.role !== 'admin') {
      query += ` WHERE m.created_by = ? OR m.id IN (SELECT meeting_id FROM meeting_participants WHERE user_id = ?)`;
      params.push(req.user.id, req.user.id);
    }
    query += ' ORDER BY m.meeting_date ASC';
    const [meetings] = await pool.query(query, params);

    // Attach participants to each meeting
    const ids = meetings.map(m => m.id);
    let participantMap = {};
    if (ids.length) {
      const [rows] = await pool.query(
        `SELECT mp.meeting_id, u.id, u.name FROM meeting_participants mp JOIN users u ON mp.user_id = u.id WHERE mp.meeting_id IN (?)`,
        [ids]
      );
      for (const r of rows) {
        if (!participantMap[r.meeting_id]) participantMap[r.meeting_id] = [];
        participantMap[r.meeting_id].push({ id: r.id, name: r.name });
      }
    }
    res.json(meetings.map(m => ({ ...m, participants: participantMap[m.id] || [] })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, description, meeting_date, meeting_link, lead_id, project_id, participants } = req.body;
    const [result] = await pool.query(
      'INSERT INTO meetings (title, description, meeting_date, meeting_link, lead_id, project_id, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title, description, meeting_date, meeting_link || null, lead_id || null, project_id || null, req.user.id]
    );
    if (participants && participants.length) {
      for (const uid of participants) {
        await pool.query('INSERT IGNORE INTO meeting_participants (meeting_id, user_id) VALUES (?, ?)', [result.insertId, uid]);
        await createNotification(uid, 'New Meeting', `You have been invited to "${title}" on ${meeting_date}${meeting_link ? '. Join: ' + meeting_link : ''}`, 'meeting', result.insertId, 'meeting');
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
    const { title, description, meeting_date, meeting_link, project_id, participants } = req.body;
    await pool.query(
      'UPDATE meetings SET title=?, description=?, meeting_date=?, meeting_link=?, project_id=? WHERE id=?',
      [title, description, meeting_date, meeting_link || null, project_id || null, req.params.id]
    );
    if (participants !== undefined) {
      await pool.query('DELETE FROM meeting_participants WHERE meeting_id=?', [req.params.id]);
      for (const uid of participants) {
        await pool.query('INSERT IGNORE INTO meeting_participants (meeting_id, user_id) VALUES (?, ?)', [req.params.id, uid]);
        await createNotification(uid, 'Meeting Updated', `Meeting "${title}" has been updated${meeting_link ? '. Join: ' + meeting_link : ''}`, 'meeting', req.params.id, 'meeting');
      }
    }
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

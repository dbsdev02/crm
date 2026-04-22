const express = require('express');
const pool = require('../config/db');
const { authenticate, requireModule } = require('../middleware/auth');
const { logActivity } = require('../utils/logger');
const router = express.Router();

router.use(authenticate, requireModule('projects'));

router.get('/', async (req, res) => {
  try {
    let query = `SELECT p.*, u.name as created_by_name FROM projects p JOIN users u ON p.created_by = u.id`;
    const params = [];
    if (req.user.role === 'user') {
      query += ' WHERE p.id IN (SELECT project_id FROM project_members WHERE user_id = ?)';
      params.push(req.user.id);
    }
    query += ' ORDER BY p.updated_at DESC';
    const [projects] = await pool.query(query, params);
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const toDbStatus = (s) => ({ active: 'in_progress', in_progress: 'in_progress', on_hold: 'on_hold', completed: 'completed', planning: 'planning', cancelled: 'cancelled' })[s] ?? 'planning';

router.post('/', async (req, res) => {
  try {
    const { name, description, client_name, client_email, client_phone, start_date, end_date, members } = req.body;
    const [result] = await pool.query(
      'INSERT INTO projects (name, description, client_name, client_email, client_phone, start_date, end_date, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [name, description, client_name, client_email, client_phone, start_date || null, end_date || null, toDbStatus(req.body.status), req.user.id]
    );
    if (members && members.length) {
      for (const uid of members)
        await pool.query('INSERT INTO project_members (project_id, user_id) VALUES (?, ?)', [result.insertId, uid]);
    }
    await logActivity(req.user.id, 'create_project', 'projects', `Created project: ${name}`, req.ip);
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [projects] = await pool.query('SELECT * FROM projects WHERE id = ?', [req.params.id]);
    if (!projects.length) return res.status(404).json({ error: 'Project not found' });
    const [members] = await pool.query(
      'SELECT u.id, u.name, u.email FROM project_members pm JOIN users u ON pm.user_id = u.id WHERE pm.project_id = ?',
      [req.params.id]
    );
    const [tasks] = await pool.query('SELECT * FROM tasks WHERE project_id = ?', [req.params.id]);
    const [assets] = await pool.query('SELECT * FROM project_assets WHERE project_id = ?', [req.params.id]);
    res.json({ ...projects[0], members, tasks, assets });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, description, client_name, client_email, client_phone, progress, start_date, end_date } = req.body;
    await pool.query(
      'UPDATE projects SET name=?, description=?, client_name=?, client_email=?, client_phone=?, status=?, progress=?, start_date=?, end_date=? WHERE id=?',
      [name, description, client_name, client_email, client_phone, toDbStatus(req.body.status), progress, start_date || null, end_date || null, req.params.id]
    );
    await logActivity(req.user.id, 'update_project', 'projects', `Updated project ${req.params.id}`, req.ip);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM projects WHERE id = ?', [req.params.id]);
    await logActivity(req.user.id, 'delete_project', 'projects', `Deleted project ${req.params.id}`, req.ip);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

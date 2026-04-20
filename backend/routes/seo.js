const express = require('express');
const pool = require('../config/db');
const { authenticate, requireModule } = require('../middleware/auth');
const { logActivity } = require('../utils/logger');
const router = express.Router();

router.use(authenticate, requireModule('seo'));

router.get('/project/:projectId', async (req, res) => {
  try {
    const [plans] = await pool.query(
      'SELECT s.*, u.name as created_by_name FROM seo_plans s JOIN users u ON s.created_by = u.id WHERE s.project_id = ? ORDER BY s.created_at DESC',
      [req.params.projectId]
    );
    res.json(plans);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { project_id, keyword, current_rank, target_rank, page_url, notes } = req.body;
    const [result] = await pool.query(
      'INSERT INTO seo_plans (project_id, keyword, current_rank, target_rank, page_url, notes, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [project_id, keyword, current_rank, target_rank, page_url, notes, req.user.id]
    );
    await logActivity(req.user.id, 'create_seo_plan', 'seo', `Created SEO plan for project ${project_id}`, req.ip);
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { keyword, current_rank, target_rank, page_url, status, notes } = req.body;
    await pool.query(
      'UPDATE seo_plans SET keyword=?, current_rank=?, target_rank=?, page_url=?, status=?, notes=? WHERE id=?',
      [keyword, current_rank, target_rank, page_url, status, notes, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM seo_plans WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

const express = require('express');
const pool = require('../config/db');
const { authenticate, requireModule } = require('../middleware/auth');
const { logActivity } = require('../utils/logger');
const router = express.Router();

router.use(authenticate, requireModule('social_media'));

router.get('/project/:projectId', async (req, res) => {
  try {
    const [posts] = await pool.query(
      'SELECT sm.*, u.name as created_by_name FROM social_media_posts sm JOIN users u ON sm.created_by = u.id WHERE sm.project_id = ? ORDER BY sm.scheduled_date ASC',
      [req.params.projectId]
    );
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { project_id, platform, content, media_url, scheduled_date } = req.body;
    const [result] = await pool.query(
      'INSERT INTO social_media_posts (project_id, platform, content, media_url, scheduled_date, created_by) VALUES (?, ?, ?, ?, ?, ?)',
      [project_id, platform, content, media_url, scheduled_date, req.user.id]
    );
    await logActivity(req.user.id, 'create_social_post', 'social_media', `Created social post for project ${project_id}`, req.ip);
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { platform, content, media_url, scheduled_date, status } = req.body;
    await pool.query(
      'UPDATE social_media_posts SET platform=?, content=?, media_url=?, scheduled_date=?, status=? WHERE id=?',
      [platform, content, media_url, scheduled_date, status, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM social_media_posts WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

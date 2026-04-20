const express = require('express');
const multer = require('multer');
const path = require('path');
const pool = require('../config/db');
const { authenticate, requireModule } = require('../middleware/auth');
const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, process.env.UPLOAD_DIR || './uploads'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

router.use(authenticate, requireModule('projects'));

router.get('/project/:projectId', async (req, res) => {
  try {
    const [assets] = await pool.query(
      'SELECT pa.*, u.name as uploaded_by_name FROM project_assets pa JOIN users u ON pa.uploaded_by = u.id WHERE pa.project_id = ?',
      [req.params.projectId]
    );
    res.json(assets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/upload/:projectId', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const [result] = await pool.query(
      'INSERT INTO project_assets (project_id, file_name, file_path, file_type, file_size, uploaded_by) VALUES (?, ?, ?, ?, ?, ?)',
      [req.params.projectId, req.file.originalname, req.file.path, req.file.mimetype, req.file.size, req.user.id]
    );
    res.status(201).json({ id: result.insertId, file_name: req.file.originalname });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM project_assets WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

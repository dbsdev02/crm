const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { authenticate, requireRole } = require('../middleware/auth');
const { logActivity } = require('../utils/logger');
const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const [users] = await pool.query('SELECT * FROM users WHERE email = ? AND is_active = TRUE', [email]);
    if (!users.length) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, users[0].password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const [roles] = await pool.query(
      'SELECT r.name FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = ?',
      [users[0].id]
    );

    const token = jwt.sign({ id: users[0].id, role: roles[0].name }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });

    await logActivity(users[0].id, 'login', 'auth', 'User logged in', req.ip);

    res.json({
      token,
      user: { id: users[0].id, name: users[0].name, email: users[0].email, role: roles[0].name }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/register', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { email, password, name, phone, role } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (email, password, name, phone) VALUES (?, ?, ?, ?)',
      [email, hashed, name, phone]
    );
    const userId = result.insertId;

    const [roleRow] = await pool.query('SELECT id FROM roles WHERE name = ?', [role || 'staff']);
    await pool.query('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)', [userId, roleRow[0].id]);

    if (role === 'staff' || !role) {
      const modules = ['leads','tasks','projects','calendar','credits','social_media','seo'];
      for (const mod of modules) {
        await pool.query('INSERT INTO staff_permissions (user_id, module, has_access) VALUES (?, ?, TRUE)', [userId, mod]);
      }
    }
    await pool.query('INSERT INTO staff_credits (user_id, points, credits) VALUES (?, 0, 0)', [userId]);

    await logActivity(req.user.id, 'create_user', 'auth', `Created user: ${email}`, req.ip);
    res.status(201).json({ id: userId, email, name, role: role || 'staff' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Email already exists' });
    res.status(500).json({ error: err.message });
  }
});

router.get('/me', authenticate, async (req, res) => {
  const [perms] = await pool.query('SELECT module, has_access FROM staff_permissions WHERE user_id = ?', [req.user.id]);
  res.json({ ...req.user, password: undefined, permissions: perms });
});

router.put('/users/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { name, phone, is_active, role, credits_delta, points_delta } = req.body;
    if (name !== undefined) {
      await pool.query('UPDATE users SET name = ?, phone = ?, is_active = ? WHERE id = ?',
        [name, phone, is_active, req.params.id]);
    }
    if (role) {
      const [roleRow] = await pool.query('SELECT id FROM roles WHERE name = ?', [role]);
      if (roleRow.length) {
        await pool.query('UPDATE user_roles SET role_id = ? WHERE user_id = ?', [roleRow[0].id, req.params.id]);
      }
    }
    if (credits_delta !== undefined || points_delta !== undefined) {
      await pool.query(
        `INSERT INTO staff_credits (user_id, credits, points) VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE
         credits = GREATEST(0, credits + VALUES(credits)),
         points = GREATEST(0, points + VALUES(points))`,
        [req.params.id, credits_delta || 0, points_delta || 0]
      );
    }
    await logActivity(req.user.id, 'update_user', 'auth', `Updated user ${req.params.id}`, req.ip);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/users/:id/permissions', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { permissions } = req.body;
    for (const [module, hasAccess] of Object.entries(permissions)) {
      await pool.query(
        `INSERT INTO staff_permissions (user_id, module, has_access) VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE has_access = VALUES(has_access)`,
        [req.params.id, module, hasAccess]
      );
    }
    await logActivity(req.user.id, 'update_permissions', 'auth', `Updated permissions for user ${req.params.id}`, req.ip);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/users', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const [users] = await pool.query(
      `SELECT u.id, u.email, u.name, u.phone, u.is_active, u.created_at, r.name as role,
       COALESCE(sc.credits, 0) as credits, COALESCE(sc.points, 0) as points
       FROM users u 
       JOIN user_roles ur ON u.id = ur.user_id 
       JOIN roles r ON ur.role_id = r.id
       LEFT JOIN staff_credits sc ON u.id = sc.user_id`
    );
    const [perms] = await pool.query('SELECT user_id, module, has_access FROM staff_permissions');
    const result = users.map((u) => ({
      ...u,
      permissions: perms.filter((p) => p.user_id === u.id),
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

const express = require('express');
const pool = require('../config/db');
const { authenticate, requireRole } = require('../middleware/auth');
const { logActivity } = require('../utils/logger');
const bcrypt = require('bcryptjs');
const router = express.Router();

router.use(authenticate, requireRole('super_admin'));

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
router.get('/dashboard', async (req, res) => {
  try {
    const [[userStats]]  = await pool.query(`SELECT COUNT(*) AS total, SUM(is_active=1) AS active FROM users`);
    const [[taskStats]]  = await pool.query(`SELECT COUNT(*) AS total, SUM(DATE(created_at)=CURDATE()) AS today FROM tasks`);
    const [[autoStats]]  = await pool.query(`SELECT COUNT(*) AS total FROM automation_logs WHERE status='running'`).catch(() => [[{ total: 0 }]]);
    const [[sessionCount]] = await pool.query(`SELECT COUNT(DISTINCT user_id) AS active FROM activity_logs WHERE created_at >= NOW() - INTERVAL 1 HOUR`);

    // user growth last 6 months
    const [userGrowth] = await pool.query(`
      SELECT DATE_FORMAT(created_at,'%b') AS label, COUNT(*) AS users
      FROM users WHERE created_at >= NOW() - INTERVAL 6 MONTH
      GROUP BY YEAR(created_at), MONTH(created_at)
      ORDER BY MIN(created_at) ASC`);

    // daily task volume last 7 days
    const [taskVolume] = await pool.query(`
      SELECT DATE_FORMAT(created_at,'%a') AS label, COUNT(*) AS tasks
      FROM tasks WHERE created_at >= NOW() - INTERVAL 7 DAY
      GROUP BY DATE(created_at) ORDER BY DATE(created_at) ASC`);

    // recent activity
    const [activity] = await pool.query(`
      SELECT al.id, al.action, al.module, al.details, al.created_at,
             u.name AS actor
      FROM activity_logs al LEFT JOIN users u ON al.user_id = u.id
      ORDER BY al.created_at DESC LIMIT 10`);

    res.json({
      kpis: {
        totalUsers:    userStats.total,
        activeUsers:   userStats.active,
        tasksToday:    taskStats.today,
        activeAutomations: autoStats.total,
        activeSessions: sessionCount.active,
      },
      userGrowth,
      taskVolume,
      activity,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── USERS ────────────────────────────────────────────────────────────────────
router.get('/users', async (req, res) => {
  try {
    const { search, role, status } = req.query;
    let q = `SELECT u.id, u.name, u.email, u.is_active, u.created_at,
               r.name AS role, COALESCE(sc.credits,0) AS credits,
               COALESCE(sc.points,0) AS points,
               COUNT(DISTINCT t.id) AS tasks
             FROM users u
             JOIN user_roles ur ON u.id = ur.user_id
             JOIN roles r ON ur.role_id = r.id
             LEFT JOIN staff_credits sc ON sc.user_id = u.id
             LEFT JOIN tasks t ON t.assigned_to = u.id
             WHERE 1=1`;
    const params = [];
    if (search) { q += ' AND (u.name LIKE ? OR u.email LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    if (role && role !== 'all')   { q += ' AND r.name = ?'; params.push(role); }
    if (status === 'active')      { q += ' AND u.is_active = 1'; }
    if (status === 'suspended')   { q += ' AND u.is_active = 0'; }
    q += ' GROUP BY u.id, u.name, u.email, u.is_active, u.created_at, r.name, sc.credits, sc.points ORDER BY u.created_at DESC';
    const [users] = await pool.query(q, params);
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/users/:id/suspend', async (req, res) => {
  try {
    const { id } = req.params;
    const [[u]] = await pool.query('SELECT is_active FROM users WHERE id=?', [id]);
    if (!u) return res.status(404).json({ error: 'User not found' });
    await pool.query('UPDATE users SET is_active=? WHERE id=?', [!u.is_active, id]);
    await logActivity(req.user.id, u.is_active ? 'suspend_user' : 'unsuspend_user', 'admin', `User ${id}`, req.ip);
    res.json({ success: true, is_active: !u.is_active });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    const [roleRow] = await pool.query('SELECT id FROM roles WHERE name=?', [role]);
    if (!roleRow.length) return res.status(400).json({ error: 'Invalid role' });
    await pool.query('UPDATE user_roles SET role_id=? WHERE user_id=?', [roleRow[0].id, req.params.id]);
    await logActivity(req.user.id, 'change_role', 'admin', `User ${req.params.id} → ${role}`, req.ip);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/users/:id/reset-password', async (req, res) => {
  try {
    const tempPass = Math.random().toString(36).slice(-8);
    const hashed = await bcrypt.hash(tempPass, 10);
    await pool.query('UPDATE users SET password=? WHERE id=?', [hashed, req.params.id]);
    await logActivity(req.user.id, 'reset_password', 'admin', `User ${req.params.id}`, req.ip);
    res.json({ success: true, tempPassword: tempPass });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── ORGANIZATIONS (grouped by created_by domain / project grouping) ──────────
// Since there's no orgs table, we group users by email domain as "organizations"
router.get('/organizations', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        SUBSTRING_INDEX(u.email,'@',-1) AS domain,
        COUNT(DISTINCT u.id) AS members,
        MIN(u.created_at) AS joined,
        GROUP_CONCAT(DISTINCT r.name) AS roles
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      WHERE u.is_active = 1
      GROUP BY domain
      ORDER BY members DESC`);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── WORKSPACES (projects as workspaces) ──────────────────────────────────────
router.get('/workspaces', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.id, p.name, p.status, p.created_at,
             u.name AS owner,
             COUNT(DISTINCT pm.user_id) AS members,
             COUNT(DISTINCT t.id) AS tasks,
             COUNT(DISTINCT pa.id) AS assets
      FROM projects p
      JOIN users u ON p.created_by = u.id
      LEFT JOIN project_members pm ON pm.project_id = p.id
      LEFT JOIN tasks t ON t.project_id = p.id
      LEFT JOIN project_assets pa ON pa.project_id = p.id
      GROUP BY p.id, p.name, p.status, p.created_at, u.name
      ORDER BY p.created_at DESC`);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── ANALYTICS ────────────────────────────────────────────────────────────────
router.get('/analytics', async (req, res) => {
  try {
    // task completion trend last 7 days
    const [completionTrend] = await pool.query(`
      SELECT DATE_FORMAT(completed_at,'%a') AS label, COUNT(*) AS tasks
      FROM tasks WHERE status='completed' AND completed_at >= NOW() - INTERVAL 7 DAY
      GROUP BY DATE(completed_at) ORDER BY DATE(completed_at) ASC`);

    // top performers
    const [topUsers] = await pool.query(`
      SELECT u.id, u.name,
        COUNT(t.id) AS completed,
        ROUND(COUNT(t.id)*100.0/GREATEST((SELECT COUNT(*) FROM tasks WHERE assigned_to=u.id),1),0) AS score
      FROM users u
      JOIN tasks t ON t.assigned_to = u.id AND t.status='completed'
      GROUP BY u.id, u.name ORDER BY completed DESC LIMIT 5`);

    // overdue by project
    const [overdueByProject] = await pool.query(`
      SELECT COALESCE(p.name,'No Project') AS label, COUNT(*) AS tasks
      FROM tasks t LEFT JOIN projects p ON t.project_id = p.id
      WHERE t.status='overdue'
      GROUP BY p.id, p.name ORDER BY tasks DESC LIMIT 6`);

    // kpis
    const [[kpis]] = await pool.query(`
      SELECT
        SUM(status='completed') AS completed,
        SUM(status='overdue') AS overdue,
        COUNT(DISTINCT assigned_to) AS activeUsers
      FROM tasks WHERE created_at >= NOW() - INTERVAL 30 DAY`);

    res.json({ completionTrend, topUsers, overdueByProject, kpis });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── ACTIVITY LOGS ────────────────────────────────────────────────────────────
router.get('/logs', async (req, res) => {
  try {
    const { search, module, limit = 50 } = req.query;
    let q = `SELECT al.id, al.action, al.module, al.details, al.created_at, al.ip_address,
               u.name AS actor
             FROM activity_logs al LEFT JOIN users u ON al.user_id = u.id WHERE 1=1`;
    const params = [];
    if (search) { q += ' AND (al.action LIKE ? OR al.details LIKE ? OR u.name LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
    if (module && module !== 'All') { q += ' AND al.module = ?'; params.push(module); }
    q += ' ORDER BY al.created_at DESC LIMIT ?';
    params.push(parseInt(limit));
    const [logs] = await pool.query(q, params);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── SYSTEM SETTINGS (stored in a simple key-value table) ────────────────────
router.get('/settings', async (req, res) => {
  try {
    // Try to get from system_settings table, fallback to defaults
    const [rows] = await pool.query('SELECT `key`, `value` FROM system_settings').catch(() => [[]]);
    const settings = Object.fromEntries(rows.map(r => [r.key, r.value]));
    res.json(settings);
  } catch (err) {
    res.json({});
  }
});

router.put('/settings', async (req, res) => {
  try {
    const entries = Object.entries(req.body);
    for (const [key, value] of entries) {
      await pool.query(
        'INSERT INTO system_settings (`key`,`value`) VALUES (?,?) ON DUPLICATE KEY UPDATE `value`=VALUES(`value`)',
        [key, String(value)]
      ).catch(() => {}); // table may not exist yet
    }
    await logActivity(req.user.id, 'update_settings', 'admin', 'System settings updated', req.ip);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── SUPPORT TICKETS ─────────────────────────────────────────────────────────
router.get('/support', async (req, res) => {
  try {
    const { type, status } = req.query;
    let q = `SELECT st.id, st.type, st.title, st.description, st.priority, st.status,
               st.created_at, st.updated_at,
               u.name AS user_name, u.email AS user_email
             FROM support_tickets st
             JOIN users u ON st.user_id = u.id
             WHERE 1=1`;
    const params = [];
    if (type   && type   !== 'all') { q += ' AND st.type = ?';   params.push(type); }
    if (status && status !== 'all') { q += ' AND st.status = ?'; params.push(status); }
    q += ' ORDER BY st.created_at DESC LIMIT 100';
    const [tickets] = await pool.query(q, params);
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/support/:id', async (req, res) => {
  try {
    const { status, assigned_to } = req.body;
    await pool.query(
      'UPDATE support_tickets SET status = ?, assigned_to = ? WHERE id = ?',
      [status, assigned_to ?? null, req.params.id]
    );
    await logActivity(req.user.id, 'update_ticket', 'support', `Ticket #${req.params.id} → ${status}`, req.ip);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

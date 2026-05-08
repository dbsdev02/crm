const express = require('express');
const pool = require('../config/db');
const { authenticate, requireRole } = require('../middleware/auth');
const router = express.Router();

router.use(authenticate, requireRole('admin', 'staff'));

// GET /api/reports/summary
router.get('/summary', async (req, res) => {
  try {
    const { from, to } = req.query;
    const dateFrom = from || new Date(new Date().setDate(1)).toISOString().slice(0, 10); // start of month
    const dateTo   = to   || new Date().toISOString().slice(0, 10);

    // ── Tasks ──────────────────────────────────────────────────
    const [[taskStats]] = await pool.query(`
      SELECT
        COUNT(*) AS total,
        SUM(status = 'completed') AS completed,
        SUM(status = 'pending')   AS pending,
        SUM(status = 'in_progress') AS in_progress,
        SUM(status = 'overdue')   AS overdue,
        SUM(status = 'completed' AND completed_at <= due_date) AS on_time,
        SUM(status = 'completed' AND completed_at > due_date)  AS late
      FROM tasks
      WHERE created_at BETWEEN ? AND DATE_ADD(?, INTERVAL 1 DAY)
    `, [dateFrom, dateTo]);

    // ── Tasks by assignee ──────────────────────────────────────
    const [tasksByUser] = await pool.query(`
      SELECT u.name, u.id,
        COUNT(t.id) AS total,
        SUM(t.status = 'completed') AS completed,
        SUM(t.status = 'overdue')   AS overdue
      FROM tasks t
      JOIN users u ON t.assigned_to = u.id
      WHERE t.created_at BETWEEN ? AND DATE_ADD(?, INTERVAL 1 DAY)
      GROUP BY u.id, u.name
      ORDER BY completed DESC
    `, [dateFrom, dateTo]);

    // ── Tasks completed per day (trend) ───────────────────────
    const [taskTrend] = await pool.query(`
      SELECT DATE(completed_at) AS date, COUNT(*) AS count
      FROM tasks
      WHERE status = 'completed'
        AND completed_at BETWEEN ? AND DATE_ADD(?, INTERVAL 1 DAY)
      GROUP BY DATE(completed_at)
      ORDER BY date ASC
    `, [dateFrom, dateTo]);

    // ── Leads ──────────────────────────────────────────────────
    const [[leadStats]] = await pool.query(`
      SELECT
        COUNT(*) AS total,
        SUM(stage = 'onboarded')    AS converted,
        SUM(stage = 'uninterested') AS lost,
        SUM(value) AS total_value,
        SUM(stage = 'onboarded' AND value > 0) AS won_count,
        SUM(CASE WHEN stage = 'onboarded' THEN value ELSE 0 END) AS won_value
      FROM leads
      WHERE created_at BETWEEN ? AND DATE_ADD(?, INTERVAL 1 DAY)
    `, [dateFrom, dateTo]);

    // ── Leads by stage ─────────────────────────────────────────
    const [leadsByStage] = await pool.query(`
      SELECT stage, COUNT(*) AS count
      FROM leads
      WHERE created_at BETWEEN ? AND DATE_ADD(?, INTERVAL 1 DAY)
      GROUP BY stage
    `, [dateFrom, dateTo]);

    // ── Projects ───────────────────────────────────────────────
    const [[projectStats]] = await pool.query(`
      SELECT
        COUNT(*) AS total,
        SUM(status = 'completed')   AS completed,
        SUM(status = 'in_progress') AS in_progress,
        SUM(status = 'on_hold')     AS on_hold,
        SUM(status = 'planning')    AS planning
      FROM projects
      WHERE created_at BETWEEN ? AND DATE_ADD(?, INTERVAL 1 DAY)
    `, [dateFrom, dateTo]);

    // ── Staff credits leaderboard ──────────────────────────────
    const [leaderboard] = await pool.query(`
      SELECT u.name, sc.points, sc.credits
      FROM staff_credits sc
      JOIN users u ON sc.user_id = u.id
      ORDER BY sc.credits DESC, sc.points DESC
      LIMIT 10
    `);

    res.json({
      period: { from: dateFrom, to: dateTo },
      tasks: { ...taskStats, byUser: tasksByUser, trend: taskTrend },
      leads: { ...leadStats, byStage: leadsByStage },
      projects: projectStats,
      leaderboard,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reports/member/:id
router.get('/member/:id', async (req, res) => {
  try {
    const { from, to } = req.query;
    const dateFrom = from || new Date(new Date().setDate(1)).toISOString().slice(0, 10);
    const dateTo   = to   || new Date().toISOString().slice(0, 10);
    const uid = req.params.id;

    // basic info
    const [[user]] = await pool.query(
      `SELECT u.id, u.name, u.email, u.avatar, r.name AS role
       FROM users u JOIN user_roles ur ON u.id = ur.user_id JOIN roles r ON ur.role_id = r.id
       WHERE u.id = ?`, [uid]
    );
    if (!user) return res.status(404).json({ error: 'User not found' });

    // task stats
    const [[taskStats]] = await pool.query(`
      SELECT
        COUNT(*)                                                      AS total,
        SUM(status = 'completed')                                     AS completed,
        SUM(status = 'pending')                                       AS pending,
        SUM(status = 'in_progress')                                   AS in_progress,
        SUM(status = 'overdue')                                       AS overdue,
        SUM(status = 'completed' AND completed_at <= due_date)        AS on_time,
        SUM(status = 'completed' AND completed_at >  due_date)        AS late
      FROM tasks
      WHERE assigned_to = ?
        AND created_at BETWEEN ? AND DATE_ADD(?, INTERVAL 1 DAY)
    `, [uid, dateFrom, dateTo]);

    // daily completion trend
    const [trend] = await pool.query(`
      SELECT DATE(completed_at) AS date, COUNT(*) AS count
      FROM tasks
      WHERE assigned_to = ? AND status = 'completed'
        AND completed_at BETWEEN ? AND DATE_ADD(?, INTERVAL 1 DAY)
      GROUP BY DATE(completed_at) ORDER BY date ASC
    `, [uid, dateFrom, dateTo]);

    // recent completed tasks
    const [recentTasks] = await pool.query(`
      SELECT t.id, t.title, t.priority, t.due_date, t.completed_at,
             p.name AS project_name,
             CASE WHEN t.completed_at <= t.due_date THEN 'on_time' ELSE 'late' END AS timing
      FROM tasks t LEFT JOIN projects p ON t.project_id = p.id
      WHERE t.assigned_to = ? AND t.status = 'completed'
        AND t.completed_at BETWEEN ? AND DATE_ADD(?, INTERVAL 1 DAY)
      ORDER BY t.completed_at DESC LIMIT 20
    `, [uid, dateFrom, dateTo]);

    // pending / overdue tasks
    const [pendingTasks] = await pool.query(`
      SELECT t.id, t.title, t.priority, t.due_date, t.status,
             p.name AS project_name
      FROM tasks t LEFT JOIN projects p ON t.project_id = p.id
      WHERE t.assigned_to = ? AND t.status IN ('pending','in_progress','overdue')
      ORDER BY t.due_date ASC LIMIT 20
    `, [uid]);

    // leads assigned
    const [[leadStats]] = await pool.query(`
      SELECT COUNT(*) AS total,
        SUM(stage = 'onboarded')    AS converted,
        SUM(stage = 'uninterested') AS lost,
        SUM(CASE WHEN stage = 'onboarded' THEN value ELSE 0 END) AS won_value
      FROM leads
      WHERE assigned_to = ?
        AND created_at BETWEEN ? AND DATE_ADD(?, INTERVAL 1 DAY)
    `, [uid, dateFrom, dateTo]);

    // credits
    const [[credits]] = await pool.query(
      'SELECT points, credits FROM staff_credits WHERE user_id = ?', [uid]
    );

    // credit history in period
    const [creditHistory] = await pool.query(`
      SELECT type, amount, reason, created_at
      FROM credit_history
      WHERE user_id = ?
        AND created_at BETWEEN ? AND DATE_ADD(?, INTERVAL 1 DAY)
      ORDER BY created_at DESC LIMIT 20
    `, [uid, dateFrom, dateTo]);

    res.json({
      user,
      period: { from: dateFrom, to: dateTo },
      tasks: { ...taskStats, trend, recent: recentTasks, pending: pendingTasks },
      leads: leadStats,
      credits: credits || { points: 0, credits: 0 },
      creditHistory,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reports/members  — list all staff with summary stats
router.get('/members', async (req, res) => {
  try {
    const { from, to } = req.query;
    const dateFrom = from || new Date(new Date().setDate(1)).toISOString().slice(0, 10);
    const dateTo   = to   || new Date().toISOString().slice(0, 10);

    const [members] = await pool.query(`
      SELECT u.id, u.name, u.email, u.avatar, r.name AS role,
        COUNT(t.id)                                            AS total_tasks,
        SUM(t.status = 'completed')                            AS completed,
        SUM(t.status = 'overdue')                              AS overdue,
        SUM(t.status = 'completed' AND t.completed_at <= t.due_date) AS on_time,
        COALESCE(sc.credits, 0)                                AS credits,
        COALESCE(sc.points,  0)                                AS points
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r       ON ur.role_id = r.id
      LEFT JOIN tasks t  ON t.assigned_to = u.id
        AND t.created_at BETWEEN ? AND DATE_ADD(?, INTERVAL 1 DAY)
      LEFT JOIN staff_credits sc ON sc.user_id = u.id
      WHERE u.is_active = TRUE AND r.name IN ('admin','staff')
      GROUP BY u.id, u.name, u.email, u.avatar, r.name, sc.credits, sc.points
      ORDER BY completed DESC
    `, [dateFrom, dateTo]);

    res.json(members);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

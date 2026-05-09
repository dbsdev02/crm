const express = require('express');
const pool = require('../config/db');
const { authenticate, requireModule } = require('../middleware/auth');
const { logActivity } = require('../utils/logger');
const { updateCredits } = require('../utils/credits');
const { createNotification } = require('../utils/notifications');
const router = express.Router();

router.use(authenticate, requireModule('tasks'));

// ── Sections ──────────────────────────────────────────────────────────────────
router.get('/sections', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM task_sections ORDER BY project_id, order_index');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/sections', async (req, res) => {
  try {
    const { project_id, name, order_index = 0 } = req.body;
    const [r] = await pool.query(
      'INSERT INTO task_sections (project_id, name, order_index) VALUES (?, ?, ?)',
      [project_id, name, order_index]
    );
    res.status(201).json({ id: r.insertId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/sections/:id', async (req, res) => {
  try {
    const { name, order_index } = req.body;
    await pool.query('UPDATE task_sections SET name=?, order_index=? WHERE id=?', [name, order_index ?? 0, req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/sections/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM task_sections WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Tasks ─────────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    let query = `
      SELECT t.*,
             u.name  AS assigned_to_name,
             ab.name AS assigned_by_name,
             p.name  AS project_name,
             s.name  AS section_name
      FROM tasks t
      LEFT JOIN users    u  ON t.assigned_to    = u.id
      LEFT JOIN users    ab ON t.assigned_by    = ab.id
      LEFT JOIN projects p  ON t.project_id     = p.id
      LEFT JOIN task_sections s ON t.section_id = s.id`;
    const params = [];
    if (req.user.role === 'staff') {
      // Show tasks assigned to me directly OR via task_assignees (@ mention)
      query += ` WHERE (
        t.assigned_to = ?
        OR t.id IN (SELECT task_id FROM task_assignees WHERE user_id = ?)
      )`;
      params.push(req.user.id, req.user.id);
    } else if (req.user.role === 'user') {
      query += ` WHERE (
        t.assigned_to = ?
        OR t.id IN (SELECT task_id FROM task_assignees WHERE user_id = ?)
      )`;
      params.push(req.user.id, req.user.id);
    }
    query += ' ORDER BY t.project_id, t.section_id, t.order_index, t.due_date';
    const [tasks] = await pool.query(query, params);

    // Attach assignee names to each task
    const taskIds = tasks.map(t => t.id);
    let assigneeMap = {};
    if (taskIds.length) {
      const [assigneeRows] = await pool.query(
        `SELECT ta.task_id, u.id, u.name, u.avatar
         FROM task_assignees ta JOIN users u ON ta.user_id = u.id
         WHERE ta.task_id IN (?)`, [taskIds]
      );
      for (const row of assigneeRows) {
        if (!assigneeMap[row.task_id]) assigneeMap[row.task_id] = [];
        assigneeMap[row.task_id].push({ id: row.id, name: row.name, avatar: row.avatar });
      }
    }

    const result = tasks.map(t => ({
      ...t,
      assignees: assigneeMap[t.id] || [],
    }));

    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const {
      title, description, project_id, assigned_to, priority, due_date,
      assignees, labels, section_id = null, parent_task_id = null, order_index = 0,
      recurring_rule = null, reminder_at = null,
    } = req.body;
    const labelsStr = Array.isArray(labels) && labels.length ? labels.join(',') : null;
    const depth_level = parent_task_id ? 1 : 0;

    const [result] = await pool.query(
      `INSERT INTO tasks
         (title, description, project_id, assigned_to, assigned_by, priority, due_date, labels,
          section_id, parent_task_id, order_index, depth_level, recurring_rule, reminder_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, description, project_id || null, assigned_to || null, req.user.id,
       priority || 'medium', due_date || null, labelsStr,
       section_id || null, parent_task_id || null, order_index, depth_level,
       recurring_rule || null, reminder_at || null]
    );
    const taskId = result.insertId;

    // Log automation events
    if (recurring_rule)
      await pool.query('INSERT INTO automation_logs (task_id, automation_type, metadata) VALUES (?, ?, ?)',
        [taskId, 'recurring_set', JSON.stringify({ rule: recurring_rule })]);
    if (reminder_at)
      await pool.query('INSERT INTO automation_logs (task_id, automation_type, metadata) VALUES (?, ?, ?)',
        [taskId, 'reminder_set', JSON.stringify({ reminder_at })]);

    if (assignees?.length) {
      for (const uid of assignees) {
        await pool.query('INSERT IGNORE INTO task_assignees (task_id, user_id) VALUES (?, ?)', [taskId, uid]);
        await createNotification(uid, 'New Task', `Task "${title}" assigned to you`, 'task', taskId, 'task');
      }
    }
    if (assigned_to) {
      await createNotification(assigned_to, 'New Task', `Task "${title}" assigned to you`, 'task', taskId, 'task');
    }
    await logActivity(req.user.id, 'create_task', 'tasks', `Created task: ${title}`, req.ip);
    res.status(201).json({ id: taskId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id/complete', async (req, res) => {
  try {
    const completedAt = new Date();
    const [tasks] = await pool.query('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    if (!tasks.length) return res.status(404).json({ error: 'Task not found' });
    const task = tasks[0];

    await pool.query('UPDATE tasks SET status=?, completed_at=? WHERE id=?',
      ['completed', completedAt, req.params.id]);

    let creditResult = null;
    if (task.assigned_to && task.due_date)
      creditResult = await updateCredits(task.assigned_to, task.id, task.due_date, completedAt);

    if (task.assigned_by && task.assigned_by !== req.user.id)
      await createNotification(task.assigned_by, 'Task Completed', `Task "${task.title}" has been completed`, 'task', task.id, 'task');
    if (task.assigned_to && task.assigned_to !== req.user.id)
      await createNotification(task.assigned_to, 'Task Completed', `Task "${task.title}" marked as completed`, 'task', task.id, 'task');

    await logActivity(req.user.id, 'complete_task', 'tasks', `Completed task ${req.params.id}`, req.ip);
    res.json({ success: true, credits: creditResult });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const {
      title, description, project_id, assigned_to, priority, due_date,
      status, labels, assignees, section_id, parent_task_id, order_index, recurring_rule, reminder_at,
    } = req.body;
    const labelsStr = Array.isArray(labels) && labels.length ? labels.join(',') : null;
    const [tasks] = await pool.query('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    if (!tasks.length) return res.status(404).json({ error: 'Task not found' });
    const task = tasks[0];

    await pool.query(
      `UPDATE tasks SET title=?, description=?, project_id=?, assigned_to=?, priority=?,
       due_date=?, status=?, labels=?, section_id=?, parent_task_id=?, order_index=?,
       recurring_rule=?, reminder_at=? WHERE id=?`,
      [title, description, project_id || null, assigned_to || null, priority,
       due_date || null, status, labelsStr,
       section_id !== undefined ? (section_id || null) : task.section_id,
       parent_task_id !== undefined ? (parent_task_id || null) : task.parent_task_id,
       order_index !== undefined ? order_index : task.order_index,
       recurring_rule !== undefined ? recurring_rule : task.recurring_rule,
       reminder_at !== undefined ? (reminder_at || null) : task.reminder_at,
       req.params.id]
    );

    if (assignees) {
      await pool.query('DELETE FROM task_assignees WHERE task_id=?', [req.params.id]);
      for (const uid of assignees) {
        await pool.query('INSERT IGNORE INTO task_assignees (task_id, user_id) VALUES (?, ?)', [req.params.id, uid]);
        if (uid !== req.user.id)
          await createNotification(uid, 'Task Assigned', `Task "${title}" assigned to you`, 'task', req.params.id, 'task');
      }
    }
    if (assigned_to && assigned_to !== task.assigned_to && assigned_to !== req.user.id)
      await createNotification(assigned_to, 'Task Assigned', `Task "${title}" assigned to you`, 'task', req.params.id, 'task');

    await logActivity(req.user.id, 'update_task', 'tasks', `Updated task ${req.params.id}`, req.ip);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM tasks WHERE id=?', [req.params.id]);
    await logActivity(req.user.id, 'delete_task', 'tasks', `Deleted task ${req.params.id}`, req.ip);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Comments ──────────────────────────────────────────────────────────────────
router.get('/:id/comments', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.*, u.name AS user_name, u.avatar AS user_avatar
       FROM task_comments c JOIN users u ON c.user_id = u.id
       WHERE c.task_id = ? ORDER BY c.created_at ASC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/comments', async (req, res) => {
  try {
    const { content } = req.body;
    const [r] = await pool.query(
      'INSERT INTO task_comments (task_id, user_id, content) VALUES (?, ?, ?)',
      [req.params.id, req.user.id, content]
    );
    res.status(201).json({ id: r.insertId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:taskId/comments/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM task_comments WHERE id=? AND user_id=?', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

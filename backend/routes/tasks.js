const express = require('express');
const pool = require('../config/db');
const { authenticate, requireModule } = require('../middleware/auth');
const { logActivity } = require('../utils/logger');
const { updateCredits } = require('../utils/credits');
const { createNotification } = require('../utils/notifications');
const router = express.Router();

router.use(authenticate, requireModule('tasks'));

router.get('/', async (req, res) => {
  try {
    let query = `SELECT t.*, u.name as assigned_to_name, a.name as assigned_by_name, p.name as project_name
                 FROM tasks t LEFT JOIN users u ON t.assigned_to = u.id
                 JOIN users a ON t.assigned_by = a.id LEFT JOIN projects p ON t.project_id = p.id`;
    const params = [];
    if (req.user.role === 'staff') {
      query += ' WHERE t.assigned_to = ? OR t.assigned_by = ?';
      params.push(req.user.id, req.user.id);
    } else if (req.user.role === 'user') {
      query += ' WHERE t.assigned_to = ?';
      params.push(req.user.id);
    }
    query += ' ORDER BY t.due_date ASC';
    const [tasks] = await pool.query(query, params);
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, description, project_id, assigned_to, priority, due_date, assignees, labels } = req.body;
    const labelsStr = Array.isArray(labels) && labels.length ? labels.join(',') : null;
    const [result] = await pool.query(
      'INSERT INTO tasks (title, description, project_id, assigned_to, assigned_by, priority, due_date, labels) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [title, description, project_id, assigned_to, req.user.id, priority || 'medium', due_date, labelsStr]
    );
    const taskId = result.insertId;
    if (assignees && assignees.length) {
      for (const uid of assignees) {
        await pool.query('INSERT INTO task_assignees (task_id, user_id) VALUES (?, ?)', [taskId, uid]);
        await createNotification(uid, 'New Task', `Task "${title}" assigned to you`, 'task', taskId, 'task');
      }
    }
    if (assigned_to) {
      await createNotification(assigned_to, 'New Task', `Task "${title}" assigned to you`, 'task', taskId, 'task');
    }
    await logActivity(req.user.id, 'create_task', 'tasks', `Created task: ${title}`, req.ip);
    res.status(201).json({ id: taskId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/complete', async (req, res) => {
  try {
    const completedAt = new Date();
    const [tasks] = await pool.query('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    if (!tasks.length) return res.status(404).json({ error: 'Task not found' });

    await pool.query('UPDATE tasks SET status = ?, completed_at = ? WHERE id = ?',
      ['completed', completedAt, req.params.id]);

    const task = tasks[0];
    let creditResult = null;
    if (task.assigned_to && task.due_date) {
      creditResult = await updateCredits(task.assigned_to, task.id, task.due_date, completedAt);
    }

    // Notify the person who assigned the task
    if (task.assigned_by && task.assigned_by !== req.user.id) {
      await createNotification(
        task.assigned_by,
        'Task Completed',
        `Task "${task.title}" has been completed`,
        'task', task.id, 'task'
      );
    }
    // Notify the assignee if completed by someone else
    if (task.assigned_to && task.assigned_to !== req.user.id) {
      await createNotification(
        task.assigned_to,
        'Task Completed',
        `Task "${task.title}" has been marked as completed`,
        'task', task.id, 'task'
      );
    }

    await logActivity(req.user.id, 'complete_task', 'tasks', `Completed task ${req.params.id}`, req.ip);
    res.json({ success: true, credits: creditResult });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { title, description, project_id, assigned_to, priority, due_date, status, labels, assignees } = req.body;
    const labelsStr = Array.isArray(labels) && labels.length ? labels.join(',') : null;
    const [tasks] = await pool.query('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    if (!tasks.length) return res.status(404).json({ error: 'Task not found' });
    const task = tasks[0];

    await pool.query(
      'UPDATE tasks SET title=?, description=?, project_id=?, assigned_to=?, priority=?, due_date=?, status=?, labels=? WHERE id=?',
      [title, description, project_id, assigned_to, priority, due_date, status, labelsStr, req.params.id]
    );

    // Sync assignees
    if (assignees) {
      await pool.query('DELETE FROM task_assignees WHERE task_id = ?', [req.params.id]);
      for (const uid of assignees) {
        await pool.query('INSERT INTO task_assignees (task_id, user_id) VALUES (?, ?)', [req.params.id, uid]);
        if (uid !== req.user.id) {
          await createNotification(uid, 'Task Assigned', `Task "${title}" has been assigned to you`, 'task', req.params.id, 'task');
        }
      }
    }

    // Notify new assignee if assignment changed
    if (assigned_to && assigned_to !== task.assigned_to && assigned_to !== req.user.id) {
      await createNotification(
        assigned_to,
        'Task Assigned',
        `Task "${title}" has been assigned to you`,
        'task', req.params.id, 'task'
      );
    }

    await logActivity(req.user.id, 'update_task', 'tasks', `Updated task ${req.params.id}`, req.ip);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM tasks WHERE id = ?', [req.params.id]);
    await logActivity(req.user.id, 'delete_task', 'tasks', `Deleted task ${req.params.id}`, req.ip);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

const pool = require('../config/db');

const updateCredits = async (userId, taskId, dueDate, completedAt) => {
  const due = new Date(dueDate);
  const completed = new Date(completedAt);
  let points = 0, credits = 0, reason = '';

  if (completed < due) {
    credits = 2; reason = 'Task completed before deadline';
  } else if (completed.toDateString() === due.toDateString()) {
    points = 1; reason = 'Task completed on time';
  } else {
    credits = -1; reason = 'Task completed late';
  }

  await pool.query(
    `INSERT INTO staff_credits (user_id, points, credits)
     VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE
     points = points + VALUES(points), credits = credits + VALUES(credits)`,
    [userId, points, credits]
  );

  await pool.query(
    'INSERT INTO credit_history (user_id, type, amount, reason, task_id) VALUES (?, ?, ?, ?, ?)',
    [userId, credits !== 0 ? 'credit' : 'point', credits || points, reason, taskId]
  );

  return { points, credits, reason };
};

module.exports = { updateCredits };

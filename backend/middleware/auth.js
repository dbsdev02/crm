const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const [users] = await pool.query(
      `SELECT u.*, r.name as role FROM users u
       JOIN user_roles ur ON u.id = ur.user_id
       JOIN roles r ON ur.role_id = r.id
       WHERE u.id = ? AND u.is_active = TRUE`, [decoded.id]
    );

    if (!users.length) return res.status(401).json({ error: 'User not found' });
    req.user = users[0];
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const requireRole = (...roles) => (req, res, next) => {

  // super_admin passes all role checks
  if (req.user.role === 'super_admin') return next();
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  next();
};

const requireModule = (module) => async (req, res, next) => {
  if (req.user.role === 'super_admin' || req.user.role === 'admin') return next();
  const [perms] = await pool.query(
    'SELECT has_access FROM staff_permissions WHERE user_id = ? AND module = ?',
    [req.user.id, module]
  );
  if (!perms.length || !perms[0].has_access) {
    return res.status(403).json({ error: 'Module access denied' });
  }
  next();
};

module.exports = { authenticate, requireRole, requireModule };

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS: Allow web frontend + Capacitor Android app
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:8080',
  'https://internal.ltd',
  'capacitor://localhost', // Capacitor Android
  'https://localhost'      // Capacitor iOS
];

app.use(cors({ 
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, curl)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true 
}));

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/leads', require('./routes/leads'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/meetings', require('./routes/meetings'));
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/logs', require('./routes/logs'));
app.use('/api/credits', require('./routes/credits'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/social-media', require('./routes/social-media'));
app.use('/api/seo', require('./routes/seo'));
app.use('/api/assets', require('./routes/assets'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/google', require('./routes/google'));
app.use('/api/push', require('./routes/push'));

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const pool = require('./config/db');
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected', timestamp: new Date() });
  } catch (err) {
    res.status(500).json({ status: 'ok', db: 'disconnected', error: err.message });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => console.log(`CRM Backend running on port ${PORT}`));

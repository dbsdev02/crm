const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ 
  origin: process.env.FRONTEND_URL || 'http://localhost:8080', 
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

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => console.log(`CRM Backend running on port ${PORT}`));

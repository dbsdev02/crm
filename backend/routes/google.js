const express = require('express');
const { google } = require('googleapis');
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

const getOAuthClient = () => new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Step 1: Redirect user to Google consent screen
router.get('/auth', authenticate, (req, res) => {
  const oauth2Client = getOAuthClient();
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar.events'],
    state: String(req.user.id),
  });
  res.json({ url });
});

// Step 2: Google redirects back with code
router.get('/callback', async (req, res) => {
  const { code, state: userId } = req.query;
  try {
    const oauth2Client = getOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);
    await pool.query(
      `INSERT INTO user_google_tokens (user_id, access_token, refresh_token, expiry_date)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE access_token=VALUES(access_token), refresh_token=VALUES(refresh_token), expiry_date=VALUES(expiry_date)`,
      [userId, tokens.access_token, tokens.refresh_token, tokens.expiry_date]
    );
    res.redirect(`${process.env.FRONTEND_URL}/calendar?google=connected`);
  } catch (err) {
    res.redirect(`${process.env.FRONTEND_URL}/calendar?google=error`);
  }
});

// Step 3: Create Google Meet link
router.post('/create-meet', authenticate, async (req, res) => {
  const { title, description, start, end, attendees = [] } = req.body;
  try {
    const [rows] = await pool.query('SELECT * FROM user_google_tokens WHERE user_id = ?', [req.user.id]);
    if (!rows.length) return res.status(401).json({ error: 'Google account not connected' });

    const oauth2Client = getOAuthClient();
    oauth2Client.setCredentials({
      access_token: rows[0].access_token,
      refresh_token: rows[0].refresh_token,
      expiry_date: rows[0].expiry_date,
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const event = await calendar.events.insert({
      calendarId: 'primary',
      conferenceDataVersion: 1,
      requestBody: {
        summary: title,
        description,
        start: { dateTime: start, timeZone: 'UTC' },
        end: { dateTime: end, timeZone: 'UTC' },
        attendees: attendees.map((email) => ({ email })),
        conferenceData: {
          createRequest: {
            requestId: `crm-${Date.now()}`,
            conferenceSolutionKey: { type: 'hangoutsMeet' },
          },
        },
      },
    });

    const meetLink = event.data.conferenceData?.entryPoints?.[0]?.uri || '';
    res.json({ meetLink, eventId: event.data.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Check if user has connected Google
router.get('/status', authenticate, async (req, res) => {
  const [rows] = await pool.query('SELECT user_id FROM user_google_tokens WHERE user_id = ?', [req.user.id]);
  res.json({ connected: rows.length > 0 });
});

// Disconnect Google
router.delete('/disconnect', authenticate, async (req, res) => {
  await pool.query('DELETE FROM user_google_tokens WHERE user_id = ?', [req.user.id]);
  res.json({ success: true });
});

module.exports = router;

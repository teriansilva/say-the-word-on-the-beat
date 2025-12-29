const express = require('express');
const Session = require('../models/Session');
const { SESSION_COOKIE } = require('../middleware/session');
const { sessionCreationLimiter } = require('../middleware/rateLimit');

const router = express.Router();

// POST /api/sessions - Create new session
// Protected by: IP rate limit (5 sessions per hour)
router.post('/', sessionCreationLimiter, async (req, res) => {
  try {
    const session = new Session();
    await session.save();
    
    res.cookie(SESSION_COOKIE, session._id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 365 * 24 * 60 * 60 * 1000 // 1 year
    });
    
    res.status(201).json({ 
      sessionId: session._id,
      createdAt: session.createdAt 
    });
  } catch (err) {
    console.error('Error creating session:', err);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// GET /api/sessions/current - Get current session info
router.get('/current', async (req, res) => {
  const sessionId = req.cookies[SESSION_COOKIE];
  
  if (!sessionId) {
    return res.status(404).json({ error: 'No session found' });
  }
  
  try {
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    res.json({ 
      sessionId: session._id,
      createdAt: session.createdAt 
    });
  } catch (err) {
    console.error('Error getting session:', err);
    res.status(500).json({ error: 'Failed to get session' });
  }
});

module.exports = router;

const Session = require('../models/Session');

const SESSION_COOKIE = 'session_id';

async function sessionMiddleware(req, res, next) {
  let sessionId = req.cookies[SESSION_COOKIE];
  
  if (sessionId) {
    try {
      const session = await Session.findById(sessionId);
      if (session) {
        req.sessionId = sessionId;
        return next();
      }
    } catch (err) {
      // Invalid session ID, will create new one
    }
  }
  
  // No valid session - some routes require it, some don't
  req.sessionId = null;
  next();
}

function requireSession(req, res, next) {
  if (!req.sessionId) {
    return res.status(401).json({ error: 'Session required. Call POST /api/sessions first.' });
  }
  next();
}

module.exports = { sessionMiddleware, requireSession, SESSION_COOKIE };

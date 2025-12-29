const rateLimit = require('express-rate-limit');

/**
 * Rate limiting configuration for bot prevention
 * Multiple tiers based on endpoint sensitivity
 */

// Store for tracking rate limits (in production, use Redis)
// For now, using in-memory store

/**
 * General API rate limiter
 * 100 requests per minute per IP
 */
const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: {
    error: 'Too many requests. Please try again later.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use X-Forwarded-For header if behind proxy, fallback to IP
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
           req.headers['x-real-ip'] || 
           req.ip;
  }
});

/**
 * Strict rate limiter for share creation
 * 5 shares per 15 minutes per IP
 */
const shareCreationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 shares per 15 minutes
  message: {
    error: 'You are creating games too quickly. Please wait before sharing again.',
    retryAfter: 900
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
           req.headers['x-real-ip'] || 
           req.ip;
  },
  skipFailedRequests: false // Count failed requests too (prevents probing)
});

/**
 * Like toggle rate limiter
 * 30 likes per minute per IP
 */
const likeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 likes per minute
  message: {
    error: 'Too many like requests. Please slow down.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
           req.headers['x-real-ip'] || 
           req.ip;
  }
});

/**
 * Session creation rate limiter
 * 5 sessions per hour per IP (prevents session farming)
 */
const sessionCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 sessions per hour
  message: {
    error: 'Too many session requests. Please try again later.',
    retryAfter: 3600
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
           req.headers['x-real-ip'] || 
           req.ip;
  }
});

/**
 * Validates honeypot field - should be empty
 * If filled, it's likely a bot
 */
function honeypotValidator(req, res, next) {
  const honeypot = req.body._hp_field || req.body.website || req.body.url_check;
  
  if (honeypot) {
    console.log('[Bot Detection] Honeypot triggered:', {
      ip: req.headers['x-forwarded-for'] || req.ip,
      userAgent: req.headers['user-agent'],
      honeypotValue: honeypot.substring(0, 50)
    });
    
    // Return success to not reveal detection (confuse bots)
    return res.status(201).json({
      guid: 'success-' + Date.now(),
      createdAt: new Date().toISOString()
    });
  }
  
  next();
}

/**
 * Validates submission timing - too fast is suspicious
 * Requires at least 2 seconds between page load and submit
 */
function timingValidator(req, res, next) {
  const submittedAt = req.body._submit_time;
  
  if (submittedAt) {
    const elapsed = Date.now() - parseInt(submittedAt, 10);
    
    // If submitted in less than 2 seconds, likely a bot
    if (elapsed < 2000) {
      console.log('[Bot Detection] Too fast submission:', {
        ip: req.headers['x-forwarded-for'] || req.ip,
        elapsed: elapsed + 'ms'
      });
      
      return res.status(429).json({
        error: 'Please take your time filling out the form.',
        retryAfter: 5
      });
    }
  }
  
  next();
}

/**
 * Session-based cooldown check
 * Requires minimum time between actions for same session
 */
async function sessionCooldownValidator(minIntervalMs) {
  return async (req, res, next) => {
    if (!req.sessionId) {
      return next(); // No session, other validators will catch
    }
    
    try {
      const Session = require('../models/Session');
      const session = await Session.findById(req.sessionId);
      
      if (session && session.lastShareCreatedAt) {
        const elapsed = Date.now() - session.lastShareCreatedAt.getTime();
        
        if (elapsed < minIntervalMs) {
          const waitTime = Math.ceil((minIntervalMs - elapsed) / 1000);
          return res.status(429).json({
            error: `Please wait ${waitTime} seconds before sharing again.`,
            retryAfter: waitTime
          });
        }
      }
      
      next();
    } catch (err) {
      console.error('Session cooldown check error:', err);
      next(); // Don't block on error
    }
  };
}

/**
 * Update session with last share creation time
 */
async function updateSessionShareTime(sessionId) {
  if (!sessionId) return;
  
  try {
    const Session = require('../models/Session');
    await Session.findByIdAndUpdate(sessionId, {
      $set: { lastShareCreatedAt: new Date() }
    });
  } catch (err) {
    console.error('Failed to update session share time:', err);
  }
}

module.exports = {
  generalLimiter,
  shareCreationLimiter,
  likeLimiter,
  sessionCreationLimiter,
  honeypotValidator,
  timingValidator,
  sessionCooldownValidator,
  updateSessionShareTime
};

const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastAccessed: {
    type: Date,
    default: Date.now
  },
  // Bot prevention: track last share creation for cooldown
  lastShareCreatedAt: {
    type: Date,
    default: null
  },
  // Track share creation count for additional rate limiting
  shareCount: {
    type: Number,
    default: 0
  },
  // Track suspicious activity
  suspiciousActivityCount: {
    type: Number,
    default: 0
  }
});

// Index for cleanup job - find stale sessions
sessionSchema.index({ lastAccessed: 1 });

module.exports = mongoose.model('Session', sessionSchema);

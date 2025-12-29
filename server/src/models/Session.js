const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastAccessed: {
    type: Date,
    default: Date.now
  }
});

// Index for cleanup job - find stale sessions
sessionSchema.index({ lastAccessed: 1 });

module.exports = mongoose.model('Session', sessionSchema);

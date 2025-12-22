const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true
  },
  key: {
    type: String,
    required: true,
    maxlength: 100
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound unique index for session + key
settingSchema.index({ sessionId: 1, key: 1 }, { unique: true });

module.exports = mongoose.model('Setting', settingSchema);

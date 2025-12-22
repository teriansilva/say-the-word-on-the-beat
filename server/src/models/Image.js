const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true
  },
  data: {
    type: String,  // Base64 data URL
    required: true
  },
  mimeType: {
    type: String,
    required: true,
    maxlength: 50
  },
  word: {
    type: String,
    maxlength: 20
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

imageSchema.index({ sessionId: 1 });

module.exports = mongoose.model('Image', imageSchema);

const mongoose = require('mongoose');

const shareSchema = new mongoose.Schema({
  guid: {
    type: String,
    required: true,
    unique: true,
    maxlength: 36
  },
  config: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  imageIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Image'
  }],
  audioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AudioFile'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date
  },
  // Social features
  isPublic: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    maxlength: 100,
    default: ''
  },
  likes: {
    type: Number,
    default: 0
  },
  likedBy: [{
    type: String // Session IDs that have liked this share
  }],
  // Preview data for quick display (computed from config on save)
  preview: {
    contentItems: [{
      content: String,
      type: {
        type: String,
        enum: ['emoji', 'image']
      }
    }],
    rounds: Number,
    bpm: Number,
    hasCustomAudio: Boolean,
    difficulty: String
  }
});

// TTL index for automatic expiration
shareSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
shareSchema.index({ guid: 1 }, { unique: true });
// Index for public shares sorted by likes
shareSchema.index({ isPublic: 1, likes: -1, createdAt: -1 });

module.exports = mongoose.model('Share', shareSchema);

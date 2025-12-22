const mongoose = require('mongoose');

const bpmSegmentSchema = new mongoose.Schema({
  startTime: { type: Number, required: true },
  endTime: { type: Number, required: true },
  bpm: { type: Number, required: true }
}, { _id: false });

const bpmAnalysisSchema = new mongoose.Schema({
  segments: [bpmSegmentSchema],
  averageBpm: { type: Number, required: true },
  silenceOffset: { type: Number, required: true }
}, { _id: false });

const audioFileSchema = new mongoose.Schema({
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
  bpmAnalysis: bpmAnalysisSchema,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

audioFileSchema.index({ sessionId: 1 });

module.exports = mongoose.model('AudioFile', audioFileSchema);

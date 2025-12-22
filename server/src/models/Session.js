const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Session', sessionSchema);

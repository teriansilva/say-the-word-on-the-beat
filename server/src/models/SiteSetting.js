const mongoose = require('mongoose');

/**
 * Site-wide settings, changed from the admin dashboard (one document per key).
 * Unlike `Setting`, these are not tied to a visitor session.
 */
const siteSettingSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
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

module.exports = mongoose.model('SiteSetting', siteSettingSchema);

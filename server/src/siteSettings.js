const SiteSetting = require('./models/SiteSetting');

/**
 * The site-wide settings the admin dashboard can change, with their defaults.
 * A key that has never been saved reads as its default.
 */
const SITE_SETTING_DEFAULTS = {
  // Show the "Make your own rounds with AI" hint that points to gameplayce.io.
  promoEnabled: true,
};

async function readSiteSettings() {
  const docs = await SiteSetting.find({ key: { $in: Object.keys(SITE_SETTING_DEFAULTS) } }).lean();
  const out = { ...SITE_SETTING_DEFAULTS };
  for (const doc of docs) {
    if (typeof doc.value === typeof SITE_SETTING_DEFAULTS[doc.key]) out[doc.key] = doc.value;
  }
  return out;
}

async function writeSiteSetting(key, value) {
  await SiteSetting.findOneAndUpdate(
    { key },
    { value, updatedAt: new Date() },
    { upsert: true, new: true, runValidators: true }
  );
}

module.exports = { SITE_SETTING_DEFAULTS, readSiteSettings, writeSiteSetting };

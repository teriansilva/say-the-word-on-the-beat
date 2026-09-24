const express = require('express');
const { readSiteSettings } = require('../siteSettings');

const router = express.Router();

// GET /api/site-settings - public, read-only site-wide settings.
// Changing them goes through /api/admin/site-settings (admin auth).
router.get('/', async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    res.json(await readSiteSettings());
  } catch (err) {
    console.error('Error reading site settings:', err);
    res.status(500).json({ error: 'Failed to read site settings' });
  }
});

module.exports = router;

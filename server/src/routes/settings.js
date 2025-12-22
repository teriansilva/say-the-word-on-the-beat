const express = require('express');
const Setting = require('../models/Setting');
const { sessionMiddleware, requireSession } = require('../middleware/session');

const router = express.Router();

router.use(sessionMiddleware);

// GET /api/settings - Get all settings for session
router.get('/', requireSession, async (req, res) => {
  try {
    const settings = await Setting.find({ sessionId: req.sessionId });
    const result = {};
    settings.forEach(s => {
      result[s.key] = s.value;
    });
    res.json(result);
  } catch (err) {
    console.error('Error getting settings:', err);
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

// GET /api/settings/:key - Get specific setting
router.get('/:key', requireSession, async (req, res) => {
  try {
    const setting = await Setting.findOne({ 
      sessionId: req.sessionId, 
      key: req.params.key 
    });
    
    if (!setting) {
      return res.json({ value: null });
    }
    
    res.json({ value: setting.value });
  } catch (err) {
    console.error('Error getting setting:', err);
    res.status(500).json({ error: 'Failed to get setting' });
  }
});

// PUT /api/settings/:key - Set specific setting
router.put('/:key', requireSession, async (req, res) => {
  try {
    const { value } = req.body;
    
    const setting = await Setting.findOneAndUpdate(
      { sessionId: req.sessionId, key: req.params.key },
      { 
        sessionId: req.sessionId,
        key: req.params.key,
        value,
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    );
    
    res.json({ value: setting.value });
  } catch (err) {
    console.error('Error setting value:', err);
    res.status(500).json({ error: 'Failed to set setting' });
  }
});

// DELETE /api/settings/:key - Delete specific setting
router.delete('/:key', requireSession, async (req, res) => {
  try {
    await Setting.findOneAndDelete({ 
      sessionId: req.sessionId, 
      key: req.params.key 
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting setting:', err);
    res.status(500).json({ error: 'Failed to delete setting' });
  }
});

module.exports = router;

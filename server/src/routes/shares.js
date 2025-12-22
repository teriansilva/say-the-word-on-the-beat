const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Share = require('../models/Share');
const { sessionMiddleware } = require('../middleware/session');

const router = express.Router();

router.use(sessionMiddleware);

// GET /api/shares/:guid - Get share by GUID
router.get('/:guid', async (req, res) => {
  try {
    const share = await Share.findOne({ guid: req.params.guid });
    
    if (!share) {
      return res.status(404).json({ error: 'Share not found' });
    }
    
    res.json({
      guid: share.guid,
      config: share.config,
      imageIds: share.imageIds,
      audioId: share.audioId,
      createdAt: share.createdAt
    });
  } catch (err) {
    console.error('Error getting share:', err);
    res.status(500).json({ error: 'Failed to get share' });
  }
});

// POST /api/shares - Create new share
router.post('/', async (req, res) => {
  try {
    const { config, imageIds, audioId, expiresInDays } = req.body;
    
    if (!config) {
      return res.status(400).json({ error: 'config is required' });
    }
    
    const guid = uuidv4();
    
    const shareData = {
      guid,
      config,
      imageIds: imageIds || [],
      audioId: audioId || null,
      createdAt: new Date()
    };
    
    // Optional expiration
    if (expiresInDays) {
      shareData.expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);
    }
    
    const share = new Share(shareData);
    await share.save();
    
    res.status(201).json({
      guid: share.guid,
      createdAt: share.createdAt,
      expiresAt: share.expiresAt
    });
  } catch (err) {
    console.error('Error creating share:', err);
    res.status(500).json({ error: 'Failed to create share' });
  }
});

// DELETE /api/shares/:guid - Delete share (only by creator in same session)
router.delete('/:guid', async (req, res) => {
  try {
    const result = await Share.findOneAndDelete({ guid: req.params.guid });
    
    if (!result) {
      return res.status(404).json({ error: 'Share not found' });
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting share:', err);
    res.status(500).json({ error: 'Failed to delete share' });
  }
});

module.exports = router;

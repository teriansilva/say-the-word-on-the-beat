const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Share = require('../models/Share');
const { sessionMiddleware } = require('../middleware/session');

const router = express.Router();

router.use(sessionMiddleware);

// Helper function to extract preview data from config
function extractPreview(config) {
  const contentItems = (config.content || config.images || [])
    .slice(0, 4)
    .map(item => {
      if (typeof item === 'string') {
        return { content: item, type: 'image' };
      }
      if (item.url) {
        return { content: item.url, type: 'image' };
      }
      return { content: item.content, type: item.type };
    });

  return {
    contentItems,
    rounds: config.rounds || 3,
    bpm: config.bpm || 91,
    hasCustomAudio: !!config.audio,
    difficulty: config.difficulty || 'medium'
  };
}

// GET /api/shares/public - Get public shares with pagination (sorted by likes)
router.get('/public', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [shares, total] = await Promise.all([
      Share.find({ isPublic: true })
        .sort({ likes: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('guid title likes preview createdAt likedBy'),
      Share.countDocuments({ isPublic: true })
    ]);

    // Add hasLiked field based on current session
    const sessionId = req.sessionId;
    const sharesWithLikeStatus = shares.map(share => ({
      guid: share.guid,
      title: share.title,
      likes: share.likes,
      preview: share.preview,
      createdAt: share.createdAt,
      hasLiked: sessionId ? share.likedBy.includes(sessionId) : false
    }));

    res.json({
      shares: sharesWithLikeStatus,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + shares.length < total
      }
    });
  } catch (err) {
    console.error('Error getting public shares:', err);
    res.status(500).json({ error: 'Failed to get public shares' });
  }
});

// GET /api/shares/:guid - Get share by GUID
router.get('/:guid', async (req, res) => {
  try {
    // Update lastPlayedAt timestamp when share is accessed
    const share = await Share.findOneAndUpdate(
      { guid: req.params.guid },
      { $set: { lastPlayedAt: new Date() } },
      { new: true }
    );
    
    if (!share) {
      return res.status(404).json({ error: 'Share not found' });
    }
    
    // Add hasLiked status
    const sessionId = req.sessionId;
    
    res.json({
      guid: share.guid,
      config: share.config,
      imageIds: share.imageIds,
      audioId: share.audioId,
      createdAt: share.createdAt,
      isPublic: share.isPublic,
      title: share.title,
      likes: share.likes,
      hasLiked: sessionId ? share.likedBy.includes(sessionId) : false
    });
  } catch (err) {
    console.error('Error getting share:', err);
    res.status(500).json({ error: 'Failed to get share' });
  }
});

// POST /api/shares - Create new share
router.post('/', async (req, res) => {
  try {
    const { config, imageIds, audioId, expiresInDays, isPublic, title } = req.body;
    
    if (!config) {
      return res.status(400).json({ error: 'config is required' });
    }
    
    const guid = uuidv4();
    
    const shareData = {
      guid,
      config,
      imageIds: imageIds || [],
      audioId: audioId || null,
      createdAt: new Date(),
      isPublic: !!isPublic,
      title: (title || '').slice(0, 100),
      preview: extractPreview(config)
    };
    
    // Optional expiration (public shares don't expire by default)
    if (expiresInDays && !isPublic) {
      shareData.expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);
    }
    
    const share = new Share(shareData);
    await share.save();
    
    res.status(201).json({
      guid: share.guid,
      createdAt: share.createdAt,
      expiresAt: share.expiresAt,
      isPublic: share.isPublic,
      title: share.title
    });
  } catch (err) {
    console.error('Error creating share:', err);
    res.status(500).json({ error: 'Failed to create share' });
  }
});

// POST /api/shares/:guid/like - Toggle like on a share
router.post('/:guid/like', async (req, res) => {
  try {
    const sessionId = req.sessionId;
    
    if (!sessionId) {
      return res.status(401).json({ error: 'Session required to like' });
    }
    
    const share = await Share.findOne({ guid: req.params.guid, isPublic: true });
    
    if (!share) {
      return res.status(404).json({ error: 'Public share not found' });
    }
    
    const hasLiked = share.likedBy.includes(sessionId);
    
    if (hasLiked) {
      // Unlike
      share.likedBy = share.likedBy.filter(id => id !== sessionId);
      share.likes = Math.max(0, share.likes - 1);
    } else {
      // Like
      share.likedBy.push(sessionId);
      share.likes += 1;
    }
    
    await share.save();
    
    res.json({
      likes: share.likes,
      hasLiked: !hasLiked
    });
  } catch (err) {
    console.error('Error toggling like:', err);
    res.status(500).json({ error: 'Failed to toggle like' });
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

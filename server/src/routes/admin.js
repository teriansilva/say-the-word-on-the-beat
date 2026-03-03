const express = require('express');
const Session = require('../models/Session');
const Share = require('../models/Share');
const AudioFile = require('../models/AudioFile');
const Image = require('../models/Image');
const Setting = require('../models/Setting');
const { requireAdmin } = require('../middleware/adminAuth');

const router = express.Router();

// All admin routes require authentication
router.use(requireAdmin);

// ============================================================================
// Stats overview
// ============================================================================

router.get('/stats', async (req, res) => {
  try {
    const now = new Date();
    const staleDays = parseInt(process.env.STALE_DAYS) || 7;
    const staleDate = new Date(now - staleDays * 24 * 60 * 60 * 1000);
    const recentDate = new Date(now - 24 * 60 * 60 * 1000); // last 24h

    const [
      totalSessions,
      activeSessions,
      staleSessions,
      totalShares,
      publicShares,
      privateShares,
      totalImages,
      totalAudioFiles,
    ] = await Promise.all([
      Session.countDocuments(),
      Session.countDocuments({ lastAccessed: { $gte: staleDate } }),
      Session.countDocuments({ lastAccessed: { $lt: staleDate } }),
      Share.countDocuments(),
      Share.countDocuments({ isPublic: true }),
      Share.countDocuments({ isPublic: false }),
      Image.countDocuments(),
      AudioFile.countDocuments(),
    ]);

    res.json({
      sessions: { total: totalSessions, active: activeSessions, stale: staleSessions },
      shares: { total: totalShares, public: publicShares, private: privateShares },
      images: totalImages,
      audioFiles: totalAudioFiles,
      staleDays,
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// ============================================================================
// Sessions
// ============================================================================

router.get('/sessions', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const skip = (page - 1) * limit;
    const filter = req.query.filter; // 'active' | 'stale' | undefined (all)

    const staleDays = parseInt(process.env.STALE_DAYS) || 7;
    const staleDate = new Date(Date.now() - staleDays * 24 * 60 * 60 * 1000);

    let query = {};
    if (filter === 'active') {
      query = { lastAccessed: { $gte: staleDate } };
    } else if (filter === 'stale') {
      query = { lastAccessed: { $lt: staleDate } };
    }

    const [sessions, total] = await Promise.all([
      Session.find(query)
        .sort({ lastAccessed: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Session.countDocuments(query),
    ]);

    // Enrich with counts
    const enriched = await Promise.all(
      sessions.map(async (s) => {
        const [shareCount, imageCount, audioCount, settingCount] = await Promise.all([
          Share.countDocuments({ creatorSessionId: s._id.toString() }),
          Image.countDocuments({ sessionId: s._id }),
          AudioFile.countDocuments({ sessionId: s._id }),
          Setting.countDocuments({ sessionId: s._id }),
        ]);
        return {
          ...s,
          shareCount,
          imageCount,
          audioCount,
          settingCount,
        };
      })
    );

    res.json({
      sessions: enriched,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('Admin sessions error:', err);
    res.status(500).json({ error: 'Failed to get sessions' });
  }
});

router.delete('/sessions/:id', async (req, res) => {
  try {
    const sessionId = req.params.id;

    // Delete all associated data
    const [sessionResult, sharesDeleted, imagesDeleted, audioDeleted, settingsDeleted] =
      await Promise.all([
        Session.findByIdAndDelete(sessionId),
        Share.deleteMany({ creatorSessionId: sessionId }),
        Image.deleteMany({ sessionId }),
        AudioFile.deleteMany({ sessionId }),
        Setting.deleteMany({ sessionId }),
      ]);

    if (!sessionResult) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({
      success: true,
      deleted: {
        shares: sharesDeleted.deletedCount,
        images: imagesDeleted.deletedCount,
        audioFiles: audioDeleted.deletedCount,
        settings: settingsDeleted.deletedCount,
      },
    });
  } catch (err) {
    console.error('Admin delete session error:', err);
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

// ============================================================================
// Shares (all types)
// ============================================================================

router.get('/shares', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const skip = (page - 1) * limit;
    const filter = req.query.filter; // 'public' | 'private' | undefined (all)

    let query = {};
    if (filter === 'public') {
      query = { isPublic: true };
    } else if (filter === 'private') {
      query = { isPublic: false };
    }

    // Optional search by guid or title
    const search = req.query.search;
    if (search) {
      query.$or = [
        { guid: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
      ];
    }

    const sort = req.query.sort === 'oldest'
      ? { createdAt: 1 }
      : req.query.sort === 'popular'
      ? { likes: -1, createdAt: -1 }
      : { createdAt: -1 }; // default: newest

    const [shares, total] = await Promise.all([
      Share.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .select('-config -likedBy') // Exclude large fields for listing
        .lean(),
      Share.countDocuments(query),
    ]);

    res.json({
      shares,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('Admin shares error:', err);
    res.status(500).json({ error: 'Failed to get shares' });
  }
});

// Get full share details (for loading/inspecting)
router.get('/shares/:guid', async (req, res) => {
  try {
    const share = await Share.findOne({ guid: req.params.guid }).lean();
    if (!share) return res.status(404).json({ error: 'Share not found' });
    res.json(share);
  } catch (err) {
    console.error('Admin get share error:', err);
    res.status(500).json({ error: 'Failed to get share' });
  }
});

router.delete('/shares/:guid', async (req, res) => {
  try {
    const result = await Share.findOneAndDelete({ guid: req.params.guid });
    if (!result) return res.status(404).json({ error: 'Share not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('Admin delete share error:', err);
    res.status(500).json({ error: 'Failed to delete share' });
  }
});

// Bulk delete shares
router.post('/shares/bulk-delete', async (req, res) => {
  try {
    const { guids } = req.body;
    if (!Array.isArray(guids) || guids.length === 0) {
      return res.status(400).json({ error: 'guids array is required' });
    }
    const result = await Share.deleteMany({ guid: { $in: guids } });
    res.json({ success: true, deletedCount: result.deletedCount });
  } catch (err) {
    console.error('Admin bulk delete shares error:', err);
    res.status(500).json({ error: 'Failed to bulk delete shares' });
  }
});

// Toggle share flaggedAsSpam
router.patch('/shares/:guid/flag', async (req, res) => {
  try {
    const share = await Share.findOne({ guid: req.params.guid });
    if (!share) return res.status(404).json({ error: 'Share not found' });

    share.flaggedAsSpam = !share.flaggedAsSpam;
    await share.save();
    res.json({ guid: share.guid, flaggedAsSpam: share.flaggedAsSpam });
  } catch (err) {
    console.error('Admin flag share error:', err);
    res.status(500).json({ error: 'Failed to flag share' });
  }
});

// Toggle share public/private
router.patch('/shares/:guid/visibility', async (req, res) => {
  try {
    const share = await Share.findOne({ guid: req.params.guid });
    if (!share) return res.status(404).json({ error: 'Share not found' });

    share.isPublic = !share.isPublic;
    await share.save();
    res.json({ guid: share.guid, isPublic: share.isPublic });
  } catch (err) {
    console.error('Admin toggle visibility error:', err);
    res.status(500).json({ error: 'Failed to toggle visibility' });
  }
});

module.exports = router;

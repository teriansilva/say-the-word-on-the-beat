/**
 * Cleanup Task
 * 
 * Deletes:
 * 1. Shares that haven't been played for 7 days (along with their associated images/audio)
 * 2. Orphaned images not linked to any share
 * 3. Orphaned audio files not linked to any share
 * 4. Old sessions not accessed for 7 days
 * 
 * Run via: node src/tasks/cleanup.js
 */

const mongoose = require('mongoose');
const Share = require('../models/Share');
const Image = require('../models/Image');
const AudioFile = require('../models/AudioFile');
const Session = require('../models/Session');
const Setting = require('../models/Setting');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/saytheword';
const STALE_DAYS = parseInt(process.env.STALE_DAYS) || 7;

async function cleanup() {
  console.log(`[Cleanup] Starting cleanup task at ${new Date().toISOString()}`);
  console.log(`[Cleanup] Looking for resources not used in ${STALE_DAYS} days...`);

  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('[Cleanup] Connected to MongoDB');

    // Calculate cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - STALE_DAYS);

    let deletedImages = 0;
    let deletedAudio = 0;
    let deletedShares = 0;
    let deletedOrphanedImages = 0;
    let deletedOrphanedAudio = 0;
    let deletedSessions = 0;
    let deletedSettings = 0;

    // 1. Find and delete stale shares
    console.log('[Cleanup] Step 1: Finding stale shares...');
    const staleShares = await Share.find({
      lastPlayedAt: { $lt: cutoffDate }
    });

    console.log(`[Cleanup] Found ${staleShares.length} stale shares`);

    for (const share of staleShares) {
      try {
        // Delete associated images
        if (share.imageIds && share.imageIds.length > 0) {
          const imageResult = await Image.deleteMany({
            _id: { $in: share.imageIds }
          });
          deletedImages += imageResult.deletedCount;
        }

        // Delete associated audio
        if (share.audioId) {
          const audioResult = await AudioFile.deleteOne({
            _id: share.audioId
          });
          deletedAudio += audioResult.deletedCount;
        }

        // Delete the share itself
        await Share.deleteOne({ _id: share._id });
        deletedShares++;

        console.log(`[Cleanup] Deleted share: ${share.guid} (title: ${share.title || 'untitled'})`);
      } catch (err) {
        console.error(`[Cleanup] Error deleting share ${share.guid}:`, err);
      }
    }

    // 2. Find and delete orphaned images (not linked to any share)
    console.log('[Cleanup] Step 2: Finding orphaned images...');
    
    // Get all image IDs that are referenced by shares
    const allShareImageIds = await Share.distinct('imageIds');
    const flatImageIds = allShareImageIds.flat().filter(Boolean);
    
    // Find images created before cutoff that are not in any share
    const orphanedImages = await Image.find({
      _id: { $nin: flatImageIds },
      createdAt: { $lt: cutoffDate }
    });
    
    console.log(`[Cleanup] Found ${orphanedImages.length} orphaned images`);
    
    if (orphanedImages.length > 0) {
      const orphanedImageResult = await Image.deleteMany({
        _id: { $in: orphanedImages.map(img => img._id) }
      });
      deletedOrphanedImages = orphanedImageResult.deletedCount;
    }

    // 3. Find and delete orphaned audio files (not linked to any share)
    console.log('[Cleanup] Step 3: Finding orphaned audio files...');
    
    // Get all audio IDs that are referenced by shares
    const allShareAudioIds = await Share.distinct('audioId');
    const validAudioIds = allShareAudioIds.filter(Boolean);
    
    // Find audio files created before cutoff that are not in any share
    const orphanedAudio = await AudioFile.find({
      _id: { $nin: validAudioIds },
      createdAt: { $lt: cutoffDate }
    });
    
    console.log(`[Cleanup] Found ${orphanedAudio.length} orphaned audio files`);
    
    if (orphanedAudio.length > 0) {
      const orphanedAudioResult = await AudioFile.deleteMany({
        _id: { $in: orphanedAudio.map(audio => audio._id) }
      });
      deletedOrphanedAudio = orphanedAudioResult.deletedCount;
    }

    // 4. Find and delete stale sessions (not accessed for 7 days)
    console.log('[Cleanup] Step 4: Finding stale sessions...');
    
    const staleSessions = await Session.find({
      lastAccessed: { $lt: cutoffDate }
    });
    
    console.log(`[Cleanup] Found ${staleSessions.length} stale sessions`);
    
    // Delete settings associated with stale sessions
    for (const session of staleSessions) {
      try {
        const settingsResult = await Setting.deleteMany({
          sessionId: session._id
        });
        deletedSettings += settingsResult.deletedCount;
      } catch (err) {
        console.error(`[Cleanup] Error deleting settings for session ${session._id}:`, err);
      }
    }
    
    // Delete the stale sessions
    if (staleSessions.length > 0) {
      const sessionResult = await Session.deleteMany({
        _id: { $in: staleSessions.map(s => s._id) }
      });
      deletedSessions = sessionResult.deletedCount;
    }

    console.log('[Cleanup] Cleanup complete!');
    console.log(`[Cleanup] Summary:`);
    console.log(`  - Deleted ${deletedShares} stale shares`);
    console.log(`  - Deleted ${deletedImages} images from shares`);
    console.log(`  - Deleted ${deletedAudio} audio files from shares`);
    console.log(`  - Deleted ${deletedOrphanedImages} orphaned images`);
    console.log(`  - Deleted ${deletedOrphanedAudio} orphaned audio files`);
    console.log(`  - Deleted ${deletedSessions} stale sessions`);
    console.log(`  - Deleted ${deletedSettings} settings from stale sessions`);

  } catch (err) {
    console.error('[Cleanup] Error during cleanup:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('[Cleanup] Disconnected from MongoDB');
  }
}

// Run the cleanup
cleanup()
  .then(() => {
    console.log('[Cleanup] Task finished successfully');
    process.exit(0);
  })
  .catch((err) => {
    console.error('[Cleanup] Task failed:', err);
    process.exit(1);
  });

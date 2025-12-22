const express = require('express');
const AudioFile = require('../models/AudioFile');
const { sessionMiddleware, requireSession } = require('../middleware/session');

const router = express.Router();

router.use(sessionMiddleware);

// GET /api/audio - List all audio files for session
router.get('/', requireSession, async (req, res) => {
  try {
    const audioFiles = await AudioFile.find({ sessionId: req.sessionId })
      .select('_id mimeType bpmAnalysis createdAt')
      .sort({ createdAt: -1 });
    
    res.json(audioFiles);
  } catch (err) {
    console.error('Error listing audio files:', err);
    res.status(500).json({ error: 'Failed to list audio files' });
  }
});

// GET /api/audio/:id - Get audio file by ID
router.get('/:id', async (req, res) => {
  try {
    const audioFile = await AudioFile.findById(req.params.id);
    
    if (!audioFile) {
      return res.status(404).json({ error: 'Audio file not found' });
    }
    
    res.json({
      id: audioFile._id,
      data: audioFile.data,
      mimeType: audioFile.mimeType,
      bpmAnalysis: audioFile.bpmAnalysis
    });
  } catch (err) {
    console.error('Error getting audio file:', err);
    res.status(500).json({ error: 'Failed to get audio file' });
  }
});

// POST /api/audio - Upload new audio file
router.post('/', requireSession, async (req, res) => {
  try {
    const { data, mimeType, bpmAnalysis } = req.body;
    
    if (!data || !mimeType) {
      return res.status(400).json({ error: 'data and mimeType are required' });
    }
    
    const audioFile = new AudioFile({
      sessionId: req.sessionId,
      data,
      mimeType,
      bpmAnalysis
    });
    
    await audioFile.save();
    
    res.status(201).json({
      id: audioFile._id,
      mimeType: audioFile.mimeType,
      bpmAnalysis: audioFile.bpmAnalysis,
      createdAt: audioFile.createdAt
    });
  } catch (err) {
    console.error('Error uploading audio file:', err);
    res.status(500).json({ error: 'Failed to upload audio file' });
  }
});

// PUT /api/audio/:id - Update audio BPM analysis
router.put('/:id', requireSession, async (req, res) => {
  try {
    const { bpmAnalysis } = req.body;
    
    const audioFile = await AudioFile.findOneAndUpdate(
      { _id: req.params.id, sessionId: req.sessionId },
      { bpmAnalysis },
      { new: true }
    );
    
    if (!audioFile) {
      return res.status(404).json({ error: 'Audio file not found' });
    }
    
    res.json({
      id: audioFile._id,
      mimeType: audioFile.mimeType,
      bpmAnalysis: audioFile.bpmAnalysis
    });
  } catch (err) {
    console.error('Error updating audio file:', err);
    res.status(500).json({ error: 'Failed to update audio file' });
  }
});

// DELETE /api/audio/:id - Delete audio file
router.delete('/:id', requireSession, async (req, res) => {
  try {
    const result = await AudioFile.findOneAndDelete({ 
      _id: req.params.id, 
      sessionId: req.sessionId 
    });
    
    if (!result) {
      return res.status(404).json({ error: 'Audio file not found' });
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting audio file:', err);
    res.status(500).json({ error: 'Failed to delete audio file' });
  }
});

module.exports = router;

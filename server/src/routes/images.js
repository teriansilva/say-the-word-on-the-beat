const express = require('express');
const Image = require('../models/Image');
const { sessionMiddleware, requireSession } = require('../middleware/session');

const router = express.Router();

router.use(sessionMiddleware);

// GET /api/images - List all images for session
router.get('/', requireSession, async (req, res) => {
  try {
    const images = await Image.find({ sessionId: req.sessionId })
      .select('_id mimeType word createdAt')
      .sort({ createdAt: -1 });
    
    res.json(images);
  } catch (err) {
    console.error('Error listing images:', err);
    res.status(500).json({ error: 'Failed to list images' });
  }
});

// GET /api/images/:id - Get image by ID
router.get('/:id', async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);
    
    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }
    
    res.json({
      id: image._id,
      data: image.data,
      mimeType: image.mimeType,
      word: image.word
    });
  } catch (err) {
    console.error('Error getting image:', err);
    res.status(500).json({ error: 'Failed to get image' });
  }
});

// POST /api/images - Upload new image
router.post('/', requireSession, async (req, res) => {
  try {
    const { data, mimeType, word } = req.body;
    
    if (!data || !mimeType) {
      return res.status(400).json({ error: 'data and mimeType are required' });
    }
    
    const image = new Image({
      sessionId: req.sessionId,
      data,
      mimeType,
      word: word?.substring(0, 20)
    });
    
    await image.save();
    
    res.status(201).json({
      id: image._id,
      mimeType: image.mimeType,
      word: image.word,
      createdAt: image.createdAt
    });
  } catch (err) {
    console.error('Error uploading image:', err);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// PUT /api/images/:id - Update image word
router.put('/:id', requireSession, async (req, res) => {
  try {
    const { word } = req.body;
    
    const image = await Image.findOneAndUpdate(
      { _id: req.params.id, sessionId: req.sessionId },
      { word: word?.substring(0, 20) },
      { new: true }
    );
    
    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }
    
    res.json({
      id: image._id,
      mimeType: image.mimeType,
      word: image.word
    });
  } catch (err) {
    console.error('Error updating image:', err);
    res.status(500).json({ error: 'Failed to update image' });
  }
});

// DELETE /api/images/:id - Delete image
router.delete('/:id', requireSession, async (req, res) => {
  try {
    const result = await Image.findOneAndDelete({ 
      _id: req.params.id, 
      sessionId: req.sessionId 
    });
    
    if (!result) {
      return res.status(404).json({ error: 'Image not found' });
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting image:', err);
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

module.exports = router;

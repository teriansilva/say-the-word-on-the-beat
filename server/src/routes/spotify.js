const express = require('express');
const { SpotifyApi } = require('@spotify/web-api-ts-sdk');
const router = express.Router();

// Initialize Spotify API client with Client Credentials
let spotifyApi = null;
let tokenExpiry = 0;

async function getSpotifyClient() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Spotify credentials not configured. Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET environment variables.');
  }

  // Check if token is still valid (with 5 minute buffer)
  if (spotifyApi && Date.now() < tokenExpiry - 300000) {
    return spotifyApi;
  }

  // Create new client with Client Credentials flow
  spotifyApi = SpotifyApi.withClientCredentials(clientId, clientSecret);
  
  // Set token expiry (tokens typically last 1 hour)
  tokenExpiry = Date.now() + 3600000;
  
  return spotifyApi;
}

// POST /api/spotify/search
// Search for tracks
router.post('/search', async (req, res) => {
  try {
    const { query, limit = 10 } = req.body;

    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    const api = await getSpotifyClient();
    const results = await api.search(query.trim(), ['track'], undefined, limit);
    
    const tracks = results.tracks.items.map(track => ({
      id: track.id,
      name: track.name,
      artists: track.artists.map(artist => artist.name),
      album: track.album.name,
      albumArt: track.album.images[0]?.url || '',
      previewUrl: track.preview_url,
      duration: track.duration_ms / 1000
    }));

    res.json({ tracks });
  } catch (error) {
    console.error('Spotify search error:', error);
    res.status(500).json({ 
      error: 'Failed to search Spotify',
      message: error.message 
    });
  }
});

// GET /api/spotify/track/:trackId
// Get track details with BPM
router.get('/track/:trackId', async (req, res) => {
  try {
    const { trackId } = req.params;

    if (!trackId) {
      return res.status(400).json({ error: 'Track ID is required' });
    }

    const api = await getSpotifyClient();
    
    // Get track details and audio features in parallel
    const [track, audioFeatures] = await Promise.all([
      api.tracks.get(trackId),
      api.tracks.audioFeatures(trackId)
    ]);

    const trackWithBpm = {
      id: track.id,
      name: track.name,
      artists: track.artists.map(artist => artist.name),
      album: track.album.name,
      albumArt: track.album.images[0]?.url || '',
      previewUrl: track.preview_url,
      duration: track.duration_ms / 1000,
      bpm: Math.round(audioFeatures.tempo)
    };

    res.json(trackWithBpm);
  } catch (error) {
    console.error('Spotify track error:', error);
    res.status(500).json({ 
      error: 'Failed to get track details',
      message: error.message 
    });
  }
});

module.exports = router;

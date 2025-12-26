import { SpotifyApi } from '@spotify/web-api-ts-sdk'

export interface SpotifyTrack {
  id: string
  name: string
  artists: string[]
  album: string
  albumArt: string
  previewUrl: string | null
  duration: number
}

export interface SpotifyTrackWithBpm extends SpotifyTrack {
  bpm: number
}

class SpotifyService {
  private api: SpotifyApi | null = null
  private tokenExpiry: number = 0

  private async initializeApi(): Promise<void> {
    const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID
    const clientSecret = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      throw new Error('Spotify credentials not configured. Please set VITE_SPOTIFY_CLIENT_ID and VITE_SPOTIFY_CLIENT_SECRET in your .env file.')
    }

    // WARNING: Using Client Credentials flow with secret in frontend is NOT secure for production.
    // This implementation is for demonstration/development purposes only.
    // For production, implement a backend proxy that handles authentication and forwards requests.
    // See: https://developer.spotify.com/documentation/web-api/concepts/authorization
    
    // Check if token is still valid (with 5 minute buffer)
    if (this.api && Date.now() < this.tokenExpiry - 300000) {
      return
    }

    // Use Client Credentials flow
    this.api = SpotifyApi.withClientCredentials(clientId, clientSecret)
    
    // Set token expiry (tokens typically last 1 hour)
    this.tokenExpiry = Date.now() + 3600000
  }

  async searchTracks(query: string, limit: number = 10): Promise<SpotifyTrack[]> {
    if (!query.trim()) {
      return []
    }

    await this.initializeApi()

    if (!this.api) {
      throw new Error('Failed to initialize Spotify API')
    }

    // Search for tracks with market set to undefined (searches all markets)
    const results = await this.api.search(query, ['track'], undefined, limit)
    
    return results.tracks.items.map(track => ({
      id: track.id,
      name: track.name,
      artists: track.artists.map(artist => artist.name),
      album: track.album.name,
      albumArt: track.album.images[0]?.url || '',
      previewUrl: track.preview_url,
      duration: track.duration_ms / 1000
    }))
  }

  async getTrackWithBpm(trackId: string): Promise<SpotifyTrackWithBpm> {
    await this.initializeApi()

    if (!this.api) {
      throw new Error('Failed to initialize Spotify API')
    }

    // Get track details and audio features in parallel
    const [track, audioFeatures] = await Promise.all([
      this.api.tracks.get(trackId),
      this.api.tracks.audioFeatures(trackId)
    ])

    return {
      id: track.id,
      name: track.name,
      artists: track.artists.map(artist => artist.name),
      album: track.album.name,
      albumArt: track.album.images[0]?.url || '',
      previewUrl: track.preview_url,
      duration: track.duration_ms / 1000,
      bpm: Math.round(audioFeatures.tempo)
    }
  }
}

export const spotifyService = new SpotifyService()

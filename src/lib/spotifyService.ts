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
  private apiBaseUrl: string

  constructor() {
    // Use backend API proxy to keep credentials secure
    this.apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
  }

  async searchTracks(query: string, limit: number = 10): Promise<SpotifyTrack[]> {
    if (!query.trim()) {
      return []
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/spotify/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: query.trim(), limit })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to search Spotify')
      }

      const data = await response.json()
      return data.tracks
    } catch (error) {
      console.error('Spotify search error:', error)
      throw error
    }
  }

  async getTrackWithBpm(trackId: string): Promise<SpotifyTrackWithBpm> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/spotify/track/${trackId}`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to get track details')
      }

      const track = await response.json()
      return track
    } catch (error) {
      console.error('Spotify track error:', error)
      throw error
    }
  }
}

export const spotifyService = new SpotifyService()

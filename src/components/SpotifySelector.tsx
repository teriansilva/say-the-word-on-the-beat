import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { MagnifyingGlass, MusicNote, X, ArrowCounterClockwise, Spinner } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { spotifyService, type SpotifyTrack, type SpotifyTrackWithBpm } from '@/lib/spotifyService'

interface SpotifySelectorProps {
  selectedTrack: SpotifyTrackWithBpm | null
  onTrackSelect: (track: SpotifyTrackWithBpm) => void
  onTrackRemove: () => void
  bpm: number
  onBpmChange: (bpm: number) => void
  baseBpm: number
  isPlaying: boolean
}

export function SpotifySelector({ 
  selectedTrack, 
  onTrackSelect, 
  onTrackRemove, 
  bpm, 
  onBpmChange, 
  baseBpm,
  isPlaying 
}: SpotifySelectorProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SpotifyTrack[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isLoadingTrack, setIsLoadingTrack] = useState(false)
  const searchTimeoutRef = useRef<number | null>(null)

  const handleReset = () => {
    const resetBpm = selectedTrack ? baseBpm : 91
    onBpmChange(resetBpm)
    toast.success('Tempo reset to original value')
  }

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const results = await spotifyService.searchTracks(query, 20)
      setSearchResults(results)
    } catch (error) {
      console.error('Search error:', error)
      if (error instanceof Error && error.message.includes('credentials not configured')) {
        toast.error('Spotify not configured. Please add your Spotify credentials to the .env file.')
      } else {
        toast.error('Failed to search Spotify. Please try again.')
      }
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleSearchInputChange = (query: string) => {
    setSearchQuery(query)
    
    // Debounce search
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = window.setTimeout(() => {
      handleSearch(query)
    }, 500)
  }

  const handleTrackSelect = async (track: SpotifyTrack) => {
    setIsLoadingTrack(true)
    try {
      const trackWithBpm = await spotifyService.getTrackWithBpm(track.id)
      onTrackSelect(trackWithBpm)
      setIsSearchOpen(false)
      setSearchQuery('')
      setSearchResults([])
      toast.success(`Selected: ${trackWithBpm.name} - ${trackWithBpm.bpm} BPM`)
    } catch (error) {
      console.error('Failed to load track:', error)
      toast.error('Failed to load track details. Please try again.')
    } finally {
      setIsLoadingTrack(false)
    }
  }

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [])

  return (
    <>
      <Card className="p-4 border-2">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MusicNote size={20} weight="bold" className="text-primary" />
              <label className="text-sm font-semibold text-foreground">
                Song Selection
              </label>
            </div>
            {selectedTrack && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onTrackRemove}
                className="h-8 gap-1 text-destructive hover:text-destructive"
                disabled={isPlaying}
              >
                <X size={16} weight="bold" />
                Remove
              </Button>
            )}
          </div>

          {selectedTrack ? (
            <div className="space-y-3">
              <div className="flex gap-3 items-center">
                {selectedTrack.albumArt && (
                  <img 
                    src={selectedTrack.albumArt} 
                    alt={selectedTrack.album}
                    className="w-16 h-16 rounded-md object-cover"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm truncate">{selectedTrack.name}</h4>
                  <p className="text-xs text-muted-foreground truncate">
                    {selectedTrack.artists.join(', ')}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {selectedTrack.album}
                  </p>
                </div>
              </div>
              {selectedTrack.previewUrl && (
                <audio controls className="w-full h-10" src={selectedTrack.previewUrl} />
              )}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">
              No song selected. Using default sound: <span className="font-semibold text-foreground">Say the Word on Beat</span>
            </div>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsSearchOpen(true)}
            className="w-full gap-2"
            disabled={isPlaying}
          >
            <MagnifyingGlass size={16} weight="bold" />
            {selectedTrack ? 'Change Song' : 'Search Spotify'}
          </Button>

          {selectedTrack && (
            <div className="pt-3 border-t border-border space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-foreground">
                  Base BPM
                </label>
                <Badge variant="secondary" className="text-sm font-bold">
                  {baseBpm} BPM
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Detected tempo from Spotify for this track
              </p>
            </div>
          )}

          <div className="pt-3 border-t border-border space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-foreground">
                Adjust Tempo
              </label>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-sm font-bold">
                  {bpm} BPM
                </Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleReset}
                  className="h-7 w-7 p-0"
                  disabled={isPlaying}
                >
                  <ArrowCounterClockwise size={16} weight="bold" />
                </Button>
              </div>
            </div>
            <Slider
              value={[bpm]}
              onValueChange={([value]) => onBpmChange(value)}
              min={60}
              max={180}
              step={1}
              className="w-full"
              disabled={isPlaying}
            />
          </div>
        </div>
      </Card>

      <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <MagnifyingGlass size={28} weight="bold" className="text-primary" />
              Search Spotify
            </DialogTitle>
            <DialogDescription>
              Search for songs on Spotify. BPM will be automatically detected.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
            <div className="relative">
              <MagnifyingGlass 
                size={18} 
                weight="bold" 
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                placeholder="Search for songs..."
                value={searchQuery}
                onChange={(e) => handleSearchInputChange(e.target.value)}
                className="pl-10"
                autoFocus
              />
            </div>

            {isSearching && (
              <div className="flex items-center justify-center py-8">
                <Spinner size={32} weight="bold" className="animate-spin text-primary" />
              </div>
            )}

            {!isSearching && searchResults.length === 0 && searchQuery.trim() && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No results found. Try a different search.
              </div>
            )}

            {!isSearching && searchResults.length === 0 && !searchQuery.trim() && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Start typing to search for songs
              </div>
            )}

            {searchResults.length > 0 && (
              <div className="flex-1 overflow-y-auto space-y-2">
                {searchResults.map((track) => (
                  <button
                    key={track.id}
                    onClick={() => handleTrackSelect(track)}
                    disabled={isLoadingTrack}
                    className="w-full flex gap-3 items-center p-3 rounded-lg border border-border hover:bg-accent hover:border-primary transition-colors text-left disabled:opacity-50"
                  >
                    {track.albumArt && (
                      <img 
                        src={track.albumArt} 
                        alt={track.album}
                        className="w-12 h-12 rounded object-cover flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm truncate">{track.name}</h4>
                      <p className="text-xs text-muted-foreground truncate">
                        {track.artists.join(', ')}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {track.album}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

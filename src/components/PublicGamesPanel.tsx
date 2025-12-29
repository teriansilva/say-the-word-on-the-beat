import { useState, useEffect, useCallback, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Globe, ArrowClockwise, Trophy, TrendUp } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { shareApi, type PublicShare } from '@/hooks/useLocalStorage'
import { GamePreviewCard } from '@/components/GamePreviewCard'

interface PublicGamesPanelProps {
  onLoadGame: (guid: string) => Promise<void>
}

export function PublicGamesPanel({ onLoadGame }: PublicGamesPanelProps) {
  const [shares, setShares] = useState<PublicShare[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [likingGuids, setLikingGuids] = useState<Set<string>>(new Set())
  const [pagination, setPagination] = useState({
    page: 1,
    hasMore: true,
    total: 0
  })
  
  const scrollRef = useRef<HTMLDivElement>(null)
  const loadingRef = useRef(false)
  
  const fetchShares = useCallback(async (page: number, append: boolean = false) => {
    if (loadingRef.current) return
    loadingRef.current = true
    
    try {
      const response = await shareApi.getPublic(page, 12)
      
      setShares(prev => append ? [...prev, ...response.shares] : response.shares)
      setPagination({
        page: response.pagination.page,
        hasMore: response.pagination.hasMore,
        total: response.pagination.total
      })
    } catch (error) {
      console.error('Failed to fetch public games:', error)
      if (!append) {
        toast.error('Failed to load public games')
      }
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
      loadingRef.current = false
    }
  }, [])
  
  // Initial load
  useEffect(() => {
    fetchShares(1)
  }, [fetchShares])
  
  // Handle scroll for infinite loading
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const target = event.target as HTMLDivElement
    const scrollBottom = target.scrollHeight - target.scrollTop - target.clientHeight
    
    if (scrollBottom < 200 && pagination.hasMore && !isLoadingMore && !loadingRef.current) {
      setIsLoadingMore(true)
      fetchShares(pagination.page + 1, true)
    }
  }, [pagination, isLoadingMore, fetchShares])
  
  const handleLike = async (guid: string) => {
    if (likingGuids.has(guid)) return
    
    setLikingGuids(prev => new Set([...prev, guid]))
    
    try {
      const result = await shareApi.toggleLike(guid)
      
      setShares(prev => prev.map(share => 
        share.guid === guid 
          ? { ...share, likes: result.likes, hasLiked: result.hasLiked }
          : share
      ))
    } catch (error) {
      toast.error('Failed to update like')
    } finally {
      setLikingGuids(prev => {
        const next = new Set(prev)
        next.delete(guid)
        return next
      })
    }
  }
  
  const handleLoad = async (guid: string) => {
    try {
      await onLoadGame(guid)
      toast.success('Game loaded!')
    } catch (error) {
      toast.error('Failed to load game')
    }
  }
  
  const handleRefresh = () => {
    setIsLoading(true)
    setShares([])
    fetchShares(1)
  }
  
  return (
    <Card className="p-4 border-2 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Globe size={20} weight="bold" className="text-primary" />
          <h2 className="font-bold text-lg">Community Games</h2>
          {pagination.total > 0 && (
            <span className="text-xs text-muted-foreground">
              ({pagination.total})
            </span>
          )}
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleRefresh}
          disabled={isLoading}
          className="h-8 w-8 p-0"
        >
          <ArrowClockwise size={16} weight="bold" className={isLoading ? 'animate-spin' : ''} />
        </Button>
      </div>
      
      {/* Subtitle */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
        <TrendUp size={14} weight="bold" />
        <span>Sorted by most popular</span>
      </div>
      
      {/* Scrollable Content */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto min-h-0 -mx-2 px-2"
        onScroll={handleScroll}
      >
        {isLoading ? (
          // Loading skeletons
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Card key={i} className="p-3 border-2">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="aspect-square rounded-lg mb-3" />
                <div className="flex gap-2 mb-3">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-14" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-8 flex-1" />
                  <Skeleton className="h-8 flex-1" />
                </div>
              </Card>
            ))}
          </div>
        ) : shares.length === 0 ? (
          // Empty state
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Trophy size={48} weight="duotone" className="text-muted-foreground/50 mb-3" />
            <h3 className="font-semibold text-foreground mb-1">No Public Games Yet</h3>
            <p className="text-sm text-muted-foreground max-w-[200px]">
              Be the first to share your game with the community!
            </p>
          </div>
        ) : (
          // Games list
          <div className="space-y-3 pb-2">
            {shares.map((share) => (
              <GamePreviewCard
                key={share.guid}
                share={share}
                onLike={handleLike}
                onLoad={handleLoad}
                isLiking={likingGuids.has(share.guid)}
              />
            ))}
            
            {/* Loading more indicator */}
            {isLoadingMore && (
              <div className="flex items-center justify-center py-4">
                <ArrowClockwise size={20} weight="bold" className="animate-spin text-muted-foreground" />
              </div>
            )}
            
            {/* End of list */}
            {!pagination.hasMore && shares.length > 0 && (
              <p className="text-center text-xs text-muted-foreground py-2">
                You've seen all {pagination.total} games!
              </p>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}

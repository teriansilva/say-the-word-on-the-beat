import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Heart, MusicNote, Play, Timer } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import type { PublicShare } from '@/hooks/useLocalStorage'

interface GamePreviewCardProps {
  share: PublicShare
  onLike: (guid: string) => void
  onLoad: (guid: string) => void
  isLiking?: boolean
}

export function GamePreviewCard({ share, onLike, onLoad, isLiking }: GamePreviewCardProps) {
  const { preview, title, likes, hasLiked, guid } = share
  
  // Get up to 4 content items for the preview grid
  const previewItems = preview?.contentItems?.slice(0, 4) || []
  
  // Format difficulty display
  const difficultyColors: Record<string, string> = {
    easy: 'bg-green-500/20 text-green-700 dark:text-green-400',
    medium: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400',
    hard: 'bg-red-500/20 text-red-700 dark:text-red-400'
  }
  
  const formattedDate = new Date(share.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
  
  return (
    <Card className="p-3 border-2 hover:border-primary/50 transition-colors group">
      {/* Title + Preview Row */}
      <div className="flex items-center gap-3 mb-2">
        {/* Mini Preview Grid - 4 tiles in a row */}
        <div className="flex gap-0.5 shrink-0">
          {[0, 1, 2, 3].map((index) => {
            const item = previewItems[index]
            return (
              <div
                key={index}
                className="w-10 h-10 flex items-center justify-center bg-muted/50 border border-border/50 rounded-sm"
              >
                {item ? (
                  item.type === 'emoji' ? (
                    <span className="text-lg">{item.content}</span>
                  ) : (
                    <img
                      src={item.content}
                      alt=""
                      className="w-full h-full object-cover rounded-sm"
                    />
                  )
                ) : (
                  <div className="w-full h-full bg-muted/30 rounded-sm" />
                )}
              </div>
            )
          })}
        </div>
        
        {/* Title */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-foreground line-clamp-1">
            {title || 'Untitled Game'}
          </h3>
          <span className="text-xs text-muted-foreground">{formattedDate}</span>
        </div>
      </div>
      
      {/* Stats Row */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <Badge variant="secondary" className="text-xs gap-1">
          <Timer size={12} weight="bold" />
          {preview?.rounds || 3} rounds
        </Badge>
        <Badge 
          variant="secondary" 
          className={cn('text-xs capitalize', difficultyColors[preview?.difficulty || 'medium'])}
        >
          {preview?.difficulty || 'medium'}
        </Badge>
        {preview?.hasCustomAudio && (
          <Badge variant="secondary" className="text-xs gap-1 bg-purple-500/20 text-purple-700 dark:text-purple-400">
            <MusicNote size={12} weight="fill" />
            Custom
          </Badge>
        )}
      </div>
      
      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          className={cn(
            'h-8 gap-1.5 flex-1',
            hasLiked && 'bg-red-500/10 border-red-500/50 text-red-600 hover:bg-red-500/20'
          )}
          onClick={() => onLike(guid)}
          disabled={isLiking}
        >
          <Heart 
            size={16} 
            weight={hasLiked ? 'fill' : 'regular'} 
            className={hasLiked ? 'text-red-500' : ''} 
          />
          <span className="font-medium">{likes}</span>
        </Button>
        
        <Button
          size="sm"
          className="h-8 gap-1.5 flex-1"
          onClick={() => onLoad(guid)}
        >
          <Play size={16} weight="fill" />
          Load
        </Button>
      </div>
    </Card>
  )
}

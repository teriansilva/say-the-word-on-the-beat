import { Card } from '@/components/ui/card'
import { Plus } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface GridCardProps {
  emoji: string
  isActive: boolean
  onClick: () => void
}

export function GridCard({ emoji, isActive, onClick }: GridCardProps) {
  return (
    <Card
      className={cn(
        'aspect-square flex items-center justify-center cursor-pointer transition-all duration-200',
        'border-4 hover:border-lavender hover:-translate-y-1 hover:shadow-xl',
        'bg-card text-card-foreground relative overflow-hidden',
        isActive && 'beat-active scale-105 border-accent'
      )}
      onClick={onClick}
    >
      <div className="relative w-full h-full flex items-center justify-center group">
        {emoji ? (
          <span className="text-6xl md:text-7xl select-none transition-transform group-hover:scale-110" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            {emoji}
          </span>
        ) : (
          <div className="flex flex-col items-center justify-center text-muted-foreground">
            <Plus size={48} weight="bold" className="mb-2" />
            <span className="text-sm font-medium">Add Emoji</span>
          </div>
        )}
        
        {emoji && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
            <span className="text-xs font-semibold text-foreground/70 bg-background/90 px-3 py-1.5 rounded-full shadow-sm">
              Click to change
            </span>
          </div>
        )}
      </div>
    </Card>
  )
}

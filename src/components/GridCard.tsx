import { Card } from '@/components/ui/card'
import { Plus } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface GridCardProps {
  content: string
  contentType: 'emoji' | 'image'
  isActive: boolean
}

export function GridCard({ content, contentType, isActive }: GridCardProps) {
  return (
    <Card
      className={cn(
        'aspect-square flex items-center justify-center transition-all duration-200',
        'border-4',
        'bg-card text-card-foreground relative overflow-hidden',
        isActive && 'beat-active scale-105 border-accent'
      )}
    >
      <div className="relative w-full h-full flex items-center justify-center">
        {content ? (
          contentType === 'emoji' ? (
            <span className="text-6xl md:text-7xl select-none" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              {content}
            </span>
          ) : (
            <img
              src={content}
              alt="Custom content"
              className="w-full h-full object-cover"
            />
          )
        ) : (
          <div className="flex flex-col items-center justify-center text-muted-foreground">
            <Plus size={48} weight="bold" className="mb-2" />
            <span className="text-sm font-medium">Add Content</span>
          </div>
        )}
      </div>
    </Card>
  )
}

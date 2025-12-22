import { Card } from '@/components/ui/card'
import { Plus, Question } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { sanitizeText } from '@/lib/security'

interface GridCardProps {
  content: string
  contentType: 'emoji' | 'image'
  isActive: boolean
  hasBeenRevealed: boolean
  word?: string
}

export function GridCard({ content, contentType, isActive, hasBeenRevealed, word }: GridCardProps) {
  const shouldShowContent = hasBeenRevealed
  
  // Sanitize word for display
  const safeWord = word ? sanitizeText(word) : undefined
  
  return (
    <Card
      className={cn(
        'aspect-square flex items-center justify-center transition-all duration-200',
        'border-4',
        'bg-card text-card-foreground relative overflow-hidden',
        isActive && 'beat-active scale-105 border-accent'
      )}
    >
      {!shouldShowContent ? (
        <div className="relative w-full h-full flex items-center justify-center">
          <Question size={64} weight="bold" className="text-muted-foreground" />
        </div>
      ) : content ? (
        contentType === 'emoji' ? (
          <div className="relative w-full h-full flex items-center justify-center">
            <span className="text-6xl md:text-7xl select-none" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              {content}
            </span>
          </div>
        ) : (
          <>
            <img
              src={content}
              alt="Custom content"
              className="absolute inset-0 w-full h-full object-cover"
            />
            {safeWord && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent pt-8 pb-3 px-3">
                <p className="text-white text-2xl md:text-3xl font-bold text-center leading-tight drop-shadow-lg" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>
                  {safeWord}
                </p>
              </div>
            )}
          </>
        )
      ) : (
        <div className="relative w-full h-full flex flex-col items-center justify-center text-muted-foreground">
          <Plus size={48} weight="bold" className="mb-2" />
          <span className="text-sm font-medium">Add Content</span>
        </div>
      )}
    </Card>
  )
}

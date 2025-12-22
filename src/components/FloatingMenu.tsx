import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { PlayCircle, PauseCircle, ShareNetwork, Coffee, CaretLeft, CaretRight } from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'

interface FloatingMenuProps {
  isPlaying: boolean
  onPlayPause: () => void
  onShareClick: () => void
}

export function FloatingMenu({ isPlaying, onPlayPause, onShareClick }: FloatingMenuProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  return (
    <div className="fixed bottom-8 right-8 z-50 flex items-end gap-3">
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-3 bg-card border-2 border-border rounded-2xl p-3 shadow-2xl"
          >
            <Button
              size="lg"
              className="h-12 w-12 rounded-xl shadow-lg text-base font-bold p-0"
              onClick={onPlayPause}
            >
              {isPlaying ? (
                <PauseCircle size={28} weight="fill" />
              ) : (
                <PlayCircle size={28} weight="fill" />
              )}
            </Button>
            
            <Button
              size="lg"
              variant="outline"
              className="h-12 w-12 rounded-xl p-0 bg-[#FFDD00] hover:bg-[#FFDD00]/90 border-2 border-[#000000]"
              onClick={() => window.open('https://buymeacoffee.com/teriansilva', '_blank')}
            >
              <Coffee size={24} weight="fill" className="text-[#000000]" />
            </Button>
            
            <Button
              size="lg"
              variant="secondary"
              className="h-12 w-12 rounded-xl p-0"
              onClick={onShareClick}
            >
              <ShareNetwork size={24} weight="fill" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        size="lg"
        variant="outline"
        className="h-12 w-12 rounded-xl p-0 bg-card border-2 shadow-lg"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? (
          <CaretRight size={24} weight="bold" />
        ) : (
          <CaretLeft size={24} weight="bold" />
        )}
      </Button>
    </div>
  )
}

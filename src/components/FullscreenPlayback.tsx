/**
 * Fullscreen Playback Component
 * 
 * Displays the game in fullscreen mode during active playback.
 * Handles countdown, active game grid, and completion celebration.
 */

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PauseCircle } from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import { GridCard } from '@/components/GridCard'
import { calculateTransitionDuration } from '@/lib/constants'
import type { GridItem } from '@/lib/types'

// ============================================================================
// Confetti Colors
// ============================================================================

const CONFETTI_COLORS = [
  '#E8744F', // primary coral
  '#5BA3D0', // secondary blue
  '#F5D547', // yellow
  '#4ADE80', // green
  '#F472B6', // pink
  '#A78BFA', // purple
]

// ============================================================================
// Sub-components
// ============================================================================

interface CountdownDisplayProps {
  countdown: number
  totalRounds: number
}

function CountdownDisplay({ countdown, totalRounds }: CountdownDisplayProps) {
  return (
    <div className="text-center space-y-8">
      <h2 className="text-4xl font-bold text-foreground">
        Round 1 of {totalRounds}
      </h2>
      <div 
        className="text-[200px] font-bold text-primary animate-[countdown-pulse_1s_ease-out]"
        key={countdown}
        style={{ 
          textShadow: '0 8px 32px rgba(232, 116, 79, 0.4)'
        }}
      >
        {countdown}
      </div>
    </div>
  )
}

interface CompletionCelebrationProps {
  totalRounds: number
  onExit: () => void
}

function CompletionCelebration({ totalRounds, onExit }: CompletionCelebrationProps) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 md:p-8 overflow-hidden relative">
      {/* Confetti particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-3 h-3 rounded-sm"
            style={{
              left: `${Math.random() * 100}%`,
              top: -20,
              backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
              rotate: Math.random() * 360,
            }}
            initial={{ y: -20, opacity: 1, rotate: 0 }}
            animate={{
              y: window.innerHeight + 100,
              opacity: [1, 1, 0],
              rotate: Math.random() * 720 - 360,
              x: Math.random() * 200 - 100,
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              delay: Math.random() * 0.5,
              ease: 'easeOut',
            }}
          />
        ))}
      </div>
      
      <motion.div 
        className="text-center space-y-8 z-10"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 15,
          delay: 0.1,
        }}
      >
        <motion.div 
          className="space-y-4"
          initial={{ y: 50 }}
          animate={{ y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.2 }}
        >
          <motion.h2 
            className="text-6xl md:text-8xl font-bold text-primary"
            style={{ textShadow: '0 4px 24px rgba(232, 116, 79, 0.3)' }}
            animate={{ 
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              repeatDelay: 1.5,
            }}
          >
            🎉 Complete!
          </motion.h2>
          <motion.p 
            className="text-2xl md:text-3xl font-semibold text-secondary"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            You finished {totalRounds} round{totalRounds > 1 ? 's' : ''}!
          </motion.p>
        </motion.div>
        
        <motion.div 
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >                  
          <Button
            size="lg"
            variant="default"
            className="h-14 px-10 text-xl font-bold"
            onClick={onExit}
          >
            Exit
          </Button>
        </motion.div>
      </motion.div>
    </div>
  )
}

interface ActiveGameGridProps {
  currentRound: number
  totalRounds: number
  displayBpm: number
  gridItems: GridItem[]
  activeIndex: number | null
  revealedIndices: Set<number>
  onStop: () => void
}

function ActiveGameGrid({
  currentRound,
  totalRounds,
  displayBpm,
  gridItems,
  activeIndex,
  revealedIndices,
  onStop,
}: ActiveGameGridProps) {
  const transitionDuration = calculateTransitionDuration(displayBpm)
  
  return (
    <div className="w-full h-full flex flex-col items-center p-4 md:p-8 overflow-y-auto">
      {/* Round indicator */}
      <div className="mb-4 md:mb-6 flex flex-col items-center gap-2 flex-shrink-0">
        <Badge variant="secondary" className="text-lg md:text-2xl font-bold px-4 md:px-6 py-1.5 md:py-2">
          Round {currentRound} of {totalRounds}
        </Badge>
        <span className="text-xs md:text-sm text-muted-foreground">
          {displayBpm} BPM
        </span>
      </div>
      
      {/* Game grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 lg:gap-8 max-w-6xl w-full flex-shrink-0">
        {gridItems.map((item, index) => (
          <GridCard
            key={index}
            content={item.content}
            contentType={item.type}
            isActive={activeIndex === index}
            hasBeenRevealed={revealedIndices.has(index)}
            word={item.word}
            transitionDuration={transitionDuration}
          />
        ))}
      </div>
      
      {/* Stop button */}
      <Button
        size="lg"
        variant="destructive"
        className="mt-4 md:mt-8 h-12 md:h-14 px-6 md:px-8 text-base md:text-lg font-bold flex-shrink-0"
        onClick={onStop}
      >
        <PauseCircle size={24} weight="fill" className="mr-2 md:hidden" />
        <PauseCircle size={28} weight="fill" className="mr-2 hidden md:block" />
        Stop
      </Button>
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

interface FullscreenPlaybackProps {
  isVisible: boolean
  countdown: number | null
  isFinished: boolean
  currentRound: number
  totalRounds: number
  displayBpm: number
  gridItems: GridItem[]
  activeIndex: number | null
  revealedIndices: Set<number>
  onStop: () => void
}

export function FullscreenPlayback({
  isVisible,
  countdown,
  isFinished,
  currentRound,
  totalRounds,
  displayBpm,
  gridItems,
  activeIndex,
  revealedIndices,
  onStop,
}: FullscreenPlaybackProps) {
  if (!isVisible) return null
  
  return (
    <div className="fixed inset-0 bg-background z-[100] flex items-center justify-center">
      {countdown !== null ? (
        <CountdownDisplay countdown={countdown} totalRounds={totalRounds} />
      ) : isFinished ? (
        <CompletionCelebration totalRounds={totalRounds} onExit={onStop} />
      ) : (
        <ActiveGameGrid
          currentRound={currentRound}
          totalRounds={totalRounds}
          displayBpm={displayBpm}
          gridItems={gridItems}
          activeIndex={activeIndex}
          revealedIndices={revealedIndices}
          onStop={onStop}
        />
      )}
    </div>
  )
}

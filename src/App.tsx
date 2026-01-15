/**
 * Say the Word on Beat - Main Application
 * 
 * A playful React app recreating the viral "Say the Word on Beat" challenge.
 * Users create picture grids, sync them to music beats, and share their games.
 * 
 * Architecture:
 * - State: useLocalStorage for persistence, useState for transient playback state
 * - Playback: useGamePlayback hook manages beat timing and audio sync
 * - Sharing: useShareConfig hook handles URL loading and share link generation
 * - UI: Separated into GameSettings, FullscreenPlayback, and FloatingMenu components
 */

import { useState, useRef, useEffect, useMemo } from 'react'
import { useLocalStorage, resetAllSettings } from '@/hooks/useLocalStorage'
import { useDebouncedSlider } from '@/hooks/useDebouncedCallback'
import { useGamePlayback } from '@/hooks/useGamePlayback'
import { useShareConfig } from '@/hooks/useShareConfig'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'
import { GameSettings } from '@/components/GameSettings'
import { FullscreenPlayback } from '@/components/FullscreenPlayback'
import { FloatingMenu } from '@/components/FloatingMenu'
import { PublicGamesPanel } from '@/components/PublicGamesPanel'
import { ShareModal } from '@/components/ShareModal'
import { generateGridFromPool } from '@/lib/gridGenerator'
import { DEFAULT_CONTENT_POOL, DEFAULT_BPM } from '@/lib/constants'
import type { GridItem, Difficulty } from '@/lib/types'
import type { BpmAnalysisResult } from '@/lib/bpmAnalyzer'
import type { ContentPoolItem } from '@/components/ContentPoolManager'

// Audio assets
import defaultAudio from '@/assets/audio/audio.mp3'
import completeSound from '@/assets/audio/cheer.mp3'

// ============================================================================
// Main App Component
// ============================================================================

function App() {
  // ==========================================================================
  // Persistent State (survives page reload)
  // ==========================================================================
  
  const [contentPool, setContentPool] = useLocalStorage<ContentPoolItem[]>(
    'content-pool-v1', 
    DEFAULT_CONTENT_POOL
  )
  const [difficulty, setDifficulty] = useLocalStorage<Difficulty>('difficulty', 'medium')
  const [gridItems, setGridItems] = useLocalStorage<GridItem[]>('grid-items', [])
  const [bpm, setBpm] = useLocalStorage<number>('bpm-value', DEFAULT_BPM)
  const [baseBpm, setBaseBpm] = useLocalStorage<number>('base-bpm', DEFAULT_BPM)
  const [customAudio, setCustomAudio] = useLocalStorage<string | null>('custom-audio', null)
  const [bpmAnalysis, setBpmAnalysis] = useLocalStorage<BpmAnalysisResult | null>('bpm-analysis', null)
  const [audioStartTime, setAudioStartTime] = useLocalStorage<number>('audio-start-time', 0)
  const [rounds, setRounds] = useLocalStorage<number>('rounds', 3)
  const [increaseSpeed, setIncreaseSpeed] = useLocalStorage<boolean>('increase-speed', false)
  const [speedIncreasePercent, setSpeedIncreasePercent] = useLocalStorage<number>('speed-increase-percent', 5)
  const [countdownDuration, setCountdownDuration] = useLocalStorage<number>('countdown-duration', 2)
  const [showImagesImmediately, setShowImagesImmediately] = useLocalStorage<boolean>('show-images-immediately', false)

  // ==========================================================================
  // Transient State (resets on page reload)
  // ==========================================================================
  
  const [isPlaying, setIsPlaying] = useState(false)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [revealedIndices, setRevealedIndices] = useState<Set<number>>(new Set())
  const [currentRound, setCurrentRound] = useState(0)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [displayBpm, setDisplayBpm] = useState<number>(DEFAULT_BPM)
  const [isFinished, setIsFinished] = useState(false)

  // ==========================================================================
  // Audio Refs
  // ==========================================================================
  
  const customAudioRef = useRef<HTMLAudioElement | null>(null)
  const defaultAudioRef = useRef<HTMLAudioElement | null>(null)
  const completeSoundRef = useRef<HTMLAudioElement | null>(null)

  // ==========================================================================
  // Derived Values with Null-Safe Defaults
  // ==========================================================================
  
  const currentBpm = bpm ?? DEFAULT_BPM
  const currentBaseBpm = baseBpm ?? DEFAULT_BPM
  const currentDifficulty = difficulty ?? 'medium'
  const currentContentPool = contentPool ?? []
  const currentRounds = rounds ?? 3
  const currentIncreaseSpeed = increaseSpeed ?? false
  const currentSpeedIncreasePercent = speedIncreasePercent ?? 5
  const currentCountdownDuration = countdownDuration ?? 2
  const currentBpmAnalysis = bpmAnalysis ?? null
  const currentAudioStartTime = audioStartTime ?? 0
  const currentShowImagesImmediately = showImagesImmediately ?? false

  // ==========================================================================
  // Debounced Slider Values (smooth UI with delayed persistence)
  // ==========================================================================
  
  const [localRounds, setLocalRounds] = useDebouncedSlider(currentRounds, setRounds, 500)
  const [localSpeedPercent, setLocalSpeedPercent] = useDebouncedSlider(currentSpeedIncreasePercent, setSpeedIncreasePercent, 500)
  const [localBpm, setLocalBpm] = useDebouncedSlider(currentBpm, setBpm, 500)
  const [localBaseBpm, setLocalBaseBpm] = useDebouncedSlider(currentBaseBpm, setBaseBpm, 500)
  const [localStartTime, setLocalStartTime] = useDebouncedSlider(currentAudioStartTime, setAudioStartTime, 500)
  const [localCountdown, setLocalCountdown] = useDebouncedSlider(currentCountdownDuration, setCountdownDuration, 500)

  // ==========================================================================
  // Grid Management
  // ==========================================================================
  
  // Fallback grid when no items are persisted
  const fallbackGridItems = useMemo(() => {
    return generateGridFromPool(currentContentPool, currentDifficulty)
  }, [currentContentPool, currentDifficulty])
  
  const displayedGridItems = (gridItems && gridItems.length > 0) ? gridItems : fallbackGridItems

  // ==========================================================================
  // Customization Detection (for share button validation)
  // ==========================================================================
  
  const hasCustomizations = useMemo(() => {
    const defaultContentStrings = DEFAULT_CONTENT_POOL.map(item => item.content).sort()
    const currentContentStrings = currentContentPool.map(item => item.content).sort()
    const contentPoolChanged = 
      currentContentPool.length !== DEFAULT_CONTENT_POOL.length ||
      currentContentStrings.some((content, i) => content !== defaultContentStrings[i]) ||
      currentContentPool.some(item => item.type === 'image')

    const hasCustomAudio = customAudio !== null
    const difficultyChanged = currentDifficulty !== 'medium'
    const bpmChanged = currentBpm !== DEFAULT_BPM
    const roundsChanged = currentRounds !== 3
    const speedSettingsChanged = currentIncreaseSpeed !== false

    return contentPoolChanged || hasCustomAudio || difficultyChanged || bpmChanged || roundsChanged || speedSettingsChanged
  }, [currentContentPool, customAudio, currentDifficulty, currentBpm, currentRounds, currentIncreaseSpeed])

  // ==========================================================================
  // Game Playback Hook
  // ==========================================================================
  
  const { startBeat, stopBeat, cleanup } = useGamePlayback({
    currentBpm,
    currentBaseBpm,
    currentRounds,
    currentDifficulty,
    currentContentPool,
    currentIncreaseSpeed,
    currentSpeedIncreasePercent,
    currentCountdownDuration,
    currentAudioStartTime,
    currentBpmAnalysis,
    customAudio: customAudio ?? null,
    displayedGridItems,
    setIsPlaying,
    setIsFullscreen,
    setIsFinished,
    setActiveIndex,
    setRevealedIndices,
    setCurrentRound,
    setCountdown,
    setDisplayBpm,
    setGridItems,
    customAudioRef,
    defaultAudioRef,
    completeSoundRef,
  })

  // ==========================================================================
  // Share Config Hook
  // ==========================================================================
  
  const { generateShareLink, loadFromUrl, loadPublicGame } = useShareConfig({
    currentBpm,
    currentBaseBpm,
    currentDifficulty,
    currentContentPool,
    customAudio: customAudio ?? null,
    currentBpmAnalysis,
    currentAudioStartTime,
    currentRounds,
    currentIncreaseSpeed,
    currentSpeedIncreasePercent,
    setBpm,
    setBaseBpm,
    setDifficulty,
    setContentPool,
    setCustomAudio,
    setBpmAnalysis,
    setAudioStartTime,
    setRounds,
    setIncreaseSpeed,
    setSpeedIncreasePercent,
    setCountdownDuration,
  })

  // ==========================================================================
  // Event Handlers
  // ==========================================================================
  
  const handlePlayPause = () => {
    if (isPlaying) {
      stopBeat()
    } else {
      startBeat()
    }
  }

  const handleAudioUpload = (url: string, analysis: BpmAnalysisResult | null) => {
    setCustomAudio(url)
    setBpmAnalysis(analysis)
    setAudioStartTime(0)
    if (analysis) {
      setBaseBpm(analysis.averageBpm)
      setBpm(analysis.averageBpm)
    }
  }

  const handleAudioRemove = () => {
    setCustomAudio(null)
    setBpmAnalysis(null)
    setBaseBpm(DEFAULT_BPM)
    setBpm(DEFAULT_BPM)
    setAudioStartTime(0)
  }

  const handleShareClick = () => {
    if (!hasCustomizations) {
      toast.error('Customize your game first before sharing!')
      return
    }
    setShareModalOpen(true)
  }

  const handleResetClick = async () => {
    await resetAllSettings()
    toast.success('Game reset! Reloading...')
    setTimeout(() => window.location.reload(), 500)
  }

  // ==========================================================================
  // Effects
  // ==========================================================================
  
  // Load config from URL on mount
  useEffect(() => {
    loadFromUrl()
  }, [loadFromUrl])

  // Cleanup intervals on unmount
  useEffect(() => {
    return cleanup
  }, [cleanup])

  // Restart playback when BPM changes during play
  useEffect(() => {
    if (isPlaying) {
      stopBeat()
      startBeat()
    }
  }, [currentBpm])

  // Regenerate grid when difficulty or content changes
  useEffect(() => {
    const newGrid = generateGridFromPool(currentContentPool, currentDifficulty)
    setGridItems(newGrid)
  }, [currentDifficulty, currentContentPool, setGridItems])

  // ==========================================================================
  // Render
  // ==========================================================================
  
  return (
    <div className="min-h-screen p-4 md:p-8">
      <Toaster position="bottom-left" offset="24px" />
      
      {/* Fullscreen Playback Overlay */}
      <FullscreenPlayback
        isVisible={isFullscreen}
        countdown={countdown}
        isFinished={isFinished}
        currentRound={currentRound}
        totalRounds={currentRounds}
        displayBpm={displayBpm}
        gridItems={displayedGridItems}
        activeIndex={activeIndex}
        revealedIndices={revealedIndices}
        showImagesImmediately={currentShowImagesImmediately}
        onStop={stopBeat}
      />
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <header className="text-center space-y-2 py-4">
          <h1 
            className="text-5xl md:text-7xl font-bold text-primary tracking-tight" 
            style={{ 
              textShadow: '0 2px 0 rgba(232, 116, 79, 0.2), 0 4px 12px rgba(232, 116, 79, 0.15)'
            }}
          >
            SAY THE WORD
          </h1>
          <p 
            className="text-3xl md:text-5xl font-semibold text-secondary" 
            style={{
              textShadow: '0 2px 8px rgba(91, 163, 208, 0.15)'
            }}
          >
            ON THE BEAT
          </p>
        </header>

        {/* Two-column Layout: Settings + Community Games */}
        <div className="flex flex-col xl:flex-row gap-6">
          {/* Settings Panel */}
          <GameSettings
            contentPool={currentContentPool}
            onContentPoolChange={setContentPool}
            rounds={localRounds}
            onRoundsChange={setLocalRounds}
            difficulty={currentDifficulty}
            onDifficultyChange={setDifficulty}
            increaseSpeed={currentIncreaseSpeed}
            onIncreaseSpeedChange={setIncreaseSpeed}
            speedIncreasePercent={localSpeedPercent}
            onSpeedIncreasePercentChange={setLocalSpeedPercent}
            showImagesImmediately={currentShowImagesImmediately}
            onShowImagesImmediatelyChange={setShowImagesImmediately}
            audioUrl={customAudio ?? null}
            onAudioUpload={handleAudioUpload}
            onAudioRemove={handleAudioRemove}
            bpm={localBpm}
            onBpmChange={setLocalBpm}
            baseBpm={localBaseBpm}
            onBaseBpmChange={setLocalBaseBpm}
            startTime={localStartTime}
            onStartTimeChange={setLocalStartTime}
            countdownDuration={localCountdown}
            onCountdownDurationChange={setLocalCountdown}
            isPlaying={isPlaying}
          />
          
          {/* Desktop: Community Games Sidebar */}
          <div className="hidden xl:block w-[360px] shrink-0 h-[calc(100vh-280px)] sticky top-8">
            <PublicGamesPanel onLoadGame={loadPublicGame} />
          </div>
        </div>
        
        {/* Mobile: Community Games (below settings) */}
        <div className="xl:hidden">
          <PublicGamesPanel onLoadGame={loadPublicGame} />
        </div>

        {/* Footer */}
        <footer className="text-center text-sm text-muted-foreground space-y-2">
          <p>
            Made with ❤️ by{' '}
            <a 
              href="https://superstatus.io" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
            >
              TerianSilva
            </a>
            {' '}|{' '}
            <a 
              href="https://github.com/teriansilva/say-the-word-on-the-beat" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
            >
              🐙 GitHub
            </a>
          </p>
        </footer>
      </div>

      {/* Audio Elements */}
      <audio ref={defaultAudioRef} src={defaultAudio} preload="auto" loop />
      <audio ref={completeSoundRef} src={completeSound} preload="auto" />
      {customAudio && (
        <audio ref={customAudioRef} src={customAudio} preload="auto" loop />
      )}

      {/* Share Modal */}
      <ShareModal
        open={shareModalOpen}
        onOpenChange={setShareModalOpen}
        onGenerateShare={generateShareLink}
      />

      {/* Floating Action Menu */}
      {!isFullscreen && (
        <FloatingMenu
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
          onShareClick={handleShareClick}
          onResetClick={handleResetClick}
        />
      )}
    </div>
  )
}

export default App

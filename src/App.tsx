import { useState, useRef, useEffect, useMemo } from 'react'
import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Toaster } from '@/components/ui/sonner'
import { PlayCircle, PauseCircle, ShareNetwork } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { GridCard } from '@/components/GridCard'
import { AudioUploader } from '@/components/AudioUploader'
import { ImagePoolManager } from '@/components/ImagePoolManager'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { ShareModal } from '@/components/ShareModal'

interface GridItem {
  content: string
  type: 'emoji' | 'image'
}

type Difficulty = 'easy' | 'medium' | 'hard'

const DEFAULT_ITEMS: GridItem[] = [
  { content: '🐱', type: 'emoji' },
  { content: '🧢', type: 'emoji' },
  { content: '🦇', type: 'emoji' },
  { content: '🍉', type: 'emoji' },
  { content: '🔔', type: 'emoji' },
  { content: '🧱', type: 'emoji' },
  { content: '🕐', type: 'emoji' },
  { content: '🪨', type: 'emoji' },
]

function generateGridFromPool(images: string[], difficulty: Difficulty): GridItem[] {
  if (images.length === 0) {
    return DEFAULT_ITEMS
  }

  const gridSize = 8
  const result: GridItem[] = []

  switch (difficulty) {
    case 'easy': {
      for (let i = 0; i < gridSize; i += 2) {
        const randomImage = images[Math.floor(Math.random() * images.length)]
        result.push({ content: randomImage, type: 'image' })
        result.push({ content: randomImage, type: 'image' })
      }
      break
    }

    case 'medium': {
      let lastUsed: string | null = null
      for (let i = 0; i < gridSize; i++) {
        const availableImages = lastUsed 
          ? images.filter(img => img !== lastUsed)
          : images
        
        const pool = availableImages.length > 0 ? availableImages : images
        const randomImage = pool[Math.floor(Math.random() * pool.length)]
        
        result.push({ content: randomImage, type: 'image' })
        
        if (Math.random() > 0.3) {
          lastUsed = randomImage
        } else {
          lastUsed = null
        }
      }
      break
    }

    case 'hard': {
      let lastUsed: string | null = null
      for (let i = 0; i < gridSize; i++) {
        const availableImages = lastUsed 
          ? images.filter(img => img !== lastUsed)
          : images
        
        const pool = availableImages.length > 0 ? availableImages : images
        const randomImage = pool[Math.floor(Math.random() * pool.length)]
        
        result.push({ content: randomImage, type: 'image' })
        lastUsed = randomImage
      }
      break
    }
  }

  return result
}

function App() {
  const [imagePool, setImagePool] = useKV<string[]>('image-pool', [])
  const [difficulty, setDifficulty] = useKV<Difficulty>('difficulty', 'medium')
  const [gridItems, setGridItems] = useKV<GridItem[]>('grid-items', DEFAULT_ITEMS)
  const [bpm, setBpm] = useKV<number>('bpm-value', 120)
  const [customAudio, setCustomAudio] = useKV<string | null>('custom-audio', null)
  const [rounds, setRounds] = useKV<number>('rounds', 1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [revealedIndices, setRevealedIndices] = useState<Set<number>>(new Set())
  const [currentRound, setCurrentRound] = useState(0)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  
  const intervalRef = useRef<number | null>(null)
  const customAudioRef = useRef<HTMLAudioElement | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const hasLoadedFromUrl = useRef(false)

  const currentBpm = bpm ?? 120
  const currentDifficulty = difficulty ?? 'medium'
  const currentImagePool = imagePool ?? []
  const currentRounds = rounds ?? 1
  const currentGridItems = useMemo(() => {
    if (currentImagePool.length > 0) {
      return generateGridFromPool(currentImagePool, currentDifficulty)
    }
    return gridItems ?? DEFAULT_ITEMS
  }, [currentImagePool, currentDifficulty, gridItems])
  const beatInterval = (60 / currentBpm) * 1000

  const playMetronomeClick = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext()
    }
    
    const ctx = audioContextRef.current
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)
    
    oscillator.frequency.value = 1000
    oscillator.type = 'sine'
    
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1)
    
    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.1)
  }

  const generateGuid = (): string => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }

  const generateShareLink = async (): Promise<string> => {
    try {
      const config = {
        bpm: currentBpm,
        difficulty: currentDifficulty,
        images: currentImagePool,
        audio: customAudio,
        rounds: currentRounds
      }
      
      const guid = generateGuid()
      await window.spark.kv.set(`share:${guid}`, config)
      
      const url = new URL(window.location.href)
      url.searchParams.delete('config')
      url.searchParams.set('share', guid)
      
      return url.toString()
    } catch (error) {
      throw new Error('Failed to generate share link')
    }
  }

  const loadFromUrl = async () => {
    if (hasLoadedFromUrl.current) return
    
    try {
      const urlParams = new URLSearchParams(window.location.search)
      const shareId = urlParams.get('share')
      const configParam = urlParams.get('config')
      
      if (shareId) {
        const config = await window.spark.kv.get<{
          bpm: number
          difficulty: Difficulty
          images: string[]
          audio: string | null
          rounds: number
        }>(`share:${shareId}`)
        
        if (config) {
          if (config.bpm) setBpm(config.bpm)
          if (config.difficulty) setDifficulty(config.difficulty)
          if (config.images && Array.isArray(config.images)) setImagePool(config.images)
          if (config.audio) setCustomAudio(config.audio)
          if (config.rounds) setRounds(config.rounds)
          
          toast.success('Loaded shared game configuration!')
          hasLoadedFromUrl.current = true
        } else {
          toast.error('Share link not found')
        }
      } else if (configParam) {
        const decoded = JSON.parse(atob(configParam))
        
        if (decoded.bpm) setBpm(decoded.bpm)
        if (decoded.difficulty) setDifficulty(decoded.difficulty)
        if (decoded.images && Array.isArray(decoded.images)) setImagePool(decoded.images)
        if (decoded.audio) setCustomAudio(decoded.audio)
        if (decoded.rounds) setRounds(decoded.rounds)
        
        toast.success('Loaded shared game configuration!')
        hasLoadedFromUrl.current = true
      }
    } catch (error) {
      console.error('Failed to load from URL:', error)
    }
  }



  const startBeat = () => {
    if (isPlaying) return
    
    setIsFullscreen(true)
    setCurrentRound(1)
    setCountdown(3)
    
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(countdownInterval)
          setTimeout(() => {
            setCountdown(null)
            beginPlayback()
          }, 1000)
          return null
        }
        return prev - 1
      })
    }, 1000)
  }

  const beginPlayback = () => {
    setIsPlaying(true)
    setRevealedIndices(new Set())
    let index = -1
    let roundCount = 1
    
    if (customAudio && customAudioRef.current) {
      customAudioRef.current.currentTime = 0
      customAudioRef.current.play().catch(() => {
        toast.error('Failed to play audio')
      })
    }
    
    const playSequence = () => {
      index = (index + 1) % currentGridItems.length
      
      if (index === 0 && roundCount > 1) {
        if (roundCount > currentRounds) {
          stopBeat()
          toast.success(`Completed ${currentRounds} round${currentRounds > 1 ? 's' : ''}!`)
          return
        }
        
        if (currentImagePool.length > 0) {
          const newGrid = generateGridFromPool(currentImagePool, currentDifficulty)
          setGridItems(newGrid)
        }
        
        setRevealedIndices(new Set())
        setCurrentRound(roundCount)
      }
      
      if (index === currentGridItems.length - 1) {
        roundCount++
      }
      
      if (!customAudio) {
        playMetronomeClick()
      }
      
      setActiveIndex(index)
      setRevealedIndices(prev => new Set([...prev, index]))
    }
    
    playSequence()
    intervalRef.current = window.setInterval(playSequence, beatInterval)
  }

  const stopBeat = () => {
    setIsPlaying(false)
    setActiveIndex(null)
    setRevealedIndices(new Set())
    setCurrentRound(0)
    setIsFullscreen(false)
    setCountdown(null)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (customAudio && customAudioRef.current) {
      customAudioRef.current.pause()
      customAudioRef.current.currentTime = 0
    }
  }

  const handlePlayPause = () => {
    if (isPlaying) {
      stopBeat()
    } else {
      startBeat()
    }
  }

  const handleRegenerateGrid = () => {
    if (currentImagePool.length === 0) {
      toast.error('Add images to the pool first')
      return
    }
    
    const newGrid = generateGridFromPool(currentImagePool, currentDifficulty)
    setGridItems(newGrid)
    toast.success('Grid regenerated!')
  }

  useEffect(() => {
    loadFromUrl()
  }, [])

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (isPlaying) {
      stopBeat()
      startBeat()
    }
  }, [currentBpm])

  useEffect(() => {
    if (currentImagePool.length > 0) {
      const newGrid = generateGridFromPool(currentImagePool, currentDifficulty)
      setGridItems(newGrid)
    }
  }, [currentDifficulty])

  return (
    <div className="min-h-screen p-4 md:p-8">
      <Toaster />
      
      {isFullscreen && (
        <div className="fixed inset-0 bg-background z-[100] flex items-center justify-center">
          {countdown !== null ? (
            <div className="text-center space-y-8">
              <h2 className="text-4xl font-bold text-foreground">
                Round 1 of {currentRounds}
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
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-8">
              <div className="mb-8">
                <Badge variant="secondary" className="text-2xl font-bold px-6 py-2">
                  Round {currentRound} of {currentRounds}
                </Badge>
              </div>
              
              <div 
                className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-4xl"
              >
                {currentGridItems.map((item, index) => (
                  <GridCard
                    key={index}
                    content={item.content}
                    contentType={item.type}
                    isActive={activeIndex === index}
                    hasBeenRevealed={revealedIndices.has(index)}
                  />
                ))}
              </div>
              
              <Button
                size="lg"
                variant="destructive"
                className="mt-8 h-14 px-8 text-lg font-bold"
                onClick={stopBeat}
              >
                <PauseCircle size={28} weight="fill" className="mr-2" />
                Stop
              </Button>
            </div>
          )}
        </div>
      )}
      
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="text-center space-y-2 py-4">
          <h1 className="text-5xl md:text-7xl font-bold text-primary tracking-tight" style={{ 
            textShadow: '0 2px 0 rgba(232, 116, 79, 0.2), 0 4px 12px rgba(232, 116, 79, 0.15)'
          }}>
            SAY THE WORD
          </h1>
          <p className="text-3xl md:text-5xl font-semibold text-secondary" style={{
            textShadow: '0 2px 8px rgba(91, 163, 208, 0.15)'
          }}>
            ON THE BEAT
          </p>
        </header>

        <div 
          ref={gridRef}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto"
        >
          {currentGridItems.map((item, index) => (
            <GridCard
              key={index}
              content={item.content}
              contentType={item.type}
              isActive={false}
              hasBeenRevealed={false}
            />
          ))}
        </div>

        <div className="max-w-2xl mx-auto space-y-6 bg-card p-6 rounded-2xl border-2 border-border shadow-sm">
          <ImagePoolManager
            images={currentImagePool}
            onImagesChange={(images) => setImagePool(images)}
          />
          
          {currentImagePool.length > 0 && (
            <Card className="p-4 border-2">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-foreground">
                    Difficulty
                  </label>
                  <Badge variant="outline" className="text-xs">
                    {currentDifficulty === 'easy' && 'Same images repeat'}
                    {currentDifficulty === 'medium' && 'Slight variance'}
                    {currentDifficulty === 'hard' && 'All different'}
                  </Badge>
                </div>
                
                <ToggleGroup
                  type="single"
                  value={currentDifficulty}
                  onValueChange={(value) => {
                    if (value) setDifficulty(value as Difficulty)
                  }}
                  className="justify-start"
                >
                  <ToggleGroupItem value="easy" className="text-sm">
                    Easy
                  </ToggleGroupItem>
                  <ToggleGroupItem value="medium" className="text-sm">
                    Medium
                  </ToggleGroupItem>
                  <ToggleGroupItem value="hard" className="text-sm">
                    Hard
                  </ToggleGroupItem>
                </ToggleGroup>
                
                <p className="text-xs text-muted-foreground">
                  {currentDifficulty === 'easy' && 'Same images appear consecutively (pairs)'}
                  {currentDifficulty === 'medium' && 'Images mostly change with occasional repeats'}
                  {currentDifficulty === 'hard' && 'Every image is different from the previous one'}
                </p>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRegenerateGrid}
                  className="w-full"
                  disabled={isPlaying}
                >
                  Regenerate Grid
                </Button>
              </div>
            </Card>
          )}
          
          <AudioUploader
            audioUrl={customAudio ?? null}
            onAudioUpload={(url) => setCustomAudio(url)}
            onAudioRemove={() => setCustomAudio(null)}
          />
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-lg font-semibold text-foreground">
                Rounds
              </label>
              <Badge variant="secondary" className="text-base font-bold">
                {currentRounds}
              </Badge>
            </div>
            <Slider
              value={[currentRounds]}
              onValueChange={([value]) => setRounds(value)}
              min={1}
              max={10}
              step={1}
              className="w-full"
              disabled={isPlaying}
            />
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-lg font-semibold text-foreground">
                Tempo
              </label>
              <Badge variant="secondary" className="text-base font-bold">
                {currentBpm} BPM
              </Badge>
            </div>
            <Slider
              value={[currentBpm]}
              onValueChange={([value]) => setBpm(value)}
              min={60}
              max={180}
              step={1}
              className="w-full"
              disabled={isPlaying}
            />
          </div>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          <p>
            Upload images to the pool • Choose difficulty • Cards auto-generate based on your settings
          </p>
        </div>
      </div>

      {customAudio && (
        <audio ref={customAudioRef} src={customAudio} preload="auto" loop />
      )}

      <ShareModal
        open={shareModalOpen}
        onOpenChange={setShareModalOpen}
        onGenerateShare={generateShareLink}
      />

      {!isFullscreen && (
        <div className="fixed bottom-8 right-8 flex flex-col gap-3 z-50">
          <Button
            size="lg"
            variant="secondary"
            className="h-14 w-14 rounded-full shadow-2xl p-0"
            onClick={() => setShareModalOpen(true)}
          >
            <ShareNetwork size={28} weight="fill" />
          </Button>
          
          <Button
            size="lg"
            className="h-16 w-16 rounded-full shadow-2xl text-base font-bold p-0"
            onClick={handlePlayPause}
          >
            {isPlaying ? (
              <PauseCircle size={36} weight="fill" />
            ) : (
              <PlayCircle size={36} weight="fill" />
            )}
          </Button>
        </div>
      )}
    </div>
  )
}

export default App

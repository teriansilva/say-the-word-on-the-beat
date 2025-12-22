import { useState, useRef, useEffect, useMemo } from 'react'
import { useLocalStorage, shareApi } from '@/hooks/useLocalStorage'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Toaster } from '@/components/ui/sonner'
import { PauseCircle } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { GridCard } from '@/components/GridCard'
import { AudioUploader } from '@/components/AudioUploader'
import { ImagePoolManager, type ImagePoolItem } from '@/components/ImagePoolManager'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { ShareModal } from '@/components/ShareModal'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { getBpmAtTime, type BpmAnalysisResult } from '@/lib/bpmAnalyzer'
import { FloatingMenu } from '@/components/FloatingMenu'
import defaultAudio from '@/assets/audio/audio.mp3'
import { 
  isValidDataUrl, 
  validateNumber, 
  validateDifficulty, 
  sanitizeUrlParam, 
  isValidGuid 
} from '@/lib/security'

interface GridItem {
  content: string
  type: 'emoji' | 'image'
  word?: string
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

function generateGridFromPool(images: ImagePoolItem[], difficulty: Difficulty): GridItem[] {
  if (images.length === 0) {
    return DEFAULT_ITEMS
  }

  const gridSize = 8
  const result: GridItem[] = []

  switch (difficulty) {
    case 'easy': {
      for (let i = 0; i < gridSize; i += 2) {
        const randomImage = images[Math.floor(Math.random() * images.length)]
        result.push({ content: randomImage.url, type: 'image', word: randomImage.word })
        result.push({ content: randomImage.url, type: 'image', word: randomImage.word })
      }
      break
    }

    case 'medium': {
      let lastUsed: ImagePoolItem | null = null
      for (let i = 0; i < gridSize; i++) {
        const availableImages = lastUsed 
          ? images.filter(img => img.url !== lastUsed!.url)
          : images
        
        const pool = availableImages.length > 0 ? availableImages : images
        const randomImage = pool[Math.floor(Math.random() * pool.length)]
        
        result.push({ content: randomImage.url, type: 'image', word: randomImage.word })
        
        if (Math.random() > 0.3) {
          lastUsed = randomImage
        } else {
          lastUsed = null
        }
      }
      break
    }

    case 'hard': {
      let lastUsed: ImagePoolItem | null = null
      for (let i = 0; i < gridSize; i++) {
        const availableImages = lastUsed 
          ? images.filter(img => img.url !== lastUsed!.url)
          : images
        
        const pool = availableImages.length > 0 ? availableImages : images
        const randomImage = pool[Math.floor(Math.random() * pool.length)]
        
        result.push({ content: randomImage.url, type: 'image', word: randomImage.word })
        lastUsed = randomImage
      }
      break
    }
  }

  return result
}

function App() {
  const [imagePool, setImagePool] = useLocalStorage<ImagePoolItem[]>('image-pool-v2', [])
  const [difficulty, setDifficulty] = useLocalStorage<Difficulty>('difficulty', 'medium')
  const [gridItems, setGridItems] = useLocalStorage<GridItem[]>('grid-items', DEFAULT_ITEMS)
  const [bpm, setBpm] = useLocalStorage<number>('bpm-value', 91)
  const [baseBpm, setBaseBpm] = useLocalStorage<number>('base-bpm', 91)
  const [customAudio, setCustomAudio] = useLocalStorage<string | null>('custom-audio', null)
  const [bpmAnalysis, setBpmAnalysis] = useLocalStorage<BpmAnalysisResult | null>('bpm-analysis', null)
  const [rounds, setRounds] = useLocalStorage<number>('rounds', 1)
  const [increaseSpeed, setIncreaseSpeed] = useLocalStorage<boolean>('increase-speed', false)
  const [speedIncreasePercent, setSpeedIncreasePercent] = useLocalStorage<number>('speed-increase-percent', 5)
  const [isPlaying, setIsPlaying] = useState(false)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [revealedIndices, setRevealedIndices] = useState<Set<number>>(new Set())
  const [currentRound, setCurrentRound] = useState(0)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [displayBpm, setDisplayBpm] = useState<number>(91)
  
  const intervalRef = useRef<number | null>(null)
  const customAudioRef = useRef<HTMLAudioElement | null>(null)
  const defaultAudioRef = useRef<HTMLAudioElement | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const hasLoadedFromUrl = useRef(false)
  const bpmCheckIntervalRef = useRef<number | null>(null)

  const currentBpm = bpm ?? 91
  const currentBaseBpm = baseBpm ?? 91
  const currentDifficulty = difficulty ?? 'medium'
  const currentImagePool = imagePool ?? []
  const currentRounds = rounds ?? 1
  const currentIncreaseSpeed = increaseSpeed ?? false
  const currentSpeedIncreasePercent = speedIncreasePercent ?? 5
  const currentBpmAnalysis = bpmAnalysis ?? null
  const currentGridItems = useMemo(() => {
    if (currentImagePool.length > 0) {
      return generateGridFromPool(currentImagePool, currentDifficulty)
    }
    return gridItems ?? DEFAULT_ITEMS
  }, [currentImagePool, currentDifficulty, gridItems])
  
  const baseBpmValue = customAudio ? currentBaseBpm : 91
  const basePlaybackSpeed = currentBpm / baseBpmValue
  
  const calculateRoundBpm = (roundNumber: number, audioTime?: number) => {
    let effectiveBpm = currentBpm
    
    if (customAudio && currentBpmAnalysis && audioTime !== undefined) {
      const detectedBpm = getBpmAtTime(currentBpmAnalysis.segments, audioTime)
      const speedMultiplier = currentBpm / currentBaseBpm
      effectiveBpm = detectedBpm * speedMultiplier
    }
    
    if (!currentIncreaseSpeed) return effectiveBpm
    
    const speedMultiplier = 1 + ((currentSpeedIncreasePercent / 100) * (roundNumber - 1))
    return effectiveBpm * speedMultiplier
  }
  
  const calculatePlaybackSpeed = (roundNumber: number) => {
    if (!currentIncreaseSpeed) return basePlaybackSpeed
    const speedMultiplier = 1 + ((currentSpeedIncreasePercent / 100) * (roundNumber - 1))
    return basePlaybackSpeed * speedMultiplier
  }
  
  const activeAudioUrl = customAudio || defaultAudio

  const generateShareLink = async (): Promise<string> => {
    try {
      const config = {
        bpm: currentBpm,
        baseBpm: currentBaseBpm,
        difficulty: currentDifficulty,
        images: currentImagePool,
        audio: customAudio,
        bpmAnalysis: currentBpmAnalysis,
        rounds: currentRounds,
        increaseSpeed: currentIncreaseSpeed,
        speedIncreasePercent: currentSpeedIncreasePercent
      }
      
      const guid = await shareApi.create(config)
      
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
      const shareIdRaw = urlParams.get('share')
      const configParamRaw = urlParams.get('config')
      
      // Sanitize URL parameters
      const shareId = sanitizeUrlParam(shareIdRaw)
      const configParam = sanitizeUrlParam(configParamRaw)
      
      if (shareId) {
        // Validate GUID format
        if (!isValidGuid(shareId)) {
          toast.error('Invalid share link format')
          return
        }

        const config = await shareApi.get(shareId) as {
          bpm: number
          baseBpm?: number
          difficulty: Difficulty
          images: ImagePoolItem[] | string[]
          audio: string | null
          bpmAnalysis?: BpmAnalysisResult | null
          rounds: number
          increaseSpeed?: boolean
          speedIncreasePercent?: number
        } | null
        
        if (config) {
          // Validate BPM values
          if (config.bpm) {
            const bpmValidation = validateNumber(config.bpm, 60, 180, 'BPM')
            if (bpmValidation.valid) {
              setBpm(config.bpm)
            }
          }
          
          if (config.baseBpm) {
            const baseBpmValidation = validateNumber(config.baseBpm, 60, 180, 'Base BPM')
            if (baseBpmValidation.valid) {
              setBaseBpm(config.baseBpm)
            }
          }
          
          // Validate difficulty
          if (config.difficulty && validateDifficulty(config.difficulty)) {
            setDifficulty(config.difficulty)
          }
          
          // Validate and sanitize images
          if (config.images && Array.isArray(config.images)) {
            const validImages = config.images
              .map(img => typeof img === 'string' ? { url: img } : img)
              .filter(img => {
                // Validate data URL
                if (!isValidDataUrl(img.url)) {
                  console.warn('Invalid image URL in shared config, skipping')
                  return false
                }
                return true
              })
              .slice(0, 8) // Limit to 8 images
            
            if (validImages.length > 0) {
              setImagePool(validImages)
            }
          }
          
          // Validate audio URL
          if (config.audio && isValidDataUrl(config.audio)) {
            setCustomAudio(config.audio)
          }
          
          if (config.bpmAnalysis) setBpmAnalysis(config.bpmAnalysis)
          
          // Validate rounds
          if (config.rounds) {
            const roundsValidation = validateNumber(config.rounds, 1, 10, 'Rounds')
            if (roundsValidation.valid) {
              setRounds(config.rounds)
            }
          }
          
          if (config.increaseSpeed !== undefined) setIncreaseSpeed(config.increaseSpeed)
          
          // Validate speed increase percent
          if (config.speedIncreasePercent !== undefined) {
            const speedValidation = validateNumber(config.speedIncreasePercent, 0, 100, 'Speed increase')
            if (speedValidation.valid) {
              setSpeedIncreasePercent(config.speedIncreasePercent)
            }
          }
          
          toast.success('Loaded shared game configuration!')
          hasLoadedFromUrl.current = true
        } else {
          toast.error('Share link not found')
        }
      } else if (configParam) {
        try {
          const decoded = JSON.parse(atob(configParam))
          
          // Validate BPM
          if (decoded.bpm) {
            const bpmValidation = validateNumber(decoded.bpm, 60, 180, 'BPM')
            if (bpmValidation.valid) {
              setBpm(decoded.bpm)
            }
          }
          
          if (decoded.baseBpm) {
            const baseBpmValidation = validateNumber(decoded.baseBpm, 60, 180, 'Base BPM')
            if (baseBpmValidation.valid) {
              setBaseBpm(decoded.baseBpm)
            }
          }
          
          // Validate difficulty
          if (decoded.difficulty && validateDifficulty(decoded.difficulty)) {
            setDifficulty(decoded.difficulty)
          }
          
          // Validate images
          if (decoded.images && Array.isArray(decoded.images)) {
            const validImages = decoded.images
              .map((img: ImagePoolItem | string) => typeof img === 'string' ? { url: img } : img)
              .filter((img: ImagePoolItem) => {
                if (!isValidDataUrl(img.url)) {
                  console.warn('Invalid image URL in config, skipping')
                  return false
                }
                return true
              })
              .slice(0, 8)
            
            if (validImages.length > 0) {
              setImagePool(validImages)
            }
          }
          
          // Validate audio
          if (decoded.audio && isValidDataUrl(decoded.audio)) {
            setCustomAudio(decoded.audio)
          }
          
          if (decoded.bpmAnalysis) setBpmAnalysis(decoded.bpmAnalysis)
          
          // Validate rounds
          if (decoded.rounds) {
            const roundsValidation = validateNumber(decoded.rounds, 1, 10, 'Rounds')
            if (roundsValidation.valid) {
              setRounds(decoded.rounds)
            }
          }
          
          if (decoded.increaseSpeed !== undefined) setIncreaseSpeed(decoded.increaseSpeed)
          
          // Validate speed increase
          if (decoded.speedIncreasePercent !== undefined) {
            const speedValidation = validateNumber(decoded.speedIncreasePercent, 0, 100, 'Speed increase')
            if (speedValidation.valid) {
              setSpeedIncreasePercent(decoded.speedIncreasePercent)
            }
          }
          
          toast.success('Loaded game configuration!')
          hasLoadedFromUrl.current = true
        } catch (error) {
          console.error('Failed to parse config:', error)
          if (error instanceof SyntaxError) {
            toast.error('Invalid configuration format - corrupted data')
          } else {
            toast.error('Failed to load configuration')
          }
        }
      }
    } catch (error) {
      console.error('Load error:', error)
      if (error instanceof TypeError) {
        toast.error('Network error loading shared configuration')
      } else {
        toast.error('Failed to load configuration')
      }
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
    
    const audioRef = customAudio ? customAudioRef : defaultAudioRef
    
    if (audioRef.current) {
      if (customAudio && currentBpmAnalysis && currentBpmAnalysis.silenceOffset) {
        audioRef.current.currentTime = currentBpmAnalysis.silenceOffset
      } else {
        audioRef.current.currentTime = 0
      }
      audioRef.current.playbackRate = calculatePlaybackSpeed(roundCount)
      audioRef.current.play().catch((error) => {
        console.error('Audio play error:', error)
        toast.error('Failed to play audio')
      })
    }
    
    const initialBpm = calculateRoundBpm(roundCount, 0)
    setDisplayBpm(Math.round(initialBpm))
    let currentIntervalBpm = initialBpm
    
    const updateBpmFromAudio = () => {
      if (audioRef.current && customAudio && currentBpmAnalysis) {
        const audioTime = audioRef.current.currentTime / audioRef.current.playbackRate
        const newBpm = calculateRoundBpm(roundCount, audioTime)
        
        setDisplayBpm(Math.round(newBpm))
        
        if (Math.abs(newBpm - currentIntervalBpm) > 1) {
          currentIntervalBpm = newBpm
          
          if (intervalRef.current) {
            clearInterval(intervalRef.current)
          }
          
          const newInterval = (60 / currentIntervalBpm) * 1000
          intervalRef.current = window.setInterval(playSequence, newInterval)
        }
      }
    }
    
    if (customAudio && currentBpmAnalysis) {
      bpmCheckIntervalRef.current = window.setInterval(updateBpmFromAudio, 100)
    }
    
    const getIntervalForRound = (round: number, audioTime?: number) => {
      const roundBpm = calculateRoundBpm(round, audioTime)
      return (60 / roundBpm) * 1000
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
        
        if (audioRef.current) {
          audioRef.current.playbackRate = calculatePlaybackSpeed(roundCount)
        }
        
        if (!(customAudio && currentBpmAnalysis)) {
          const newBpm = calculateRoundBpm(roundCount)
          setDisplayBpm(Math.round(newBpm))
          
          if (intervalRef.current) {
            clearInterval(intervalRef.current)
          }
          intervalRef.current = window.setInterval(playSequence, getIntervalForRound(roundCount))
        }
      }
      
      if (index === currentGridItems.length - 1) {
        roundCount++
      }
      
      setActiveIndex(index)
      setRevealedIndices(prev => new Set([...prev, index]))
    }
    
    playSequence()
    
    const initialInterval = getIntervalForRound(roundCount, 0)
    intervalRef.current = window.setInterval(playSequence, initialInterval)
  }

  const stopBeat = () => {
    setIsPlaying(false)
    setActiveIndex(null)
    setRevealedIndices(new Set())
    setCurrentRound(0)
    setIsFullscreen(false)
    setCountdown(null)
    setDisplayBpm(customAudio && currentBpmAnalysis ? currentBaseBpm : 91)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (bpmCheckIntervalRef.current) {
      clearInterval(bpmCheckIntervalRef.current)
      bpmCheckIntervalRef.current = null
    }
    
    if (customAudioRef.current) {
      customAudioRef.current.pause()
      const resetTime = currentBpmAnalysis?.silenceOffset || 0
      customAudioRef.current.currentTime = resetTime
      customAudioRef.current.playbackRate = 1
    }
    if (defaultAudioRef.current) {
      defaultAudioRef.current.pause()
      defaultAudioRef.current.currentTime = 0
      defaultAudioRef.current.playbackRate = 1
    }
  }

  const handlePlayPause = () => {
    if (isPlaying) {
      stopBeat()
    } else {
      startBeat()
    }
  }

  useEffect(() => {
    loadFromUrl()
  }, [])

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (bpmCheckIntervalRef.current) {
        clearInterval(bpmCheckIntervalRef.current)
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
      <Toaster position="bottom-left" offset="24px" />
      
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
            <div className="w-full h-full flex flex-col items-center p-4 md:p-8 overflow-y-auto">
              <div className="mb-4 md:mb-6 flex flex-col items-center gap-2 flex-shrink-0">
                <Badge variant="secondary" className="text-lg md:text-2xl font-bold px-4 md:px-6 py-1.5 md:py-2">
                  Round {currentRound} of {currentRounds}
                </Badge>
                <span className="text-xs md:text-sm text-muted-foreground">
                  {displayBpm} BPM
                </span>
              </div>
              
              <div 
                className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 lg:gap-8 max-w-6xl w-full flex-shrink-0"
              >
                {currentGridItems.map((item, index) => (
                  <GridCard
                    key={index}
                    content={item.content}
                    contentType={item.type}
                    isActive={activeIndex === index}
                    hasBeenRevealed={revealedIndices.has(index)}
                    word={item.word}
                  />
                ))}
              </div>
              
              <Button
                size="lg"
                variant="destructive"
                className="mt-4 md:mt-8 h-12 md:h-14 px-6 md:px-8 text-base md:text-lg font-bold flex-shrink-0"
                onClick={stopBeat}
              >
                <PauseCircle size={24} weight="fill" className="mr-2 md:hidden" />
                <PauseCircle size={28} weight="fill" className="mr-2 hidden md:block" />
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
                  className="w-full"
                >
                  <ToggleGroupItem value="easy" className="text-sm flex-1">
                    Easy
                  </ToggleGroupItem>
                  <ToggleGroupItem value="medium" className="text-sm flex-1">
                    Medium
                  </ToggleGroupItem>
                  <ToggleGroupItem value="hard" className="text-sm flex-1">
                    Hard
                  </ToggleGroupItem>
                </ToggleGroup>
                
                <p className="text-xs text-muted-foreground">
                  {currentDifficulty === 'easy' && 'Same images appear consecutively (pairs)'}
                  {currentDifficulty === 'medium' && 'Images mostly change with occasional repeats'}
                  {currentDifficulty === 'hard' && 'Every image is different from the previous one'}
                </p>
              </div>
            </Card>
          )}
          
          <Card className="p-4 border-2">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="increase-speed" className="text-sm font-semibold text-foreground cursor-pointer">
                    Increase speed with each round
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Audio and cards speed up per round
                  </p>
                </div>
                <Switch
                  id="increase-speed"
                  checked={currentIncreaseSpeed}
                  onCheckedChange={(checked) => setIncreaseSpeed(checked)}
                  disabled={isPlaying}
                />
              </div>
              
              {currentIncreaseSpeed && (
                <div className="space-y-3 pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-foreground">
                      Speed increase per round
                    </label>
                    <Badge variant="secondary" className="text-sm font-bold">
                      {currentSpeedIncreasePercent}%
                    </Badge>
                  </div>
                  <Slider
                    value={[currentSpeedIncreasePercent]}
                    onValueChange={([value]) => setSpeedIncreasePercent(value)}
                    min={1}
                    max={10}
                    step={1}
                    className="w-full"
                    disabled={isPlaying}
                  />
                  <p className="text-xs text-muted-foreground">
                    Each round increases by {currentSpeedIncreasePercent}% (1-10%)
                  </p>
                </div>
              )}
            </div>
          </Card>
          
          <AudioUploader
            audioUrl={customAudio ?? null}
            onAudioUpload={(url, analysis) => {
              setCustomAudio(url)
              setBpmAnalysis(analysis)
              if (analysis) {
                setBaseBpm(analysis.averageBpm)
                setBpm(analysis.averageBpm)
              }
            }}
            onAudioRemove={() => {
              setCustomAudio(null)
              setBpmAnalysis(null)
              setBaseBpm(91)
              setBpm(91)
            }}
            bpm={currentBpm}
            onBpmChange={(value) => setBpm(value)}
            baseBpm={currentBaseBpm}
            onBaseBpmChange={(value) => setBaseBpm(value)}
            isPlaying={isPlaying}
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
        </div>

        <div className="text-center text-sm text-muted-foreground">
          <p>
            Upload images to the pool • Choose difficulty • Cards auto-generate based on your settings
          </p>
        </div>
      </div>

      <audio ref={defaultAudioRef} src={defaultAudio} preload="auto" loop />
      
      {customAudio && (
        <audio ref={customAudioRef} src={customAudio} preload="auto" loop />
      )}

      <ShareModal
        open={shareModalOpen}
        onOpenChange={setShareModalOpen}
        onGenerateShare={generateShareLink}
      />

      {!isFullscreen && (
        <FloatingMenu
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
          onShareClick={() => setShareModalOpen(true)}
        />
      )}
    </div>
  )
}

export default App

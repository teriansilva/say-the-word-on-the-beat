import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { useLocalStorage, shareApi, resetAllSettings } from '@/hooks/useLocalStorage'
import { useDebouncedSlider } from '@/hooks/useDebouncedCallback'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Toaster } from '@/components/ui/sonner'
import { PauseCircle } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { GridCard } from '@/components/GridCard'
import { AudioUploader } from '@/components/AudioUploader'
import { ContentPoolManager, type ContentPoolItem } from '@/components/ContentPoolManager'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { ShareModal } from '@/components/ShareModal'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { getBpmAtTime, type BpmAnalysisResult } from '@/lib/bpmAnalyzer'
import { FloatingMenu } from '@/components/FloatingMenu'
import { PublicGamesPanel } from '@/components/PublicGamesPanel'
import defaultAudio from '@/assets/audio/audio.mp3'
import completeSound from '@/assets/audio/cheer.mp3'
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

// Expanded emoji pool for random selection when no content is provided
const DEFAULT_EMOJIS = [
  '🐱', '🐶', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸',
  '🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍒', '🍑', '🥭', '🍍', '🥝',
  '⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🎱', '🏓', '🏸', '🥊',
  '🔔', '🧱', '🕐', '🪨', '⭐', '🌙', '☀️', '🌈', '❄️', '🔥',
  '🎸', '🎹', '🥁', '🎺', '🎻', '🎤', '🎧', '📚', '✏️', '🔑',
  '🧢', '🦇', '🐝', '🦋', '🐛', '🌸', '🌻', '🌹', '🍀', '🌵'
]

// Default content pool with initial emojis
const DEFAULT_CONTENT_POOL: ContentPoolItem[] = [
  { content: '🐱', type: 'emoji' },
  { content: '🐶', type: 'emoji' },
  { content: '🍎', type: 'emoji' },
  { content: '⚽', type: 'emoji' },
  { content: '⭐', type: 'emoji' },
  { content: '🎸', type: 'emoji' },
  { content: '🌈', type: 'emoji' },
  { content: '🔥', type: 'emoji' },
]

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function generateRandomEmojiGrid(difficulty: Difficulty): GridItem[] {
  const shuffled = shuffleArray(DEFAULT_EMOJIS)
  const gridSize = 8
  const result: GridItem[] = []

  switch (difficulty) {
    case 'easy': {
      // Pairs of same emojis
      for (let i = 0; i < gridSize; i += 2) {
        const emoji = shuffled[i % shuffled.length]
        result.push({ content: emoji, type: 'emoji' })
        result.push({ content: emoji, type: 'emoji' })
      }
      break
    }
    case 'medium': {
      // Mostly different with occasional repeats
      let lastUsed: string | null = null
      for (let i = 0; i < gridSize; i++) {
        const available = lastUsed 
          ? shuffled.filter(e => e !== lastUsed)
          : shuffled
        const emoji = available[Math.floor(Math.random() * available.length)]
        result.push({ content: emoji, type: 'emoji' })
        lastUsed = Math.random() > 0.3 ? emoji : null
      }
      break
    }
    case 'hard': {
      // All different
      for (let i = 0; i < gridSize; i++) {
        result.push({ content: shuffled[i % shuffled.length], type: 'emoji' })
      }
      break
    }
  }

  return result
}

function generateGridFromPool(items: ContentPoolItem[], difficulty: Difficulty): GridItem[] {
  if (items.length === 0) {
    return generateRandomEmojiGrid(difficulty)
  }

  const gridSize = 8
  const result: GridItem[] = []

  switch (difficulty) {
    case 'easy': {
      for (let i = 0; i < gridSize; i += 2) {
        const randomItem = items[Math.floor(Math.random() * items.length)]
        result.push({ content: randomItem.content, type: randomItem.type, word: randomItem.word })
        result.push({ content: randomItem.content, type: randomItem.type, word: randomItem.word })
      }
      break
    }

    case 'medium': {
      let lastUsed: ContentPoolItem | null = null
      for (let i = 0; i < gridSize; i++) {
        const availableItems = lastUsed 
          ? items.filter(item => item.content !== lastUsed!.content)
          : items
        
        const pool = availableItems.length > 0 ? availableItems : items
        const randomItem = pool[Math.floor(Math.random() * pool.length)]
        
        result.push({ content: randomItem.content, type: randomItem.type, word: randomItem.word })
        
        if (Math.random() > 0.3) {
          lastUsed = randomItem
        } else {
          lastUsed = null
        }
      }
      break
    }

    case 'hard': {
      let lastUsed: ContentPoolItem | null = null
      for (let i = 0; i < gridSize; i++) {
        const availableItems = lastUsed 
          ? items.filter(item => item.content !== lastUsed!.content)
          : items
        
        const pool = availableItems.length > 0 ? availableItems : items
        const randomItem = pool[Math.floor(Math.random() * pool.length)]
        
        result.push({ content: randomItem.content, type: randomItem.type, word: randomItem.word })
        lastUsed = randomItem
      }
      break
    }
  }

  return result
}

function App() {
  const [contentPool, setContentPool] = useLocalStorage<ContentPoolItem[]>('content-pool-v1', DEFAULT_CONTENT_POOL)
  const [difficulty, setDifficulty] = useLocalStorage<Difficulty>('difficulty', 'medium')
  const [gridItems, setGridItems] = useLocalStorage<GridItem[]>('grid-items', [])
  const [bpm, setBpm] = useLocalStorage<number>('bpm-value', 91)
  const [baseBpm, setBaseBpm] = useLocalStorage<number>('base-bpm', 91)
  const [customAudio, setCustomAudio] = useLocalStorage<string | null>('custom-audio', null)
  const [bpmAnalysis, setBpmAnalysis] = useLocalStorage<BpmAnalysisResult | null>('bpm-analysis', null)
  const [audioStartTime, setAudioStartTime] = useLocalStorage<number>('audio-start-time', 0)
  const [rounds, setRounds] = useLocalStorage<number>('rounds', 3)
  const [increaseSpeed, setIncreaseSpeed] = useLocalStorage<boolean>('increase-speed', false)
  const [speedIncreasePercent, setSpeedIncreasePercent] = useLocalStorage<number>('speed-increase-percent', 5)
  // Admin-only parameter: can only be set via ?admin_countdown=X.X URL parameter
  const [countdownDuration, setCountdownDuration] = useLocalStorage<number>('countdown-duration', 2)
  const [isPlaying, setIsPlaying] = useState(false)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [revealedIndices, setRevealedIndices] = useState<Set<number>>(new Set())
  const [currentRound, setCurrentRound] = useState(0)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [displayBpm, setDisplayBpm] = useState<number>(91)
  const [isFinished, setIsFinished] = useState(false)
  
  const intervalRef = useRef<number | null>(null)
  const customAudioRef = useRef<HTMLAudioElement | null>(null)
  const defaultAudioRef = useRef<HTMLAudioElement | null>(null)
  const completeSoundRef = useRef<HTMLAudioElement | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const hasLoadedFromUrl = useRef(false)
  const bpmCheckIntervalRef = useRef<number | null>(null)

  const currentBpm = bpm ?? 91
  const currentBaseBpm = baseBpm ?? 91
  const currentDifficulty = difficulty ?? 'medium'
  const currentContentPool = contentPool ?? []
  const currentRounds = rounds ?? 3
  const currentIncreaseSpeed = increaseSpeed ?? false
  const currentSpeedIncreasePercent = speedIncreasePercent ?? 5
  const currentCountdownDuration = countdownDuration ?? 3.0
  const currentBpmAnalysis = bpmAnalysis ?? null
  const currentAudioStartTime = audioStartTime ?? 0

  // Debounced slider values - provides smooth UI updates with delayed persistence
  const [localRounds, setLocalRounds] = useDebouncedSlider(currentRounds, setRounds, 500)
  const [localSpeedPercent, setLocalSpeedPercent] = useDebouncedSlider(currentSpeedIncreasePercent, setSpeedIncreasePercent, 500)
  const [localBpm, setLocalBpm] = useDebouncedSlider(currentBpm, setBpm, 500)
  const [localBaseBpm, setLocalBaseBpm] = useDebouncedSlider(currentBaseBpm, setBaseBpm, 500)
  const [localStartTime, setLocalStartTime] = useDebouncedSlider(currentAudioStartTime, setAudioStartTime, 500)
  const [localCountdown, setLocalCountdown] = useDebouncedSlider(currentCountdownDuration, setCountdownDuration, 500)

  // Compute a fallback grid in case gridItems is empty
  const fallbackGridItems = useMemo(() => {
    return generateGridFromPool(currentContentPool, currentDifficulty)
  }, [currentContentPool, currentDifficulty])
  
  // Use persisted gridItems if available, otherwise use fallback
  const displayedGridItems = (gridItems && gridItems.length > 0) ? gridItems : fallbackGridItems

  // Check if user has customized anything from defaults
  const hasCustomizations = useMemo(() => {
    // Check if content pool differs from default
    const defaultContentStrings = DEFAULT_CONTENT_POOL.map(item => item.content).sort()
    const currentContentStrings = currentContentPool.map(item => item.content).sort()
    const contentPoolChanged = 
      currentContentPool.length !== DEFAULT_CONTENT_POOL.length ||
      currentContentStrings.some((content, i) => content !== defaultContentStrings[i]) ||
      currentContentPool.some(item => item.type === 'image') // Any images means customized

    // Check other settings
    const hasCustomAudio = customAudio !== null
    const difficultyChanged = currentDifficulty !== 'medium'
    const bpmChanged = currentBpm !== 91
    const roundsChanged = currentRounds !== 3
    const speedSettingsChanged = currentIncreaseSpeed !== false

    return contentPoolChanged || hasCustomAudio || difficultyChanged || bpmChanged || roundsChanged || speedSettingsChanged
  }, [currentContentPool, customAudio, currentDifficulty, currentBpm, currentRounds, currentIncreaseSpeed])
  
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

  const generateShareLink = async (options: { isPublic: boolean; title: string; _submit_time?: number }): Promise<string> => {
    try {
      const config = {
        bpm: currentBpm,
        baseBpm: currentBaseBpm,
        difficulty: currentDifficulty,
        content: currentContentPool,
        audio: customAudio,
        bpmAnalysis: currentBpmAnalysis,
        audioStartTime: currentAudioStartTime,
        rounds: currentRounds,
        increaseSpeed: currentIncreaseSpeed,
        speedIncreasePercent: currentSpeedIncreasePercent
        // Note: countdownDuration is excluded - this is an admin-only parameter
      }
      
      const guid = await shareApi.create(config, { 
        isPublic: options.isPublic, 
        title: options.title,
        _submit_time: options._submit_time
      })
      
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
          content?: ContentPoolItem[]
          images?: ContentPoolItem[] | string[]
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
          
          // Validate and sanitize content (supports both new 'content' and legacy 'images' format)
          const contentItems = config.content || config.images
          if (contentItems && Array.isArray(contentItems)) {
            const validItems: ContentPoolItem[] = contentItems
              .map(item => {
                if (typeof item === 'string') {
                  return { content: item, type: 'image' as const }
                }
                // Handle legacy ImagePoolItem format
                if ('url' in item) {
                  return { content: item.url, type: 'image' as const, word: item.word }
                }
                return item as ContentPoolItem
              })
              .filter(item => {
                // Validate data URL for images
                if (item.type === 'image' && !isValidDataUrl(item.content)) {
                  console.warn('Invalid image data URL format detected in shared config')
                  return false
                }
                return true
              })
              .slice(0, 8) // Limit to 8 items
            
            if (validItems.length > 0) {
              setContentPool(validItems)
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
          
          // Validate content (supports both new 'content' and legacy 'images' format)
          const contentItems = decoded.content || decoded.images
          if (contentItems && Array.isArray(contentItems)) {
            const validItems: ContentPoolItem[] = contentItems
              .map((item: ContentPoolItem | { url: string; word?: string } | string) => {
                if (typeof item === 'string') {
                  return { content: item, type: 'image' as const }
                }
                if ('url' in item) {
                  return { content: item.url, type: 'image' as const, word: item.word }
                }
                return item as ContentPoolItem
              })
              .filter((item: ContentPoolItem) => {
                if (item.type === 'image' && !isValidDataUrl(item.content)) {
                  console.warn('Invalid image data URL format detected in config')
                  return false
                }
                return true
              })
              .slice(0, 8)
            
            if (validItems.length > 0) {
              setContentPool(validItems)
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
      
      // Admin-only parameter: countdown duration can only be set via URL parameter
      // This is not included in user share links and is intended for administrators only
      const adminCountdown = urlParams.get('admin_countdown')
      if (adminCountdown) {
        const sanitizedCountdown = sanitizeUrlParam(adminCountdown)
        if (!sanitizedCountdown) {
          console.warn('Invalid admin_countdown parameter provided')
        } else {
          const countdownValue = parseFloat(sanitizedCountdown)
          if (isNaN(countdownValue)) {
            console.warn('Invalid admin_countdown value: must be a number')
          } else {
            const countdownValidation = validateNumber(countdownValue, 0.5, 10, 'Admin countdown duration')
            if (countdownValidation.valid) {
              setCountdownDuration(countdownValue)
              console.log(`Admin countdown duration set to: ${countdownValue}s`)
            } else {
              console.warn(`Invalid admin_countdown value: ${countdownValidation.error}`)
            }
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

  const loadPublicGame = useCallback(async (guid: string) => {
    try {
      const config = await shareApi.get(guid) as {
        bpm: number
        baseBpm?: number
        difficulty: Difficulty
        content?: ContentPoolItem[]
        images?: ContentPoolItem[] | string[]
        audio: string | null
        bpmAnalysis?: BpmAnalysisResult | null
        rounds: number
        increaseSpeed?: boolean
        speedIncreasePercent?: number
      } | null
      
      if (!config) {
        throw new Error('Game not found')
      }
      
      // Apply config (similar to loadFromUrl)
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
      
      if (config.difficulty && validateDifficulty(config.difficulty)) {
        setDifficulty(config.difficulty)
      }
      
      const contentItems = config.content || config.images
      if (contentItems && Array.isArray(contentItems)) {
        const validItems: ContentPoolItem[] = contentItems
          .map(item => {
            if (typeof item === 'string') {
              return { content: item, type: 'image' as const }
            }
            if ('url' in item) {
              return { content: item.url, type: 'image' as const, word: item.word }
            }
            return item as ContentPoolItem
          })
          .filter(item => {
            if (item.type === 'image' && !isValidDataUrl(item.content)) {
              return false
            }
            return true
          })
          .slice(0, 8)
        
        if (validItems.length > 0) {
          setContentPool(validItems)
        }
      }
      
      if (config.audio && isValidDataUrl(config.audio)) {
        setCustomAudio(config.audio)
      } else {
        setCustomAudio(null)
      }
      
      if (config.bpmAnalysis) setBpmAnalysis(config.bpmAnalysis)
      
      if (config.rounds) {
        const roundsValidation = validateNumber(config.rounds, 1, 10, 'Rounds')
        if (roundsValidation.valid) {
          setRounds(config.rounds)
        }
      }
      
      if (config.increaseSpeed !== undefined) setIncreaseSpeed(config.increaseSpeed)
      
      if (config.speedIncreasePercent !== undefined) {
        const speedValidation = validateNumber(config.speedIncreasePercent, 0, 100, 'Speed increase')
        if (speedValidation.valid) {
          setSpeedIncreasePercent(config.speedIncreasePercent)
        }
      }
      
      // Scroll to top smoothly
      window.scrollTo({ top: 0, behavior: 'smooth' })
      
    } catch (error) {
      console.error('Failed to load public game:', error)
      throw error
    }
  }, [setBpm, setBaseBpm, setDifficulty, setContentPool, setCustomAudio, setBpmAnalysis, setRounds, setIncreaseSpeed, setSpeedIncreasePercent])

  const startBeat = () => {
    if (isPlaying) return
    
    // Validate countdown duration to prevent division by zero or invalid values
    if (currentCountdownDuration < 0.5) {
      toast.error('Invalid countdown duration')
      return
    }
    
    setIsFullscreen(true)
    setCurrentRound(1)
    
    // Start playing music immediately with the countdown
    const audioRef = customAudio ? customAudioRef : defaultAudioRef
    if (audioRef.current) {
      // Use custom start time if set, otherwise fall back to silence offset
      const startTime = customAudio && currentAudioStartTime > 0 
        ? currentAudioStartTime 
        : (customAudio && currentBpmAnalysis?.silenceOffset) || 0
      audioRef.current.currentTime = startTime
      audioRef.current.playbackRate = calculatePlaybackSpeed(1)
      audioRef.current.play().catch((error) => {
        console.error('Audio play error:', error)
        toast.error('Failed to play audio')
      })
    }
    
    // Calculate the interval time: total duration divided by 3 countdown steps (always 3, 2, 1)
    const intervalTime = Math.round((currentCountdownDuration * 1000) / 3)
    
    setCountdown(3)
    
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(countdownInterval)
          setTimeout(() => {
            setCountdown(null)
            beginPlayback()
          }, intervalTime)
          return null
        }
        return prev - 1
      })
    }, intervalTime)
  }

  const beginPlayback = () => {
    setIsPlaying(true)
    setRevealedIndices(new Set())
    let index = -1
    let roundCount = 1
    
    const audioRef = customAudio ? customAudioRef : defaultAudioRef
    
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
    
    // Track the current grid size
    let currentGridSize = displayedGridItems.length
    
    const playSequence = () => {
      index = (index + 1) % currentGridSize
      
      if (index === 0 && roundCount > 1) {
        if (roundCount > currentRounds) {
          // Stop the beat sequence but keep music playing
          if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
          }
          if (bpmCheckIntervalRef.current) {
            clearInterval(bpmCheckIntervalRef.current)
            bpmCheckIntervalRef.current = null
          }
          setIsPlaying(false)
          setActiveIndex(null)
          setIsFinished(true)
          // Play completion sound
          if (completeSoundRef.current) {
            completeSoundRef.current.currentTime = 0
            completeSoundRef.current.play().catch(err => console.debug('Complete sound play error:', err))
          }
          return
        }
        
        // Always generate a fresh grid for each new round (mix it up!)
        const newGrid = generateGridFromPool(currentContentPool, currentDifficulty)
        setGridItems(newGrid)
        currentGridSize = newGrid.length
        
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
      
      if (index === currentGridSize - 1) {
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
    setIsFinished(false)
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
      const resetTime = currentAudioStartTime > 0 
        ? currentAudioStartTime 
        : (currentBpmAnalysis?.silenceOffset || 0)
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
    const newGrid = generateGridFromPool(currentContentPool, currentDifficulty)
    setGridItems(newGrid)
  }, [currentDifficulty, currentContentPool])

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
          ) : isFinished ? (
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
                      backgroundColor: [
                        '#E8744F', // primary coral
                        '#5BA3D0', // secondary blue
                        '#F5D547', // yellow
                        '#4ADE80', // green
                        '#F472B6', // pink
                        '#A78BFA', // purple
                      ][i % 6],
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
                    You finished {currentRounds} round{currentRounds > 1 ? 's' : ''}!
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
                    onClick={stopBeat}
                  >
                    Exit
                  </Button>
                </motion.div>
              </motion.div>
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
                {displayedGridItems.map((item, index) => (
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
      
      <div className="max-w-7xl mx-auto space-y-8">
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

        {/* Two-column layout: Game Settings + Community Games */}
        <div className="flex flex-col xl:flex-row gap-6">
          {/* Main Settings Column */}
          <div className="flex-1 min-w-0 space-y-6 bg-card p-6 rounded-2xl border-2 border-border shadow-sm">
            <ContentPoolManager
              items={currentContentPool}
              onItemsChange={(items) => setContentPool(items)}
            />
          
          <Card className="p-4 border-2">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-foreground">
                  Rounds
                </label>
                <Badge variant="secondary" className="text-sm font-bold">
                  {localRounds}
                </Badge>
              </div>
              <Slider
                value={[localRounds]}
                onValueChange={([value]) => setLocalRounds(value)}
                min={1}
                max={10}
                step={1}
                className="w-full"
                disabled={isPlaying}
              />
            </div>
          </Card>
          
          <Card className="p-4 border-2">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-foreground">
                  Difficulty
                </label>
                <Badge variant="outline" className="text-xs">
                  {currentDifficulty === 'easy' && 'Same items repeat'}
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
                {currentDifficulty === 'easy' && 'Same items appear consecutively (pairs)'}
                {currentDifficulty === 'medium' && 'Items mostly change with occasional repeats'}
                {currentDifficulty === 'hard' && 'Every item is different from the previous one'}
              </p>
            </div>
          </Card>
          
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
                      {localSpeedPercent}%
                    </Badge>
                  </div>
                  <Slider
                    value={[localSpeedPercent]}
                    onValueChange={([value]) => setLocalSpeedPercent(value)}
                    min={1}
                    max={10}
                    step={1}
                    className="w-full"
                    disabled={isPlaying}
                  />
                  <p className="text-xs text-muted-foreground">
                    Each round increases by {localSpeedPercent}% (1-10%)
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
              setAudioStartTime(0) // Reset start time when new audio is uploaded
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
              setAudioStartTime(0)
            }}
            bpm={localBpm}
            onBpmChange={(value) => setLocalBpm(value)}
            baseBpm={localBaseBpm}
            onBaseBpmChange={(value) => setLocalBaseBpm(value)}
            startTime={localStartTime}
            onStartTimeChange={(value) => setLocalStartTime(value)}
            countdownDuration={localCountdown}
            onCountdownDurationChange={(value) => setLocalCountdown(value)}
            isPlaying={isPlaying}
          />
          </div>
          
          {/* Community Games Column */}
          <div className="hidden xl:block w-[360px] shrink-0 h-[calc(100vh-280px)] sticky top-8">
            <PublicGamesPanel onLoadGame={loadPublicGame} />
          </div>
        </div>
        
        {/* Mobile Community Games (shown below settings on mobile) */}
        <div className="xl:hidden">
          <PublicGamesPanel onLoadGame={loadPublicGame} />
        </div>

        <div className="text-center text-sm text-muted-foreground space-y-2">
          <p>
            Made with ❤️ by  <a 
            href="https://superstatus.io" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
          >TerianSilva</a>
         &nbsp;| &nbsp;
          <a 
            href="https://github.com/teriansilva/say-the-word-on-the-beat" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
          >
            🐙 GitHub
          </a> </p>
        </div>
      </div>

      <audio ref={defaultAudioRef} src={defaultAudio} preload="auto" loop />
      <audio ref={completeSoundRef} src={completeSound} preload="auto" />
      
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
          onShareClick={() => {
            if (!hasCustomizations) {
              toast.error('Customize your game first before sharing!')
              return
            }
            setShareModalOpen(true)
          }}
          onResetClick={async () => {
            await resetAllSettings()
            toast.success('Game reset! Reloading...')
            setTimeout(() => window.location.reload(), 500)
          }}
        />
      )}
    </div>
  )
}

export default App

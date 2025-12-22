import { useState, useRef, useEffect, useMemo } from 'react'
import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Toaster } from '@/components/ui/sonner'
import { PlayCircle, PauseCircle, DownloadSimple } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { GridCard } from '@/components/GridCard'
import { ExportOverlay } from '@/components/ExportOverlay'
import { AudioUploader } from '@/components/AudioUploader'
import { ImagePoolManager } from '@/components/ImagePoolManager'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

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
  const [isPlaying, setIsPlaying] = useState(false)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  
  const intervalRef = useRef<number | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const customAudioRef = useRef<HTMLAudioElement | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  const currentBpm = bpm ?? 120
  const currentDifficulty = difficulty ?? 'medium'
  const currentImagePool = imagePool ?? []
  const currentGridItems = useMemo(() => {
    if (currentImagePool.length > 0) {
      return generateGridFromPool(currentImagePool, currentDifficulty)
    }
    return gridItems ?? DEFAULT_ITEMS
  }, [currentImagePool, currentDifficulty, gridItems])
  const beatInterval = (60 / currentBpm) * 1000

  const playBeatSound = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext()
    }
    
    const ctx = audioContextRef.current
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)
    
    oscillator.frequency.value = 800
    oscillator.type = 'sine'
    
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1)
    
    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.1)
  }

  const startBeat = () => {
    if (isPlaying) return
    
    setIsPlaying(true)
    let index = 0
    
    if (customAudio && customAudioRef.current) {
      customAudioRef.current.currentTime = 0
      customAudioRef.current.play().catch(() => {
        toast.error('Failed to play custom audio')
      })
    }
    
    const playSequence = () => {
      setActiveIndex(index)
      if (!customAudio) {
        playBeatSound()
      }
      
      index = (index + 1) % currentGridItems.length
    }
    
    playSequence()
    intervalRef.current = window.setInterval(playSequence, beatInterval)
  }

  const stopBeat = () => {
    setIsPlaying(false)
    setActiveIndex(null)
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

  const exportVideo = async () => {
    if (!gridRef.current) return
    
    try {
      setIsExporting(true)
      setExportProgress(10)
      
      toast.info('Starting video export...')
      
      const canvas = document.createElement('canvas')
      canvas.width = 1280
      canvas.height = 720
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        throw new Error('Could not get canvas context')
      }
      
      const stream = canvas.captureStream(30)
      const audioContext = new AudioContext()
      const audioDestination = audioContext.createMediaStreamDestination()
      
      const combinedStream = new MediaStream([
        ...stream.getVideoTracks(),
        ...audioDestination.stream.getAudioTracks()
      ])
      
      const mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType: 'video/webm;codecs=vp8,opus',
        videoBitsPerSecond: 2500000
      })
      
      const chunks: Blob[] = []
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data)
        }
      }
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `say-the-word-${Date.now()}.webm`
        a.click()
        URL.revokeObjectURL(url)
        
        audioContext.close()
        setIsExporting(false)
        setExportProgress(0)
        toast.success('Video exported successfully!')
      }
      
      setExportProgress(25)
      mediaRecorder.start()
      
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
      gradient.addColorStop(0, '#FFF5EB')
      gradient.addColorStop(1, '#E8F4FF')
      
      let currentBeatIndex = 0
      const frameDuration = 1000 / 30
      const totalBeats = currentGridItems.length * 2
      let elapsedTime = 0
      
      const drawFrame = () => {
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        
        ctx.font = 'bold 72px Fredoka'
        ctx.textAlign = 'center'
        ctx.fillStyle = '#E8744F'
        ctx.fillText('SAY THE WORD', canvas.width / 2, 120)
        
        ctx.font = 'bold 56px DM Sans'
        ctx.fillStyle = '#5BA3D0'
        ctx.fillText('ON THE BEAT', canvas.width / 2, 200)
        
        const gridStartX = 240
        const gridStartY = 280
        const cardSize = 180
        const gap = 20
        const cols = 4
        
        currentGridItems.forEach((item, index) => {
          const col = index % cols
          const row = Math.floor(index / cols)
          const x = gridStartX + col * (cardSize + gap)
          const y = gridStartY + row * (cardSize + gap)
          
          const isActive = index === (currentBeatIndex % currentGridItems.length)
          
          if (isActive) {
            ctx.fillStyle = '#FFE066'
            ctx.shadowColor = '#FFE066'
            ctx.shadowBlur = 20
          } else {
            ctx.fillStyle = '#FFFFFF'
            ctx.shadowBlur = 0
          }
          
          ctx.strokeStyle = isActive ? '#FFE066' : '#E5E5E5'
          ctx.lineWidth = 4
          
          ctx.beginPath()
          ctx.roundRect(x, y, cardSize, cardSize, 16)
          ctx.fill()
          ctx.stroke()
          
          ctx.shadowBlur = 0
          
          if (item.type === 'emoji') {
            ctx.font = '96px Arial'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillStyle = '#000000'
            ctx.fillText(item.content, x + cardSize / 2, y + cardSize / 2 + 8)
          } else {
            const img = new Image()
            img.src = item.content
            ctx.drawImage(img, x, y, cardSize, cardSize)
          }
        })
        
        elapsedTime += frameDuration
        
        if (elapsedTime >= beatInterval) {
          elapsedTime = 0
          currentBeatIndex++
          
          const oscillator = audioContext.createOscillator()
          const gainNode = audioContext.createGain()
          
          oscillator.connect(gainNode)
          gainNode.connect(audioDestination)
          
          oscillator.frequency.value = 800
          oscillator.type = 'sine'
          
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)
          
          oscillator.start(audioContext.currentTime)
          oscillator.stop(audioContext.currentTime + 0.1)
        }
        
        if (currentBeatIndex < totalBeats) {
          const progress = 25 + ((currentBeatIndex / totalBeats) * 70)
          setExportProgress(Math.round(progress))
          requestAnimationFrame(drawFrame)
        } else {
          setExportProgress(100)
          setTimeout(() => {
            mediaRecorder.stop()
          }, 500)
        }
      }
      
      drawFrame()
      
    } catch (error) {
      console.error('Export failed:', error)
      setIsExporting(false)
      setExportProgress(0)
      toast.error('Failed to export video. Please try again.')
    }
  }

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
              isActive={activeIndex === index}
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

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              size="lg"
              className="flex-1 text-base font-bold h-12"
              onClick={handlePlayPause}
              disabled={isExporting}
            >
              {isPlaying ? (
                <>
                  <PauseCircle size={28} weight="fill" />
                  Pause Beat
                </>
              ) : (
                <>
                  <PlayCircle size={28} weight="fill" />
                  Play Beat
                </>
              )}
            </Button>
            
            <Button
              size="lg"
              variant="secondary"
              className="flex-1 text-base font-bold h-12"
              onClick={exportVideo}
              disabled={isPlaying || isExporting}
            >
              <DownloadSimple size={28} weight="bold" />
              {isExporting ? 'Recording...' : 'Export Video'}
            </Button>
          </div>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          <p>
            Upload images to the pool • Choose difficulty • Cards auto-generate based on your settings
          </p>
        </div>
      </div>

      {customAudio && (
        <audio ref={customAudioRef} src={customAudio} preload="auto" />
      )}

      <ExportOverlay 
        isExporting={isExporting}
        progress={exportProgress}
      />
    </div>
  )
}

export default App

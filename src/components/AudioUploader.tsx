import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { Upload, Waveform, X, Spinner, ArrowCounterClockwise, Clock, Timer } from '@phosphor-icons/react'
import { useRef, useState, useEffect } from 'react'
import { toast } from 'sonner'
import { analyzeBpm, type BpmAnalysisResult } from '@/lib/bpmAnalyzer'
import { validateAudioFile } from '@/lib/security'

interface AudioUploaderProps {
  audioUrl: string | null
  onAudioUpload: (audioUrl: string, bpmAnalysis: BpmAnalysisResult | null) => void
  onAudioRemove: () => void
  bpm: number
  onBpmChange: (bpm: number) => void
  baseBpm: number
  onBaseBpmChange: (baseBpm: number) => void
  startTime: number
  onStartTimeChange: (startTime: number) => void
  countdownDuration: number
  onCountdownDurationChange: (duration: number) => void
  isPlaying: boolean
}

// Helper to format seconds as MM:SS
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function AudioUploader({ audioUrl, onAudioUpload, onAudioRemove, bpm, onBpmChange, baseBpm, onBaseBpmChange, startTime, onStartTimeChange, countdownDuration, onCountdownDurationChange, isPlaying }: AudioUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioPreviewRef = useRef<HTMLAudioElement>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [audioDuration, setAudioDuration] = useState<number>(300)

  // Update audio duration when audio URL changes
  useEffect(() => {
    if (!audioUrl) {
      setAudioDuration(300)
      return
    }

    const audio = new Audio()
    audio.src = audioUrl
    
    const handleLoadedMetadata = () => {
      const duration = Math.floor(audio.duration)
      setAudioDuration(duration)
      // If current start time exceeds new duration, reset it
      if (startTime > duration) {
        onStartTimeChange(0)
      }
    }
    
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    
    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
    }
  }, [audioUrl])

  const handleReset = () => {
    const resetBpm = audioUrl ? baseBpm : 91
    onBpmChange(resetBpm)
    toast.success('Tempo reset to original value')
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate audio file
    const validation = await validateAudioFile(file)
    if (!validation.valid) {
      toast.error(validation.error || 'Invalid audio file')
      return
    }

    const reader = new FileReader()
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string
      
      setIsAnalyzing(true)
      toast.info('Analyzing audio BPM...')
      
      try {
        const bpmAnalysis = await analyzeBpm(dataUrl)
        onAudioUpload(dataUrl, bpmAnalysis)
        toast.success(`Audio uploaded! Average BPM: ${bpmAnalysis.averageBpm}`)
      } catch (error) {
        console.error('BPM analysis failed:', error)
        onAudioUpload(dataUrl, null)
        toast.warning('Audio uploaded, but BPM analysis failed. Using manual BPM.')
      } finally {
        setIsAnalyzing(false)
      }
    }
    reader.onerror = () => {
      toast.error('Failed to read audio file')
      setIsAnalyzing(false)
    }
    reader.readAsDataURL(file)
  }

  return (
    <Card className="p-4 border-2">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Waveform size={20} weight="bold" className="text-primary" />
            <label className="text-sm font-semibold text-foreground">
              Beat Sound
            </label>
          </div>
          {audioUrl && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onAudioRemove}
              className="h-8 gap-1 text-destructive hover:text-destructive"
            >
              <X size={16} weight="bold" />
              Remove
            </Button>
          )}
        </div>

        {audioUrl ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="flex-1">Custom audio loaded</span>
            </div>
            <audio controls className="w-full h-10" src={audioUrl} />
          </div>
        ) : (
          <div className="text-xs text-muted-foreground">
            Using default sound: <span className="font-semibold text-foreground">Say the Word on Beat</span>
          </div>
        )}

        <Button
          size="sm"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          className="w-full gap-2"
          disabled={isAnalyzing}
        >
          {isAnalyzing ? (
            <>
              <Spinner size={16} weight="bold" className="animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Upload size={16} weight="bold" />
              {audioUrl ? 'Replace Audio' : 'Upload Custom Audio'}
            </>
          )}
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleFileUpload}
          className="hidden"
        />

        {audioUrl && (
          <div className="pt-3 border-t border-border space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-foreground">
                Base BPM
              </label>
              <Badge variant="secondary" className="text-sm font-bold">
                {baseBpm} BPM
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Automatically detected base tempo for this audio file
            </p>
          </div>
        )}

        {audioUrl && (
          <div className="pt-3 border-t border-border space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock size={16} weight="bold" className="text-muted-foreground" />
                <label className="text-sm font-semibold text-foreground">
                  Start Time
                </label>
              </div>
              <Badge variant="secondary" className="text-sm font-bold">
                {formatTime(startTime)}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Slider
                value={[startTime]}
                onValueChange={([value]) => onStartTimeChange(value)}
                min={0}
                max={audioDuration}
                step={1}
                className="flex-1"
                disabled={isPlaying}
              />
              <Input
                type="number"
                value={startTime}
                onChange={(e) => {
                  const value = Math.max(0, Math.min(audioDuration, parseInt(e.target.value) || 0))
                  onStartTimeChange(value)
                }}
                className="w-20 h-8 text-center text-sm"
                min={0}
                max={audioDuration}
                disabled={isPlaying}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Set where in the audio to start playback (0-{formatTime(audioDuration)})
            </p>
          </div>
        )}

        {audioUrl && (
          <div className="pt-3 border-t border-border space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Timer size={16} weight="bold" className="text-muted-foreground" />
                <label className="text-sm font-semibold text-foreground">
                  Countdown
                </label>
              </div>
              <Badge variant="secondary" className="text-sm font-bold">
                {countdownDuration}s
              </Badge>
            </div>
            <Slider
              value={[countdownDuration]}
              onValueChange={([value]) => onCountdownDurationChange(value)}
              min={1}
              max={5}
              step={0.5}
              className="w-full"
              disabled={isPlaying}
            />
            <p className="text-xs text-muted-foreground">
              Duration of the countdown before cards start (1-5 seconds)
            </p>
          </div>
        )}

        <div className="pt-3 border-t border-border space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-foreground">
              Adjust Tempo
            </label>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-sm font-bold">
                {bpm} BPM
              </Badge>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleReset}
                className="h-7 w-7 p-0"
                disabled={isPlaying}
              >
                <ArrowCounterClockwise size={16} weight="bold" />
              </Button>
            </div>
          </div>
          <Slider
            value={[bpm]}
            onValueChange={([value]) => onBpmChange(value)}
            min={60}
            max={180}
            step={1}
            className="w-full"
            disabled={isPlaying}
          />
        </div>
      </div>
    </Card>
  )
}

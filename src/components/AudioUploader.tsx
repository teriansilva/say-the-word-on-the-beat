import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Upload, Waveform, X, ArrowSquareOut } from '@phosphor-icons/react'
import { useRef } from 'react'
import { toast } from 'sonner'

interface AudioUploaderProps {
  audioUrl: string | null
  onAudioUpload: (audioUrl: string) => void
  onAudioRemove: () => void
  bpm: number
  onBpmChange: (bpm: number) => void
  baseBpm: number
  onBaseBpmChange: (baseBpm: number) => void
  isPlaying: boolean
}

export function AudioUploader({ audioUrl, onAudioUpload, onAudioRemove, bpm, onBpmChange, baseBpm, onBaseBpmChange, isPlaying }: AudioUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('audio/')) {
      toast.error('Please select a valid audio file')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Audio file must be smaller than 10MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      onAudioUpload(dataUrl)
      toast.success('Custom audio uploaded!')
    }
    reader.onerror = () => {
      toast.error('Failed to read audio file')
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
        >
          <Upload size={16} weight="bold" />
          {audioUrl ? 'Replace Audio' : 'Upload Custom Audio'}
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
            <Slider
              value={[baseBpm]}
              onValueChange={([value]) => onBaseBpmChange(value)}
              min={60}
              max={200}
              step={1}
              className="w-full"
              disabled={isPlaying}
            />
            <a
              href="https://tunebat.com/Analyzer"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
            >
              <ArrowSquareOut size={14} weight="bold" />
              Find your audio's BPM on TuneBat
            </a>
          </div>
        )}

        <div className="pt-3 border-t border-border space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-foreground">
              Tempo
            </label>
            <Badge variant="secondary" className="text-sm font-bold">
              {bpm} BPM
            </Badge>
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

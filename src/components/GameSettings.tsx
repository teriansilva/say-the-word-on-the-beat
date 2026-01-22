/**
 * Game Settings Component
 * 
 * Panel containing all game configuration options:
 * - Content pool management
 * - Rounds slider
 * - Difficulty selection
 * - Speed increase toggle
 * - Audio uploader
 */

import { Card } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { ContentPoolManager, type ContentPoolItem } from '@/components/ContentPoolManager'
import { AudioUploader } from '@/components/AudioUploader'
import type { BpmAnalysisResult } from '@/lib/bpmAnalyzer'
import type { Difficulty } from '@/lib/types'

// ============================================================================
// Sub-components
// ============================================================================

interface RoundsSettingProps {
  value: number
  onChange: (value: number) => void
  disabled?: boolean
}

function RoundsSetting({ value, onChange, disabled }: RoundsSettingProps) {
  return (
    <Card className="p-4 border-2">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-foreground">
            Rounds
          </label>
          <Badge variant="secondary" className="text-sm font-bold">
            {value}
          </Badge>
        </div>
        <Slider
          value={[value]}
          onValueChange={([v]) => onChange(v)}
          min={1}
          max={10}
          step={1}
          className="w-full"
          disabled={disabled}
        />
      </div>
    </Card>
  )
}

interface DifficultySettingProps {
  value: Difficulty
  onChange: (value: Difficulty) => void
}

const DIFFICULTY_DESCRIPTIONS: Record<Difficulty, { short: string; long: string }> = {
  easy: {
    short: 'Same items repeat',
    long: 'Same items appear consecutively (pairs)',
  },
  medium: {
    short: 'Slight variance',
    long: 'Items mostly change with occasional repeats',
  },
  hard: {
    short: 'All different',
    long: 'Every item is different from the previous one',
  },
}

function DifficultySetting({ value, onChange }: DifficultySettingProps) {
  const description = DIFFICULTY_DESCRIPTIONS[value]
  
  return (
    <Card className="p-4 border-2">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-foreground">
            Difficulty
          </label>
          <Badge variant="outline" className="text-xs">
            {description.short}
          </Badge>
        </div>
        
        <ToggleGroup
          type="single"
          value={value}
          onValueChange={(v) => {
            if (v) onChange(v as Difficulty)
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
          {description.long}
        </p>
      </div>
    </Card>
  )
}

interface SpeedIncreaseSettingProps {
  enabled: boolean
  onEnabledChange: (enabled: boolean) => void
  percent: number
  onPercentChange: (percent: number) => void
  disabled?: boolean
}

function SpeedIncreaseSetting({
  enabled,
  onEnabledChange,
  percent,
  onPercentChange,
  disabled,
}: SpeedIncreaseSettingProps) {
  return (
    <Card className="p-4 border-2">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label 
              htmlFor="increase-speed" 
              className="text-sm font-semibold text-foreground cursor-pointer"
            >
              Increase speed with each round
            </Label>
            <p className="text-xs text-muted-foreground">
              Audio and cards speed up per round
            </p>
          </div>
          <Switch
            id="increase-speed"
            checked={enabled}
            onCheckedChange={onEnabledChange}
            disabled={disabled}
          />
        </div>
        
        {enabled && (
          <div className="space-y-3 pt-2 border-t">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">
                Speed increase per round
              </label>
              <Badge variant="secondary" className="text-sm font-bold">
                {percent}%
              </Badge>
            </div>
            <Slider
              value={[percent]}
              onValueChange={([v]) => onPercentChange(v)}
              min={1}
              max={10}
              step={1}
              className="w-full"
              disabled={disabled}
            />
            <p className="text-xs text-muted-foreground">
              Each round increases by {percent}% (1-10%)
            </p>
          </div>
        )}
      </div>
    </Card>
  )
}

interface ShowImagesImmediatelySettingProps {
  enabled: boolean
  onEnabledChange: (enabled: boolean) => void
}

function ShowImagesImmediatelySetting({
  enabled,
  onEnabledChange,
}: ShowImagesImmediatelySettingProps) {
  return (
    <Card className="p-4 border-2">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Label 
            htmlFor="show-images-immediately" 
            className="text-sm font-semibold text-foreground cursor-pointer"
          >
            Show images immediately
          </Label>
          <p className="text-xs text-muted-foreground">
            Display images from the start instead of question marks
          </p>
        </div>
        <Switch
          id="show-images-immediately"
          checked={enabled}
          onCheckedChange={onEnabledChange}
        />
      </div>
    </Card>
  )
}

// ============================================================================
// Main Component
// ============================================================================

interface GameSettingsProps {
  // Content pool
  contentPool: ContentPoolItem[]
  onContentPoolChange: (items: ContentPoolItem[]) => void
  
  // Rounds
  rounds: number
  onRoundsChange: (value: number) => void
  
  // Difficulty
  difficulty: Difficulty
  onDifficultyChange: (value: Difficulty) => void
  
  // Speed increase
  increaseSpeed: boolean
  onIncreaseSpeedChange: (enabled: boolean) => void
  speedIncreasePercent: number
  onSpeedIncreasePercentChange: (percent: number) => void
  
  // Show images immediately
  showImagesImmediately: boolean
  onShowImagesImmediatelyChange: (enabled: boolean) => void
  
  // Audio
  audioUrl: string | null
  onAudioUpload: (url: string, analysis: BpmAnalysisResult | null) => void
  onAudioRemove: () => void
  bpm: number
  onBpmChange: (value: number) => void
  baseBpm: number
  onBaseBpmChange: (value: number) => void
  startTime: number
  onStartTimeChange: (value: number) => void
  countdownDuration: number
  onCountdownDurationChange: (value: number) => void
  
  // State
  isPlaying: boolean
}

export function GameSettings({
  contentPool,
  onContentPoolChange,
  rounds,
  onRoundsChange,
  difficulty,
  onDifficultyChange,
  increaseSpeed,
  onIncreaseSpeedChange,
  speedIncreasePercent,
  onSpeedIncreasePercentChange,
  showImagesImmediately,
  onShowImagesImmediatelyChange,
  audioUrl,
  onAudioUpload,
  onAudioRemove,
  bpm,
  onBpmChange,
  baseBpm,
  onBaseBpmChange,
  startTime,
  onStartTimeChange,
  countdownDuration,
  onCountdownDurationChange,
  isPlaying,
}: GameSettingsProps) {
  return (
    <div className="flex-1 min-w-0 space-y-6 bg-card p-6 rounded-2xl border-2 border-border shadow-sm">
      <ContentPoolManager
        items={contentPool}
        onItemsChange={onContentPoolChange}
      />
      
      <RoundsSetting
        value={rounds}
        onChange={onRoundsChange}
        disabled={isPlaying}
      />
      
      <DifficultySetting
        value={difficulty}
        onChange={onDifficultyChange}
      />
      
      <SpeedIncreaseSetting
        enabled={increaseSpeed}
        onEnabledChange={onIncreaseSpeedChange}
        percent={speedIncreasePercent}
        onPercentChange={onSpeedIncreasePercentChange}
        disabled={isPlaying}
      />
      
      <ShowImagesImmediatelySetting
        enabled={showImagesImmediately}
        onEnabledChange={onShowImagesImmediatelyChange}
      />
      
      <AudioUploader
        audioUrl={audioUrl}
        onAudioUpload={onAudioUpload}
        onAudioRemove={onAudioRemove}
        bpm={bpm}
        onBpmChange={onBpmChange}
        baseBpm={baseBpm}
        onBaseBpmChange={onBaseBpmChange}
        startTime={startTime}
        onStartTimeChange={onStartTimeChange}
        countdownDuration={countdownDuration}
        onCountdownDurationChange={onCountdownDurationChange}
        isPlaying={isPlaying}
      />
    </div>
  )
}

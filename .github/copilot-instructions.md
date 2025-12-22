# Say the Word on Beat - AI Coding Instructions

## Project Overview
A playful React/TypeScript web app recreating the viral "Say the Word on Beat" challenge. Users create picture grids, sync them to music beats, and export videos. Built with Vite, React 19, and GitHub Spark framework.

## Architecture & Core Patterns

### State Management: GitHub Spark KV Store
- **Use `useKV` hook** from `@github/spark/hooks` for ALL persistent state (not React's useState for persistent data)
- Pattern: `const [value, setValue] = useKV<Type>('unique-key', defaultValue)`
- Examples in [App.tsx](../src/App.tsx): `'bpm-value'`, `'image-pool-v2'`, `'custom-audio'`
- KV state automatically persists to browser storage and enables share links via `window.spark.kv.get/set`
- **Migration pattern**: When changing data structure, increment key version (e.g., `'image-pool-v2'`) to avoid breaking existing stored data

### Dual State Pattern: Persistent + Transient
App.tsx maintains two state layers:
- **Persistent** (useKV): User settings that survive page reload (`bpm`, `difficulty`, `imagePool`, `customAudio`)
- **Transient** (useState): Playback state that resets (`isPlaying`, `activeIndex`, `revealedIndices`, `currentRound`)
- Always null-check KV values with fallbacks: `const currentBpm = bpm ?? 91`

### Audio Architecture
Two parallel audio systems with dynamic BPM:
1. **Default audio**: `DEFAULT_AUDIO_URL` (91 BPM baseline)
2. **Custom audio**: User-uploaded files with automatic BPM analysis

**Key refs**: `customAudioRef`, `defaultAudioRef`, `intervalRef`, `bpmCheckIntervalRef`

**Dynamic BPM Flow**:
- Upload audio → `analyzeBpm()` ([bpmAnalyzer.ts](../src/lib/bpmAnalyzer.ts)) detects tempo changes → stores `BpmAnalysisResult` with segments
- During playback: `getBpmAtTime()` returns current BPM based on audio position → adjusts beat intervals in real-time
- See `calculateRoundBpm()` in [App.tsx](../src/App.tsx#L145-158) for multiplier logic combining detected BPM + user speed adjustment

### Grid Generation System
Located in `generateGridFromPool()` ([App.tsx](../src/App.tsx#L42-96)):
- **Easy**: Pairs of same images (predictable)
- **Medium**: 30% chance to repeat previous image
- **Hard**: Guaranteed different image each card
- Re-generates on difficulty change or round completion
- Falls back to `DEFAULT_ITEMS` (emoji array) when image pool is empty

## Component Organization

### Shadcn/UI Components
All UI primitives in [src/components/ui/](../src/components/ui/):
- Import pattern: `import { Button } from '@/components/ui/button'`
- Configured via [components.json](../components.json) with path alias `@` → `./src`
- Built on Radix UI primitives + class-variance-authority for variants
- Styling via Tailwind CSS 4 (note: uses `@tailwindcss/vite` plugin)

### Feature Components
- **GridCard**: Displays card state (hidden/revealed), handles emoji vs image rendering, shows overlay text for image words
- **ImagePoolManager**: Drag-and-drop image upload (5MB limit), word labeling, persistent via KV store
- **AudioUploader**: File upload → BPM analysis → stores audio as data URL
- **ShareModal**: Generates GUID → stores config in KV → creates shareable URL with `?share=<guid>` param
- **ExportOverlay**: Progress indicator during video recording (uses MediaRecorder API)

## Critical Developer Workflows

### Running the App
```bash
npm run dev        # Vite dev server (usually port 5173)
npm run build      # TypeScript check + Vite build
npm run preview    # Preview production build
```

### BPM Analysis Debugging
When audio sync issues occur:
1. Check `bpmAnalysis` state in React DevTools
2. Verify `silenceOffset` detection (audio may have leading silence)
3. Inspect `segments` array - each segment should have `startTime`, `endTime`, `bpm`
4. Test `getBpmAtTime()` with current audio position: should return BPM for that moment

### Share Link Debugging
Two legacy formats exist:
- **Current**: `?share=<guid>` → reads from KV store via `spark.kv.get('share:${guid}')`
- **Legacy**: `?config=<base64>` → direct JSON decode (deprecated but still supported)
- Migration code in `loadFromUrl()` handles both, normalizes `string[]` to `ImagePoolItem[]`

### Video Export Flow
1. User clicks Export → `ExportOverlay` shows
2. 3-2-1 countdown → fullscreen playback begins
3. MediaRecorder captures canvas + audio
4. Recording completes → auto-downloads .webm file
5. **Critical**: User must keep tab visible (browser throttles hidden tabs)

## Project-Specific Conventions

### Timing & Animation Standards
- All animation durations follow musical intervals: 150ms, 300ms, 600ms
- Beat interval calculation: `(60 / bpm) * 1000` milliseconds
- Active card gets `scale-105` + `border-accent` (see [GridCard.tsx](../src/components/GridCard.tsx))
- Revealed cards persist via `Set<number>` tracking indices

### Fullscreen Playback Mode
When `isFullscreen` is true:
- Overlays entire viewport with `fixed inset-0 z-[100]`
- Shows countdown OR active game grid
- Displays round counter and live BPM
- Stop button always visible (no mid-round edits allowed)

### Type Safety Patterns
```typescript
// Always define interfaces for complex state
interface GridItem {
  content: string
  type: 'emoji' | 'image'
  word?: string  // Optional overlay text for images
}

type Difficulty = 'easy' | 'medium' | 'hard'  // Use literal unions for enums
```

### Error Handling
- Use `sonner` toast library: `toast.success()` / `toast.error()`
- Audio errors: Catch `.play()` promises and show user-friendly messages
- File uploads: Validate MIME type + size before processing
- Share link failures: Show error + fall back to default config

## External Dependencies

### GitHub Spark Framework
Custom framework providing:
- `@github/spark/hooks` → `useKV` for persistent state
- `window.spark.kv` → Direct KV store access for share links
- Vite plugins: `sparkPlugin()`, `createIconImportProxy()` (required, do not remove)

### Audio Analysis Stack
- **Web Audio API**: `AudioContext`, `OfflineAudioContext`, `BiquadFilter`
- **Peak detection algorithm**: Finds rhythmic beats in low-pass filtered audio (150Hz cutoff)
- **Segmentation**: Divides audio into time segments with varying BPM

### UI/UX Libraries
- **Tailwind CSS 4**: New version with `@tailwindcss/vite` (not PostCSS)
- **Framer Motion**: Animation library (not heavily used yet)
- **Phosphor Icons**: `@phosphor-icons/react` with weight variants (`"fill"`, `"bold"`)
- **Radix UI**: Unstyled primitives for accessibility

## Known Edge Cases

1. **Variable tempo audio**: App handles by re-analyzing BPM every 100ms during playback
2. **Long share URLs**: Config stored in KV with GUID to avoid URL length limits
3. **Missing shared images**: Falls back to emoji defaults if data URLs fail to load
4. **BPM extremes**: Clamped to 60-180 range (enforced in UI slider)
5. **Mid-playback edits**: Playback auto-stops if user interacts with controls
6. **Browser compatibility**: MediaRecorder API required for export (graceful degradation needed)

## Design System

### Color Palette (OKLCH)
- Primary: Coral Pink `oklch(0.75 0.15 15)` - CTAs and active states
- Secondary: Sky Blue `oklch(0.72 0.12 230)` - Backgrounds and accents
- Accent: Electric Yellow `oklch(0.85 0.15 95)` - Beat indicators
- Use CSS custom properties via [theme.css](../src/styles/theme.css)

### Typography
- Display: Fredoka (Google Fonts) - Playful headlines
- UI: DM Sans (Google Fonts) - Clean controls/labels
- Never use generic "font-bold" for primary heading - use explicit sizing + shadow

### Animation Philosophy
All interactions should feel "on beat" - snappy, rhythmic, satisfying. Key animations:
- Beat indicator: `scale-105` + accent border (200ms transition)
- Countdown: Custom `countdown-pulse` keyframe (1s ease-out)
- Hover states: Gentle lift with shadow (150ms)

## Testing & Debugging Tips

- **React DevTools**: Monitor `useKV` state changes and re-renders
- **Audio sync issues**: Log current `audioRef.currentTime` vs expected beat timing
- **Grid generation**: Add `console.log` in `generateGridFromPool()` to verify difficulty logic
- **Share links**: Test both `?share=` and `?config=` params for backwards compatibility

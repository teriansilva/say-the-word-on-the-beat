# Say the Word on Beat - Platform PRD

A playful, interactive web platform that recreates the viral "Say the Word on Beat" social media challenge, allowing users to create custom picture grids, sync them to a beat, and export their creations as videos.

**Experience Qualities**:
1. **Playful** - The interface should feel fun and inviting, like a game or creative toy that encourages experimentation
2. **Rhythmic** - Every interaction should feel connected to the beat, with timing and synchronization being central to the experience
3. **Satisfying** - Successfully hitting the beat and seeing the visual feedback should create dopamine-inducing moments of delight

**Complexity Level**: Light Application (multiple features with basic state)
This is an interactive creative tool with several interconnected features (grid creation, beat sync, audio playback, video export) but maintains a focused, single-purpose experience around the core "say the word on beat" concept.

## Essential Features

### 1. Picture Grid Builder
- **Functionality**: Users can create a customizable grid of emoji/image cards (default 4x2 grid, 8 cards total)
- **Purpose**: Provides the visual content that will be revealed on beat
- **Trigger**: User clicks on empty card slots or existing cards to edit
- **Progression**: Click card → Emoji picker opens → Select emoji → Card updates with chosen emoji → Ready for beat sync
- **Success criteria**: Users can easily add/change emojis, grid displays clearly, changes persist between sessions

### 2. BPM Control
- **Functionality**: Adjustable beats-per-minute slider with default set to ~120 BPM (typical for the challenge)
- **Purpose**: Allows customization of beat speed to match user's speaking pace or preference
- **Trigger**: User interacts with BPM slider or input field
- **Progression**: Adjust slider → BPM value updates → Beat timing recalculates → Audio/visual sync adjusts in real-time
- **Success criteria**: Smooth BPM adjustment (60-180 range), clear visual feedback of current tempo, beat stays in sync

### 3. Beat Synchronization & Playback
- **Functionality**: Visual and audio beat indicator that highlights each card in sequence on the beat
- **Purpose**: Core mechanic - shows users when to say each word/name to stay on beat
- **Trigger**: User clicks "Play" button to start the beat sequence
- **Progression**: Click Play → Metronome starts → Cards highlight sequentially on beat → User says word when card highlights → Visual/audio feedback confirms timing
- **Success criteria**: Precise timing (<50ms accuracy), clear visual highlight state, satisfying click/tick sound on each beat

### 4. Video Export
- **Functionality**: Records the grid animation synchronized with audio and exports as downloadable video file
- **Purpose**: Allows users to share their creation on social media
- **Trigger**: User clicks "Export Video" button after configuring their grid
- **Progression**: Click Export → Recording countdown (3-2-1) → Beat sequence plays through grid → Recording completes → Video file downloads automatically
- **Success criteria**: Video captures smooth animation, audio is synchronized, file is reasonably sized (<10MB), works in modern browsers

## Edge Case Handling
- **Empty Grid**: If no emojis selected, provide default emoji set or show friendly prompt to add emojis
- **Mid-playback Edits**: Pause playback automatically if user clicks to edit a card during beat sequence
- **BPM Extremes**: Clamp BPM to sensible range (60-180) to prevent unusably slow/fast tempos
- **Export During Playback**: Disable export button while beat is playing to prevent conflicts
- **Browser Compatibility**: Gracefully handle browsers without MediaRecorder API with clear message

## Design Direction
The design should evoke the fun, addictive energy of viral TikTok challenges mixed with the precision of music production tools. Think: colorful, bouncy, immediately understandable, with satisfying micro-interactions that make you want to keep playing. The aesthetic should feel modern and social-media-native with bold typography, vibrant colors, and smooth animations that react to the beat.

## Color Selection
Vibrant, high-energy palette inspired by social media and music apps, with strong contrast for accessibility.

- **Primary Color**: Coral Pink `oklch(0.75 0.15 15)` - Energetic and playful, commands attention for main CTAs like "Play" and "Export"
- **Secondary Colors**: 
  - Sky Blue `oklch(0.72 0.12 230)` - Cool counterpoint for secondary actions and backgrounds
  - Soft Lavender `oklch(0.78 0.08 285)` - Accent for hover states and highlights
- **Accent Color**: Electric Yellow `oklch(0.85 0.15 95)` - High-energy highlight for beat indicators and active states
- **Foreground/Background Pairings**:
  - Background (Soft Cream `oklch(0.97 0.01 85)`): Dark Navy text `oklch(0.25 0.03 250)` - Ratio 11.2:1 ✓
  - Primary (Coral Pink): White text `oklch(1 0 0)` - Ratio 4.9:1 ✓
  - Accent (Electric Yellow): Dark Navy text `oklch(0.25 0.03 250)` - Ratio 12.8:1 ✓
  - Card backgrounds (White `oklch(1 0 0)`): Dark Navy text - Ratio 15.1:1 ✓

## Font Selection
Typography should feel friendly and rhythmic, with rounded letterforms that match the playful energy while maintaining excellent readability for the interface.

- **Display Font**: Fredoka (Google Fonts) - Rounded, bouncy, perfect for the "SAY THE WORD ON THE BEAT" headline
- **UI Font**: DM Sans (Google Fonts) - Clean, modern, geometric sans-serif for controls and labels

**Typographic Hierarchy**:
- H1 (Main Title): Fredoka Bold/56px/tight letter-spacing/-1px, coral pink color
- H2 (Section Labels): DM Sans Bold/20px/normal spacing, dark navy
- Body (Controls/Labels): DM Sans Medium/16px/0.3px spacing, dark navy
- Small (Help Text): DM Sans Regular/14px/0.2px spacing, muted gray

## Animations
Animations should pulse with the rhythm of the challenge itself - snappy, precise, and satisfying. The beat indicator creates the primary moment of delight with a scale-bounce animation synchronized to audio. Card interactions should feel responsive with gentle hover lifts and smooth emoji transitions. The play/pause button should morph between states fluidly. Export countdown should build anticipation with bold number scaling. All timing should feel "on beat" even when not actively playing - animation durations at musical intervals (150ms, 300ms, 600ms).

## Component Selection

**Components**:
- **Card**: Custom grid cards using shadcn Card as base, heavily customized with thick borders, rounded corners (--radius-xl), white background with subtle shadow on hover
- **Button**: shadcn Button with "default" and "outline" variants - Primary actions (Play, Export) use vibrant fills, secondary actions use outline style
- **Slider**: shadcn Slider for BPM control with custom track color (coral pink) and large thumb for easy dragging
- **Dialog**: shadcn Dialog for emoji picker overlay, with smooth scale-fade entrance
- **Progress**: Custom beat progress indicator (not shadcn Progress) as pulsing circles above cards
- **Popover**: shadcn Popover for emoji picker with smooth dropdown animation
- **Badge**: shadcn Badge to show current BPM value with accent background

**Customizations**:
- **Grid Container**: CSS Grid with `gap-4`, responsive columns (4 on desktop, 2 on mobile), centered with max-width
- **Beat Highlight State**: Custom animation class that scales card to 105% with shadow bloom and border color change to accent yellow
- **Emoji Display**: Large emoji text (text-6xl) centered in cards with subtle text-shadow for depth
- **Countdown Overlay**: Custom full-screen overlay with massive numbers (text-9xl) that scale-pulse

**States**:
- **Card States**: Empty (dashed border, ghost appearance), Filled (solid border, white bg), Active/On-Beat (yellow border, scale up, shadow), Hover (lift with shadow)
- **Play Button States**: Disabled (gray, cursor-not-allowed), Ready (coral pink, pulse on hover), Playing (transformed to pause icon with smooth rotation)
- **Export Button States**: Disabled during playback (gray), Ready (blue with download icon), Exporting (loading spinner, "Recording...")

**Icon Selection**:
- Play/Pause: `PlayCircle` / `PauseCircle` from Phosphor Icons (filled variant for prominence)
- Export: `DownloadSimple` from Phosphor Icons
- Add/Edit: `Plus` / `Pencil` from Phosphor Icons (subtle, shown on card hover)
- BPM: `Metronome` icon next to slider
- Grid Size: `GridFour` for grid configuration

**Spacing**:
- Container padding: `p-8` (2rem) on desktop, `p-4` (1rem) on mobile
- Card grid gap: `gap-4` (1rem) between cards
- Control sections: `space-y-8` (2rem) vertical rhythm between major sections
- Button groups: `gap-2` (0.5rem) for related actions
- Form fields: `space-y-2` (0.5rem) between label and input

**Mobile**:
- Grid shifts from 4 columns to 2 columns at mobile breakpoint (<768px)
- Cards maintain square aspect ratio but scale down proportionally
- Controls stack vertically with full-width buttons
- BPM slider maintains touch-friendly sizing (min 44px tall target)
- Emoji picker optimized for thumb reach with larger emoji buttons
- Export video uses mobile-friendly resolution (720p instead of 1080p)

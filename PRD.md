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
- **Functionality**: Users can create a customizable grid of emoji/image cards (default 4x2 grid, 8 cards total) with support for custom image uploads
- **Purpose**: Provides the visual content that will be revealed on beat
- **Trigger**: User clicks on empty card slots or existing cards to edit
- **Progression**: Click card → Content picker opens → User selects tab (Emoji or Image) → Choose emoji or upload image → Card updates with chosen content → Ready for beat sync
- **Success criteria**: Users can easily add/change emojis or upload images (up to 5MB), grid displays clearly, changes persist between sessions

### 2. BPM Control
- **Functionality**: Adjustable beats-per-minute slider with default set to ~120 BPM (typical for the challenge)
- **Purpose**: Allows customization of beat speed to match user's speaking pace or preference
- **Trigger**: User interacts with BPM slider or input field
- **Progression**: Adjust slider → BPM value updates → Beat timing recalculates → Audio/visual sync adjusts in real-time
- **Success criteria**: Smooth BPM adjustment (60-180 range), clear visual feedback of current tempo, beat stays in sync

### 3. Beat Synchronization & Playback
- **Functionality**: Visual and audio beat indicator that highlights each card in sequence on the beat, with support for custom audio files
- **Purpose**: Core mechanic - shows users when to say each word/name to stay on beat
- **Trigger**: User clicks "Play" button to start the beat sequence
- **Progression**: Click Play → Metronome/custom audio starts → Cards highlight sequentially on beat → User says word when card highlights → Visual/audio feedback confirms timing
- **Success criteria**: Precise timing (<50ms accuracy), clear visual highlight state, satisfying click/tick sound on each beat or custom audio playback

### 4. Video Export
- **Functionality**: Records the grid animation synchronized with audio and exports as downloadable video file, including custom images and audio
- **Purpose**: Allows users to share their creation on social media
- **Trigger**: User clicks "Export Video" button after configuring their grid
- **Progression**: Click Export → Recording countdown (3-2-1) → Beat sequence plays through grid → Recording completes → Video file downloads automatically
- **Success criteria**: Video captures smooth animation with emojis and images, audio is synchronized (default or custom), file is reasonably sized (<10MB), works in modern browsers

### 5. Custom Audio Upload
- **Functionality**: Users can upload their own audio files to replace the default metronome sound
- **Purpose**: Allows personalization and matching to specific challenge variations or creative preferences
- **Trigger**: User clicks "Upload Custom Audio" button in controls section
- **Progression**: Click Upload → File picker opens → Select audio file (MP3, WAV, etc.) → Audio loads → User can preview with play button → Audio is used in beat playback and video export
- **Success criteria**: Accepts common audio formats, file size limit (10MB), audio persists between sessions, clear option to remove and revert to default

### 6. Share Link Generation
- **Functionality**: Users can generate a shareable URL that encodes their complete game configuration (images, BPM, difficulty, custom audio)
- **Purpose**: Enables users to share their custom game setup with others, who can instantly load the same configuration
- **Trigger**: User clicks "Generate Share Link" button in controls section
- **Progression**: Click Generate → Configuration encoded to URL → Shareable link displayed → User clicks Copy → Link copied to clipboard → Recipient opens link → Game loads with shared configuration
- **Success criteria**: All settings (BPM, difficulty, images, audio) persist through URL, configuration loads automatically on page load, copy-to-clipboard works reliably, clear visual feedback when link is generated and copied

## Edge Case Handling
- **Empty Grid**: If no emojis selected, provide default emoji set or show friendly prompt to add emojis
- **Mid-playback Edits**: Pause playback automatically if user clicks to edit a card during beat sequence
- **BPM Extremes**: Clamp BPM to sensible range (60-180) to prevent unusably slow/fast tempos
- **Export During Playback**: Disable export button while beat is playing to prevent conflicts
- **Browser Compatibility**: Gracefully handle browsers without MediaRecorder API with clear message
- **Share Link Too Long**: If configuration exceeds reasonable URL length limits, show helpful error message
- **Invalid Share URL**: If decoding shared configuration fails, show error message and load default settings
- **Missing Images in Share**: If shared link references images that can't be loaded, fall back to default emojis

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
- **Card**: Custom grid cards using shadcn Card as base, heavily customized with thick borders, rounded corners (--radius-xl), white background with subtle shadow on hover, supports both emoji text and image backgrounds
- **Button**: shadcn Button with "default" and "outline" variants - Primary actions (Play, Export) use vibrant fills, secondary actions use outline style
- **Slider**: shadcn Slider for BPM control with custom track color (coral pink) and large thumb for easy dragging
- **Dialog**: shadcn Dialog for content picker overlay, with smooth scale-fade entrance
- **Tabs**: shadcn Tabs for switching between emoji and image upload in content picker
- **Progress**: Custom beat progress indicator (not shadcn Progress) as pulsing circles above cards
- **Popover**: shadcn Popover for content picker with smooth dropdown animation
- **Badge**: shadcn Badge to show current BPM value with accent background
- **Audio Controls**: Custom audio uploader component with file input and preview controls

**Customizations**:
- **Grid Container**: CSS Grid with `gap-4`, responsive columns (4 on desktop, 2 on mobile), centered with max-width
- **Beat Highlight State**: Custom animation class that scales card to 105% with shadow bloom and border color change to accent yellow
- **Emoji Display**: Large emoji text (text-6xl) centered in cards with subtle text-shadow for depth
- **Image Display**: Uploaded images cover full card area with `object-cover` and scale on hover
- **Countdown Overlay**: Custom full-screen overlay with massive numbers (text-9xl) that scale-pulse
- **Audio Uploader**: Custom card-based component with file input, preview controls, and remove button

**States**:
- **Card States**: Empty (dashed border, ghost appearance), Filled (solid border, white bg, emoji or image), Active/On-Beat (yellow border, scale up, shadow), Hover (lift with shadow)
- **Play Button States**: Disabled (gray, cursor-not-allowed), Ready (coral pink, pulse on hover), Playing (transformed to pause icon with smooth rotation)
- **Export Button States**: Disabled during playback (gray), Ready (blue with download icon), Exporting (loading spinner, "Recording...")
- **Audio Upload States**: Empty (default metronome), Loaded (custom audio with preview controls), Error (clear error message)

- **Icon Selection**:
- Play/Pause: `PlayCircle` / `PauseCircle` from Phosphor Icons (filled variant for prominence)
- Export: `DownloadSimple` from Phosphor Icons
- Add/Edit: `Plus` / `Pencil` from Phosphor Icons (subtle, shown on card hover)
- Upload: `Upload` from Phosphor Icons for image and audio uploads
- Audio: `Waveform` from Phosphor Icons for audio section
- Content Types: `Smiley` / `Image` from Phosphor Icons for content picker tabs
- Remove: `X` from Phosphor Icons for removing custom audio
- BPM: `Metronome` icon next to slider
- Grid Size: `GridFour` for grid configuration
- Share: `ShareNetwork` from Phosphor Icons for share link generation
- Copy: `Copy` / `Check` from Phosphor Icons for clipboard feedback

**Spacing**:
- Container padding: `p-8` (2rem) on desktop, `p-4` (1rem) on mobile
- Card grid gap: `gap-4` (1rem) between cards
- Control sections: `space-y-8` (2rem) vertical rhythm between major sections
- Button groups: `gap-2` (0.5rem) for related actions
- Form fields: `space-y-2` (0.5rem) between label and input

**Mobile**:
- Grid shifts from 4 columns to 2 columns at mobile breakpoint (<768px)
- Cards maintain square aspect ratio but scale down proportionally, images scale responsively
- Controls stack vertically with full-width buttons
- BPM slider maintains touch-friendly sizing (min 44px tall target)
- Content picker optimized for thumb reach with larger emoji buttons and easy-to-tap upload button
- Audio uploader stacks vertically with full-width controls
- Export video uses mobile-friendly resolution (720p instead of 1080p)

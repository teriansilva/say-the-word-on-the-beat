# Plan: Node.js + MongoDB Backend for Game Storage

Replace GitHub Spark's KV store with a self-hosted Node.js API and MongoDB database, enabling Docker deployment without Spark dependencies.

## Steps

1. **Create Node.js backend** in `server/` with Express.js and Mongoose ODM, implementing REST endpoints for settings (`GET/PUT /api/settings/:key`), images (`POST/GET/DELETE /api/images`), audio (`POST/GET /api/audio`), and shares (`POST/GET /api/shares/:guid`).

2. **Design MongoDB schema** with 4 collections: `sessions`, `settings` (embedded key-value documents), `images` (binary data with GridFS for large files), `audioFiles` (binary + BPM analysis), and `shares` (config document + media references).

3. **Create `useLocalStorage` hook** in `src/hooks/useLocalStorage.ts` to replace `useKV`, syncing state between localStorage (offline) and API (persistence).

4. **Refactor App.tsx** to use the new hook and API calls for share functionality instead of `window.spark.kv`.

5. **Update Docker Compose** in `docker-compose.yml` to add `mongo` service and `api` service, with nginx proxying `/api/*` to the Node backend.

## Further Considerations

1. **Media storage strategy?** MongoDB GridFS (built-in, handles large files) vs. filesystem/S3 (scalable, more complex)?

## Data Structures

### KV Keys from App.tsx

| KV Key | TypeScript Type | Default Value | Purpose |
|--------|-----------------|---------------|---------|
| `'image-pool-v2'` | `ImagePoolItem[]` | `[]` | User's uploaded images with optional word labels |
| `'difficulty'` | `Difficulty` (`'easy' \| 'medium' \| 'hard'`) | `'medium'` | Game difficulty level |
| `'grid-items'` | `GridItem[]` | `DEFAULT_ITEMS` (8 emoji items) | Current grid configuration |
| `'bpm-value'` | `number` | `91` | User-adjusted BPM/tempo value |
| `'base-bpm'` | `number` | `91` | Detected BPM of uploaded audio |
| `'custom-audio'` | `string \| null` | `null` | User-uploaded audio as base64 data URL |
| `'bpm-analysis'` | `BpmAnalysisResult \| null` | `null` | Full BPM analysis with segments |
| `'rounds'` | `number` | `1` | Number of game rounds |
| `'increase-speed'` | `boolean` | `false` | Whether speed increases each round |
| `'speed-increase-percent'` | `number` | `5` | Percentage speed increase per round |

### Data Structures

```typescript
interface ImagePoolItem {
  url: string    // Base64 data URL of image
  word?: string  // Optional word label (max 20 chars)
}

interface BpmAnalysisResult {
  segments: BpmSegment[]  // Array of tempo segments
  averageBpm: number      // Rounded average BPM
  silenceOffset: number   // Seconds of leading silence
}

interface BpmSegment {
  startTime: number  // Segment start in seconds
  endTime: number    // Segment end in seconds  
  bpm: number        // Detected BPM for this segment
}

interface GridItem {
  content: string         // Emoji character OR image URL
  type: 'emoji' | 'image' // Content type
  word?: string           // Display word for images
}
```

## Proposed MongoDB Schema

```javascript
// sessions collection
{
  _id: ObjectId,
  createdAt: Date  // default: new Date()
}

// settings collection
{
  _id: ObjectId,
  sessionId: ObjectId,  // ref: 'sessions'
  key: String,          // e.g., 'bpm-value', 'difficulty'
  value: Mixed,         // any JSON value
  updatedAt: Date
}
// Index: { sessionId: 1, key: 1 } unique

// images collection (for small images, or use GridFS for large)
{
  _id: ObjectId,
  sessionId: ObjectId,  // ref: 'sessions'
  data: Buffer,         // binary image data (or GridFS fileId)
  mimeType: String,
  word: String,         // optional, max 20 chars
  createdAt: Date
}

// audioFiles collection
{
  _id: ObjectId,
  sessionId: ObjectId,  // ref: 'sessions'
  data: Buffer,         // binary audio data (or GridFS fileId)
  mimeType: String,
  bpmAnalysis: {
    segments: [{ startTime: Number, endTime: Number, bpm: Number }],
    averageBpm: Number,
    silenceOffset: Number
  },
  createdAt: Date
}

// shares collection
{
  _id: ObjectId,
  guid: String,         // unique share identifier
  config: Object,       // full game configuration
  imageIds: [ObjectId], // refs: 'images'
  audioId: ObjectId,    // ref: 'audioFiles'
  createdAt: Date,
  expiresAt: Date       // optional TTL
}
// Index: { guid: 1 } unique
// TTL Index: { expiresAt: 1 } expireAfterSeconds: 0
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/sessions` | Create anonymous session, returns session ID |
| GET | `/api/settings/:key` | Get setting value (requires session cookie) |
| PUT | `/api/settings/:key` | Set setting value |
| POST | `/api/images` | Upload image (multipart/form-data) |
| GET | `/api/images/:id` | Get image binary |
| DELETE | `/api/images/:id` | Delete image |
| GET | `/api/images` | List all images for session |
| POST | `/api/audio` | Upload audio file |
| GET | `/api/audio/:id` | Get audio binary |
| DELETE | `/api/audio/:id` | Delete audio |
| POST | `/api/shares` | Create share config |
| GET | `/api/shares/:guid` | Get share config |

## Estimated Data Sizes

| Data Type | Size Estimate | Notes |
|-----------|---------------|-------|
| Single Image | 50KB - 2MB | 5MB limit per file, up to 8 images |
| Image Pool (max) | ~16MB | 8 images × ~2MB worst case |
| Custom Audio | 1MB - 10MB | 10MB file size limit |
| BPM Analysis | ~1-5KB | JSON with ~20-40 segments |
| Share Config (full) | 17-26MB | Includes all images + audio |
| Settings Only | ~500 bytes | Without images/audio |

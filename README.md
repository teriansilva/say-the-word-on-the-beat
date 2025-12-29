# Say the Word on Beat 🎵

A playful, interactive web platform that recreates the viral "Say the Word on Beat" social media challenge. Create custom picture grids, sync them to a beat, and share your creations!

## ✨ Features

- **🎨 Content Pool**: Add emojis or custom images (up to 8 items) with optional custom words
- **🎲 Random Emojis**: When no content is set, the game uses random emojis that shuffle each round
- **🎵 BPM Control & Audio Analysis**: Adjust tempo with intelligent BPM detection for custom audio files
- **⏱️ Beat Synchronization**: Visual and audio beat indicators that highlight each card in sequence
- **🔄 Multiple Rounds**: Play 1-10 rounds with automatic grid regeneration and mixing
- **⚡ Speed Increase**: Optional progressive speed increase per round (1-10%)
- **🎚️ Difficulty Modes**: Easy (pairs), Medium (slight variance), or Hard (all different)
- **🎧 Custom Audio Upload**: Upload your own audio files with automatic BPM analysis
- **⏰ Audio Start Time**: Set custom start position based on actual audio length
- **⏱️ Countdown Duration**: Configurable countdown before game starts
- **🎉 Completion Celebration**: Animated finish screen with confetti and celebration sound
- **🌐 Community Games**: Browse and play publicly shared games from other users
- **❤️ Like System**: Like and discover popular community games
- **🔗 Share Links**: Generate shareable URLs encoding your complete game configuration
- **🔄 Reset**: One-click reset to restore all settings to defaults
- **⚡ Debounced Controls**: Smooth slider interactions with rate-limit-friendly persistence

## 👀 Demo
See the platform live here: **[saywordsonbeat.com](https://saywordsonbeat.com/)**

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or your preferred package manager

### Installation

```bash
# Clone the repository
git clone https://github.com/teriansilva/say-the-word-on-beat.git

# Navigate to the project directory
cd say-the-word-on-beat

# Install dependencies
npm install

# Start the development server
npm run dev
```

The application will be available at `http://localhost:5173` (or the port Vite assigns).

### 🐳 Docker Deployment

For containerized deployment using Docker:

```bash
# Development (with hot reload and debugging)
docker compose -f docker-compose.dev.yml up -d

# Production (optimized with health checks)
docker compose -f docker-compose.prod.yml up -d

# The application will be available at http://localhost:8091
# API available at http://localhost:3847
```

#### Container Architecture

| Service | Description | Port |
|---------|-------------|------|
| `web` | Nginx serving React frontend | 8091 |
| `api` | Node.js Express API server | 3847 |
| `mongo` | MongoDB database | 27847 (dev only) |

#### Persistent Volumes

- `mongo-data` - MongoDB database files
- `mongo-config` - MongoDB configuration
- `api-logs` - API logs including cleanup task output

#### Automatic Cleanup

A cron job runs daily at 3:00 AM to clean up:
- Games not played for 7+ days (configurable via `STALE_DAYS`)
- Orphaned images and audio files
- Inactive user sessions

To run cleanup manually:
```bash
docker exec say-the-word-api sh -c "MONGODB_URI=mongodb://mongo:27017/saytheword node src/tasks/cleanup.js"
```

See [DOCKER.md](DOCKER.md) for complete Docker deployment documentation.

## 🛠️ Tech Stack

- **Frontend Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI primitives with shadcn/ui
- **Icons**: Phosphor Icons
- **Animations**: Framer Motion
- **Backend**: Node.js with Express
- **Database**: MongoDB
- **Containerization**: Docker with multi-stage builds

## 📖 How It Works

1. **Build Your Grid**: Click on cards to add emojis or upload custom images
2. **Set the Beat**: Adjust BPM or upload custom audio for automatic tempo detection
3. **Play & Practice**: Hit play to see the beat indicator highlight each card in rhythm
4. **Share Your Creation**: Generate a link to share, or publish to the community
5. **Browse Community**: Discover and play games created by others

## 🎯 Project Structure

```
say-the-word-on-beat/
├── src/                    # Frontend React source files
│   ├── components/         # React components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility functions
│   └── styles/             # CSS and theme files
├── server/                 # Backend API server
│   └── src/
│       ├── models/         # MongoDB models
│       ├── routes/         # Express routes
│       ├── middleware/     # Express middleware
│       └── tasks/          # Scheduled tasks (cleanup)
├── public/                 # Static assets
├── docker-compose.dev.yml  # Development Docker config
├── docker-compose.prod.yml # Production Docker config
└── package.json            # Dependencies and scripts
```

## 🧪 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Server Scripts

- `npm run start` - Start API server
- `npm run dev` - Start with nodemon (auto-reload)
- `npm run cleanup` - Run database cleanup manually

## 🤝 Contributing

This is a personal project, but feel free to fork and create your own variations!

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

The Spark Template files and resources from GitHub are licensed under the terms of the MIT license, Copyright GitHub, Inc.

## 🎉 Acknowledgments

Inspired by the viral "Say the Word on Beat" social media challenge that brings rhythm and joy to picture grids!

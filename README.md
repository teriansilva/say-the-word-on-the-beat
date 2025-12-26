# Say the Word on Beat 🎵

A playful, interactive web platform that recreates the viral "Say the Word on Beat" social media challenge. Create custom picture grids, sync them to a beat, and export your creations to share!

## ✨ Features

- **🎨 Picture Grid Builder**: Create customizable grids with emojis or custom images (default 4x2, 8 cards)
- **🎵 Spotify Integration**: Search and select songs directly from Spotify with automatic BPM detection
- **🎵 BPM Control & Audio Analysis**: Adjust tempo with intelligent BPM detection
- **⏱️ Beat Synchronization**: Visual and audio beat indicators that highlight each card in sequence
- **🎥 Video Export**: Record and download your grid animation synchronized with audio
- **🔗 Share Links**: Generate shareable URLs encoding your complete game configuration

## 👀 Demo
See the platform live here: **[saywordsonbeat.com](https://saywordsonbeat.com/)**

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or your preferred package manager
- Spotify API credentials (for song search feature)

### Installation

```bash
# Clone the repository
git clone https://github.com/teriansilva/say-the-word-on-beat.git

# Navigate to the project directory
cd say-the-word-on-beat

# Install dependencies
npm install

# Set up Spotify API credentials (see below)
cp .env.example .env
# Edit .env and add your Spotify credentials

# Start the development server
npm run dev
```

The application will be available at `http://localhost:5173` (or the port Vite assigns).

### 🎵 Spotify API Setup

To enable the Spotify song search feature:

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Log in with your Spotify account
3. Click "Create an App"
4. Fill in the app name and description
5. Once created, you'll see your **Client ID** and **Client Secret**
6. Copy these credentials to your `.env` file:

```env
VITE_SPOTIFY_CLIENT_ID=your_client_id_here
VITE_SPOTIFY_CLIENT_SECRET=your_client_secret_here
```

⚠️ **Security Warning for Production**: The current implementation uses Spotify's Client Credentials flow with the secret exposed in the frontend code. This is **only suitable for development/demonstration purposes**. 

For production deployments, you should:
- Implement a backend proxy server to handle Spotify authentication
- Never expose your Client Secret in client-side code
- Use environment variables on the server side only
- Consider implementing rate limiting and request validation

See the [Spotify Authorization Guide](https://developer.spotify.com/documentation/web-api/concepts/authorization) for secure production implementations.

### 🐳 Docker Deployment

For production deployment using Docker:

```bash
# Using Docker Compose (recommended)
docker compose up -d

# The application will be available at http://localhost:8080
```

See [DOCKER.md](DOCKER.md) for complete Docker deployment documentation including:
- Multi-stage build process
- Nginx configuration
- Health checks
- Production best practices

## 🛠️ Tech Stack

- **Frontend Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI primitives with shadcn/ui
- **Icons**: Phosphor Icons
- **Animations**: Framer Motion
- **State Management**: TanStack Query
- **Audio API**: Spotify Web API (for song search and BPM detection)

## 📖 How It Works

1. **Build Your Grid**: Upload custom images to create your picture grid
2. **Choose Your Song**: Search Spotify for any song - BPM is automatically detected
3. **Adjust Settings**: Fine-tune tempo, difficulty, and speed progression
4. **Play & Practice**: Hit play to see the beat indicator highlight each card in rhythm
5. **Export & Share**: Record your animation and share your creation!

## 🎯 Project Structure

```
say-the-word-on-beat/
├── src/               # Source files
├── public/            # Static assets
├── PRD.md            # Product Requirements Document
└── package.json      # Dependencies and scripts
```

## 🧪 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🤝 Contributing

This is a personal project, but feel free to fork and create your own variations!

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

The Spark Template files and resources from GitHub are licensed under the terms of the MIT license, Copyright GitHub, Inc.

## 🎉 Acknowledgments

Inspired by the viral "Say the Word on Beat" social media challenge that brings rhythm and joy to picture grids!

---

Built with ❤️ using [GitHub Spark](https://githubnext.com/projects/spark)

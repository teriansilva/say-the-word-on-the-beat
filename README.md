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
- MongoDB (for backend data storage)
- Spotify API credentials (for song search feature)

### Installation

```bash
# Clone the repository
git clone https://github.com/teriansilva/say-the-word-on-beat.git

# Navigate to the project directory
cd say-the-word-on-beat

# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### 🎵 Spotify API Setup

The application uses a secure backend proxy to communicate with Spotify's API, keeping your credentials safe on the server.

1. **Get Spotify Credentials:**
   - Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
   - Log in with your Spotify account
   - Click "Create an App"
   - Fill in the app name and description
   - Once created, you'll see your **Client ID** and **Client Secret**

2. **Configure Backend:**
   ```bash
   cd server
   cp .env.example .env
   # Edit server/.env and add your Spotify credentials:
   # SPOTIFY_CLIENT_ID=your_client_id_here
   # SPOTIFY_CLIENT_SECRET=your_client_secret_here
   ```

3. **Configure Frontend (optional):**
   ```bash
   # From project root
   cp .env.example .env
   # Edit .env if you need to change the API URL
   # VITE_API_URL=http://localhost:3001/api
   ```

### Running the Application

You need to run both the backend and frontend:

```bash
# Terminal 1 - Start the backend server
cd server
npm run dev

# Terminal 2 - Start the frontend
npm run dev
```

- **Backend API**: http://localhost:3001
- **Frontend**: http://localhost:5173 (or the port Vite assigns)

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

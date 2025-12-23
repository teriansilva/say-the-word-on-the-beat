# Say the Word on Beat 🎵

A playful, interactive web platform that recreates the viral "Say the Word on Beat" social media challenge. Create custom picture grids, sync them to a beat, and export your creations to share!

## ✨ Features

- **🎨 Picture Grid Builder**: Create customizable grids with emojis or custom images (default 4x2, 8 cards)
- **🎵 BPM Control & Audio Analysis**: Adjust tempo with intelligent BPM detection for custom audio files
- **⏱️ Beat Synchronization**: Visual and audio beat indicators that highlight each card in sequence
- **🎥 Video Export**: Record and download your grid animation synchronized with audio
- **🎧 Custom Audio Upload**: Upload your own audio files with automatic BPM analysis
- **🔗 Share Links**: Generate shareable URLs encoding your complete game configuration

## 👀DEMO
[saywordsonbeat.com](https://saywordsonbeat.com/)

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

## 📖 How It Works

1. **Build Your Grid**: Click on cards to add emojis or upload custom images
2. **Set the Beat**: Adjust BPM or upload custom audio for automatic tempo detection
3. **Play & Practice**: Hit play to see the beat indicator highlight each card in rhythm
4. **Export & Share**: Record your animation and share your creation!

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

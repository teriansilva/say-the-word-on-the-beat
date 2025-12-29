# Docker Deployment Guide

This guide explains how to deploy the Say the Word on Beat application using Docker and Docker Compose.

## Architecture Overview

The application consists of three services:
- **web**: Nginx serving the React frontend (port 8091)
- **api**: Node.js/Express backend API (port 3847)
- **mongo**: MongoDB database for persistent storage

## Prerequisites

- Docker Engine 20.10.0 or higher
- Docker Compose 2.0.0 or higher

## Quick Start

### Development Mode (Recommended for local development)

```bash
docker-compose -f docker-compose.dev.yml up -d --build
```

**Features:**
- Debug port 9229 exposed for Node.js debugging
- Source code mounted for live changes
- MongoDB exposed on port 27017 for direct access
- Verbose Express logging enabled
- No health checks (faster startup)

### Production Mode

```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

**Features:**
- Health checks on all services
- `restart: always` policy
- No debug ports or volumes exposed
- `NODE_ENV=production`
- MongoDB not exposed externally

### Default (Simple Development)

```bash
docker-compose up -d --build
```

## Accessing the Application

| Service | URL | Description |
|---------|-----|-------------|
| Web App | http://localhost:8091 | Main application |
| API | http://localhost:3847 | Backend REST API |
| API Health | http://localhost:3847/api/health | Health check endpoint |
| MongoDB | mongodb://localhost:27847 | Database (dev only) |

## Docker Compose Files

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Default minimal development setup |
| `docker-compose.dev.yml` | Full development with debugging |
| `docker-compose.prod.yml` | Production-ready configuration |

## Stop the Application

```bash
# Stop containers (keeps data)
docker-compose down

# Stop and remove volumes (deletes all data)
docker-compose down -v
```

## Docker Architecture

The application uses a multi-stage Docker build for both frontend and backend:

### Frontend (web)
1. **Builder Stage**: Uses Node.js 20 Alpine to build the React app with Vite
2. **Production Stage**: Uses Nginx Alpine to serve static files and proxy API requests

### Backend (api)
- Node.js 20 Alpine running Express.js
- Connects to MongoDB for data persistence
- Handles settings, images, audio, and share configurations

### Database (mongo)
- MongoDB 7 for persistent storage
- Data stored in Docker volume `mongo-data`

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/sessions` | Create anonymous session |
| GET/PUT | `/api/settings/:key` | Get/set user settings |
| GET/POST/DELETE | `/api/images` | Manage uploaded images |
| GET/POST/DELETE | `/api/audio` | Manage uploaded audio |
| GET/POST | `/api/shares/:guid` | Share configurations |
| GET | `/api/health` | Health check |

## Configuration

### Port Configuration

Default ports:
- Web: 8091
- API: 3847
- MongoDB: 27847 (dev only)

To change ports, edit the appropriate docker-compose file:

```yaml
ports:
  - "YOUR_PORT:80"  # Web
  - "YOUR_PORT:3847"  # API
```

### Environment Variables

| Variable | Service | Description |
|----------|---------|-------------|
| `NODE_ENV` | web, api | `development` or `production` |
| `PORT` | api | API server port (default: 3847) |
| `MONGODB_URI` | api | MongoDB connection string |
| `CORS_ORIGIN` | api | Allowed CORS origin |
| `DEBUG` | api | Debug logging (dev only) |
| `STALE_DAYS` | api | Days before inactive games are cleaned up (default: 7) |

## Health Checks

The application includes a health check endpoint at `/health`. Docker will automatically monitor this endpoint to ensure the application is running correctly.

You can manually check the health status:
```bash
docker ps
```

Look for the `STATUS` column which will show `healthy` or `unhealthy`.

## Nginx Configuration

The application uses a custom Nginx configuration (`nginx.conf`) that includes:

- **Gzip compression** for faster load times
- **Security headers** (X-Frame-Options, CSP, etc.)
- **Static asset caching** (1 year for immutable assets)
- **SPA routing support** (all routes redirect to index.html)
- **API proxy** to Node.js backend (`/api/*` → `http://api:3847`)
- **Health check endpoint** at `/health`

To modify the Nginx configuration, edit `nginx.conf` and rebuild the image.

## Troubleshooting

### View logs for all services
```bash
docker-compose logs -f
```

### View logs for specific service
```bash
docker-compose logs -f api
docker-compose logs -f web
docker-compose logs -f mongo
```

### Access container shell
```bash
docker-compose exec api sh
docker-compose exec web sh
docker-compose exec mongo mongosh
```

### Rebuild after code changes
```bash
docker-compose -f docker-compose.dev.yml up -d --build
```

### Check MongoDB data
```bash
docker-compose exec mongo mongosh saytheword --eval "db.settings.find()"
```

### Reset database
```bash
docker-compose down -v
docker-compose -f docker-compose.dev.yml up -d --build
```

## Security Considerations

- The container runs as the default nginx user (non-root)
- Security headers are configured in Nginx
- Only port 80 (mapped to 8080) is exposed
- No sensitive data is baked into the image
- Health checks ensure the application is responsive

## Performance Optimization

The Docker setup includes several optimizations:

- Multi-stage build reduces final image size
- Nginx serves static files efficiently
- Gzip compression enabled for text-based assets
- Aggressive caching headers for static assets
- Health checks prevent routing to unhealthy containers

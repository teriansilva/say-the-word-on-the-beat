# Docker Deployment Guide

This guide explains how to deploy the Say the Word on Beat application using Docker and Docker Compose.

## Prerequisites

- Docker Engine 20.10.0 or higher
- Docker Compose 2.0.0 or higher

## Quick Start

### Using Docker Compose (Recommended)

1. **Build and start the application:**
   ```bash
   docker-compose up -d
   ```

2. **Access the application:**
   Open your browser and navigate to `http://localhost:8080`

3. **Stop the application:**
   ```bash
   docker-compose down
   ```

### Using Docker CLI

1. **Build the Docker image:**
   ```bash
   docker build -t say-the-word-on-beat:latest .
   ```

2. **Run the container:**
   ```bash
   docker run -d -p 8080:80 --name say-the-word-on-beat say-the-word-on-beat:latest
   ```

3. **Stop the container:**
   ```bash
   docker stop say-the-word-on-beat
   docker rm say-the-word-on-beat
   ```

## Docker Architecture

The application uses a multi-stage Docker build:

1. **Builder Stage**: Uses Node.js 18 Alpine to build the application with Vite
2. **Production Stage**: Uses Nginx Alpine to serve the static files

This approach results in:
- Small image size (~25-30MB)
- Fast startup times
- Production-optimized serving with Nginx

## Configuration

### Port Configuration

By default, the application is exposed on port 8080. To change this, edit the `docker-compose.yml` file:

```yaml
ports:
  - "YOUR_PORT:80"  # Change YOUR_PORT to your desired port
```

### Environment Variables

The application runs in production mode. To add custom environment variables:

1. Create a `.env` file in the project root
2. Add your variables:
   ```
   VITE_API_URL=https://api.example.com
   ```
3. Update `docker-compose.yml` to include the env file:
   ```yaml
   env_file:
     - .env
   ```

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
- **Health check endpoint** at `/health`

To modify the Nginx configuration, edit `nginx.conf` and rebuild the image.

## Production Deployment

For production environments:

1. **Use a reverse proxy** (like Traefik or another Nginx instance) for HTTPS termination
2. **Set up monitoring** using the health check endpoint
3. **Configure resource limits** in docker-compose.yml:
   ```yaml
   deploy:
     resources:
       limits:
         cpus: '1.0'
         memory: 512M
       reservations:
         cpus: '0.5'
         memory: 256M
   ```

4. **Enable logging** with a logging driver:
   ```yaml
   logging:
     driver: "json-file"
     options:
       max-size: "10m"
       max-file: "3"
   ```

## Troubleshooting

### View application logs
```bash
docker-compose logs -f
```

### Access container shell
```bash
docker-compose exec web sh
```

### Rebuild after code changes
```bash
docker-compose up -d --build
```

### Check health status
```bash
docker inspect say-the-word-on-beat | grep -A 10 Health
```

## Updating the Application

1. Pull the latest code
2. Rebuild and restart:
   ```bash
   docker-compose down
   docker-compose up -d --build
   ```

## Cleanup

Remove all containers, images, and volumes:
```bash
docker-compose down -v
docker rmi say-the-word-on-beat:latest
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

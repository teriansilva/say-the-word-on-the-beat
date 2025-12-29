# Node.js API server
FROM node:20-alpine

WORKDIR /app

# Install cron for scheduled tasks
RUN apk add --no-cache dcron

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy source code
COPY src/ ./src/

# Copy crontab file
COPY crontab /etc/crontabs/root

# Create startup script
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'crond -b -l 2' >> /app/start.sh && \
    echo 'node src/index.js' >> /app/start.sh && \
    chmod +x /app/start.sh

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3001/api/health || exit 1

# Start server with cron
CMD ["/app/start.sh"]

# Multi-stage build for Guardian Admin UI
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --production=false

# Copy source code
COPY . .

# Build the React app
RUN npm run build

# Production stage with Nginx
FROM nginx:alpine

# Install Node.js for the proxy server (if needed)
RUN apk add --no-cache nodejs npm

# Create app user
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

# Create directories
RUN mkdir -p /app/server /var/log/nginx
WORKDIR /app

# Copy built React app to Nginx html directory
COPY --from=builder /app/build /usr/share/nginx/html

# Copy server files for proxy functionality
COPY server ./server
COPY --from=builder /app/package*.json ./

# Install only proxy server dependencies
RUN npm ci --only=production

# Create custom Nginx configuration
RUN echo 'server { \
    listen 80; \
    server_name _; \
    root /usr/share/nginx/html; \
    index index.html; \
    \
    # React Router support \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    \
    # API proxy \
    location /api/ { \
        proxy_pass http://localhost:3002; \
        proxy_http_version 1.1; \
        proxy_set_header Upgrade $http_upgrade; \
        proxy_set_header Connection upgrade; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \
        proxy_set_header X-Forwarded-Proto $scheme; \
        proxy_cache_bypass $http_upgrade; \
    } \
    \
    # Static file caching \
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ { \
        expires 1y; \
        add_header Cache-Control "public, immutable"; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Create startup script
RUN echo '#!/bin/sh \
set -e \
\
# Start proxy server in background \
if [ -f /app/server/server.js ]; then \
    echo "Starting proxy server..." \
    node /app/server/server.js & \
fi \
\
# Start Nginx \
echo "Starting Nginx..." \
nginx -g "daemon off;"' > /app/start.sh && \
chmod +x /app/start.sh

# Change ownership
RUN chown -R appuser:appgroup /app /usr/share/nginx/html /var/log/nginx /var/cache/nginx

# Expose port
EXPOSE 80

# Labels for better Docker management
LABEL maintainer="Guardian Admin UI"
LABEL service="guardian-admin-ui"
LABEL version="1.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80 || exit 1

# Start services
CMD ["/app/start.sh"]
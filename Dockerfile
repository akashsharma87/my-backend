# Multi-stage Docker build for Engineer.CV
# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies for build)
RUN npm ci && npm cache clean --force

# Copy source code
COPY . .

# Build frontend
RUN npm run build

# Stage 2: Production image
FROM node:20-alpine AS production

# Install system dependencies
RUN apk add --no-cache \
    dumb-init \
    curl \
    tzdata \
    && rm -rf /var/cache/apk/*

# Create app user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S engineer-cv -u 1001 -G nodejs

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production && \
    npm cache clean --force && \
    rm -rf /tmp/*

# Copy built frontend from previous stage
COPY --from=frontend-builder /app/dist ./dist

# Copy server files
COPY server ./server
COPY server.js ./
# COPY ecosystem.config.js ./ # Not needed in Docker - Docker handles process management

# Copy configuration files (scripts not needed in production container)
# COPY scripts ./scripts

# Create necessary directories
RUN mkdir -p logs uploads backups && \
    chown -R engineer-cv:nodejs /app

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Switch to non-root user
USER engineer-cv

# Expose port
EXPOSE 3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "server.js"]

# Labels for metadata
LABEL maintainer="Engineer.CV Team"
LABEL version="1.0.0"
LABEL description="Engineer.CV - Resume Management Platform"
LABEL org.opencontainers.image.source="https://github.com/your-username/engineer.cv"

# syntax=docker/dockerfile:1
FROM node:20-alpine AS base

# Install curl for healthcheck
RUN apk add --no-cache curl

WORKDIR /usr/src/app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy application source
COPY src/ ./src/

# Change ownership to non-root user 'node'
RUN chown -R node:node /usr/src/app

USER node

# Default build arguments and environment variables
ARG APP_VERSION=1.0.0
ARG FAILURE_MODE=none
ARG FAILURE_ERROR_RATE=1.0
ARG FAILURE_LATENCY_MS=1500

ENV NODE_ENV=production \
    PORT=8080 \
    APP_VERSION=${APP_VERSION} \
    FAILURE_MODE=${FAILURE_MODE} \
    FAILURE_ERROR_RATE=${FAILURE_ERROR_RATE} \
    FAILURE_LATENCY_MS=${FAILURE_LATENCY_MS}

EXPOSE 8080

HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

CMD ["node", "src/server.js"]

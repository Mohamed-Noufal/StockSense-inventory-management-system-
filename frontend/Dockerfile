# ==============================================================================
# StockSense — Frontend Container Image (Multi-Stage Build)
# ==============================================================================

# Stage 1: Build Application Bundle
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency specifications
COPY package.json package-lock.json* ./

# Install dependencies cleanly
RUN npm ci || npm install

# Copy application source code
COPY . .

# Build production assets
RUN npm run build

# Stage 2: Production Nginx Server
FROM nginx:alpine

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy custom Nginx virtual host configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled SPA bundle from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=3s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]

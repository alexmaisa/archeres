# Stage 1: Build the static Next.js application
FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm package manager
RUN npm install -g pnpm

# Pre-cache dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts

# Copy source code and build Static Export
COPY . .
RUN pnpm run build

# Stage 2: Deploy static assets onto lightweight Nginx web server
FROM nginx:1.25-alpine

# Remove default configuration and copy custom reverse proxy configuration
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled static export assets from Stage 1
COPY --from=builder /app/out /usr/share/nginx/html

# Expose Nginx port
EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]

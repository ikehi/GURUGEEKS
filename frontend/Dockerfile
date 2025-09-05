# Development stage (optimized for development)
FROM node:18-alpine

# Set environment variables
ENV NODE_ENV=development
ENV VITE_API_URL=http://localhost:8000

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies with optimizations
RUN npm ci --only=production --silent \
    && npm cache clean --force

# Install dev dependencies
RUN npm ci --silent

# Copy source code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs \
    && adduser -S nextjs -u 1001 \
    && chown -R nextjs:nodejs /app
USER nextjs

# Expose port
EXPOSE 3000

# Start development server with optimizations
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

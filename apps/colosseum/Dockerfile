FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy built application
COPY dist ./dist

# Copy environment template
COPY .env.example ./

# Create logs directory
RUN mkdir -p logs

# Expose port
EXPOSE 7777

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:7777/health || exit 1

# Set user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S colosseum -u 1001
USER colosseum

# Start the application
CMD ["node", "dist/server.js"]
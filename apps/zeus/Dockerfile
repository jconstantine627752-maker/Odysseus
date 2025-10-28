# Zeus Trading Engine Dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Create non-root user for security
RUN addgroup -g 1001 -S zeus && \
    adduser -S zeus -u 1001

# Change ownership of the app directory
RUN chown -R zeus:zeus /app

# Switch to non-root user
USER zeus

# Expose port
EXPOSE 8888

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8888/health || exit 1

# Start the application
CMD ["npm", "start"]
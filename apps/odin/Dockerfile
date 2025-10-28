FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
COPY tsconfig.json ./
RUN npm ci --only=production

# Copy source code
COPY src/ ./src/

# Build TypeScript
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S odin && \
    adduser -S odin -u 1001

# Create logs directory
RUN mkdir -p /app/logs && chown -R odin:odin /app/logs

# Switch to non-root user
USER odin

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:${ODIN_PORT:-9999}/health || exit 1

# Expose port
EXPOSE 9999

# Start the application
CMD ["npm", "start"]
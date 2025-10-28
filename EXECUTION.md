# Odysseus Execution Guide

## Technical Overview

Odysseus is a containerized multi-service DeFi trading platform built with Docker Compose orchestration. The system consists of three primary microservices:

- **Python Trading Bot** (`bot` service) - Solana-based pump.fun token discovery and execution engine
- **Odin X402 Module** (`odin` service) - Node.js/TypeScript service providing X402 protocol integration with Zeus trading engine
- **Redis Cache Layer** (`redis` service) - In-memory data structure store for session management and caching

## Prerequisites

1. **Docker Desktop** - Container runtime environment
2. **API Keys & RPC Endpoints** - You must provide your own:
   - Solana RPC URL (Alchemy, QuickNode, or similar)
   - PumpPortal API key
   - Bitquery GraphQL API key
   - Jupiter Aggregator access
   - RugCheck API credentials
   - Cross-chain RPC endpoints (Ethereum, Polygon, Arbitrum, Optimism)
   - Optional: Chainlink, Band Protocol, Pyth Network feeds

## Configuration

Environment files are pre-configured with placeholder values. **You must replace all API keys and RPC URLs with your own credentials:**

```bash
# Configure main application
cp .env.example .env
# Edit .env with your API keys

# Configure Odin X402 module  
cp apps/odin/.env.example apps/odin/.env
# Edit apps/odin/.env with your credentials
```

## Execution

```bash
# Validate configuration
docker compose config

# Start all services
docker compose up --build

# Access endpoints:
# - Odysseus Bot: localhost:3000
# - Zeus/Odin API: localhost:9999  
# - Solana Bot: localhost:8000
# - Redis: localhost:6379
```

## Service Dependencies

- `odin` service requires Redis for caching and session management
- All services share environment variables via `.env` file
- Services communicate via internal `odysseus-network` bridge network
- Persistent volumes maintain Redis data and Odin logs across container restarts

**Note:** This is a development/testing configuration. Production deployment requires additional security hardening, secrets management, and monitoring infrastructure.
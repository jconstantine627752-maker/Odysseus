# Environment Setup Guide

## Security Notice
This project uses environment variables for configuration. **Never commit actual `.env` files to version control.**

## Setup Instructions

### 1. Copy Example Files
```bash
# Root level
cp .env.example .env

# Odin app
cp apps/odin/.env.example apps/odin/.env

# Zeus app  
cp apps/zeus/.env.example apps/zeus/.env
```

### 2. Configure Your Environment

#### Required API Keys & Secrets
- **Solana Private Key**: Your Solana wallet private key (use burner wallets for testing)
- **PumpPortal API Key**: Get from [PumpPortal](https://pumpportal.fun)
- **Bitquery API Key**: Get from [Bitquery](https://bitquery.io)
- **RPC URLs**: Alchemy, Infura, or QuickNode endpoints
- **JWT Secret**: Generate with `openssl rand -hex 32`
- **Encryption Key**: Generate with `openssl rand -hex 32`

#### For Production
- Use strong, unique secrets for all keys
- Enable 2FA on all API provider accounts
- Use hardware wallets or secure key management
- Set `PAPER_TRADING=false` only when ready for live trading
- Configure proper monitoring and alerting

#### For Development
- Keep `PAPER_TRADING=true`
- Use testnet RPC URLs
- Use burner wallets with minimal funds
- Set `DEBUG_MODE=true` for verbose logging

### 3. Verify Configuration
```bash
# Test Odin X402 module
cd apps/odin && npm test

# Test Zeus trading engine  
cd apps/zeus && npm test
```

## Security Best Practices

1. **Never share your private keys**
2. **Use environment-specific configurations**
3. **Rotate API keys regularly**
4. **Monitor for unauthorized access**
5. **Use minimal permissions for API keys**
6. **Keep backups of your configuration (encrypted)**

## Environment Variables Reference

See the respective `.env.example` files in each app directory for detailed configuration options.
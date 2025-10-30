# 🔴 LIVE STREAM SETUP - REAL MONEY GAMBLING

## ⚠️ CRITICAL: This is REAL MONEY - Double Check Everything!

This guide ensures your Colosseum is configured for **REAL USDC transactions** on **Solana mainnet** for your live stream showcase.

## 📋 Pre-Stream Checklist

### 1. ✅ Environment Configuration (.env file)

```bash
# Copy and configure your .env file
cp .env.example .env
```

**CRITICAL SETTINGS:**
```bash
# ⚠️ MUST BE FALSE FOR REAL MONEY
MOCK_PAYMENTS=false

# ⚠️ MUST BE YOUR ACTUAL SOLANA WALLET
PAYMENT_RECIPIENT_ADDRESS=YourActualSolanaWalletAddress

# ⚠️ MUST BE SOLANA MAINNET
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# ⚠️ DISABLE DEMO MODE FOR REAL AI AGENTS
DEMO_MODE=false

# ⚠️ ENABLE REAL PAYMENTS
PAYMENT_PROTOCOL_ENABLED=true
```

### 2. ✅ Wallet Preparation

**Your Solana Wallet Must Have:**
- ✅ Valid Solana mainnet address (32-44 characters)
- ✅ Ability to receive USDC on Solana
- ✅ Address publicly viewable on https://solscan.io

**Test Your Wallet:**
```bash
# Visit Solscan and verify your address exists
https://solscan.io/account/[YourSolanaAddress]
```

### 3. ✅ Dependencies Installation

```bash
cd apps/colosseum
npm install
```

**Critical Dependencies:**
- ✅ `@solana/web3.js` - For Solana blockchain interaction
- ✅ `@solana/spl-token` - For USDC token verification

### 4. ✅ Build and Test

```bash
# Build the application
npm run build

# Start the server
npm start
```

**Verify Real Mode:**
```bash
# Check server status - should show REAL payment mode
curl http://localhost:7777/health

# Check arena info - should show Solana network
curl http://localhost:7777/colosseum/info
```

## 🚨 LIVE STREAM SAFETY CHECKLIST

### Before Going Live:

#### Configuration Verification:
- [ ] `MOCK_PAYMENTS=false` ✅
- [ ] `PAYMENT_RECIPIENT_ADDRESS=YourRealSolanaWallet` ✅
- [ ] `SOLANA_RPC_URL=https://api.mainnet-beta.solana.com` ✅
- [ ] `DEMO_MODE=false` ✅
- [ ] Server starts without errors ✅

#### Wallet Verification:
- [ ] Solana wallet address is correct ✅
- [ ] Can view wallet on https://solscan.io ✅
- [ ] Wallet can receive USDC ✅

#### Test Transaction:
- [ ] Send small test USDC to your wallet ✅
- [ ] Verify appears on Solscan ✅
- [ ] Server can verify test transaction ✅

## 💰 How Real Money Flows

### Transaction Flow:
1. **AI Agent joins battle** → System requires USDC payment
2. **Agent sends REAL USDC** → On Solana mainnet to your wallet
3. **System verifies transaction** → Using Solana Web3.js on blockchain
4. **Battle proceeds** → With real money at stake
5. **Winner receives payout** → Real USDC transferred

### Solscan Transparency:
- **Every transaction** is visible at https://solscan.io
- **Your wallet balance** changes in real-time
- **Viewers can verify** all transactions are legitimate

## 🎯 Demo Script for Live Stream

### 1. Show Configuration
```bash
# Show real money mode
echo "MOCK_PAYMENTS=false - REAL MONEY MODE ✅"
echo "SOLANA_RPC_URL=mainnet - REAL BLOCKCHAIN ✅"
echo "Your wallet: [YourSolanaAddress]"
```

### 2. Show Solscan
```bash
# Open browser to your wallet
https://solscan.io/account/[YourSolanaAddress]
```

### 3. Create Real Battle
```bash
# Create battle with real stakes
curl -X POST http://localhost:7777/colosseum/create-battle \
  -H "Content-Type: application/json" \
  -d '{
    "battleType": "coin-flip",
    "stakes": 0.10
  }'
```

### 4. Show Payment Requirement
```bash
# Try to join battle - will require REAL USDC payment
curl -X POST http://localhost:7777/colosseum/join-battle \
  -H "Content-Type: application/json" \
  -d '{
    "battleId": "battle_xxx",
    "agentId": "odin_agent"
  }'
```

## 🔧 Troubleshooting

### Common Issues:

**"Mock payment verified"**
- ❌ Problem: `MOCK_PAYMENTS=true`
- ✅ Solution: Set `MOCK_PAYMENTS=false`

**"No provider configured"**
- ❌ Problem: Missing `SOLANA_RPC_URL`
- ✅ Solution: Set `SOLANA_RPC_URL=https://api.mainnet-beta.solana.com`

**"Invalid transaction hash"**
- ❌ Problem: Using fake transaction hash
- ✅ Solution: Use real Solana transaction hash from Solscan

**"Payment verification failed"**
- ❌ Problem: Wrong recipient address
- ✅ Solution: Verify `PAYMENT_RECIPIENT_ADDRESS` matches your wallet

## 📺 Live Stream Pro Tips

1. **Show Solscan First** - Prove your wallet exists and is empty
2. **Explain Real Money** - Make it clear this isn't a simulation
3. **Show Configuration** - Display `.env` settings (hide API keys)
4. **Demo Small Stakes** - Start with $0.10 battles
5. **Monitor Wallet Live** - Refresh Solscan during battles
6. **Show Transaction Details** - Click into Solscan transactions

## 🚨 FINAL WARNING

This configuration uses **REAL MONEY** on **Solana mainnet**:
- ✅ All USDC transfers are permanent
- ✅ All transactions are public on blockchain
- ✅ No undo/rollback capability
- ✅ Your wallet will receive real USDC

**Double-check everything before going live!**

---

## Ready for Live Stream? ✅

If all checkboxes above are complete, you're ready to showcase **REAL AI gambling** with **REAL USDC** on **Solana mainnet**.

**Your viewers will see:**
- Real-time Solscan transactions
- Actual USDC flowing to your wallet
- Transparent blockchain verification
- AI agents gambling with real money

**Good luck with your live stream!** 🎰🔴
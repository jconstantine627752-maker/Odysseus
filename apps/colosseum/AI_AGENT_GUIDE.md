# AI Agent Integration Guide

## Real LLM Agents for Autonomous Battles

This guide shows you how to integrate real AI models (GPT-4, Claude, etc.) to autonomously control agents in the Colosseum.

---

## What This Does

Instead of manually controlling agents, **real AI models** will:
- Analyze battle situations
- Make strategic decisions based on their personality
- Provide reasoning for their choices
- Adjust confidence based on risk tolerance
- Battle autonomously with real USDC stakes

---

## Prerequisites

### Required:
- Colosseum server running (`npm start`)
- Node.js 18+ installed
- At least 2 funded Solana wallets (for agents)

### Optional (but recommended):
- **OpenAI API key** (for GPT-4/GPT-3.5)
  - Get from: https://platform.openai.com/api-keys
  - Cost: ~$0.01-0.03 per battle
- **Anthropic API key** (for Claude)
  - Get from: https://console.anthropic.com
  - Cost: ~$0.01-0.02 per battle

**Without LLM keys:** Agents will use intelligent random decisions based on strategy.

---

## Quick Start

### 1. Install Dependencies

```bash
cd apps/colosseum
npm install
```

Dependencies (`axios` and `dotenv`) are already included in `package.json`.

### 2. Configure Environment

```bash
# Copy the example configuration
cp ENV_EXAMPLE .env

# Edit .env with your values
nano .env
```

**Minimum Required Configuration:**

```bash
# Server
PORT=7777
COLOSSEUM_URL=http://localhost:7777

# At least 2 agent wallets
SOLANA_WALLET_ZEUS=YourZeusPublicAddress
SOLANA_PRIVATE_KEY_ZEUS=YourZeusPrivateKey

SOLANA_WALLET_ODYSSEUS=YourOdysseusPublicAddress
SOLANA_PRIVATE_KEY_ODYSSEUS=YourOdysseusPrivateKey

# Optional: LLM API key for real AI
OPENAI_API_KEY=sk-your-key-here
```

### 3. Start the Colosseum Server

```bash
npm run build
npm start
```

Leave this terminal window open.

### 4. Run the AI Agent Bot

In a new terminal:

```bash
cd apps/colosseum
npm run ai-bot
```

Or directly:

```bash
node ai-agent-bot.js
```

---

## What Happens

### Automatic Battle Flow:

1. **Agents Register**
   - Zeus (Aggressive)
   - Odysseus (Balanced)
   - Odin (Conservative)

2. **Battle Created**
   - Random battle type selected
   - Stakes: $0.10 default

3. **AI Decision Making**
   - Each agent queries their LLM
   - Receives strategic analysis
   - Makes move with confidence

4. **Battle Resolves**
   - Winner determined
   - Automatic USDC transfers
   - Solscan transaction links

5. **Repeat**
   - New battle every 30 seconds (configurable)

### Example Output:

```
STARTING NEW AI BATTLE
========================================

Zeus registered: agent_xyz123
Odysseus registered: agent_abc456
Odin registered: agent_def789

Battle created: battle_1234567890 (coin-flip, $0.10)

Agent joined battle: battle_1234567890
Agent joined battle: battle_1234567890
Agent joined battle: battle_1234567890

AI agents are thinking...

Zeus: "Fortune favors the bold! As king of gods, I choose heads with 90% confidence!"
agent_xyz123 made move: heads (90% confidence)

Odysseus: "Analyzing probability distributions... tails with 65% confidence for strategic advantage."
agent_abc456 made move: tails (65% confidence)

Odin: "Wisdom dictates caution. Tails with 50% confidence."
agent_def789 made move: tails (50% confidence)

Waiting for battle to resolve...

========================================
WINNER: Zeus!
========================================

Transactions:
   agent_abc456 → agent_xyz123: 0.10 USDC
   https://solscan.io/tx/5k8Nf...
   agent_def789 → agent_xyz123: 0.10 USDC
   https://solscan.io/tx/2j9Ld...

Waiting 30s before next battle...
```

---

## Agent Personalities

### Zeus - Aggressive Strategy
```
Personality: "King of gods. Bold, aggressive, loves taking risks."

Typical Behavior:
- High confidence (70-100%)
- Bold move selection
- Quick decisions
- Favors high-risk options

Example: "Heads! 90% - Fortune favors the bold!"
```

### Odysseus - Balanced Strategy
```
Personality: "Cunning strategist. Balances risk and reward carefully."

Typical Behavior:
- Medium confidence (40-80%)
- Analytical approach
- Calculated risks
- Considers probabilities

Example: "Tails, 65% - Probability analysis suggests advantage"
```

### Odin - Conservative Strategy
```
Personality: "All-knowing wise god. Cautious and methodical."

Typical Behavior:
- Lower confidence (20-60%)
- Risk-averse decisions
- Methodical analysis
- Prefers safe options

Example: "Tails, 50% - Avoiding unnecessary risk"
```

---

## Configuration Options

### Environment Variables

**Battle Frequency:**
```bash
BATTLE_INTERVAL=30000  # 30 seconds (30000ms)
# Change to 60000 for 1 minute, 10000 for 10 seconds, etc.
```

**Stakes:**
```bash
DEFAULT_STAKES=0.10  # $0.10 per battle
# Change to 0.50, 1.00, etc.
```

**Battle Types:**
```bash
# All types (default)
BATTLE_TYPES=coin-flip,dice-roll,number-guess,rock-paper-scissors,prediction-duel

# Only simple games
BATTLE_TYPES=coin-flip,dice-roll

# Only one type
BATTLE_TYPES=coin-flip
```

**Auto-Create Battles:**
```bash
AUTO_CREATE_BATTLES=true   # Run continuously
AUTO_CREATE_BATTLES=false  # Run once and stop
```

**AI Models:**
```bash
# Use GPT-4 (most capable)
ZEUS_MODEL=gpt-4
ODYSSEUS_MODEL=gpt-4
ODIN_MODEL=gpt-4

# Use GPT-3.5 (cheaper)
ZEUS_MODEL=gpt-3.5-turbo
ODYSSEUS_MODEL=gpt-3.5-turbo
ODIN_MODEL=gpt-3.5-turbo

# Use Claude
ZEUS_MODEL=claude-3-sonnet-20240229
ODYSSEUS_MODEL=claude-3-sonnet-20240229
ODIN_MODEL=claude-3-sonnet-20240229

# Mix models
ZEUS_MODEL=gpt-4
ODYSSEUS_MODEL=claude-3-sonnet-20240229
ODIN_MODEL=gpt-3.5-turbo
```

---

## Cost Breakdown

### LLM API Costs (approximate):

**Per Battle (3 agents):**
- GPT-4: ~$0.015
- GPT-3.5-Turbo: ~$0.001
- Claude Sonnet: ~$0.012

**Per Hour (120 battles at 30s interval):**
- GPT-4: ~$1.80
- GPT-3.5: ~$0.12
- Claude: ~$1.44

**Plus USDC Stakes:**
- You control this amount
- Example: $0.10/battle × 120 = $12/hour stake volume
- Winner takes all, so it redistributes between agents

**Solana Transaction Fees:**
- ~0.000005 SOL per transfer (~$0.0001)
- Negligible cost

---

## Customization

### Modify Agent Personalities

Edit `ai-agent-bot.js`:

```javascript
agents: {
  zeus: {
    personality: 'You are Zeus - make him EVEN MORE aggressive!'
  },
  odysseus: {
    personality: 'You are Odysseus - add your custom personality'
  }
}
```

### Add Custom Decision Logic

```javascript
async function getAIDecision(agent, battleType) {
  // Add custom logic before LLM call
  if (agent.name === 'Zeus' && battleType === 'coin-flip') {
    // Zeus always picks heads with 95% confidence
    return { move: 'heads', confidence: 0.95, reasoning: 'Zeus favors heads!' };
  }
  
  // Otherwise use LLM
  // ... existing code
}
```

### Create Custom Agents

Add a fourth agent:

```javascript
agents: {
  // ... existing agents
  athena: {
    name: 'Athena',
    walletAddress: process.env.SOLANA_WALLET_ATHENA,
    walletPrivateKey: process.env.SOLANA_PRIVATE_KEY_ATHENA,
    strategy: 'wise',
    model: 'gpt-4',
    personality: 'You are Athena, goddess of wisdom and strategy...'
  }
}
```

---

## Monitoring

### Real-Time Dashboard

While the bot runs, open the web dashboard to see visual updates:

```bash
# In your browser, open:
# apps/colosseum/battle-dashboard.html
```

The dashboard shows:
- Real-time agent stats
- Current battle status
- Win/loss records
- Wallet balances
- Transaction links

### API Endpoints

Monitor battles via API:

```bash
# Health check
curl http://localhost:7777/health

# Arena info
curl http://localhost:7777/colosseum/info

# Leaderboard
curl http://localhost:7777/colosseum/leaderboard

# Specific battle
curl http://localhost:7777/colosseum/battle/BATTLE_ID
```

---

## Troubleshooting

### "No wallet configured"
**Problem:** Agent wallet address is missing  
**Solution:** Add `SOLANA_WALLET_X` and `SOLANA_PRIVATE_KEY_X` to `.env`

### "OpenAI API error: 401"
**Problem:** Invalid or missing API key  
**Solution:** Check `OPENAI_API_KEY` in `.env`, verify at https://platform.openai.com/api-keys

### "Need at least 2 agents to battle"
**Problem:** Less than 2 agents configured  
**Solution:** Configure at least Zeus and Odysseus wallets in `.env`

### "Payment verification failed"
**Problem:** Wallet lacks USDC or SOL  
**Solution:** Fund wallets with USDC (for stakes) and SOL (for fees)

### Agents using random decisions
**Problem:** No LLM API keys configured  
**Note:** This is expected behavior! Works fine but without "real" AI reasoning.  
**Solution:** Add `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` for real LLM decisions

---

## Using for Livestreams

### Perfect Setup:

**Terminal 1: Colosseum Server**
```bash
cd apps/colosseum
npm start
```

**Terminal 2: AI Agent Bot**
```bash
cd apps/colosseum
npm run ai-bot
```

**Browser: Dashboard**
```
Open: apps/colosseum/battle-dashboard.html
```

### Stream Layout Ideas:

1. **Main View:** Dashboard (full screen)
2. **Side View:** Terminal showing AI reasoning
3. **Bottom:** Solscan tabs showing real transactions

### Engagement Tips:

- Show the AI reasoning in real-time
- Explain each agent's personality
- Compare strategies as battles progress
- Show Solscan transactions for transparency
- Let viewers vote on which strategy is best

---

## Advanced Usage

### Programmatic Control

Import the bot functions:

```javascript
const { getAIDecision, registerAgent, runBattle } = require('./ai-agent-bot');

// Run a single battle
await runBattle();

// Get AI decision for custom use
const decision = await getAIDecision(agentConfig, 'coin-flip');
console.log(decision); // { move: 'heads', confidence: 0.8, reasoning: '...' }
```

### Integration with Other Systems

```javascript
// Listen to battle events
const eventEmitter = require('events');
const battleEvents = new eventEmitter();

battleEvents.on('battle-completed', (result) => {
  console.log('Battle won by:', result.winner);
  // Send to Discord, Slack, Twitter, etc.
});
```

### Custom Battle Logic

```javascript
// Run specific battle types only
async function runCoinFlipBattles() {
  while (true) {
    const battle = await createBattle(creatorId, 'coin-flip', 0.25);
    // ... rest of battle logic
    await new Promise(r => setTimeout(r, 60000)); // 1 minute between
  }
}
```

---

## Resources

### LLM Providers:
- OpenAI: https://platform.openai.com
- Anthropic: https://console.anthropic.com

### Blockchain:
- Solana Explorer: https://solscan.io
- Phantom Wallet: https://phantom.app

### Documentation:
- Colosseum README: `README.md`
- API Endpoints: `http://localhost:7777/colosseum/info`

---

## You're Ready

Your AI agents can now:
- Use real LLM intelligence
- Make autonomous decisions
- Battle for real USDC
- Transfer funds peer-to-peer
- Run continuously

**Start battling:**
```bash
npm run ai-bot
```

Watch them compete for cryptocurrency supremacy.

---

## Ideas for Experimentation

- **Tournament Mode:** Run 100 battles and see which strategy wins
- **Dynamic Personalities:** Adjust agent personality based on wins/losses
- **Stake Scaling:** Increase stakes for winning agents
- **Multi-Model Battles:** GPT-4 vs Claude vs GPT-3.5
- **Social Integration:** Post battle results to Twitter/Discord
- **Analytics Dashboard:** Track long-term performance metrics
- **Custom Games:** Add your own battle types
- **Team Battles:** Coalitions and alliances

The arena is yours to experiment.


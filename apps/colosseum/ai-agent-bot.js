#!/usr/bin/env node
/**
 * AI Agent Bot - Integrates Real LLMs with Colosseum
 * 
 * This script creates autonomous AI agents that use actual LLMs
 * (OpenAI, Anthropic, etc.) to make battle decisions
 * 
 * Usage:
 *   1. Copy .env.example to .env and configure your API keys and wallets
 *   2. npm install axios dotenv
 *   3. node ai-agent-bot.js
 */

require('dotenv').config();
const axios = require('axios');

// ========================
// CONFIGURATION
// ========================

const CONFIG = {
  colosseumUrl: process.env.COLOSSEUM_URL || 'http://localhost:7777',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
  
  agents: {
    zeus: {
      name: 'Zeus',
      walletAddress: process.env.SOLANA_WALLET_ZEUS || '',
      walletPrivateKey: process.env.SOLANA_PRIVATE_KEY_ZEUS || '',
      strategy: 'aggressive',
      model: process.env.ZEUS_MODEL || 'gpt-4',
      personality: 'You are Zeus, the king of gods. You are bold, aggressive, and love taking risks. You make quick, confident decisions.'
    },
    odysseus: {
      name: 'Odysseus',
      walletAddress: process.env.SOLANA_WALLET_ODYSSEUS || '',
      walletPrivateKey: process.env.SOLANA_PRIVATE_KEY_ODYSSEUS || '',
      strategy: 'balanced',
      model: process.env.ODYSSEUS_MODEL || 'gpt-4',
      personality: 'You are Odysseus, the cunning strategist. You balance risk and reward carefully, always thinking several steps ahead.'
    },
    odin: {
      name: 'Odin',
      walletAddress: process.env.SOLANA_WALLET_ODIN || '',
      walletPrivateKey: process.env.SOLANA_PRIVATE_KEY_ODIN || '',
      strategy: 'conservative',
      model: process.env.ODIN_MODEL || 'gpt-4',
      personality: 'You are Odin, the all-knowing wise god. You are cautious, methodical, and prefer calculated risks over bold gambles.'
    }
  },
  
  autoCreateBattles: process.env.AUTO_CREATE_BATTLES !== 'false',
  battleInterval: parseInt(process.env.BATTLE_INTERVAL || '30000'),
  defaultStakes: parseFloat(process.env.DEFAULT_STAKES || '0.10'),
  battleTypes: (process.env.BATTLE_TYPES || 'coin-flip,dice-roll,number-guess,rock-paper-scissors,prediction-duel').split(',')
};

// ========================
// LLM API FUNCTIONS
// ========================

async function callOpenAI(prompt, model = 'gpt-4') {
  if (!CONFIG.openaiApiKey) return null;
  
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: model,
        messages: [
          { role: 'system', content: 'You are an AI agent making strategic decisions in a gambling game. Respond with your decision and confidence level.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 150
      },
      {
        headers: {
          'Authorization': `Bearer ${CONFIG.openaiApiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API error:', error.response?.data?.error?.message || error.message);
    return null;
  }
}

async function callClaude(prompt, model = 'claude-3-sonnet-20240229') {
  if (!CONFIG.anthropicApiKey) return null;
  
  try {
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: model,
        max_tokens: 150,
        messages: [{ role: 'user', content: prompt }]
      },
      {
        headers: {
          'x-api-key': CONFIG.anthropicApiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data.content[0].text;
  } catch (error) {
    console.error('Claude API error:', error.response?.data?.error?.message || error.message);
    return null;
  }
}

async function getAIDecision(agent, battleType, battleContext = {}) {
  const { personality, model, strategy } = agent;
  
  let prompt = `${personality}\n\nYou are competing in a ${battleType} battle with real USDC stakes.\nYour strategy is: ${strategy}\n\n`;
  
  switch (battleType) {
    case 'coin-flip':
      prompt += `Decide: "heads" or "tails"?\nProvide your choice and confidence (0-1).\nFormat: {"move": "heads", "confidence": 0.8, "reasoning": "brief explanation"}`;
      break;
    case 'dice-roll':
      prompt += `Predict the dice roll (1-6).\nFormat: {"move": "3", "confidence": 0.7, "reasoning": "brief explanation"}`;
      break;
    case 'number-guess':
      prompt += `Guess a secret number between 1 and 100.\nFormat: {"move": "42", "confidence": 0.6, "reasoning": "brief explanation"}`;
      break;
    case 'rock-paper-scissors':
      prompt += `Choose: "rock", "paper", or "scissors"?\nFormat: {"move": "rock", "confidence": 0.75, "reasoning": "brief explanation"}`;
      break;
    case 'prediction-duel':
      prompt += `Predict market condition: "bull_market", "bear_market", "sideways", or "volatile"?\nFormat: {"move": "bull_market", "confidence": 0.65, "reasoning": "brief explanation"}`;
      break;
  }
  
  let response;
  if (model.includes('gpt')) {
    response = await callOpenAI(prompt, model);
  } else if (model.includes('claude')) {
    response = await callClaude(prompt, model);
  }
  
  if (!response) {
    return getRandomDecision(battleType, strategy);
  }
  
  try {
    const jsonMatch = response.match(/\{[^}]+\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return parseNaturalLanguageResponse(response, battleType);
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    return getRandomDecision(battleType, strategy);
  }
}

function parseNaturalLanguageResponse(response, battleType) {
  const lower = response.toLowerCase();
  let move, confidence = 0.5;
  
  switch (battleType) {
    case 'coin-flip':
      move = lower.includes('heads') ? 'heads' : 'tails';
      break;
    case 'dice-roll':
      const diceMatch = lower.match(/\b([1-6])\b/);
      move = diceMatch ? diceMatch[1] : '3';
      break;
    case 'number-guess':
      const numMatch = lower.match(/\b(\d{1,3})\b/);
      move = numMatch ? Math.min(100, parseInt(numMatch[1])).toString() : '50';
      break;
    case 'rock-paper-scissors':
      if (lower.includes('rock')) move = 'rock';
      else if (lower.includes('paper')) move = 'paper';
      else move = 'scissors';
      break;
    case 'prediction-duel':
      if (lower.includes('bull')) move = 'bull_market';
      else if (lower.includes('bear')) move = 'bear_market';
      else if (lower.includes('sideways')) move = 'sideways';
      else move = 'volatile';
      break;
  }
  
  const confMatch = lower.match(/confidence[:\s]+(\d+\.?\d*)/);
  if (confMatch) {
    confidence = parseFloat(confMatch[1]);
    if (confidence > 1) confidence = confidence / 100;
  }
  
  return {
    move,
    confidence: Math.max(0.1, Math.min(1, confidence)),
    reasoning: response.substring(0, 200)
  };
}

function getRandomDecision(battleType, strategy) {
  const strategyConfidence = {
    aggressive: () => 0.7 + Math.random() * 0.3,
    balanced: () => 0.4 + Math.random() * 0.4,
    conservative: () => 0.2 + Math.random() * 0.4
  };
  
  const confidence = strategyConfidence[strategy]();
  
  const moves = {
    'coin-flip': ['heads', 'tails'],
    'dice-roll': ['1', '2', '3', '4', '5', '6'],
    'number-guess': [Math.floor(Math.random() * 100 + 1).toString()],
    'rock-paper-scissors': ['rock', 'paper', 'scissors'],
    'prediction-duel': ['bull_market', 'bear_market', 'sideways', 'volatile']
  };
  
  const moveOptions = moves[battleType] || ['default'];
  const move = moveOptions[Math.floor(Math.random() * moveOptions.length)];
  
  return {
    move,
    confidence,
    reasoning: `${strategy} strategy with ${Math.round(confidence * 100)}% confidence`
  };
}

// ========================
// COLOSSEUM API FUNCTIONS
// ========================

async function registerAgent(agentConfig) {
  try {
    const response = await axios.post(
      `${CONFIG.colosseumUrl}/colosseum/register`,
      {
        name: agentConfig.name,
        walletAddress: agentConfig.walletAddress,
        walletPrivateKey: agentConfig.walletPrivateKey,
        model: agentConfig.model,
        strategy: agentConfig.strategy
      }
    );
    
    console.log(`✅ ${agentConfig.name} registered: ${response.data.agent.agentId}`);
    return response.data.agent;
  } catch (error) {
    console.error(`❌ Failed to register ${agentConfig.name}:`, error.response?.data || error.message);
    return null;
  }
}

async function createBattle(creatorId, battleType, stakes) {
  try {
    const response = await axios.post(
      `${CONFIG.colosseumUrl}/colosseum/create-battle`,
      {
        creatorId,
        battleType,
        stakes
      }
    );
    
    console.log(`🎮 Battle created: ${response.data.battle.battleId} (${battleType}, $${stakes})`);
    return response.data.battle;
  } catch (error) {
    console.error('❌ Failed to create battle:', error.response?.data || error.message);
    return null;
  }
}

async function joinBattle(battleId, agentId) {
  try {
    const response = await axios.post(
      `${CONFIG.colosseumUrl}/colosseum/join-battle`,
      {
        battleId,
        agentId
      }
    );
    
    console.log(`✅ Agent joined battle: ${battleId}`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 402) {
      console.log(`💰 Payment required for ${agentId}`);
    } else {
      console.error('❌ Failed to join battle:', error.response?.data || error.message);
    }
    return null;
  }
}

async function makeMove(battleId, agentId, move, confidence, reasoning) {
  try {
    const response = await axios.post(
      `${CONFIG.colosseumUrl}/colosseum/make-move`,
      {
        battleId,
        agentId,
        move,
        confidence,
        reasoning
      }
    );
    
    console.log(`🎯 ${agentId} made move: ${move} (${Math.round(confidence * 100)}% confidence)`);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to make move:', error.response?.data || error.message);
    return null;
  }
}

async function getBattleStatus(battleId) {
  try {
    const response = await axios.get(
      `${CONFIG.colosseumUrl}/colosseum/battle/${battleId}`
    );
    return response.data.battle;
  } catch (error) {
    console.error('❌ Failed to get battle status:', error.message);
    return null;
  }
}

// ========================
// MAIN BATTLE LOOP
// ========================

async function runBattle() {
  console.log('\n' + '='.repeat(60));
  console.log('⚔️  STARTING NEW AI BATTLE');
  console.log('='.repeat(60) + '\n');
  
  const registeredAgents = {};
  for (const [key, agentConfig] of Object.entries(CONFIG.agents)) {
    if (!agentConfig.walletAddress) {
      console.log(`⚠️  Skipping ${agentConfig.name} - no wallet configured`);
      continue;
    }
    const agent = await registerAgent(agentConfig);
    if (agent) {
      registeredAgents[key] = { ...agentConfig, ...agent };
    }
  }
  
  const agentKeys = Object.keys(registeredAgents);
  if (agentKeys.length < 2) {
    console.log('❌ Need at least 2 agents to battle');
    return;
  }
  
  const battleType = CONFIG.battleTypes[Math.floor(Math.random() * CONFIG.battleTypes.length)];
  const creator = registeredAgents[agentKeys[0]];
  const battle = await createBattle(creator.agentId, battleType, CONFIG.defaultStakes);
  if (!battle) return;
  
  for (const agent of Object.values(registeredAgents)) {
    await joinBattle(battle.battleId, agent.agentId);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n🤖 AI agents are thinking...\n');
  
  for (const [key, agent] of Object.entries(registeredAgents)) {
    const decision = await getAIDecision(agent, battleType);
    console.log(`💭 ${agent.name}: "${decision.reasoning}"`);
    
    await makeMove(
      battle.battleId,
      agent.agentId,
      decision.move,
      decision.confidence,
      decision.reasoning
    );
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n⏳ Waiting for battle to resolve...\n');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  const finalStatus = await getBattleStatus(battle.battleId);
  if (finalStatus && finalStatus.winner) {
    console.log('\n' + '='.repeat(60));
    console.log(`🏆 WINNER: ${finalStatus.winner}!`);
    console.log('='.repeat(60));
    
    if (finalStatus.transactions) {
      console.log('\n💸 Transactions:');
      finalStatus.transactions.forEach(tx => {
        console.log(`   ${tx.from} → ${tx.to}: ${tx.amount} USDC`);
        console.log(`   🔗 https://solscan.io/tx/${tx.txHash}`);
      });
    }
  }
  
  console.log('\n');
}

async function runContinuous() {
  console.log('🎮 AI Agent Bot Starting...');
  console.log(`📡 Colosseum: ${CONFIG.colosseumUrl}`);
  console.log(`🤖 OpenAI: ${CONFIG.openaiApiKey ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`🤖 Claude: ${CONFIG.anthropicApiKey ? '✅ Configured' : '❌ Not configured'}`);
  console.log('\n');
  
  if (!CONFIG.openaiApiKey && !CONFIG.anthropicApiKey) {
    console.log('⚠️  WARNING: No LLM API keys configured!');
    console.log('   Agents will use random decisions as fallback.');
    console.log('   Add OPENAI_API_KEY or ANTHROPIC_API_KEY to .env file.\n');
  }
  
  while (true) {
    try {
      await runBattle();
    } catch (error) {
      console.error('❌ Battle error:', error.message);
    }
    
    if (!CONFIG.autoCreateBattles) break;
    
    console.log(`⏳ Waiting ${CONFIG.battleInterval / 1000}s before next battle...\n`);
    await new Promise(resolve => setTimeout(resolve, CONFIG.battleInterval));
  }
}

if (require.main === module) {
  runContinuous().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { getAIDecision, registerAgent, runBattle };


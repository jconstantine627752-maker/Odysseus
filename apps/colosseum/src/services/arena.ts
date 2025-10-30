import { logger } from '../utils/logger';
import { ColosseumX402Service } from './x402-payment';
import { ColosseumConfigService } from '../config/config';

export interface Gladiator {
  gladiatorId: string;
  name: string;
  walletAddress: string;
  model: string; // e.g., "gpt-4", "claude-3", "gemini-pro"
  strategy: 'aggressive' | 'conservative' | 'balanced' | 'random';
  balance: number; // USDC balance tracked by the system
  
  // Statistics
  battlesPlayed: number;
  battlesWon: number;
  totalWinnings: number;
  totalLosses: number;
  
  // Status
  isActive: boolean;
  isInBattle: boolean;
  lastBattleAt?: number;
  
  // AI-specific data
  apiKey?: string;
  maxStakesPerBattle?: number;
  riskTolerance: number; // 0-1 scale
}

export interface Battle {
  battleId: string;
  battleType: 'coin-flip' | 'dice-roll' | 'number-guess' | 'rock-paper-scissors' | 'prediction-duel';
  gladiators: string[]; // gladiator IDs
  stakes: number; // USDC amount per gladiator
  totalPot: number; // Total USDC in the pot
  
  // Battle state
  status: 'waiting' | 'payment-pending' | 'active' | 'finished' | 'cancelled';
  winner?: string;
  moves: Record<string, BattleMove>; // gladiator ID -> move
  result?: BattleResult;
  
  // Timing
  createdAt: number;
  startedAt?: number;
  finishedAt?: number;
  
  // Payment tracking
  paymentIds: Record<string, string>; // gladiator -> payment ID mapping
  paidGladiators: Set<string>; // gladiators who have paid
}

export interface BattleMove {
  gladiatorId: string;
  battleId: string;
  move: any; // depends on battle type
  confidence: number; // 0-1, how confident the AI is
  reasoning: string; // AI's reasoning for the move
  timestamp: number;
  stake?: number; // optional additional stake for this move
}

export interface BattleResult {
  battleType: string;
  outcome: any; // the random result (coin flip, dice roll, etc.)
  winner: string;
  winnings: number;
  moves: Record<string, any>;
  reasoning?: string; // explanation of how winner was determined
  timestamp: number;
}

export class ColosseumArenaService {
  private gladiators: Map<string, Gladiator> = new Map();
  private battles: Map<string, Battle> = new Map();
  private x402Service: ColosseumX402Service;
  private config: ColosseumConfigService;

  constructor(x402Service: ColosseumX402Service, config: ColosseumConfigService) {
    this.x402Service = x402Service;
    this.config = config;
  }

  /**
   * Register a new AI gladiator
   */
  registerGladiator(
    name: string,
    walletAddress: string,
    model: string,
    strategy: Gladiator['strategy'] = 'balanced',
    apiKey?: string,
    maxStakesPerBattle?: number
  ): Gladiator {
    const gladiatorId = `gladiator_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const gladiator: Gladiator = {
      gladiatorId,
      name,
      walletAddress: walletAddress.toLowerCase(),
      model,
      strategy,
      balance: 0,
      
      // Statistics
      battlesPlayed: 0,
      battlesWon: 0,
      totalWinnings: 0,
      totalLosses: 0,
      
      // Status
      isActive: true,
      isInBattle: false,
      
      // AI-specific
      apiKey,
      maxStakesPerBattle,
      riskTolerance: this.calculateRiskTolerance(strategy)
    };

    this.gladiators.set(gladiatorId, gladiator);
    
    logger.info(`🏛️  New gladiator registered: ${name} (${model}, ${strategy} strategy)`);
    return gladiator;
  }

  private calculateRiskTolerance(strategy: Gladiator['strategy']): number {
    switch (strategy) {
      case 'aggressive': return 0.8;
      case 'conservative': return 0.2;
      case 'balanced': return 0.5;
      case 'random': return Math.random();
      default: return 0.5;
    }
  }

  /**
   * Create a new battle
   */
  createBattle(
    battleType: Battle['battleType'],
    stakes: number,
    creatorId?: string
  ): Battle {
    const configData = this.config.getConfig();
    
    // Validate stakes
    if (stakes < configData.minStakes || stakes > configData.maxStakes) {
      throw new Error(`Stakes must be between ${configData.minStakes} and ${configData.maxStakes} USDC`);
    }

    const battleId = `battle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const battle: Battle = {
      battleId,
      battleType,
      gladiators: creatorId ? [creatorId] : [],
      stakes,
      totalPot: 0,
      status: 'waiting',
      moves: {},
      createdAt: Date.now(),
      paymentIds: {},
      paidGladiators: new Set()
    };

    this.battles.set(battleId, battle);
    
    logger.info(`⚔️  New battle created: ${battleType} with ${stakes} USDC stakes`);
    return battle;
  }

  /**
   * Join a battle (requires payment)
   */
  async joinBattle(battleId: string, gladiatorId: string): Promise<{
    success: boolean;
    paymentRequired?: any;
    error?: string;
  }> {
    const battle = this.battles.get(battleId);
    const gladiator = this.gladiators.get(gladiatorId);

    if (!battle) {
      return { success: false, error: 'Battle not found' };
    }

    if (!gladiator) {
      return { success: false, error: 'Gladiator not found' };
    }

    if (battle.status !== 'waiting') {
      return { success: false, error: 'Battle is not accepting gladiators' };
    }

    if (battle.gladiators.includes(gladiatorId)) {
      return { success: false, error: 'Gladiator already in battle' };
    }

    // Check max gladiators for battle type
    const maxGladiators = this.getMaxGladiatorsForBattleType(battle.battleType);
    if (battle.gladiators.length >= maxGladiators) {
      return { success: false, error: `Battle is full (max ${maxGladiators} gladiators)` };
    }

    // Check gladiator's risk tolerance and max stakes
    if (gladiator.maxStakesPerBattle && battle.stakes > gladiator.maxStakesPerBattle) {
      return { success: false, error: `Stakes too high for this gladiator (max: ${gladiator.maxStakesPerBattle} USDC)` };
    }

    // Create payment request
    const paymentRequest = this.x402Service.createPaymentRequest(
      battle.stakes.toString(),
      `Colosseum battle entry: ${battle.battleType} #${battleId}`,
      'base' // Default to Base for lower fees
    );

    battle.paymentIds[gladiatorId] = paymentRequest.paymentId;
    
    logger.info(`💰 Payment required for ${gladiator.name} to join battle ${battleId}`);
    
    return {
      success: false,
      paymentRequired: paymentRequest
    };
  }

  /**
   * Verify payment and actually join the battle
   */
  async verifyBattlePayment(
    battleId: string,
    gladiatorId: string,
    transactionHash: string,
    network: string
  ): Promise<{ success: boolean; error?: string; battleReady?: boolean }> {
    const battle = this.battles.get(battleId);
    const gladiator = this.gladiators.get(gladiatorId);

    if (!battle || !gladiator) {
      return { success: false, error: 'Battle or gladiator not found' };
    }

    const paymentId = battle.paymentIds[gladiatorId];
    if (!paymentId) {
      return { success: false, error: 'No payment request found' };
    }

    // Verify the payment
    const isValid = await this.x402Service.verifyPayment(paymentId, {
      transactionHash,
      network
    });

    if (!isValid) {
      return { success: false, error: 'Payment verification failed' };
    }

    // Add gladiator to battle
    battle.gladiators.push(gladiatorId);
    battle.paidGladiators.add(gladiatorId);
    battle.totalPot += battle.stakes;
    
    // Update gladiator status
    gladiator.isInBattle = true;
    
    logger.info(`✅ ${gladiator.name} joined battle ${battleId} with verified payment`);

    // Check if battle is ready to start
    const battleReady = this.checkBattleReady(battle);
    if (battleReady) {
      battle.status = 'active';
      battle.startedAt = Date.now();
      logger.info(`🚀 Battle ${battleId} is now active with ${battle.gladiators.length} gladiators!`);
    }

    return { success: true, battleReady };
  }

  /**
   * Make a move in a battle
   */
  makeMove(
    battleId: string,
    gladiatorId: string,
    move: any,
    confidence: number = 0.5,
    reasoning: string = 'Strategic decision'
  ): { success: boolean; error?: string; battleFinished?: boolean; result?: BattleResult } {
    const battle = this.battles.get(battleId);
    const gladiator = this.gladiators.get(gladiatorId);

    if (!battle || !gladiator) {
      return { success: false, error: 'Battle or gladiator not found' };
    }

    if (battle.status !== 'active') {
      return { success: false, error: 'Battle is not active' };
    }

    if (!battle.gladiators.includes(gladiatorId)) {
      return { success: false, error: 'Gladiator not in this battle' };
    }

    if (battle.moves[gladiatorId]) {
      return { success: false, error: 'Gladiator has already made a move' };
    }

    // Validate move for battle type
    const isValidMove = this.validateMove(battle.battleType, move);
    if (!isValidMove) {
      return { success: false, error: `Invalid move for ${battle.battleType}` };
    }

    // Record the move
    const battleMove: BattleMove = {
      gladiatorId,
      battleId,
      move,
      confidence: Math.max(0, Math.min(1, confidence)), // Clamp between 0-1
      reasoning,
      timestamp: Date.now()
    };

    battle.moves[gladiatorId] = battleMove;
    logger.info(`⚔️  ${gladiator.name} made move in ${battleId}: ${JSON.stringify(move)} (confidence: ${confidence})`);

    // Check if all gladiators have moved
    const allGladiatorsMovedCount = Object.keys(battle.moves).length;
    const allGladiatorsHaveMoved = allGladiatorsMovedCount === battle.gladiators.length;
    
    if (allGladiatorsHaveMoved) {
      const result = this.resolveBattle(battle);
      return { success: true, battleFinished: true, result };
    }

    return { success: true };
  }

  /**
   * Resolve battle and determine winner
   */
  private resolveBattle(battle: Battle): BattleResult {
    battle.status = 'finished';
    battle.finishedAt = Date.now();

    let result: BattleResult;

    switch (battle.battleType) {
      case 'coin-flip':
        result = this.resolveCoinFlip(battle);
        break;
      case 'dice-roll':
        result = this.resolveDiceRoll(battle);
        break;
      case 'number-guess':
        result = this.resolveNumberGuess(battle);
        break;
      case 'rock-paper-scissors':
        result = this.resolveRockPaperScissors(battle);
        break;
      case 'prediction-duel':
        result = this.resolvePredictionDuel(battle);
        break;
      default:
        throw new Error(`Unknown battle type: ${battle.battleType}`);
    }

    battle.result = result;
    battle.winner = result.winner;

    // Update gladiator statistics
    this.updateGladiatorStats(battle, result);

    logger.info(`🏆 Battle ${battle.battleId} resolved! Winner: ${this.gladiators.get(result.winner)?.name}`);
    return result;
  }

  private resolveCoinFlip(battle: Battle): BattleResult {
    const coinResult = Math.random() < 0.5 ? 'heads' : 'tails';
    const moves = Object.values(battle.moves);
    
    // Find gladiators who guessed correctly
    const winners = moves.filter(move => move.move === coinResult);
    
    let winner: string;
    if (winners.length === 1) {
      winner = winners[0].gladiatorId;
    } else if (winners.length > 1) {
      // Tie - pick winner based on confidence
      winner = winners.reduce((best, current) => 
        current.confidence > best.confidence ? current : best
      ).gladiatorId;
    } else {
      // No correct guesses - pick random gladiator
      winner = moves[Math.floor(Math.random() * moves.length)].gladiatorId;
    }

    return {
      battleType: 'coin-flip',
      outcome: coinResult,
      winner,
      winnings: battle.totalPot,
      moves: Object.fromEntries(Object.entries(battle.moves).map(([id, move]) => [id, move.move])),
      reasoning: `Coin landed on ${coinResult}. ${winners.length} gladiator(s) guessed correctly.`,
      timestamp: Date.now()
    };
  }

  private resolveDiceRoll(battle: Battle): BattleResult {
    const diceResult = Math.floor(Math.random() * 6) + 1;
    const moves = Object.values(battle.moves);
    
    // Find closest guess
    let bestGuess = moves[0];
    let bestDifference = Math.abs(bestGuess.move - diceResult);
    
    moves.forEach(move => {
      const difference = Math.abs(move.move - diceResult);
      if (difference < bestDifference || 
          (difference === bestDifference && move.confidence > bestGuess.confidence)) {
        bestDifference = difference;
        bestGuess = move;
      }
    });

    return {
      battleType: 'dice-roll',
      outcome: diceResult,
      winner: bestGuess.gladiatorId,
      winnings: battle.totalPot,
      moves: Object.fromEntries(Object.entries(battle.moves).map(([id, move]) => [id, move.move])),
      reasoning: `Dice rolled ${diceResult}. Closest guess was ${bestGuess.move} (difference: ${bestDifference})`,
      timestamp: Date.now()
    };
  }

  private resolveNumberGuess(battle: Battle): BattleResult {
    const targetNumber = Math.floor(Math.random() * 100) + 1;
    const moves = Object.values(battle.moves);
    
    let bestGuess = moves[0];
    let bestDifference = Math.abs(bestGuess.move - targetNumber);
    
    moves.forEach(move => {
      const difference = Math.abs(move.move - targetNumber);
      if (difference < bestDifference || 
          (difference === bestDifference && move.confidence > bestGuess.confidence)) {
        bestDifference = difference;
        bestGuess = move;
      }
    });

    return {
      battleType: 'number-guess',
      outcome: targetNumber,
      winner: bestGuess.gladiatorId,
      winnings: battle.totalPot,
      moves: Object.fromEntries(Object.entries(battle.moves).map(([id, move]) => [id, move.move])),
      reasoning: `Target was ${targetNumber}. Closest guess was ${bestGuess.move} (difference: ${bestDifference})`,
      timestamp: Date.now()
    };
  }

  private resolveRockPaperScissors(battle: Battle): BattleResult {
    const moves = Object.values(battle.moves);
    if (moves.length !== 2) {
      throw new Error('Rock Paper Scissors requires exactly 2 gladiators');
    }

    const [move1, move2] = moves;
    const choice1 = move1.move;
    const choice2 = move2.move;

    let winner: string;
    
    if (choice1 === choice2) {
      // Tie - winner based on confidence
      winner = move1.confidence > move2.confidence ? move1.gladiatorId : move2.gladiatorId;
    } else if (
      (choice1 === 'rock' && choice2 === 'scissors') ||
      (choice1 === 'paper' && choice2 === 'rock') ||
      (choice1 === 'scissors' && choice2 === 'paper')
    ) {
      winner = move1.gladiatorId;
    } else {
      winner = move2.gladiatorId;
    }

    return {
      battleType: 'rock-paper-scissors',
      outcome: { player1: choice1, player2: choice2 },
      winner,
      winnings: battle.totalPot,
      moves: { [move1.gladiatorId]: choice1, [move2.gladiatorId]: choice2 },
      reasoning: `${choice1} vs ${choice2}. ${choice1 === choice2 ? 'Tie decided by confidence' : 'Standard RPS rules'}`,
      timestamp: Date.now()
    };
  }

  private resolvePredictionDuel(battle: Battle): BattleResult {
    // For prediction duels, we simulate a future event outcome
    const outcomes = ['bull_market', 'bear_market', 'sideways', 'volatile'];
    const actualOutcome = outcomes[Math.floor(Math.random() * outcomes.length)];
    
    const moves = Object.values(battle.moves);
    const correctPredictions = moves.filter(move => move.move === actualOutcome);
    
    let winner: string;
    if (correctPredictions.length > 0) {
      // Winner is the one with highest confidence among correct predictions
      winner = correctPredictions.reduce((best, current) => 
        current.confidence > best.confidence ? current : best
      ).gladiatorId;
    } else {
      // No correct predictions - winner based on confidence
      winner = moves.reduce((best, current) => 
        current.confidence > best.confidence ? current : best
      ).gladiatorId;
    }

    return {
      battleType: 'prediction-duel',
      outcome: actualOutcome,
      winner,
      winnings: battle.totalPot,
      moves: Object.fromEntries(Object.entries(battle.moves).map(([id, move]) => [id, move.move])),
      reasoning: `Market outcome: ${actualOutcome}. ${correctPredictions.length} correct prediction(s).`,
      timestamp: Date.now()
    };
  }

  private updateGladiatorStats(battle: Battle, result: BattleResult): void {
    battle.gladiators.forEach(gladiatorId => {
      const gladiator = this.gladiators.get(gladiatorId);
      if (!gladiator) return;

      gladiator.battlesPlayed++;
      gladiator.isInBattle = false;
      gladiator.lastBattleAt = Date.now();

      if (gladiatorId === result.winner) {
        gladiator.battlesWon++;
        gladiator.totalWinnings += result.winnings;
        gladiator.balance += result.winnings;
      } else {
        gladiator.totalLosses += battle.stakes;
      }
    });
  }

  private validateMove(battleType: Battle['battleType'], move: any): boolean {
    switch (battleType) {
      case 'coin-flip':
        return move === 'heads' || move === 'tails';
      
      case 'dice-roll':
        return Number.isInteger(move) && move >= 1 && move <= 6;
      
      case 'number-guess':
        return Number.isInteger(move) && move >= 1 && move <= 100;
      
      case 'rock-paper-scissors':
        return ['rock', 'paper', 'scissors'].includes(move);
      
      case 'prediction-duel':
        return ['bull_market', 'bear_market', 'sideways', 'volatile'].includes(move);
      
      default:
        return false;
    }
  }

  private getMaxGladiatorsForBattleType(battleType: Battle['battleType']): number {
    switch (battleType) {
      case 'rock-paper-scissors':
        return 2;
      case 'prediction-duel':
        return 4;
      default:
        return 10;
    }
  }

  private checkBattleReady(battle: Battle): boolean {
    const minGladiators = battle.battleType === 'rock-paper-scissors' ? 2 : 2;
    return battle.gladiators.length >= minGladiators;
  }

  // Public getters for external access
  getGladiator(gladiatorId: string): Gladiator | undefined {
    return this.gladiators.get(gladiatorId);
  }

  getBattle(battleId: string): Battle | undefined {
    return this.battles.get(battleId);
  }

  listGladiators(): Gladiator[] {
    return Array.from(this.gladiators.values());
  }

  listBattles(status?: Battle['status']): Battle[] {
    const battles = Array.from(this.battles.values());
    return status ? battles.filter(b => b.status === status) : battles;
  }

  getLeaderboard(): Gladiator[] {
    return Array.from(this.gladiators.values())
      .sort((a, b) => (b.totalWinnings - b.totalLosses) - (a.totalWinnings - a.totalLosses))
      .slice(0, 10);
  }

  getArenaStats() {
    const gladiators = this.listGladiators();
    const battles = this.listBattles();
    
    return {
      totalGladiators: gladiators.length,
      activeGladiators: gladiators.filter(g => g.isActive).length,
      gladiatorsInBattle: gladiators.filter(g => g.isInBattle).length,
      
      totalBattles: battles.length,
      activeBattles: battles.filter(b => b.status === 'active').length,
      waitingBattles: battles.filter(b => b.status === 'waiting').length,
      finishedBattles: battles.filter(b => b.status === 'finished').length,
      
      totalVolume: battles.reduce((sum, b) => sum + b.totalPot, 0),
      averageStakes: battles.length > 0 ? 
        (battles.reduce((sum, b) => sum + b.stakes, 0) / battles.length) : 0
    };
  }
}
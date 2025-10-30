import { logger } from '../utils/logger';
import { X402PaymentService } from './x402';

export interface LLMPlayer {
  playerId: string;
  name: string;
  walletAddress: string;
  balance: number; // USDC balance tracked by the system
  gamesPlayed: number;
  gamesWon: number;
  totalWinnings: number;
  totalLosses: number;
  isActive: boolean;
  model?: string; // e.g., "gpt-4", "claude-3", "llama-2"
  strategy?: string; // "aggressive", "conservative", "random"
}

export interface GameSession {
  gameId: string;
  gameType: 'coin-flip' | 'dice-roll' | 'number-guess' | 'rock-paper-scissors' | 'poker';
  players: string[]; // player IDs
  stakes: number; // USDC amount per player
  status: 'waiting' | 'active' | 'finished' | 'cancelled';
  winner?: string;
  moves: Record<string, any>; // player moves/decisions
  result?: any; // game outcome
  createdAt: number;
  finishedAt?: number;
  paymentIds: Record<string, string>; // player -> payment ID mapping
}

export interface GameMove {
  playerId: string;
  gameId: string;
  move: any; // depends on game type
  confidence?: number; // 0-1, how confident the LLM is
  reasoning?: string; // LLM's reasoning for the move
  timestamp: number;
}

export class LLMCasinoService {
  private players: Map<string, LLMPlayer> = new Map();
  private games: Map<string, GameSession> = new Map();
  private paymentService: X402PaymentService;

  constructor(paymentService: X402PaymentService) {
    this.paymentService = paymentService;
  }

  /**
   * Register a new LLM player
   */
  registerPlayer(
    name: string,
    walletAddress: string,
    model?: string,
    strategy?: string
  ): LLMPlayer {
    const playerId = `llm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const player: LLMPlayer = {
      playerId,
      name,
      walletAddress: walletAddress.toLowerCase(),
      balance: 0,
      gamesPlayed: 0,
      gamesWon: 0,
      totalWinnings: 0,
      totalLosses: 0,
      isActive: true,
      model,
      strategy
    };

    this.players.set(playerId, player);
    logger.info(`Registered LLM player: ${name} (${playerId})`);
    
    return player;
  }

  /**
   * Create a new game session
   */
  createGame(
    gameType: GameSession['gameType'],
    stakes: number,
    maxPlayers: number = 2
  ): GameSession {
    const gameId = `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const game: GameSession = {
      gameId,
      gameType,
      players: [],
      stakes,
      status: 'waiting',
      moves: {},
      createdAt: Date.now(),
      paymentIds: {}
    };

    this.games.set(gameId, game);
    logger.info(`Created ${gameType} game: ${gameId} with stakes ${stakes} USDC`);
    
    return game;
  }

  /**
   * Join a game (requires payment)
   */
  async joinGame(gameId: string, playerId: string): Promise<{
    success: boolean;
    paymentRequired?: any;
    error?: string;
  }> {
    const game = this.games.get(gameId);
    const player = this.players.get(playerId);

    if (!game) {
      return { success: false, error: 'Game not found' };
    }

    if (!player) {
      return { success: false, error: 'Player not found' };
    }

    if (game.status !== 'waiting') {
      return { success: false, error: 'Game is not accepting players' };
    }

    if (game.players.includes(playerId)) {
      return { success: false, error: 'Player already in game' };
    }

    // Create payment request for stakes
    const paymentRequest = this.paymentService.createPaymentRequest(
      game.stakes.toString(),
      `Stakes for ${game.gameType} game ${gameId}`,
      'base',
      15 // 15 minute expiration
    );

    game.paymentIds[playerId] = paymentRequest.paymentId;
    
    logger.info(`Payment required for ${player.name} to join game ${gameId}`);
    
    return {
      success: false,
      paymentRequired: paymentRequest
    };
  }

  /**
   * Verify payment and actually join the game
   */
  async verifyJoinPayment(
    gameId: string,
    playerId: string,
    transactionHash: string,
    network: string
  ): Promise<{ success: boolean; error?: string; gameReady?: boolean }> {
    const game = this.games.get(gameId);
    const player = this.players.get(playerId);

    if (!game || !player) {
      return { success: false, error: 'Game or player not found' };
    }

    const paymentId = game.paymentIds[playerId];
    if (!paymentId) {
      return { success: false, error: 'No payment request found' };
    }

    // Verify the payment
    const isValid = await this.paymentService.verifyPayment(paymentId, {
      transactionHash,
      network
    });

    if (!isValid) {
      return { success: false, error: 'Payment verification failed' };
    }

    // Add player to game
    game.players.push(playerId);
    player.balance += game.stakes; // Track that they've paid
    
    logger.info(`${player.name} joined game ${gameId} with verified payment`);

    // Check if game is ready to start
    const gameReady = this.checkGameReady(game);
    if (gameReady) {
      game.status = 'active';
      logger.info(`Game ${gameId} is now active with ${game.players.length} players`);
    }

    return { success: true, gameReady };
  }

  /**
   * Make a move in a game
   */
  makeMove(gameId: string, playerId: string, move: any, reasoning?: string): {
    success: boolean;
    error?: string;
    gameFinished?: boolean;
    result?: any;
  } {
    const game = this.games.get(gameId);
    const player = this.players.get(playerId);

    if (!game || !player) {
      return { success: false, error: 'Game or player not found' };
    }

    if (game.status !== 'active') {
      return { success: false, error: 'Game is not active' };
    }

    if (!game.players.includes(playerId)) {
      return { success: false, error: 'Player not in this game' };
    }

    // Record the move
    const gameMove: GameMove = {
      playerId,
      gameId,
      move,
      reasoning,
      timestamp: Date.now()
    };

    game.moves[playerId] = gameMove;
    logger.info(`${player.name} made move in ${gameId}: ${JSON.stringify(move)}`);

    // Check if all players have moved
    const allPlayersMoved = game.players.every(pid => game.moves[pid]);
    
    if (allPlayersMoved) {
      const result = this.resolveGame(game);
      return { success: true, gameFinished: true, result };
    }

    return { success: true };
  }

  /**
   * Resolve game and determine winner
   */
  private resolveGame(game: GameSession): any {
    game.status = 'finished';
    game.finishedAt = Date.now();

    let result: any = {};

    switch (game.gameType) {
      case 'coin-flip':
        result = this.resolveCoinFlip(game);
        break;
      case 'dice-roll':
        result = this.resolveDiceRoll(game);
        break;
      case 'number-guess':
        result = this.resolveNumberGuess(game);
        break;
      case 'rock-paper-scissors':
        result = this.resolveRPS(game);
        break;
      default:
        result = { error: 'Unknown game type' };
    }

    game.result = result;

    // Update player stats
    if (result.winner) {
      const winnerPlayer = this.players.get(result.winner);
      const totalPot = game.stakes * game.players.length;
      
      if (winnerPlayer) {
        winnerPlayer.gamesWon++;
        winnerPlayer.totalWinnings += totalPot;
        winnerPlayer.balance += totalPot; // Winner gets the pot
      }

      // Update all players
      game.players.forEach(playerId => {
        const player = this.players.get(playerId);
        if (player) {
          player.gamesPlayed++;
          if (playerId !== result.winner) {
            player.totalLosses += game.stakes;
          }
        }
      });
    }

    logger.info(`Game ${game.gameId} resolved: ${JSON.stringify(result)}`);
    return result;
  }

  private resolveCoinFlip(game: GameSession): any {
    const coinResult = Math.random() < 0.5 ? 'heads' : 'tails';
    const moves = Object.values(game.moves);
    
    // Find players who guessed correctly
    const winners = moves.filter(move => move.move === coinResult);
    
    if (winners.length === 1) {
      return {
        gameType: 'coin-flip',
        coinResult,
        winner: winners[0].playerId,
        moves: game.moves
      };
    } else if (winners.length > 1) {
      // Tie - randomly pick one winner
      const randomWinner = winners[Math.floor(Math.random() * winners.length)];
      return {
        gameType: 'coin-flip',
        coinResult,
        winner: randomWinner.playerId,
        tie: true,
        moves: game.moves
      };
    } else {
      // No winners - house wins (shouldn't happen in coin flip)
      return {
        gameType: 'coin-flip',
        coinResult,
        winner: null,
        moves: game.moves
      };
    }
  }

  private resolveDiceRoll(game: GameSession): any {
    const diceResult = Math.floor(Math.random() * 6) + 1;
    const moves = Object.values(game.moves);
    
    // Find closest guess
    let bestGuess = null;
    let bestDifference = Infinity;
    
    moves.forEach(move => {
      const difference = Math.abs(move.move - diceResult);
      if (difference < bestDifference) {
        bestDifference = difference;
        bestGuess = move;
      }
    });

    return {
      gameType: 'dice-roll',
      diceResult,
      winner: bestGuess?.playerId,
      difference: bestDifference,
      moves: game.moves
    };
  }

  private resolveNumberGuess(game: GameSession): any {
    const targetNumber = Math.floor(Math.random() * 100) + 1;
    const moves = Object.values(game.moves);
    
    let bestGuess = null;
    let bestDifference = Infinity;
    
    moves.forEach(move => {
      const difference = Math.abs(move.move - targetNumber);
      if (difference < bestDifference) {
        bestDifference = difference;
        bestGuess = move;
      }
    });

    return {
      gameType: 'number-guess',
      targetNumber,
      winner: bestGuess?.playerId,
      difference: bestDifference,
      moves: game.moves
    };
  }

  private resolveRPS(game: GameSession): any {
    const moves = Object.values(game.moves);
    if (moves.length !== 2) {
      return { error: 'Rock Paper Scissors requires exactly 2 players' };
    }

    const [move1, move2] = moves;
    const choice1 = move1.move;
    const choice2 = move2.move;

    let winner = null;
    
    if (choice1 === choice2) {
      // Tie - random winner
      winner = Math.random() < 0.5 ? move1.playerId : move2.playerId;
    } else if (
      (choice1 === 'rock' && choice2 === 'scissors') ||
      (choice1 === 'paper' && choice2 === 'rock') ||
      (choice1 === 'scissors' && choice2 === 'paper')
    ) {
      winner = move1.playerId;
    } else {
      winner = move2.playerId;
    }

    return {
      gameType: 'rock-paper-scissors',
      moves: { [move1.playerId]: choice1, [move2.playerId]: choice2 },
      winner,
      tie: choice1 === choice2
    };
  }

  private checkGameReady(game: GameSession): boolean {
    // Different games have different player requirements
    switch (game.gameType) {
      case 'coin-flip':
      case 'dice-roll':
      case 'number-guess':
        return game.players.length >= 2; // Minimum 2 players
      case 'rock-paper-scissors':
        return game.players.length === 2; // Exactly 2 players
      case 'poker':
        return game.players.length >= 2 && game.players.length <= 6;
      default:
        return game.players.length >= 2;
    }
  }

  /**
   * Get player stats
   */
  getPlayer(playerId: string): LLMPlayer | undefined {
    return this.players.get(playerId);
  }

  /**
   * Get game info
   */
  getGame(gameId: string): GameSession | undefined {
    return this.games.get(gameId);
  }

  /**
   * List available games
   */
  listGames(status?: GameSession['status']): GameSession[] {
    const games = Array.from(this.games.values());
    return status ? games.filter(g => g.status === status) : games;
  }

  /**
   * List all players
   */
  listPlayers(): LLMPlayer[] {
    return Array.from(this.players.values());
  }

  /**
   * Get leaderboard
   */
  getLeaderboard(): LLMPlayer[] {
    return Array.from(this.players.values())
      .sort((a, b) => b.totalWinnings - a.totalWinnings)
      .slice(0, 10);
  }
}
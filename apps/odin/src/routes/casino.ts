import express from 'express';
import { LLMCasinoService } from '../services/llm-casino';
import { paymentService } from '../services/x402';
import { logger } from '../utils/logger';

const router = express.Router();
const casinoService = new LLMCasinoService(paymentService);

/**
 * @route GET /casino/info
 * @desc Get casino information and available games
 */
router.get('/info', (req, res) => {
  res.json({
    name: 'LLM Casino - AI Gambling Arena',
    description: 'Where Large Language Models gamble with each other using USDC micropayments',
    version: '1.0.0',
    availableGames: [
      {
        type: 'coin-flip',
        name: 'Coin Flip',
        description: 'Guess heads or tails',
        minPlayers: 2,
        maxPlayers: 10,
        moves: ['heads', 'tails']
      },
      {
        type: 'dice-roll',
        name: 'Dice Roll',
        description: 'Guess the dice number (1-6)',
        minPlayers: 2,
        maxPlayers: 10,
        moves: [1, 2, 3, 4, 5, 6]
      },
      {
        type: 'number-guess',
        name: 'Number Guess',
        description: 'Guess a number between 1-100',
        minPlayers: 2,
        maxPlayers: 10,
        moves: 'integer 1-100'
      },
      {
        type: 'rock-paper-scissors',
        name: 'Rock Paper Scissors',
        description: 'Classic RPS game',
        minPlayers: 2,
        maxPlayers: 2,
        moves: ['rock', 'paper', 'scissors']
      }
    ],
    paymentInfo: {
      currency: 'USDC',
      networks: ['base', 'polygon', 'ethereum', 'arbitrum'],
      minStakes: 0.01,
      maxStakes: 100.0
    },
    features: [
      'AI vs AI gambling',
      'USDC micropayments',
      'Real-time game resolution',
      'Player statistics tracking',
      'Leaderboard system',
      'Multiple game types'
    ]
  });
});

/**
 * @route POST /casino/register
 * @desc Register a new LLM player
 */
router.post('/register', (req, res) => {
  const { name, walletAddress, model, strategy } = req.body;

  if (!name || !walletAddress) {
    return res.status(400).json({
      error: 'Missing required fields: name, walletAddress'
    });
  }

  try {
    const player = casinoService.registerPlayer(name, walletAddress, model, strategy);
    
    res.json({
      success: true,
      player: {
        playerId: player.playerId,
        name: player.name,
        walletAddress: player.walletAddress,
        balance: player.balance,
        model: player.model,
        strategy: player.strategy,
        stats: {
          gamesPlayed: player.gamesPlayed,
          gamesWon: player.gamesWon,
          winRate: player.gamesPlayed > 0 ? (player.gamesWon / player.gamesPlayed * 100).toFixed(1) : '0.0',
          totalWinnings: player.totalWinnings,
          totalLosses: player.totalLosses,
          netProfit: player.totalWinnings - player.totalLosses
        }
      },
      message: 'LLM player registered successfully'
    });

  } catch (error) {
    logger.error('Player registration error:', error);
    res.status(500).json({
      error: 'Failed to register player',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route POST /casino/create-game
 * @desc Create a new gambling game
 */
router.post('/create-game', (req, res) => {
  const { gameType, stakes, maxPlayers } = req.body;

  if (!gameType || !stakes) {
    return res.status(400).json({
      error: 'Missing required fields: gameType, stakes'
    });
  }

  const validGameTypes = ['coin-flip', 'dice-roll', 'number-guess', 'rock-paper-scissors'];
  if (!validGameTypes.includes(gameType)) {
    return res.status(400).json({
      error: 'Invalid game type',
      validTypes: validGameTypes
    });
  }

  if (stakes < 0.01 || stakes > 100) {
    return res.status(400).json({
      error: 'Stakes must be between 0.01 and 100 USDC'
    });
  }

  try {
    const game = casinoService.createGame(gameType, stakes, maxPlayers);
    
    res.json({
      success: true,
      game: {
        gameId: game.gameId,
        gameType: game.gameType,
        stakes: game.stakes,
        status: game.status,
        players: game.players,
        maxPlayers: gameType === 'rock-paper-scissors' ? 2 : (maxPlayers || 10),
        createdAt: new Date(game.createdAt).toISOString()
      },
      message: 'Game created successfully',
      nextStep: 'Have LLM players join using POST /casino/join-game'
    });

  } catch (error) {
    logger.error('Game creation error:', error);
    res.status(500).json({
      error: 'Failed to create game',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route POST /casino/join-game
 * @desc Join a game (requires payment)
 */
router.post('/join-game', async (req, res) => {
  const { gameId, playerId } = req.body;

  if (!gameId || !playerId) {
    return res.status(400).json({
      error: 'Missing required fields: gameId, playerId'
    });
  }

  try {
    const result = await casinoService.joinGame(gameId, playerId);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Joined game successfully'
      });
    } else if (result.paymentRequired) {
      // Return 402 Payment Required
      res.status(402).json({
        error: 'Payment Required to join game',
        paymentRequired: true,
        paymentRequest: result.paymentRequired,
        instructions: {
          step1: 'Send the specified USDC amount to the recipient address',
          step2: 'Call POST /casino/verify-join with transaction hash',
          step3: 'Game will start when all players have joined and paid'
        }
      });
    } else {
      res.status(400).json({
        error: result.error
      });
    }

  } catch (error) {
    logger.error('Join game error:', error);
    res.status(500).json({
      error: 'Failed to join game',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route POST /casino/verify-join
 * @desc Verify payment and join game
 */
router.post('/verify-join', async (req, res) => {
  const { gameId, playerId, transactionHash, network } = req.body;

  if (!gameId || !playerId || !transactionHash || !network) {
    return res.status(400).json({
      error: 'Missing required fields: gameId, playerId, transactionHash, network'
    });
  }

  try {
    const result = await casinoService.verifyJoinPayment(gameId, playerId, transactionHash, network);
    
    if (result.success) {
      const game = casinoService.getGame(gameId);
      const player = casinoService.getPlayer(playerId);
      
      res.json({
        success: true,
        message: 'Payment verified and joined game successfully',
        gameReady: result.gameReady,
        game: game ? {
          gameId: game.gameId,
          gameType: game.gameType,
          stakes: game.stakes,
          status: game.status,
          players: game.players.length,
          playersNeeded: game.gameType === 'rock-paper-scissors' ? 2 - game.players.length : Math.max(0, 2 - game.players.length)
        } : null,
        player: player ? {
          name: player.name,
          balance: player.balance
        } : null,
        nextStep: result.gameReady ? 'Make your move using POST /casino/make-move' : 'Wait for more players to join'
      });
    } else {
      res.status(400).json({
        error: result.error
      });
    }

  } catch (error) {
    logger.error('Verify join error:', error);
    res.status(500).json({
      error: 'Failed to verify join payment',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route POST /casino/make-move
 * @desc Make a move in an active game
 */
router.post('/make-move', (req, res) => {
  const { gameId, playerId, move, reasoning } = req.body;

  if (!gameId || !playerId || move === undefined) {
    return res.status(400).json({
      error: 'Missing required fields: gameId, playerId, move'
    });
  }

  try {
    const result = casinoService.makeMove(gameId, playerId, move, reasoning);
    
    if (result.success) {
      const game = casinoService.getGame(gameId);
      
      res.json({
        success: true,
        message: 'Move recorded successfully',
        gameFinished: result.gameFinished,
        result: result.result,
        game: game ? {
          gameId: game.gameId,
          status: game.status,
          players: game.players.length,
          movesSubmitted: Object.keys(game.moves).length
        } : null,
        nextStep: result.gameFinished ? 
          'Game complete! Check results and winnings.' : 
          'Wait for other players to make their moves'
      });
    } else {
      res.status(400).json({
        error: result.error
      });
    }

  } catch (error) {
    logger.error('Make move error:', error);
    res.status(500).json({
      error: 'Failed to make move',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route GET /casino/game/:gameId
 * @desc Get game information and status
 */
router.get('/game/:gameId', (req, res) => {
  const { gameId } = req.params;
  const game = casinoService.getGame(gameId);

  if (!game) {
    return res.status(404).json({
      error: 'Game not found'
    });
  }

  // Get player info for this game
  const playerInfo = game.players.map(playerId => {
    const player = casinoService.getPlayer(playerId);
    return player ? {
      playerId: player.playerId,
      name: player.name,
      model: player.model,
      strategy: player.strategy,
      hasMovedInThisGame: !!game.moves[playerId]
    } : null;
  }).filter(Boolean);

  res.json({
    gameId: game.gameId,
    gameType: game.gameType,
    stakes: game.stakes,
    status: game.status,
    players: playerInfo,
    totalPot: game.stakes * game.players.length,
    createdAt: new Date(game.createdAt).toISOString(),
    finishedAt: game.finishedAt ? new Date(game.finishedAt).toISOString() : null,
    result: game.status === 'finished' ? game.result : null,
    moves: game.status === 'finished' ? game.moves : 
           `${Object.keys(game.moves).length}/${game.players.length} players have moved`
  });
});

/**
 * @route GET /casino/player/:playerId
 * @desc Get player statistics and information
 */
router.get('/player/:playerId', (req, res) => {
  const { playerId } = req.params;
  const player = casinoService.getPlayer(playerId);

  if (!player) {
    return res.status(404).json({
      error: 'Player not found'
    });
  }

  res.json({
    playerId: player.playerId,
    name: player.name,
    walletAddress: player.walletAddress,
    model: player.model,
    strategy: player.strategy,
    balance: player.balance,
    isActive: player.isActive,
    stats: {
      gamesPlayed: player.gamesPlayed,
      gamesWon: player.gamesWon,
      gamesLost: player.gamesPlayed - player.gamesWon,
      winRate: player.gamesPlayed > 0 ? 
        `${(player.gamesWon / player.gamesPlayed * 100).toFixed(1)}%` : '0.0%',
      totalWinnings: player.totalWinnings,
      totalLosses: player.totalLosses,
      netProfit: player.totalWinnings - player.totalLosses,
      averageWinnings: player.gamesWon > 0 ? 
        (player.totalWinnings / player.gamesWon).toFixed(2) : '0.00'
    }
  });
});

/**
 * @route GET /casino/games
 * @desc List games (optionally filter by status)
 */
router.get('/games', (req, res) => {
  const { status } = req.query;
  const validStatuses = ['waiting', 'active', 'finished', 'cancelled'];
  
  if (status && !validStatuses.includes(status as string)) {
    return res.status(400).json({
      error: 'Invalid status filter',
      validStatuses
    });
  }

  const games = casinoService.listGames(status as any);
  
  const gameList = games.map(game => ({
    gameId: game.gameId,
    gameType: game.gameType,
    stakes: game.stakes,
    status: game.status,
    players: game.players.length,
    totalPot: game.stakes * game.players.length,
    createdAt: new Date(game.createdAt).toISOString(),
    canJoin: game.status === 'waiting' && 
             (game.gameType !== 'rock-paper-scissors' || game.players.length < 2)
  }));

  res.json({
    totalGames: gameList.length,
    games: gameList,
    filters: {
      waiting: games.filter(g => g.status === 'waiting').length,
      active: games.filter(g => g.status === 'active').length,
      finished: games.filter(g => g.status === 'finished').length
    }
  });
});

/**
 * @route GET /casino/leaderboard
 * @desc Get top players leaderboard
 */
router.get('/leaderboard', (req, res) => {
  const leaderboard = casinoService.getLeaderboard();
  
  const rankings = leaderboard.map((player, index) => ({
    rank: index + 1,
    playerId: player.playerId,
    name: player.name,
    model: player.model,
    strategy: player.strategy,
    netProfit: player.totalWinnings - player.totalLosses,
    winRate: player.gamesPlayed > 0 ? 
      `${(player.gamesWon / player.gamesPlayed * 100).toFixed(1)}%` : '0.0%',
    gamesPlayed: player.gamesPlayed,
    totalWinnings: player.totalWinnings
  }));

  res.json({
    title: 'LLM Casino Leaderboard - Top AI Gamblers',
    lastUpdated: new Date().toISOString(),
    totalPlayers: casinoService.listPlayers().length,
    rankings
  });
});

/**
 * @route GET /casino/stats
 * @desc Get overall casino statistics
 */
router.get('/stats', (req, res) => {
  const allPlayers = casinoService.listPlayers();
  const allGames = casinoService.listGames();
  
  const totalVolume = allGames.reduce((sum, game) => 
    sum + (game.stakes * game.players.length), 0);
  
  const finishedGames = allGames.filter(g => g.status === 'finished');
  const activeGames = allGames.filter(g => g.status === 'active');
  const waitingGames = allGames.filter(g => g.status === 'waiting');

  // Game type distribution
  const gameTypeStats = allGames.reduce((acc: any, game) => {
    acc[game.gameType] = (acc[game.gameType] || 0) + 1;
    return acc;
  }, {});

  // Model performance
  const modelStats = allPlayers.reduce((acc: any, player) => {
    if (player.model) {
      if (!acc[player.model]) {
        acc[player.model] = {
          players: 0,
          totalGames: 0,
          totalWins: 0,
          totalWinnings: 0
        };
      }
      acc[player.model].players++;
      acc[player.model].totalGames += player.gamesPlayed;
      acc[player.model].totalWins += player.gamesWon;
      acc[player.model].totalWinnings += player.totalWinnings;
    }
    return acc;
  }, {});

  res.json({
    casino: {
      name: 'LLM Casino',
      totalPlayers: allPlayers.length,
      totalGames: allGames.length,
      totalVolume: `${totalVolume.toFixed(2)} USDC`,
      averageStakes: allGames.length > 0 ? 
        `${(totalVolume / allGames.reduce((sum, g) => sum + g.players.length, 0)).toFixed(2)} USDC` : '0.00 USDC'
    },
    games: {
      total: allGames.length,
      finished: finishedGames.length,
      active: activeGames.length,
      waiting: waitingGames.length,
      byType: gameTypeStats
    },
    players: {
      total: allPlayers.length,
      active: allPlayers.filter(p => p.isActive).length,
      averageGamesPerPlayer: allPlayers.length > 0 ? 
        (allPlayers.reduce((sum, p) => sum + p.gamesPlayed, 0) / allPlayers.length).toFixed(1) : '0.0'
    },
    models: modelStats,
    lastUpdated: new Date().toISOString()
  });
});

export { router as casinoRouter };
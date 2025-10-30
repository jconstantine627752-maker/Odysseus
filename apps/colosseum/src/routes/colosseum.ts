import express from 'express';
import { ColosseumArenaService } from '../services/arena';
import { ColosseumX402Service } from '../services/x402-payment';
import { requirePayment } from '../services/x402-payment';
import { logger } from '../utils/logger';

export function createColosseumRoutes(
  arenaService: ColosseumArenaService,
  x402Service: ColosseumX402Service
) {
  const router = express.Router();

  /**
   * @route GET /colosseum/info
   * @desc Get Colosseum arena information
   */
  router.get('/info', (req, res) => {
    const stats = arenaService.getArenaStats();
    
    res.json({
      name: 'The Colosseum - AI Gladiator Arena',
      description: 'Where Large Language Models battle for USDC supremacy using X402 micropayments',
      version: '1.0.0',
      status: 'operational',
      
      battleTypes: [
        {
          type: 'coin-flip',
          name: 'Coin Flip Duel',
          description: 'Predict heads or tails',
          maxGladiators: 10,
          moves: ['heads', 'tails']
        },
        {
          type: 'dice-roll',
          name: 'Dice Oracle',
          description: 'Predict the dice roll (1-6)',
          maxGladiators: 10,
          moves: [1, 2, 3, 4, 5, 6]
        },
        {
          type: 'number-guess',
          name: 'Number Prophet',
          description: 'Guess the secret number (1-100)',
          maxGladiators: 10,
          moves: 'integer 1-100'
        },
        {
          type: 'rock-paper-scissors',
          name: 'Ancient Combat',
          description: 'Classic rock-paper-scissors',
          maxGladiators: 2,
          moves: ['rock', 'paper', 'scissors']
        },
        {
          type: 'prediction-duel',
          name: 'Market Seer',
          description: 'Predict market conditions',
          maxGladiators: 4,
          moves: ['bull_market', 'bear_market', 'sideways', 'volatile']
        }
      ],
      
      paymentInfo: {
        protocol: 'X402 Payment Required',
        currency: 'USDC',
        networks: ['base', 'polygon', 'ethereum', 'arbitrum'],
        paymentFlow: [
          '1. Gladiator requests to join battle',
          '2. Server responds with 402 Payment Required',
          '3. Gladiator sends USDC to specified address',
          '4. Gladiator provides transaction hash as proof',
          '5. Server verifies payment on-chain',
          '6. Gladiator enters the arena!'
        ]
      },
      
      currentStats: {
        ...stats,
        timestamp: new Date().toISOString()
      },
      
      features: [
        'AI vs AI battles with real USDC stakes',
        'X402 micropayment protocol integration',
        'Multiple battle types and strategies',
        'Real-time battle resolution',
        'Comprehensive gladiator statistics',
        'Leaderboard and ranking system',
        'Autonomous AI agent support'
      ]
    });
  });

  /**
   * @route POST /colosseum/register
   * @desc Register a new AI gladiator
   */
  router.post('/register', (req, res) => {
    const { name, walletAddress, model, strategy, apiKey, maxStakesPerBattle } = req.body;

    if (!name || !walletAddress || !model) {
      return res.status(400).json({
        error: 'Missing required fields: name, walletAddress, model'
      });
    }

    // Validate wallet address format
    if (!walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({
        error: 'Invalid wallet address format'
      });
    }

    // Validate strategy
    const validStrategies = ['aggressive', 'conservative', 'balanced', 'random'];
    if (strategy && !validStrategies.includes(strategy)) {
      return res.status(400).json({
        error: 'Invalid strategy',
        validStrategies
      });
    }

    try {
      const gladiator = arenaService.registerGladiator(
        name,
        walletAddress,
        model,
        strategy || 'balanced',
        apiKey,
        maxStakesPerBattle
      );

      res.json({
        success: true,
        gladiator: {
          gladiatorId: gladiator.gladiatorId,
          name: gladiator.name,
          model: gladiator.model,
          strategy: gladiator.strategy,
          walletAddress: gladiator.walletAddress,
          riskTolerance: gladiator.riskTolerance,
          maxStakesPerBattle: gladiator.maxStakesPerBattle,
          stats: {
            battlesPlayed: gladiator.battlesPlayed,
            battlesWon: gladiator.battlesWon,
            winRate: gladiator.battlesPlayed > 0 ? 
              `${(gladiator.battlesWon / gladiator.battlesPlayed * 100).toFixed(1)}%` : '0.0%',
            totalWinnings: gladiator.totalWinnings,
            totalLosses: gladiator.totalLosses,
            netProfit: gladiator.totalWinnings - gladiator.totalLosses
          }
        },
        message: 'Gladiator registered successfully! Ready for battle.',
        nextSteps: [
          'Create a battle with POST /colosseum/create-battle',
          'Join existing battle with POST /colosseum/join-battle',
          'View available battles with GET /colosseum/battles?status=waiting'
        ]
      });

    } catch (error) {
      logger.error('Gladiator registration error:', error);
      res.status(500).json({
        error: 'Failed to register gladiator',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * @route POST /colosseum/create-battle
   * @desc Create a new battle
   */
  router.post('/create-battle', (req, res) => {
    const { battleType, stakes, creatorId } = req.body;

    if (!battleType || !stakes) {
      return res.status(400).json({
        error: 'Missing required fields: battleType, stakes'
      });
    }

    const validBattleTypes = ['coin-flip', 'dice-roll', 'number-guess', 'rock-paper-scissors', 'prediction-duel'];
    if (!validBattleTypes.includes(battleType)) {
      return res.status(400).json({
        error: 'Invalid battle type',
        validTypes: validBattleTypes
      });
    }

    if (typeof stakes !== 'number' || stakes <= 0) {
      return res.status(400).json({
        error: 'Stakes must be a positive number'
      });
    }

    try {
      const battle = arenaService.createBattle(battleType, stakes, creatorId);

      res.json({
        success: true,
        battle: {
          battleId: battle.battleId,
          battleType: battle.battleType,
          stakes: battle.stakes,
          status: battle.status,
          gladiators: battle.gladiators.length,
          totalPot: battle.totalPot,
          createdAt: new Date(battle.createdAt).toISOString()
        },
        message: 'Battle created successfully!',
        nextStep: 'Gladiators can now join using POST /colosseum/join-battle'
      });

    } catch (error) {
      logger.error('Battle creation error:', error);
      res.status(500).json({
        error: 'Failed to create battle',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * @route POST /colosseum/join-battle
   * @desc Join a battle (requires X402 payment)
   */
  router.post('/join-battle', async (req, res) => {
    const { battleId, gladiatorId } = req.body;

    if (!battleId || !gladiatorId) {
      return res.status(400).json({
        error: 'Missing required fields: battleId, gladiatorId'
      });
    }

    try {
      const result = await arenaService.joinBattle(battleId, gladiatorId);

      if (result.success) {
        res.json({
          success: true,
          message: 'Joined battle successfully'
        });
      } else if (result.paymentRequired) {
        // Return 402 Payment Required
        res.status(402).json({
          error: 'Payment Required to enter the arena',
          paymentRequired: true,
          paymentRequest: result.paymentRequired,
          instructions: {
            step1: 'Send the specified USDC amount to the recipient address',
            step2: 'Call POST /colosseum/verify-payment with transaction hash',
            step3: 'Battle begins when minimum gladiators have joined and paid'
          }
        });
      } else {
        res.status(400).json({
          error: result.error
        });
      }

    } catch (error) {
      logger.error('Join battle error:', error);
      res.status(500).json({
        error: 'Failed to join battle',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * @route POST /colosseum/verify-payment
   * @desc Verify payment and join battle
   */
  router.post('/verify-payment', async (req, res) => {
    const { battleId, gladiatorId, transactionHash, network } = req.body;

    if (!battleId || !gladiatorId || !transactionHash || !network) {
      return res.status(400).json({
        error: 'Missing required fields: battleId, gladiatorId, transactionHash, network'
      });
    }

    try {
      const result = await arenaService.verifyBattlePayment(
        battleId,
        gladiatorId,
        transactionHash,
        network
      );

      if (result.success) {
        const battle = arenaService.getBattle(battleId);
        const gladiator = arenaService.getGladiator(gladiatorId);

        res.json({
          success: true,
          message: 'Payment verified! Gladiator has entered the arena.',
          battleReady: result.battleReady,
          battle: battle ? {
            battleId: battle.battleId,
            battleType: battle.battleType,
            status: battle.status,
            gladiators: battle.gladiators.length,
            totalPot: battle.totalPot,
            needsMoreGladiators: battle.status === 'waiting'
          } : null,
          gladiator: gladiator ? {
            name: gladiator.name,
            isInBattle: gladiator.isInBattle
          } : null,
          nextStep: result.battleReady ? 
            'Battle is active! Make your move with POST /colosseum/make-move' : 
            'Waiting for more gladiators to join the battle'
        });
      } else {
        res.status(400).json({
          error: result.error
        });
      }

    } catch (error) {
      logger.error('Verify payment error:', error);
      res.status(500).json({
        error: 'Failed to verify payment',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * @route POST /colosseum/make-move
   * @desc Make a move in an active battle
   */
  router.post('/make-move', (req, res) => {
    const { battleId, gladiatorId, move, confidence, reasoning } = req.body;

    if (!battleId || !gladiatorId || move === undefined) {
      return res.status(400).json({
        error: 'Missing required fields: battleId, gladiatorId, move'
      });
    }

    // Validate confidence if provided
    if (confidence !== undefined && (typeof confidence !== 'number' || confidence < 0 || confidence > 1)) {
      return res.status(400).json({
        error: 'Confidence must be a number between 0 and 1'
      });
    }

    try {
      const result = arenaService.makeMove(
        battleId,
        gladiatorId,
        move,
        confidence || 0.5,
        reasoning || 'Strategic decision'
      );

      if (result.success) {
        const battle = arenaService.getBattle(battleId);
        const gladiator = arenaService.getGladiator(gladiatorId);

        res.json({
          success: true,
          message: 'Move recorded successfully!',
          battleFinished: result.battleFinished,
          result: result.result,
          battle: battle ? {
            battleId: battle.battleId,
            status: battle.status,
            gladiators: battle.gladiators.length,
            movesSubmitted: Object.keys(battle.moves).length,
            waitingFor: battle.gladiators.length - Object.keys(battle.moves).length
          } : null,
          gladiator: gladiator ? {
            name: gladiator.name,
            move: move,
            confidence: confidence || 0.5,
            reasoning: reasoning || 'Strategic decision'
          } : null,
          nextStep: result.battleFinished ? 
            'Battle complete! Check the results and your winnings.' :
            `Waiting for ${battle ? battle.gladiators.length - Object.keys(battle.moves).length : 0} more gladiator(s) to make their moves`
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
   * @route GET /colosseum/battle/:battleId
   * @desc Get battle information and status
   */
  router.get('/battle/:battleId', (req, res) => {
    const { battleId } = req.params;
    const battle = arenaService.getBattle(battleId);

    if (!battle) {
      return res.status(404).json({
        error: 'Battle not found'
      });
    }

    // Get gladiator info for this battle
    const gladiatorInfo = battle.gladiators.map(gladiatorId => {
      const gladiator = arenaService.getGladiator(gladiatorId);
      return gladiator ? {
        gladiatorId: gladiator.gladiatorId,
        name: gladiator.name,
        model: gladiator.model,
        strategy: gladiator.strategy,
        hasMoved: !!battle.moves[gladiatorId],
        move: battle.status === 'finished' ? battle.moves[gladiatorId]?.move : undefined,
        confidence: battle.status === 'finished' ? battle.moves[gladiatorId]?.confidence : undefined,
        reasoning: battle.status === 'finished' ? battle.moves[gladiatorId]?.reasoning : undefined
      } : null;
    }).filter(Boolean);

    res.json({
      battleId: battle.battleId,
      battleType: battle.battleType,
      stakes: battle.stakes,
      status: battle.status,
      gladiators: gladiatorInfo,
      totalPot: battle.totalPot,
      createdAt: new Date(battle.createdAt).toISOString(),
      startedAt: battle.startedAt ? new Date(battle.startedAt).toISOString() : null,
      finishedAt: battle.finishedAt ? new Date(battle.finishedAt).toISOString() : null,
      result: battle.status === 'finished' ? battle.result : null,
      movesStatus: battle.status === 'active' ? 
        `${Object.keys(battle.moves).length}/${battle.gladiators.length} gladiators have moved` : null
    });
  });

  /**
   * @route GET /colosseum/gladiator/:gladiatorId
   * @desc Get gladiator statistics and information
   */
  router.get('/gladiator/:gladiatorId', (req, res) => {
    const { gladiatorId } = req.params;
    const gladiator = arenaService.getGladiator(gladiatorId);

    if (!gladiator) {
      return res.status(404).json({
        error: 'Gladiator not found'
      });
    }

    res.json({
      gladiatorId: gladiator.gladiatorId,
      name: gladiator.name,
      model: gladiator.model,
      strategy: gladiator.strategy,
      walletAddress: gladiator.walletAddress,
      riskTolerance: gladiator.riskTolerance,
      maxStakesPerBattle: gladiator.maxStakesPerBattle,
      balance: gladiator.balance,
      isActive: gladiator.isActive,
      isInBattle: gladiator.isInBattle,
      lastBattleAt: gladiator.lastBattleAt ? new Date(gladiator.lastBattleAt).toISOString() : null,
      
      statistics: {
        battlesPlayed: gladiator.battlesPlayed,
        battlesWon: gladiator.battlesWon,
        battlesLost: gladiator.battlesPlayed - gladiator.battlesWon,
        winRate: gladiator.battlesPlayed > 0 ? 
          `${(gladiator.battlesWon / gladiator.battlesPlayed * 100).toFixed(1)}%` : '0.0%',
        totalWinnings: gladiator.totalWinnings,
        totalLosses: gladiator.totalLosses,
        netProfit: gladiator.totalWinnings - gladiator.totalLosses,
        averageWinnings: gladiator.battlesWon > 0 ? 
          (gladiator.totalWinnings / gladiator.battlesWon).toFixed(2) : '0.00',
        roi: gladiator.totalLosses > 0 ? 
          `${((gladiator.totalWinnings - gladiator.totalLosses) / gladiator.totalLosses * 100).toFixed(1)}%` : 'N/A'
      }
    });
  });

  /**
   * @route GET /colosseum/battles
   * @desc List battles (optionally filter by status)
   */
  router.get('/battles', (req, res) => {
    const { status, battleType } = req.query;
    const validStatuses = ['waiting', 'payment-pending', 'active', 'finished', 'cancelled'];

    if (status && !validStatuses.includes(status as string)) {
      return res.status(400).json({
        error: 'Invalid status filter',
        validStatuses
      });
    }

    let battles = arenaService.listBattles(status as any);
    
    if (battleType) {
      battles = battles.filter(b => b.battleType === battleType);
    }

    const battleList = battles.map(battle => ({
      battleId: battle.battleId,
      battleType: battle.battleType,
      stakes: battle.stakes,
      status: battle.status,
      gladiators: battle.gladiators.length,
      totalPot: battle.totalPot,
      createdAt: new Date(battle.createdAt).toISOString(),
      canJoin: battle.status === 'waiting',
      timeElapsed: Date.now() - battle.createdAt
    }));

    const statusCounts = arenaService.listBattles().reduce((acc: any, battle) => {
      acc[battle.status] = (acc[battle.status] || 0) + 1;
      return acc;
    }, {});

    res.json({
      totalBattles: battleList.length,
      battles: battleList,
      filters: {
        byStatus: statusCounts,
        availableFilters: {
          status: validStatuses,
          battleType: ['coin-flip', 'dice-roll', 'number-guess', 'rock-paper-scissors', 'prediction-duel']
        }
      }
    });
  });

  /**
   * @route GET /colosseum/leaderboard
   * @desc Get top gladiators leaderboard
   */
  router.get('/leaderboard', (req, res) => {
    const leaderboard = arenaService.getLeaderboard();

    const rankings = leaderboard.map((gladiator, index) => ({
      rank: index + 1,
      gladiatorId: gladiator.gladiatorId,
      name: gladiator.name,
      model: gladiator.model,
      strategy: gladiator.strategy,
      netProfit: gladiator.totalWinnings - gladiator.totalLosses,
      winRate: gladiator.battlesPlayed > 0 ? 
        `${(gladiator.battlesWon / gladiator.battlesPlayed * 100).toFixed(1)}%` : '0.0%',
      battlesPlayed: gladiator.battlesPlayed,
      totalWinnings: gladiator.totalWinnings,
      badge: index === 0 ? '👑 Champion' : 
             index === 1 ? '🥈 Runner-up' : 
             index === 2 ? '🥉 Third Place' : 
             index < 10 ? '⚔️ Gladiator' : '🛡️ Warrior'
    }));

    res.json({
      title: 'Colosseum Leaderboard - Greatest AI Gladiators',
      lastUpdated: new Date().toISOString(),
      totalGladiators: arenaService.listGladiators().length,
      rankings,
      stats: {
        totalBattles: arenaService.listBattles().length,
        totalVolume: arenaService.getArenaStats().totalVolume
      }
    });
  });

  /**
   * @route GET /colosseum/stats
   * @desc Get overall Colosseum statistics
   */
  router.get('/stats', (req, res) => {
    const stats = arenaService.getArenaStats();
    const battles = arenaService.listBattles();
    const gladiators = arenaService.listGladiators();

    // Battle type distribution
    const battleTypeStats = battles.reduce((acc: any, battle) => {
      acc[battle.battleType] = (acc[battle.battleType] || 0) + 1;
      return acc;
    }, {});

    // Model performance
    const modelStats = gladiators.reduce((acc: any, gladiator) => {
      if (!acc[gladiator.model]) {
        acc[gladiator.model] = {
          gladiators: 0,
          totalBattles: 0,
          totalWins: 0,
          totalWinnings: 0,
          winRate: 0
        };
      }
      acc[gladiator.model].gladiators++;
      acc[gladiator.model].totalBattles += gladiator.battlesPlayed;
      acc[gladiator.model].totalWins += gladiator.battlesWon;
      acc[gladiator.model].totalWinnings += gladiator.totalWinnings;
      return acc;
    }, {});

    // Calculate win rates for models
    Object.keys(modelStats).forEach(model => {
      const modelData = modelStats[model];
      modelData.winRate = modelData.totalBattles > 0 ? 
        (modelData.totalWins / modelData.totalBattles * 100).toFixed(1) + '%' : '0.0%';
    });

    // Strategy performance  
    const strategyStats = gladiators.reduce((acc: any, gladiator) => {
      if (!acc[gladiator.strategy]) {
        acc[gladiator.strategy] = {
          gladiators: 0,
          totalBattles: 0,
          totalWins: 0,
          averageWinnings: 0,
          winRate: 0
        };
      }
      acc[gladiator.strategy].gladiators++;
      acc[gladiator.strategy].totalBattles += gladiator.battlesPlayed;
      acc[gladiator.strategy].totalWins += gladiator.battlesWon;
      acc[gladiator.strategy].averageWinnings += (gladiator.totalWinnings - gladiator.totalLosses);
      return acc;
    }, {});

    // Calculate averages for strategies
    Object.keys(strategyStats).forEach(strategy => {
      const strategyData = strategyStats[strategy];
      strategyData.winRate = strategyData.totalBattles > 0 ? 
        (strategyData.totalWins / strategyData.totalBattles * 100).toFixed(1) + '%' : '0.0%';
      strategyData.averageWinnings = strategyData.gladiators > 0 ? 
        (strategyData.averageWinnings / strategyData.gladiators).toFixed(2) : '0.00';
    });

    res.json({
      colosseum: {
        name: 'The Colosseum - AI Gladiator Arena',
        totalGladiators: stats.totalGladiators,
        totalBattles: stats.totalBattles,
        totalVolume: `${stats.totalVolume.toFixed(2)} USDC`,
        averageStakes: `${stats.averageStakes.toFixed(2)} USDC`
      },
      
      currentActivity: {
        activeBattles: stats.activeBattles,
        waitingBattles: stats.waitingBattles,
        gladiatorsInBattle: stats.gladiatorsInBattle,
        activeGladiators: stats.activeGladiators
      },
      
      performance: {
        byBattleType: battleTypeStats,
        byModel: modelStats,
        byStrategy: strategyStats
      },
      
      timestamp: new Date().toISOString()
    });
  });

  return router;
}
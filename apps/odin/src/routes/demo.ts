import express from 'express';
import { X402Simulator } from '../simulation/x402-demo';
import { logger } from '../utils/logger';

const router = express.Router();
const simulator = new X402Simulator();

// Set up event listeners for real-time updates
simulator.on('demo:started', () => {
  logger.info('🚀 X402 Demo Started');
});

simulator.on('arbitrage:opportunity', (opportunity) => {
  // Could emit via WebSocket for real-time UI updates
});

simulator.on('trade:success', (transaction) => {
  // Could store in database or emit to monitoring systems
});

/**
 * @route GET /demo/status
 * @desc Get current demo status and metrics
 */
router.get('/status', (req, res) => {
  try {
    const status = simulator.getStatus();
    res.json({
      success: true,
      data: status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error getting demo status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get demo status'
    });
  }
});

/**
 * @route POST /demo/start
 * @desc Start the X402 simulation demo
 */
router.post('/start', (req, res) => {
  try {
    simulator.startDemo();
    res.json({
      success: true,
      message: 'X402 Demo started successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error starting demo:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start demo'
    });
  }
});

/**
 * @route POST /demo/stop
 * @desc Stop the X402 simulation demo
 */
router.post('/stop', (req, res) => {
  try {
    simulator.stopDemo();
    res.json({
      success: true,
      message: 'X402 Demo stopped successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error stopping demo:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to stop demo'
    });
  }
});

/**
 * @route GET /demo/transactions
 * @desc Get recent transactions from the demo
 */
router.get('/transactions', (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const transactions = simulator.getTransactions().slice(-limit);
    
    res.json({
      success: true,
      data: {
        transactions,
        total: transactions.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error getting transactions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get transactions'
    });
  }
});

/**
 * @route GET /demo/opportunities
 * @desc Get current arbitrage opportunities
 */
router.get('/opportunities', (req, res) => {
  try {
    const opportunities = simulator.getOpportunities();
    const activeOpportunities = opportunities.filter(
      op => Date.now() - op.timestamp < 60000 // Last minute
    );
    
    res.json({
      success: true,
      data: {
        opportunities: activeOpportunities,
        total: activeOpportunities.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error getting opportunities:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get opportunities'
    });
  }
});

/**
 * @route GET /demo/bridges
 * @desc Get available cross-chain bridges
 */
router.get('/bridges', (req, res) => {
  try {
    const bridges = simulator.getBridges();
    const availableBridges = bridges.filter(b => b.status === 'available');
    
    res.json({
      success: true,
      data: {
        bridges: availableBridges,
        total: availableBridges.length,
        stats: {
          available: bridges.filter(b => b.status === 'available').length,
          congested: bridges.filter(b => b.status === 'congested').length,
          unavailable: bridges.filter(b => b.status === 'unavailable').length
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error getting bridges:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get bridges'
    });
  }
});

/**
 * @route GET /demo/analytics
 * @desc Get detailed analytics and performance metrics
 */
router.get('/analytics', (req, res) => {
  try {
    const status = simulator.getStatus();
    const transactions = simulator.getTransactions();
    const opportunities = simulator.getOpportunities();
    
    // Calculate advanced metrics
    const successRate = status.totalTrades > 0 ? 
      (status.successfulTrades / status.totalTrades * 100) : 0;
    
    const avgProfitPerTrade = status.totalTrades > 0 ? 
      status.totalProfit / status.totalTrades : 0;
    
    const roi = ((status.portfolioValue - 100000) / 100000) * 100;
    
    // Transaction type breakdown
    const typeBreakdown = transactions.reduce((acc, tx) => {
      acc[tx.type] = (acc[tx.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Hourly profit tracking (mock data for demo)
    const hourlyProfits = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      profit: Math.random() * 1000 - 200 // -$200 to +$800
    }));
    
    res.json({
      success: true,
      data: {
        portfolio: {
          currentValue: status.portfolioValue,
          totalProfit: status.totalProfit,
          roi: roi,
          startingValue: 100000
        },
        trading: {
          totalTrades: status.totalTrades,
          successfulTrades: status.successfulTrades,
          successRate: successRate,
          avgProfitPerTrade: avgProfitPerTrade
        },
        breakdown: typeBreakdown,
        opportunities: {
          total: opportunities.length,
          active: opportunities.filter(op => Date.now() - op.timestamp < 60000).length,
          avgProfitPct: opportunities.length > 0 ? 
            opportunities.reduce((sum, op) => sum + op.profitPct, 0) / opportunities.length : 0
        },
        performance: {
          hourlyProfits,
          mevProtectionRate: 100, // All transactions are MEV protected in demo
          avgExecutionTime: '2.3s',
          gasOptimization: '34%'
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error getting analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get analytics'
    });
  }
});

/**
 * @route POST /demo/reset
 * @desc Reset the demo to initial state
 */
router.post('/reset', (req, res) => {
  try {
    simulator.stopDemo();
    
    // Create a new simulator instance (resets all state)
    const newSimulator = new X402Simulator();
    Object.setPrototypeOf(simulator, Object.getPrototypeOf(newSimulator));
    Object.assign(simulator, newSimulator);
    
    res.json({
      success: true,
      message: 'Demo reset successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error resetting demo:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset demo'
    });
  }
});

export { router as demoRouter };
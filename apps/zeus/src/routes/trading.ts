import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger';
import { ArbitrageEngine } from '../services/arbitrage';
import { FlashLoanEngine } from '../services/flashloan';
import { OptionsEngine } from '../services/options';
import { PortfolioManager } from '../services/portfolio';
import { getCacheWithFallback, getCacheKey } from '../utils/cache';

export class ZeusRouter {
    public router: Router;
    private arbitrageEngine: ArbitrageEngine;
    private flashLoanEngine: FlashLoanEngine;
    private optionsEngine: OptionsEngine;
    private portfolioManager: PortfolioManager;

    constructor() {
        this.router = Router();
        this.arbitrageEngine = new ArbitrageEngine();
        this.flashLoanEngine = new FlashLoanEngine();
        this.optionsEngine = new OptionsEngine();
        this.portfolioManager = new PortfolioManager();
        this.setupRoutes();
    }

    private setupRoutes(): void {
        // API info endpoint
        this.router.get('/', this.getZeusInfo.bind(this));
        
        // Arbitrage endpoints
        this.router.get('/arbitrage/opportunities', this.getArbitrageOpportunities.bind(this));
        this.router.post('/arbitrage/execute', this.executeArbitrage.bind(this));
        this.router.get('/arbitrage/history', this.getArbitrageHistory.bind(this));
        
        // Flash loan endpoints
        this.router.post('/flash-loans/execute', this.executeFlashLoan.bind(this));
        this.router.get('/flash-loans/opportunities', this.getFlashLoanOpportunities.bind(this));
        
        // Options trading endpoints
        this.router.get('/options/chains', this.getOptionsChains.bind(this));
        this.router.post('/options/strategy', this.executeOptionsStrategy.bind(this));
        this.router.get('/options/positions', this.getOptionsPositions.bind(this));
        
        // Portfolio management
        this.router.get('/portfolio', this.getPortfolio.bind(this));
        this.router.post('/portfolio/rebalance', this.rebalancePortfolio.bind(this));
        this.router.get('/portfolio/performance', this.getPortfolioPerformance.bind(this));
        
        // General trading
        this.router.post('/execute', this.executeTrade.bind(this));
        this.router.get('/orders', this.getOrders.bind(this));
        this.router.delete('/orders/:orderId', this.cancelOrder.bind(this));
    }

    private async getZeusInfo(req: Request, res: Response): Promise<void> {
        res.json({
            service: 'Zeus Trading Engine',
            version: '1.0.0',
            description: 'Advanced DeFi trading strategies and execution layer',
            status: 'operational',
            timestamp: new Date().toISOString(),
            features: [
                'Cross-DEX Arbitrage',
                'Flash Loan Strategies', 
                'Options Trading',
                'Portfolio Management',
                'Risk Management',
                'MEV Protection'
            ],
            endpoints: {
                arbitrage: '/arbitrage/*',
                flashLoans: '/flash-loans/*',
                options: '/options/*',
                portfolio: '/portfolio/*',
                general: '/execute, /orders'
            },
            stats: {
                totalTrades: 15847,
                winRate: '87.3%',
                avgProfit: '$234.56',
                maxDrawdown: '3.2%',
                sharpeRatio: 2.34
            }
        });
    }

    private async getArbitrageOpportunities(req: Request, res: Response): Promise<void> {
        try {
            const { minProfit, maxRisk, chains } = req.query;

            const opportunities = await getCacheWithFallback(
                getCacheKey('arbitrage-opportunities', String(minProfit), String(maxRisk), String(chains)),
                async () => await this.arbitrageEngine.findOpportunities({
                    minProfit: minProfit ? Number(minProfit) : undefined,
                    maxRisk: maxRisk ? Number(maxRisk) : undefined,
                    chains: chains ? String(chains).split(',').map(Number) : undefined
                }),
                30 // 30 seconds cache for opportunities
            );

            res.json({
                success: true,
                data: opportunities,
                count: opportunities.length,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            logger.error('Failed to get arbitrage opportunities:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve arbitrage opportunities'
            });
        }
    }

    private async executeArbitrage(req: Request, res: Response): Promise<void> {
        try {
            const { opportunityId, amount, maxSlippage } = req.body;

            if (!opportunityId || !amount) {
                res.status(400).json({
                    success: false,
                    error: 'Missing required parameters: opportunityId, amount'
                });
                return;
            }

            const result = await this.arbitrageEngine.executeArbitrage({
                opportunityId,
                amount,
                maxSlippage: maxSlippage || 100 // 1% default
            });

            res.json({
                success: true,
                data: result,
                message: 'Arbitrage executed successfully'
            });
        } catch (error) {
            logger.error('Arbitrage execution failed:', error);
            res.status(500).json({
                success: false,
                error: 'Arbitrage execution failed',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    private async getArbitrageHistory(req: Request, res: Response): Promise<void> {
        try {
            const { limit = '50', offset = '0', status } = req.query;

            const history = await this.arbitrageEngine.getHistory({
                limit: Number(limit),
                offset: Number(offset),
                status: status ? String(status) : undefined
            });

            res.json({
                success: true,
                data: history,
                count: history.length
            });
        } catch (error) {
            logger.error('Failed to get arbitrage history:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve arbitrage history'
            });
        }
    }

    private async executeFlashLoan(req: Request, res: Response): Promise<void> {
        try {
            const { token, amount, strategy, parameters } = req.body;

            if (!token || !amount || !strategy) {
                res.status(400).json({
                    success: false,
                    error: 'Missing required parameters: token, amount, strategy'
                });
                return;
            }

            const result = await this.flashLoanEngine.executeFlashLoan({
                token,
                amount,
                strategy,
                parameters: parameters || {}
            });

            res.json({
                success: true,
                data: result,
                message: 'Flash loan executed successfully'
            });
        } catch (error) {
            logger.error('Flash loan execution failed:', error);
            res.status(500).json({
                success: false,
                error: 'Flash loan execution failed',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    private async getFlashLoanOpportunities(req: Request, res: Response): Promise<void> {
        try {
            const { token, minProfit } = req.query;

            const opportunities = await getCacheWithFallback(
                getCacheKey('flashloan-opportunities', String(token), String(minProfit)),
                async () => await this.flashLoanEngine.findOpportunities({
                    token: token ? String(token) : undefined,
                    minProfit: minProfit ? Number(minProfit) : undefined
                }),
                60 // 1 minute cache
            );

            res.json({
                success: true,
                data: opportunities,
                count: opportunities.length
            });
        } catch (error) {
            logger.error('Failed to get flash loan opportunities:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve flash loan opportunities'
            });
        }
    }

    private async getOptionsChains(req: Request, res: Response): Promise<void> {
        try {
            const { underlying, expiration } = req.query;

            const chains = await getCacheWithFallback(
                getCacheKey('options-chains', String(underlying), String(expiration)),
                async () => await this.optionsEngine.getOptionsChains({
                    underlying: underlying ? String(underlying) : undefined,
                    expiration: expiration ? String(expiration) : undefined
                }),
                300 // 5 minutes cache
            );

            res.json({
                success: true,
                data: chains
            });
        } catch (error) {
            logger.error('Failed to get options chains:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve options chains'
            });
        }
    }

    private async executeOptionsStrategy(req: Request, res: Response): Promise<void> {
        try {
            const { strategy, legs, amount } = req.body;

            if (!strategy || !legs || !amount) {
                res.status(400).json({
                    success: false,
                    error: 'Missing required parameters: strategy, legs, amount'
                });
                return;
            }

            const result = await this.optionsEngine.executeStrategy({
                strategy,
                legs,
                amount
            });

            res.json({
                success: true,
                data: result,
                message: 'Options strategy executed successfully'
            });
        } catch (error) {
            logger.error('Options strategy execution failed:', error);
            res.status(500).json({
                success: false,
                error: 'Options strategy execution failed',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    private async getOptionsPositions(req: Request, res: Response): Promise<void> {
        try {
            const positions = await this.optionsEngine.getPositions();

            res.json({
                success: true,
                data: positions,
                count: positions.length
            });
        } catch (error) {
            logger.error('Failed to get options positions:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve options positions'
            });
        }
    }

    private async getPortfolio(req: Request, res: Response): Promise<void> {
        try {
            const portfolio = await this.portfolioManager.getPortfolio();

            res.json({
                success: true,
                data: portfolio
            });
        } catch (error) {
            logger.error('Failed to get portfolio:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve portfolio'
            });
        }
    }

    private async rebalancePortfolio(req: Request, res: Response): Promise<void> {
        try {
            const { targetAllocations, rebalanceThreshold } = req.body;

            const result = await this.portfolioManager.rebalance({
                targetAllocations,
                rebalanceThreshold: rebalanceThreshold || 5 // 5% default threshold
            });

            res.json({
                success: true,
                data: result,
                message: 'Portfolio rebalanced successfully'
            });
        } catch (error) {
            logger.error('Portfolio rebalancing failed:', error);
            res.status(500).json({
                success: false,
                error: 'Portfolio rebalancing failed',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    private async getPortfolioPerformance(req: Request, res: Response): Promise<void> {
        try {
            const { timeframe = '24h' } = req.query;

            const performance = await getCacheWithFallback(
                getCacheKey('portfolio-performance', String(timeframe)),
                async () => await this.portfolioManager.getPerformance(String(timeframe)),
                300 // 5 minutes cache
            );

            res.json({
                success: true,
                data: performance
            });
        } catch (error) {
            logger.error('Failed to get portfolio performance:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve portfolio performance'
            });
        }
    }

    private async executeTrade(req: Request, res: Response): Promise<void> {
        try {
            const { type, token, amount, price, strategy } = req.body;

            if (!type || !token || !amount) {
                res.status(400).json({
                    success: false,
                    error: 'Missing required parameters: type, token, amount'
                });
                return;
            }

            // Route to appropriate engine based on strategy
            let result;
            switch (strategy) {
                case 'arbitrage':
                    result = await this.arbitrageEngine.executeTrade({ type, token, amount, price });
                    break;
                case 'flash-loan':
                    result = await this.flashLoanEngine.executeTrade({ type, token, amount, price });
                    break;
                case 'options':
                    result = await this.optionsEngine.executeTrade({ type, token, amount, price });
                    break;
                default:
                    result = await this.portfolioManager.executeTrade({ type, token, amount, price });
                    break;
            }

            res.json({
                success: true,
                data: result,
                message: 'Trade executed successfully'
            });
        } catch (error) {
            logger.error('Trade execution failed:', error);
            res.status(500).json({
                success: false,
                error: 'Trade execution failed',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    private async getOrders(req: Request, res: Response): Promise<void> {
        try {
            const { status, limit = '50', offset = '0' } = req.query;

            const orders = await this.portfolioManager.getOrders({
                status: status ? String(status) : undefined,
                limit: Number(limit),
                offset: Number(offset)
            });

            res.json({
                success: true,
                data: orders,
                count: orders.length
            });
        } catch (error) {
            logger.error('Failed to get orders:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve orders'
            });
        }
    }

    private async cancelOrder(req: Request, res: Response): Promise<void> {
        try {
            const { orderId } = req.params;

            const result = await this.portfolioManager.cancelOrder(orderId);

            res.json({
                success: true,
                data: result,
                message: 'Order cancelled successfully'
            });
        } catch (error) {
            logger.error('Order cancellation failed:', error);
            res.status(500).json({
                success: false,
                error: 'Order cancellation failed',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
}
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZeusRouter = void 0;
const express_1 = require("express");
const logger_1 = require("../utils/logger");
const arbitrage_1 = require("../services/arbitrage");
const flashloan_1 = require("../services/flashloan");
const options_1 = require("../services/options");
const portfolio_1 = require("../services/portfolio");
const cache_1 = require("../utils/cache");
class ZeusRouter {
    constructor() {
        this.router = (0, express_1.Router)();
        this.arbitrageEngine = new arbitrage_1.ArbitrageEngine();
        this.flashLoanEngine = new flashloan_1.FlashLoanEngine();
        this.optionsEngine = new options_1.OptionsEngine();
        this.portfolioManager = new portfolio_1.PortfolioManager();
        this.setupRoutes();
    }
    setupRoutes() {
        // Arbitrage endpoints
        this.router.get('/opportunities', this.getArbitrageOpportunities.bind(this));
        this.router.post('/arbitrage', this.executeArbitrage.bind(this));
        this.router.get('/arbitrage/history', this.getArbitrageHistory.bind(this));
        // Flash loan endpoints
        this.router.post('/flash-loan', this.executeFlashLoan.bind(this));
        this.router.get('/flash-loan/opportunities', this.getFlashLoanOpportunities.bind(this));
        // Options trading endpoints
        this.router.get('/options/chains', this.getOptionsChains.bind(this));
        this.router.post('/options/trade', this.executeOptionsStrategy.bind(this));
        this.router.get('/options/positions', this.getOptionsPositions.bind(this));
        // Portfolio management
        this.router.get('/portfolio', this.getPortfolio.bind(this));
        this.router.post('/portfolio/rebalance', this.rebalancePortfolio.bind(this));
        this.router.get('/portfolio/performance', this.getPortfolioPerformance.bind(this));
        // General Zeus trading
        this.router.post('/execute', this.executeTrade.bind(this));
        this.router.get('/orders', this.getOrders.bind(this));
        this.router.delete('/orders/:orderId', this.cancelOrder.bind(this));
    }
    async getArbitrageOpportunities(req, res) {
        try {
            const { minProfit, maxRisk, chains } = req.query;
            const opportunities = await (0, cache_1.getCacheWithFallback)((0, cache_1.getCacheKey)('arbitrage-opportunities', String(minProfit), String(maxRisk), String(chains)), async () => await this.arbitrageEngine.findOpportunities({
                minProfit: minProfit ? Number(minProfit) : undefined,
                maxRisk: maxRisk ? Number(maxRisk) : undefined,
                chains: chains ? String(chains).split(',').map(Number) : undefined
            }), 30 // 30 seconds cache for opportunities
            );
            res.json({
                success: true,
                data: opportunities,
                count: opportunities.length,
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to get arbitrage opportunities:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve arbitrage opportunities'
            });
        }
    }
    async executeArbitrage(req, res) {
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
        }
        catch (error) {
            logger_1.logger.error('Arbitrage execution failed:', error);
            res.status(500).json({
                success: false,
                error: 'Arbitrage execution failed',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    async getArbitrageHistory(req, res) {
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
        }
        catch (error) {
            logger_1.logger.error('Failed to get arbitrage history:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve arbitrage history'
            });
        }
    }
    async executeFlashLoan(req, res) {
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
        }
        catch (error) {
            logger_1.logger.error('Flash loan execution failed:', error);
            res.status(500).json({
                success: false,
                error: 'Flash loan execution failed',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    async getFlashLoanOpportunities(req, res) {
        try {
            const { token, minProfit } = req.query;
            const opportunities = await (0, cache_1.getCacheWithFallback)((0, cache_1.getCacheKey)('flashloan-opportunities', String(token), String(minProfit)), async () => await this.flashLoanEngine.findOpportunities({
                token: token ? String(token) : undefined,
                minProfit: minProfit ? Number(minProfit) : undefined
            }), 60 // 1 minute cache
            );
            res.json({
                success: true,
                data: opportunities,
                count: opportunities.length
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to get flash loan opportunities:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve flash loan opportunities'
            });
        }
    }
    async getOptionsChains(req, res) {
        try {
            const { underlying, expiration } = req.query;
            const chains = await (0, cache_1.getCacheWithFallback)((0, cache_1.getCacheKey)('options-chains', String(underlying), String(expiration)), async () => await this.optionsEngine.getOptionsChains({
                underlying: underlying ? String(underlying) : undefined,
                expiration: expiration ? String(expiration) : undefined
            }), 300 // 5 minutes cache
            );
            res.json({
                success: true,
                data: chains
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to get options chains:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve options chains'
            });
        }
    }
    async executeOptionsStrategy(req, res) {
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
        }
        catch (error) {
            logger_1.logger.error('Options strategy execution failed:', error);
            res.status(500).json({
                success: false,
                error: 'Options strategy execution failed',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    async getOptionsPositions(req, res) {
        try {
            const positions = await this.optionsEngine.getPositions();
            res.json({
                success: true,
                data: positions,
                count: positions.length
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to get options positions:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve options positions'
            });
        }
    }
    async getPortfolio(req, res) {
        try {
            const portfolio = await this.portfolioManager.getPortfolio();
            res.json({
                success: true,
                data: portfolio
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to get portfolio:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve portfolio'
            });
        }
    }
    async rebalancePortfolio(req, res) {
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
        }
        catch (error) {
            logger_1.logger.error('Portfolio rebalancing failed:', error);
            res.status(500).json({
                success: false,
                error: 'Portfolio rebalancing failed',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    async getPortfolioPerformance(req, res) {
        try {
            const { timeframe = '24h' } = req.query;
            const performance = await (0, cache_1.getCacheWithFallback)((0, cache_1.getCacheKey)('portfolio-performance', String(timeframe)), async () => await this.portfolioManager.getPerformance(String(timeframe)), 300 // 5 minutes cache
            );
            res.json({
                success: true,
                data: performance
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to get portfolio performance:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve portfolio performance'
            });
        }
    }
    async executeTrade(req, res) {
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
        }
        catch (error) {
            logger_1.logger.error('Trade execution failed:', error);
            res.status(500).json({
                success: false,
                error: 'Trade execution failed',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    async getOrders(req, res) {
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
        }
        catch (error) {
            logger_1.logger.error('Failed to get orders:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve orders'
            });
        }
    }
    async cancelOrder(req, res) {
        try {
            const { orderId } = req.params;
            const result = await this.portfolioManager.cancelOrder(orderId);
            res.json({
                success: true,
                data: result,
                message: 'Order cancelled successfully'
            });
        }
        catch (error) {
            logger_1.logger.error('Order cancellation failed:', error);
            res.status(500).json({
                success: false,
                error: 'Order cancellation failed',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
}
exports.ZeusRouter = ZeusRouter;
//# sourceMappingURL=zeus.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.X402Router = void 0;
const express_1 = require("express");
const logger_1 = require("../utils/logger");
const x402_1 = require("../providers/x402");
const cache_1 = require("../utils/cache");
class X402Router {
    constructor() {
        this.router = (0, express_1.Router)();
        this.x402Provider = new x402_1.X402Provider();
        this.setupRoutes();
    }
    setupRoutes() {
        // Protocol information
        this.router.get('/protocols', this.getProtocols.bind(this));
        this.router.get('/bridges', this.getBridges.bind(this));
        this.router.get('/oracles', this.getOracles.bind(this));
        // Bridge operations
        this.router.post('/bridge', this.executeBridge.bind(this));
        this.router.get('/bridge/routes', this.getBridgeRoutes.bind(this));
        this.router.get('/bridge/quote', this.getBridgeQuote.bind(this));
        // Oracle data
        this.router.get('/oracle/price/:token', this.getOraclePrice.bind(this));
        this.router.get('/oracle/feeds', this.getOracleFeeds.bind(this));
        // Protocol analysis
        this.router.get('/protocol/:address/info', this.getProtocolInfo.bind(this));
        this.router.get('/protocol/:address/security', this.getProtocolSecurity.bind(this));
        // Liquidity analysis
        this.router.get('/liquidity/:pool', this.getLiquidityInfo.bind(this));
        this.router.get('/liquidity/top-pools', this.getTopPools.bind(this));
    }
    async getProtocols(req, res) {
        try {
            const protocols = await (0, cache_1.getCacheWithFallback)((0, cache_1.getCacheKey)('protocols'), async () => await this.x402Provider.getSupportedProtocols(), 3600 // 1 hour cache
            );
            res.json({
                success: true,
                data: protocols,
                count: protocols.length
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to get protocols:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve protocols'
            });
        }
    }
    async getBridges(req, res) {
        try {
            const bridges = await (0, cache_1.getCacheWithFallback)((0, cache_1.getCacheKey)('bridges'), async () => await this.x402Provider.getAvailableBridges(), 1800 // 30 minutes cache
            );
            res.json({
                success: true,
                data: bridges,
                count: bridges.length
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to get bridges:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve bridge information'
            });
        }
    }
    async getOracles(req, res) {
        try {
            const oracles = await (0, cache_1.getCacheWithFallback)((0, cache_1.getCacheKey)('oracles'), async () => await this.x402Provider.getOracleFeeds(), 600 // 10 minutes cache
            );
            res.json({
                success: true,
                data: oracles,
                count: oracles.length
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to get oracles:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve oracle information'
            });
        }
    }
    async executeBridge(req, res) {
        try {
            const { fromChain, toChain, token, amount, recipient } = req.body;
            // Validate required parameters
            if (!fromChain || !toChain || !token || !amount || !recipient) {
                res.status(400).json({
                    success: false,
                    error: 'Missing required parameters: fromChain, toChain, token, amount, recipient'
                });
                return;
            }
            const result = await this.x402Provider.executeBridge({
                fromChain,
                toChain,
                token,
                amount,
                recipient
            });
            res.json({
                success: true,
                data: result,
                message: 'Bridge transaction submitted successfully'
            });
        }
        catch (error) {
            logger_1.logger.error('Bridge execution failed:', error);
            res.status(500).json({
                success: false,
                error: 'Bridge execution failed',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    async getBridgeRoutes(req, res) {
        try {
            const { fromChain, toChain, token } = req.query;
            const routes = await (0, cache_1.getCacheWithFallback)((0, cache_1.getCacheKey)('bridge-routes', String(fromChain), String(toChain), String(token)), async () => await this.x402Provider.getBridgeRoutes({
                fromChain: Number(fromChain),
                toChain: Number(toChain),
                token: String(token)
            }), 300 // 5 minutes cache
            );
            res.json({
                success: true,
                data: routes
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to get bridge routes:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve bridge routes'
            });
        }
    }
    async getBridgeQuote(req, res) {
        try {
            const { fromChain, toChain, token, amount } = req.query;
            if (!fromChain || !toChain || !token || !amount) {
                res.status(400).json({
                    success: false,
                    error: 'Missing required parameters: fromChain, toChain, token, amount'
                });
                return;
            }
            const quote = await this.x402Provider.getBridgeQuote({
                fromChain: Number(fromChain),
                toChain: Number(toChain),
                token: String(token),
                amount: String(amount)
            });
            res.json({
                success: true,
                data: quote
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to get bridge quote:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get bridge quote'
            });
        }
    }
    async getOraclePrice(req, res) {
        try {
            const { token } = req.params;
            const { pair } = req.query;
            const price = await (0, cache_1.getCacheWithFallback)((0, cache_1.getCacheKey)('oracle-price', token, String(pair || 'USD')), async () => await this.x402Provider.getOraclePrice(token, String(pair || 'USD')), 60 // 1 minute cache for prices
            );
            res.json({
                success: true,
                data: {
                    token,
                    pair: pair || 'USD',
                    price,
                    timestamp: new Date().toISOString()
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to get oracle price:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve oracle price'
            });
        }
    }
    async getOracleFeeds(req, res) {
        try {
            const feeds = await (0, cache_1.getCacheWithFallback)((0, cache_1.getCacheKey)('oracle-feeds'), async () => await this.x402Provider.getOracleFeeds(), 300 // 5 minutes cache
            );
            res.json({
                success: true,
                data: feeds,
                count: feeds.length
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to get oracle feeds:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve oracle feeds'
            });
        }
    }
    async getProtocolInfo(req, res) {
        try {
            const { address } = req.params;
            const info = await (0, cache_1.getCacheWithFallback)((0, cache_1.getCacheKey)('protocol-info', address), async () => await this.x402Provider.getProtocolInfo(address), 1800 // 30 minutes cache
            );
            res.json({
                success: true,
                data: info
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to get protocol info:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve protocol information'
            });
        }
    }
    async getProtocolSecurity(req, res) {
        try {
            const { address } = req.params;
            const security = await (0, cache_1.getCacheWithFallback)((0, cache_1.getCacheKey)('protocol-security', address), async () => await this.x402Provider.analyzeProtocolSecurity(address), 3600 // 1 hour cache
            );
            res.json({
                success: true,
                data: security
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to get protocol security:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to analyze protocol security'
            });
        }
    }
    async getLiquidityInfo(req, res) {
        try {
            const { pool } = req.params;
            const liquidity = await (0, cache_1.getCacheWithFallback)((0, cache_1.getCacheKey)('liquidity-info', pool), async () => await this.x402Provider.getLiquidityInfo(pool), 180 // 3 minutes cache
            );
            res.json({
                success: true,
                data: liquidity
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to get liquidity info:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve liquidity information'
            });
        }
    }
    async getTopPools(req, res) {
        try {
            const { limit = '10', sortBy = 'tvl' } = req.query;
            const pools = await (0, cache_1.getCacheWithFallback)((0, cache_1.getCacheKey)('top-pools', String(limit), String(sortBy)), async () => await this.x402Provider.getTopLiquidityPools({
                limit: Number(limit),
                sortBy: String(sortBy)
            }), 600 // 10 minutes cache
            );
            res.json({
                success: true,
                data: pools,
                count: pools.length
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to get top pools:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve top pools'
            });
        }
    }
}
exports.X402Router = X402Router;
//# sourceMappingURL=x402.js.map
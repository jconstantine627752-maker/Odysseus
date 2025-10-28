"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthRouter = void 0;
const express_1 = require("express");
const logger_1 = require("../utils/logger");
const config_1 = require("../config/config");
class HealthRouter {
    constructor() {
        this.router = (0, express_1.Router)();
        this.config = new config_1.OdinConfig();
        this.setupRoutes();
    }
    setupRoutes() {
        this.router.get('/', this.getHealth.bind(this));
        this.router.get('/status', this.getDetailedStatus.bind(this));
        this.router.get('/metrics', this.getMetrics.bind(this));
    }
    async getHealth(req, res) {
        try {
            res.json({
                status: 'healthy',
                service: 'Odin X402 Protocol Module',
                version: '1.0.0',
                timestamp: new Date().toISOString(),
                uptime: process.uptime()
            });
        }
        catch (error) {
            logger_1.logger.error('Health check failed:', error);
            res.status(500).json({
                status: 'unhealthy',
                error: 'Health check failed'
            });
        }
    }
    async getDetailedStatus(req, res) {
        try {
            const status = {
                service: 'Odin X402 Protocol Module',
                version: '1.0.0',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                environment: this.config.nodeEnv,
                configuration: this.config.toJSON(),
                features: {
                    x402Protocol: true,
                    mevProtection: this.config.enableMevProtection,
                    arbitrage: this.config.enableArbitrage,
                    flashLoans: this.config.enableFlashLoans,
                    optionsTrading: this.config.enableOptionsTrading,
                    paperTrading: this.config.paperTrading
                },
                chains: {
                    x402: { chainId: this.config.x402ChainId, enabled: true },
                    ethereum: { chainId: 1, enabled: !!this.config.ethereumRpcUrl },
                    polygon: { chainId: 137, enabled: !!this.config.polygonRpcUrl },
                    arbitrum: { chainId: 42161, enabled: !!this.config.arbitrumRpcUrl },
                    optimism: { chainId: 10, enabled: !!this.config.optimismRpcUrl }
                },
                memory: {
                    used: process.memoryUsage().heapUsed / 1024 / 1024,
                    total: process.memoryUsage().heapTotal / 1024 / 1024,
                    external: process.memoryUsage().external / 1024 / 1024
                }
            };
            res.json(status);
        }
        catch (error) {
            logger_1.logger.error('Status check failed:', error);
            res.status(500).json({
                status: 'error',
                error: 'Status check failed'
            });
        }
    }
    async getMetrics(req, res) {
        try {
            // Mock metrics - in production, integrate with proper metrics system
            const metrics = {
                requests: {
                    total: Math.floor(Math.random() * 10000),
                    successful: Math.floor(Math.random() * 9500),
                    failed: Math.floor(Math.random() * 500)
                },
                trading: {
                    totalTrades: Math.floor(Math.random() * 1000),
                    successfulTrades: Math.floor(Math.random() * 950),
                    totalVolume: Math.floor(Math.random() * 1000000),
                    averageSlippage: (Math.random() * 2).toFixed(3)
                },
                arbitrage: {
                    opportunitiesFound: Math.floor(Math.random() * 500),
                    opportunitiesExecuted: Math.floor(Math.random() * 400),
                    totalProfit: Math.floor(Math.random() * 50000)
                },
                risk: {
                    stopLossTriggered: Math.floor(Math.random() * 50),
                    takeProfitTriggered: Math.floor(Math.random() * 100),
                    currentDrawdown: (Math.random() * 5).toFixed(2)
                },
                performance: {
                    avgResponseTime: Math.floor(Math.random() * 200),
                    uptime: process.uptime(),
                    memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024,
                    cpuUsage: (Math.random() * 100).toFixed(1)
                }
            };
            res.json(metrics);
        }
        catch (error) {
            logger_1.logger.error('Metrics retrieval failed:', error);
            res.status(500).json({
                status: 'error',
                error: 'Metrics retrieval failed'
            });
        }
    }
}
exports.HealthRouter = HealthRouter;
//# sourceMappingURL=health.js.map
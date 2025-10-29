import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger';
import { OdinConfig } from '../config/config';

export class HealthRouter {
    public router: Router;
    private config: OdinConfig;

    constructor() {
        this.router = Router();
        this.config = new OdinConfig();
        this.setupRoutes();
    }

    private setupRoutes(): void {
        this.router.get('/', this.getHealth.bind(this));
        this.router.get('/status', this.getDetailedStatus.bind(this));
        this.router.get('/metrics', this.getMetrics.bind(this));
    }

    private async getHealth(req: Request, res: Response): Promise<void> {
        try {
            res.json({
                status: 'healthy',
                service: 'Odin HTTP 402 Payment Module',
                version: '1.0.0',
                timestamp: new Date().toISOString(),
                uptime: process.uptime()
            });
        } catch (error) {
            logger.error('Health check failed:', error);
            res.status(500).json({
                status: 'unhealthy',
                error: 'Health check failed'
            });
        }
    }

    private async getDetailedStatus(req: Request, res: Response): Promise<void> {
        try {
            const status = {
                service: 'Odin HTTP 402 Payment Module',
                version: '1.0.0',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                environment: this.config.nodeEnv,
                configuration: this.config.toJSON(),
                features: {
                    http402Protocol: this.config.paymentProtocolEnabled,
                    paymentTracking: true,
                    multiChainSupport: true
                },
                chains: {
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
        } catch (error) {
            logger.error('Status check failed:', error);
            res.status(500).json({
                status: 'error',
                error: 'Status check failed'
            });
        }
    }

    private async getMetrics(req: Request, res: Response): Promise<void> {
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
        } catch (error) {
            logger.error('Metrics retrieval failed:', error);
            res.status(500).json({
                status: 'error',
                error: 'Metrics retrieval failed'
            });
        }
    }
}
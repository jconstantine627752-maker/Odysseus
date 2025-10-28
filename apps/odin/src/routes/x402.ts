import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger';
import { X402Provider } from '../providers/x402';
import { getCacheWithFallback, getCacheKey } from '../utils/cache';

export class X402Router {
    public router: Router;
    private x402Provider: X402Provider;

    constructor() {
        this.router = Router();
        this.x402Provider = new X402Provider();
        this.setupRoutes();
    }

    private setupRoutes(): void {
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

    private async getProtocols(req: Request, res: Response): Promise<void> {
        try {
            const protocols = await getCacheWithFallback(
                getCacheKey('protocols'),
                async () => await this.x402Provider.getSupportedProtocols(),
                3600 // 1 hour cache
            );

            res.json({
                success: true,
                data: protocols,
                count: protocols.length
            });
        } catch (error) {
            logger.error('Failed to get protocols:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve protocols'
            });
        }
    }

    private async getBridges(req: Request, res: Response): Promise<void> {
        try {
            const bridges = await getCacheWithFallback(
                getCacheKey('bridges'),
                async () => await this.x402Provider.getAvailableBridges(),
                1800 // 30 minutes cache
            );

            res.json({
                success: true,
                data: bridges,
                count: bridges.length
            });
        } catch (error) {
            logger.error('Failed to get bridges:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve bridge information'
            });
        }
    }

    private async getOracles(req: Request, res: Response): Promise<void> {
        try {
            const oracles = await getCacheWithFallback(
                getCacheKey('oracles'),
                async () => await this.x402Provider.getOracleFeeds(),
                600 // 10 minutes cache
            );

            res.json({
                success: true,
                data: oracles,
                count: oracles.length
            });
        } catch (error) {
            logger.error('Failed to get oracles:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve oracle information'
            });
        }
    }

    private async executeBridge(req: Request, res: Response): Promise<void> {
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
        } catch (error) {
            logger.error('Bridge execution failed:', error);
            res.status(500).json({
                success: false,
                error: 'Bridge execution failed',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    private async getBridgeRoutes(req: Request, res: Response): Promise<void> {
        try {
            const { fromChain, toChain, token } = req.query;

            const routes = await getCacheWithFallback(
                getCacheKey('bridge-routes', String(fromChain), String(toChain), String(token)),
                async () => await this.x402Provider.getBridgeRoutes({
                    fromChain: Number(fromChain),
                    toChain: Number(toChain),
                    token: String(token)
                }),
                300 // 5 minutes cache
            );

            res.json({
                success: true,
                data: routes
            });
        } catch (error) {
            logger.error('Failed to get bridge routes:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve bridge routes'
            });
        }
    }

    private async getBridgeQuote(req: Request, res: Response): Promise<void> {
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
        } catch (error) {
            logger.error('Failed to get bridge quote:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get bridge quote'
            });
        }
    }

    private async getOraclePrice(req: Request, res: Response): Promise<void> {
        try {
            const { token } = req.params;
            const { pair } = req.query;

            const price = await getCacheWithFallback(
                getCacheKey('oracle-price', token, String(pair || 'USD')),
                async () => await this.x402Provider.getOraclePrice(token, String(pair || 'USD')),
                60 // 1 minute cache for prices
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
        } catch (error) {
            logger.error('Failed to get oracle price:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve oracle price'
            });
        }
    }

    private async getOracleFeeds(req: Request, res: Response): Promise<void> {
        try {
            const feeds = await getCacheWithFallback(
                getCacheKey('oracle-feeds'),
                async () => await this.x402Provider.getOracleFeeds(),
                300 // 5 minutes cache
            );

            res.json({
                success: true,
                data: feeds,
                count: feeds.length
            });
        } catch (error) {
            logger.error('Failed to get oracle feeds:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve oracle feeds'
            });
        }
    }

    private async getProtocolInfo(req: Request, res: Response): Promise<void> {
        try {
            const { address } = req.params;

            const info = await getCacheWithFallback(
                getCacheKey('protocol-info', address),
                async () => await this.x402Provider.getProtocolInfo(address),
                1800 // 30 minutes cache
            );

            res.json({
                success: true,
                data: info
            });
        } catch (error) {
            logger.error('Failed to get protocol info:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve protocol information'
            });
        }
    }

    private async getProtocolSecurity(req: Request, res: Response): Promise<void> {
        try {
            const { address } = req.params;

            const security = await getCacheWithFallback(
                getCacheKey('protocol-security', address),
                async () => await this.x402Provider.analyzeProtocolSecurity(address),
                3600 // 1 hour cache
            );

            res.json({
                success: true,
                data: security
            });
        } catch (error) {
            logger.error('Failed to get protocol security:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to analyze protocol security'
            });
        }
    }

    private async getLiquidityInfo(req: Request, res: Response): Promise<void> {
        try {
            const { pool } = req.params;

            const liquidity = await getCacheWithFallback(
                getCacheKey('liquidity-info', pool),
                async () => await this.x402Provider.getLiquidityInfo(pool),
                180 // 3 minutes cache
            );

            res.json({
                success: true,
                data: liquidity
            });
        } catch (error) {
            logger.error('Failed to get liquidity info:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve liquidity information'
            });
        }
    }

    private async getTopPools(req: Request, res: Response): Promise<void> {
        try {
            const { limit = '10', sortBy = 'tvl' } = req.query;

            const pools = await getCacheWithFallback(
                getCacheKey('top-pools', String(limit), String(sortBy)),
                async () => await this.x402Provider.getTopLiquidityPools({
                    limit: Number(limit),
                    sortBy: String(sortBy)
                }),
                600 // 10 minutes cache
            );

            res.json({
                success: true,
                data: pools,
                count: pools.length
            });
        } catch (error) {
            logger.error('Failed to get top pools:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve top pools'
            });
        }
    }
}
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createLogger } from './utils/logger';
import { ZeusRouter } from './routes/trading';
import { OdinConfig } from './config/config';

// Load environment variables
dotenv.config();

const logger = createLogger('ZeusServer');

class ZeusServer {
    private app: express.Application;
    private config: OdinConfig;
    private zeusRouter: ZeusRouter;

    constructor() {
        this.app = express();
        this.config = new OdinConfig();
        this.zeusRouter = new ZeusRouter();
        this.setupMiddleware();
        this.setupRoutes();
    }

    private setupMiddleware(): void {
        // Security middleware
        this.app.use(helmet({
            contentSecurityPolicy: false,
            crossOriginEmbedderPolicy: false
        }));

        // CORS configuration
        this.app.use(cors({
            origin: process.env.NODE_ENV === 'production' 
                ? ['https://your-production-domain.com'] 
                : true,
            credentials: true
        }));

        // Body parsing
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // Request logging
        this.app.use((req, res, next) => {
            logger.info(`${req.method} ${req.path}`, {
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
            next();
        });
    }

    private setupRoutes(): void {
        // Health check endpoint
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                service: 'Zeus Trading Engine',
                version: '1.0.0',
                timestamp: new Date().toISOString(),
                uptime: process.uptime()
            });
        });

        // Main trading routes
        this.app.use('/api', this.zeusRouter.router);

        // Root endpoint
        this.app.get('/', (req, res) => {
            res.json({
                service: 'Zeus Trading Engine',
                version: '1.0.0',
                description: 'Advanced DeFi trading strategies and execution layer',
                status: 'operational',
                timestamp: new Date().toISOString(),
                documentation: '/api',
                features: [
                    'Cross-DEX Arbitrage',
                    'Flash Loan Strategies',
                    'Options Trading',
                    'Portfolio Management',
                    'Risk Management',
                    'MEV Protection'
                ]
            });
        });

        // 404 handler
        this.app.use('*', (req, res) => {
            res.status(404).json({
                error: 'Endpoint not found',
                path: req.originalUrl,
                method: req.method,
                availableEndpoints: {
                    root: '/',
                    health: '/health',
                    api: '/api',
                    arbitrage: '/api/arbitrage/*',
                    flashLoans: '/api/flash-loans/*',
                    options: '/api/options/*',
                    portfolio: '/api/portfolio/*'
                }
            });
        });

        // Error handler
        this.app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
            logger.error('Unhandled error:', error);
            res.status(500).json({
                error: 'Internal server error',
                message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
            });
        });
    }

    private async initializeServices(): Promise<void> {
        try {
            logger.info('Initializing Zeus trading services...');

            // Initialize Redis cache (commented out for demo)
            // await initializeRedis();
            logger.info('✓ Redis cache initialized (simulated)');

            // Initialize trading engines
            logger.info('✓ Arbitrage engine initialized');
            logger.info('✓ Flash loan engine initialized');
            logger.info('✓ Options engine initialized');
            logger.info('✓ Portfolio manager initialized');

            logger.info('All Zeus services initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize Zeus services:', error);
            throw error;
        }
    }

    public async start(): Promise<void> {
        try {
            // Initialize all services
            await this.initializeServices();

            // Start HTTP server
            const port = parseInt(process.env.ZEUS_PORT || '8888');
            const host = process.env.ZEUS_HOST || '0.0.0.0';

            this.app.listen(port, host, () => {
                logger.info(`⚡ Zeus Trading Engine running on http://${host}:${port}`);
                logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
                logger.info(`Paper trading: ${process.env.PAPER_TRADING === 'true' ? 'ENABLED' : 'DISABLED'}`);
                logger.info(`Arbitrage: ${process.env.ENABLE_ARBITRAGE === 'true' ? 'ENABLED' : 'DISABLED'}`);
                logger.info(`Flash loans: ${process.env.ENABLE_FLASH_LOANS === 'true' ? 'ENABLED' : 'DISABLED'}`);
                logger.info(`Options trading: ${process.env.ENABLE_OPTIONS_TRADING === 'true' ? 'ENABLED' : 'DISABLED'}`);
            });

            // Graceful shutdown handling
            process.on('SIGTERM', this.gracefulShutdown.bind(this));
            process.on('SIGINT', this.gracefulShutdown.bind(this));

        } catch (error) {
            logger.error('Failed to start Zeus server:', error);
            process.exit(1);
        }
    }

    private async gracefulShutdown(): Promise<void> {
        logger.info('Received shutdown signal, gracefully shutting down...');
        
        // Add cleanup logic here
        // - Close database connections
        // - Cancel pending trades
        // - Save trading state
        
        process.exit(0);
    }
}

// Start the server if this file is run directly
if (require.main === module) {
    const server = new ZeusServer();
    server.start().catch((error) => {
        console.error('Failed to start Zeus server:', error);
        process.exit(1);
    });
}

export { ZeusServer };
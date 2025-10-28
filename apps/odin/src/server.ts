import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createLogger } from './utils/logger';
import { ZeusRouter } from './routes/zeus';
import { RiskRouter } from './routes/risk';
import { HealthRouter } from './routes/health';
import { OdinConfig } from './config/config';
// import { initializeRedis } from './utils/cache';
// import { startBackgroundServices } from './services/background';

// Load environment variables
dotenv.config();

const logger = createLogger('OdinServer');

class OdinServer {
    private app: express.Application;
    private config: OdinConfig;
    private zeusRouter: ZeusRouter;
    private riskRouter: RiskRouter;
    private healthRouter: HealthRouter;

    constructor() {
        this.app = express();
        this.config = new OdinConfig();
        this.zeusRouter = new ZeusRouter();
        this.riskRouter = new RiskRouter();
        this.healthRouter = new HealthRouter();
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
        // Static files for demo
        this.app.use('/static', express.static('src/public'));

        // API routes
        this.app.use('/health', this.healthRouter.router);
        this.app.use('/zeus', this.zeusRouter.router);
        this.app.use('/risk', this.riskRouter.router);

        // Demo UI route
        this.app.get('/', (req, res) => {
            res.sendFile('demo.html', { root: 'src/public' });
        });

        // API info endpoint
        this.app.get('/api', (req, res) => {
            res.json({
                service: 'Odin Zeus Trading Engine',
                version: '1.0.0',
                status: 'operational',
                timestamp: new Date().toISOString(),
                endpoints: {
                    health: '/health',
                    zeus: '/zeus',
                    risk: '/risk'
                }
            });
        });

        // 404 handler
        this.app.use('*', (req, res) => {
            res.status(404).json({
                error: 'Endpoint not found',
                path: req.originalUrl,
                method: req.method
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
            logger.info('Initializing Odin services...');

            // Initialize Redis cache (commented out for demo)
            // await initializeRedis();
            logger.info('✓ Redis cache initialized (simulated)');

            // Initialize Zeus trading engine
            logger.info('✓ Zeus trading engine initialized');

            // Start background services (commented out for demo)
            // await startBackgroundServices();
            logger.info('✓ Background services started (simulated)');

            logger.info('All services initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize services:', error);
            throw error;
        }
    }

    public async start(): Promise<void> {
        try {
            // Initialize all services
            await this.initializeServices();

            // Start HTTP server
            const port = this.config.port;
            const host = this.config.host;

            this.app.listen(port, host, () => {
                logger.info(`⚡ Odin Zeus Trading Engine running on http://${host}:${port}`);
                logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
                logger.info(`Paper trading: ${process.env.PAPER_TRADING === 'true' ? 'ENABLED' : 'DISABLED'}`);
                logger.info(`MEV protection: ${process.env.ENABLE_MEV_PROTECTION === 'true' ? 'ENABLED' : 'DISABLED'}`);
            });

            // Graceful shutdown handling
            process.on('SIGTERM', this.gracefulShutdown.bind(this));
            process.on('SIGINT', this.gracefulShutdown.bind(this));

        } catch (error) {
            logger.error('Failed to start Odin server:', error);
            process.exit(1);
        }
    }

    private async gracefulShutdown(): Promise<void> {
        logger.info('Received shutdown signal, gracefully shutting down...');
        
        // Add cleanup logic here
        // - Close database connections
        // - Cancel pending trades
        // - Save state
        
        process.exit(0);
    }
}

// Start the server if this file is run directly
if (require.main === module) {
    const server = new OdinServer();
    server.start().catch((error) => {
        console.error('Failed to start server:', error);
        process.exit(1);
    });
}

export { OdinServer };
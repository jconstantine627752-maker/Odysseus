import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createLogger } from './utils/logger';
import { x402Router } from './routes/http402';
import { HealthRouter } from './routes/health';
import { OdinConfig } from './config/config';
import { paymentService } from './services/x402';
// import { initializeRedis } from './utils/cache';
// import { startBackgroundServices } from './services/background';

// Load environment variables
dotenv.config();

const logger = createLogger('OdinServer');

class OdinServer {
    private app: express.Application;
    private config: OdinConfig;
    private healthRouter: HealthRouter;

    constructor() {
        this.app = express();
        this.config = new OdinConfig();
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
        this.app.use('/x402', x402Router);

        // Demo UI route
        this.app.get('/', (req, res) => {
            res.sendFile('demo.html', { root: 'src/public' });
        });

        // API info endpoint
        this.app.get('/api', (req, res) => {
            res.json({
                service: 'Odin HTTP 402 Payment Module',
                version: '1.0.0',
                status: 'operational',
                timestamp: new Date().toISOString(),
                endpoints: {
                    health: '/health',
                    x402: '/x402'
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

            // Initialize X402 payment service
            this.app.locals.paymentService = paymentService;
            logger.info('✓ X402 payment service initialized');

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
                                logger.info(`Odin HTTP 402 Payment Module running on http://${host}:${port}`);
                logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
                logger.info(`HTTP 402 Protocol: ${this.config.paymentProtocolEnabled ? 'ENABLED' : 'DISABLED'}`);
                logger.info(`Payment Tracking: ENABLED`);
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
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OdinServer = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const logger_1 = require("./utils/logger");
const http402_1 = require("./routes/http402");
const health_1 = require("./routes/health");
const config_1 = require("./config/config");
const x402_1 = require("./services/x402");
// import { initializeRedis } from './utils/cache';
// import { startBackgroundServices } from './services/background';
// Load environment variables
dotenv_1.default.config();
const logger = (0, logger_1.createLogger)('OdinServer');
class OdinServer {
    constructor() {
        this.app = (0, express_1.default)();
        this.config = new config_1.OdinConfig();
        this.healthRouter = new health_1.HealthRouter();
        this.setupMiddleware();
        this.setupRoutes();
    }
    setupMiddleware() {
        // Security middleware
        this.app.use((0, helmet_1.default)({
            contentSecurityPolicy: false,
            crossOriginEmbedderPolicy: false
        }));
        // CORS configuration
        this.app.use((0, cors_1.default)({
            origin: process.env.NODE_ENV === 'production'
                ? ['https://your-production-domain.com']
                : true,
            credentials: true
        }));
        // Body parsing
        this.app.use(express_1.default.json({ limit: '10mb' }));
        this.app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
        // Request logging
        this.app.use((req, res, next) => {
            logger.info(`${req.method} ${req.path}`, {
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
            next();
        });
    }
    setupRoutes() {
        // Static files for demo
        this.app.use('/static', express_1.default.static('src/public'));
        // API routes
        this.app.use('/health', this.healthRouter.router);
        this.app.use('/x402', http402_1.x402Router);
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
        this.app.use((error, req, res, next) => {
            logger.error('Unhandled error:', error);
            res.status(500).json({
                error: 'Internal server error',
                message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
            });
        });
    }
    async initializeServices() {
        try {
            logger.info('Initializing Odin services...');
            // Initialize Redis cache (commented out for demo)
            // await initializeRedis();
            logger.info('✓ Redis cache initialized (simulated)');
            // Initialize X402 payment service
            this.app.locals.paymentService = x402_1.paymentService;
            logger.info('✓ X402 payment service initialized');
            // Start background services (commented out for demo)
            // await startBackgroundServices();
            logger.info('✓ Background services started (simulated)');
            logger.info('All services initialized successfully');
        }
        catch (error) {
            logger.error('Failed to initialize services:', error);
            throw error;
        }
    }
    async start() {
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
        }
        catch (error) {
            logger.error('Failed to start Odin server:', error);
            process.exit(1);
        }
    }
    async gracefulShutdown() {
        logger.info('Received shutdown signal, gracefully shutting down...');
        // Add cleanup logic here
        // - Close database connections
        // - Cancel pending trades
        // - Save state
        process.exit(0);
    }
}
exports.OdinServer = OdinServer;
// Start the server if this file is run directly
if (require.main === module) {
    const server = new OdinServer();
    server.start().catch((error) => {
        console.error('Failed to start server:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=server.js.map
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
const x402_1 = require("./routes/x402");
const zeus_1 = require("./routes/zeus");
const risk_1 = require("./routes/risk");
const health_1 = require("./routes/health");
const config_1 = require("./config/config");
const x402_2 = require("./providers/x402");
const cache_1 = require("./utils/cache");
const background_1 = require("./services/background");
// Load environment variables
dotenv_1.default.config();
const logger = (0, logger_1.createLogger)('OdinServer');
class OdinServer {
    constructor() {
        this.app = (0, express_1.default)();
        this.config = new config_1.OdinConfig();
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
        // API routes
        this.app.use('/health', new health_1.HealthRouter().router);
        this.app.use('/x402', new x402_1.X402Router().router);
        this.app.use('/zeus', new zeus_1.ZeusRouter().router);
        this.app.use('/risk', new risk_1.RiskRouter().router);
        // Root endpoint
        this.app.get('/', (req, res) => {
            res.json({
                service: 'Odin X402 Protocol Module',
                version: '1.0.0',
                status: 'operational',
                timestamp: new Date().toISOString(),
                endpoints: {
                    health: '/health',
                    x402: '/x402',
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
            // Initialize Redis cache
            await (0, cache_1.initializeRedis)();
            logger.info('✓ Redis cache initialized');
            // Initialize X402 provider
            await (0, x402_2.initializeX402Provider)();
            logger.info('✓ X402 provider initialized');
            // Start background services
            await (0, background_1.startBackgroundServices)();
            logger.info('✓ Background services started');
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
                logger.info(`🔱 Odin X402 server running on http://${host}:${port}`);
                logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
                logger.info(`Paper trading: ${process.env.PAPER_TRADING === 'true' ? 'ENABLED' : 'DISABLED'}`);
                logger.info(`MEV protection: ${process.env.ENABLE_MEV_PROTECTION === 'true' ? 'ENABLED' : 'DISABLED'}`);
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
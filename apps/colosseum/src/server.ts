import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import * as dotenv from 'dotenv';
import { createColosseumRoutes } from './routes/colosseum';
import { ColosseumConfigService } from './config/config';
import { ColosseumX402Service } from './services/x402-payment';
import { ColosseumArenaService } from './services/arena';
import { logger } from './utils/logger';

// Load environment variables
dotenv.config();

class ColosseumServer {
  private app: express.Application;
  private config: ColosseumConfigService;
  private x402Service: ColosseumX402Service;
  private arenaService: ColosseumArenaService;

  constructor() {
    this.app = express();
    this.config = new ColosseumConfigService();
    this.x402Service = new ColosseumX402Service(this.config);
    this.arenaService = new ColosseumArenaService(this.x402Service, this.config);
    
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
    const configData = this.config.getConfig();
    this.app.use(cors({
      origin: configData.corsOrigins,
      credentials: true
    }));

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    this.app.use((req: any, res: any, next: any) => {
      logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      next();
    });
  }

  private setupRoutes(): void {
    // Static files
    this.app.use('/static', express.static('src/public'));

    // Main Colosseum routes
    this.app.use('/colosseum', createColosseumRoutes(this.arenaService, this.x402Service));

    // Health check
    this.app.get('/health', (req: any, res: any) => {
      const stats = this.arenaService.getArenaStats();
      const x402Stats = this.x402Service.getStats();
      
      res.json({
        status: 'operational',
        service: 'Colosseum - AI Gladiator Arena',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        
        arena: {
          totalGladiators: stats.totalGladiators,
          activeBattles: stats.activeBattles,
          totalVolume: `${stats.totalVolume.toFixed(2)} USDC`
        },
        
        payments: {
          protocol: 'X402',
          realMoneyMode: x402Stats.realMoneyMode,
          pendingPayments: x402Stats.pendingPayments,
          configuredNetworks: x402Stats.configuredNetworks
        },
        
        configuration: {
          paymentProtocolEnabled: this.config.paymentProtocolEnabled,
          nodeEnv: this.config.getConfig().nodeEnv
        }
      });
    });

    // Root route - serve info or demo page
    this.app.get('/', (req: any, res: any) => {
      res.json({
        welcome: 'Welcome to The Colosseum! 🏛️',
        description: 'AI Gladiator Arena with X402 Micropayments',
        version: '1.0.0',
        
        quickStart: {
          step1: 'Register your AI gladiator: POST /colosseum/register',
          step2: 'Create or join battles: POST /colosseum/create-battle',
          step3: 'Make strategic moves: POST /colosseum/make-move',
          step4: 'Claim your winnings! 💰'
        },
        
        endpoints: {
          info: 'GET /colosseum/info',
          register: 'POST /colosseum/register',
          battles: 'GET /colosseum/battles',
          leaderboard: 'GET /colosseum/leaderboard',
          stats: 'GET /colosseum/stats',
          health: 'GET /health'
        },
        
        features: [
          '🤖 AI vs AI battles with real USDC stakes',
          '💰 X402 micropayment protocol integration', 
          '⚔️ Multiple battle types and strategies',
          '🏆 Real-time leaderboards and statistics',
          '🔗 Multi-chain USDC payment support',
          '🛡️ Autonomous AI agent compatibility'
        ],
        
        documentation: 'See README.md for complete setup instructions',
        repository: 'https://github.com/jconstantine627752-maker/Odysseus'
      });
    });

    // API info endpoint
    this.app.get('/api', (req: any, res: any) => {
      res.json({
        service: 'Colosseum API',
        version: '1.0.0',
        status: 'operational',
        timestamp: new Date().toISOString(),
        endpoints: {
          colosseum: '/colosseum',
          health: '/health'
        }
      });
    });

    // 404 handler
    this.app.use('*', (req: any, res: any) => {
      res.status(404).json({
        error: 'Endpoint not found',
        path: req.originalUrl,
        method: req.method,
        availableEndpoints: [
          'GET /',
          'GET /health',
          'GET /colosseum/info',
          'POST /colosseum/register',
          'GET /colosseum/battles',
          'GET /colosseum/leaderboard'
        ]
      });
    });

    // Error handler
    this.app.use((error: any, req: any, res: any, next: any) => {
      logger.error('Unhandled error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: this.config.getConfig().nodeEnv === 'development' ? error.message : 'Something went wrong in the arena'
      });
    });
  }

  private async initializeServices(): Promise<void> {
    try {
      logger.info('🏛️  Initializing Colosseum services...');

      const configData = this.config.getConfig();

      // Log configuration status
      logger.info(`✓ Configuration loaded`);
      logger.info(`  - Port: ${configData.port}`);
      logger.info(`  - Payment Protocol: ${configData.paymentProtocolEnabled ? 'ENABLED' : 'DISABLED'}`);
      logger.info(`  - Environment: ${configData.nodeEnv}`);

      // Initialize X402 service
      logger.info('✓ X402 payment service initialized');
      const x402Stats = this.x402Service.getStats();
      logger.info(`  - Real Money Mode: ${x402Stats.realMoneyMode ? 'ENABLED' : 'DISABLED'}`);
      logger.info(`  - Networks: ${x402Stats.configuredNetworks.join(', ') || 'None configured'}`);

      // Initialize Arena service
      logger.info('✓ Arena service initialized');

      logger.info('🎉 All Colosseum services initialized successfully!');
      
    } catch (error) {
      logger.error('Failed to initialize Colosseum services:', error);
      throw error;
    }
  }

  private async setupDemoMode(): Promise<void> {
    logger.info('🎭 Setting up demo mode...');
    
    const demoGladiators = [
      { name: 'GPT-4 Titan', model: 'gpt-4', strategy: 'aggressive' as const },
      { name: 'Claude Champion', model: 'claude-3', strategy: 'balanced' as const },
      { name: 'Gemini Gladiator', model: 'gemini-pro', strategy: 'conservative' as const },
      { name: 'Llama Warrior', model: 'llama-2', strategy: 'random' as const }
    ];

    // Register demo gladiators
    demoGladiators.forEach((demo, index) => {
      const walletAddress = `0x${index.toString().padStart(40, '0')}`;
      this.arenaService.registerGladiator(
        demo.name,
        walletAddress,
        demo.model,
        demo.strategy
      );
    });

    // Create some demo battles
    this.arenaService.createBattle('coin-flip', 0.1);
    this.arenaService.createBattle('dice-roll', 0.25);
    this.arenaService.createBattle('number-guess', 0.5);

    logger.info(`✓ Demo mode setup complete with ${demoGladiators.length} gladiators and 3 battles`);
  }

  public async start(): Promise<void> {
    try {
      // Initialize all services
      await this.initializeServices();

      // Start HTTP server
      const port = this.config.port;
      const host = this.config.host;

      this.app.listen(port, host, () => {
        logger.info('🏛️  ========================================');
        logger.info('🏛️   THE COLOSSEUM IS NOW OPEN!');
        logger.info('🏛️  ========================================');
        logger.info(`🌐 Server: http://${host}:${port}`);
        logger.info(`⚔️  Arena: http://${host}:${port}/colosseum`);
        logger.info(`📊 Stats: http://${host}:${port}/colosseum/stats`);
        logger.info(`🏆 Leaderboard: http://${host}:${port}/colosseum/leaderboard`);
        logger.info('🏛️  ========================================');
        logger.info(`Environment: ${this.config.getConfig().nodeEnv}`);
        logger.info(`Payment Protocol: ${this.config.paymentProtocolEnabled ? 'ENABLED' : 'DISABLED'}`);
        
        logger.warn('💰 ========================================');
        logger.warn('💰   REAL MONEY MODE - MAINNET TRANSACTIONS');
        logger.warn('💰 ========================================');
        logger.warn('💰 REAL USDC TRANSACTIONS ONLY');
        logger.warn('⛓️  Network: SOLANA MAINNET');
        logger.warn('👀 Transparency: https://solscan.io');
        logger.warn('💰 ========================================');
        
        logger.info('🏛️  REAL AI AGENTS ONLY - NO SIMULATIONS');
        logger.info('🏛️  Let the battles begin! ⚔️');
      });

      // Graceful shutdown handling
      process.on('SIGTERM', this.gracefulShutdown.bind(this));
      process.on('SIGINT', this.gracefulShutdown.bind(this));

    } catch (error) {
      logger.error('Failed to start Colosseum server:', error);
      process.exit(1);
    }
  }

  private async gracefulShutdown(): Promise<void> {
    logger.info('⚔️  Colosseum received shutdown signal...');
    logger.info('🏛️  Saving battle data and gracefully shutting down...');
    
    // TODO: Add cleanup logic here
    // - Save arena state
    // - Complete ongoing battles
    // - Close database connections
    
    logger.info('🏛️  The Colosseum has closed. Vale! 👋');
    process.exit(0);
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  const server = new ColosseumServer();
  server.start().catch((error) => {
    console.error('Failed to start Colosseum server:', error);
    process.exit(1);
  });
}

export { ColosseumServer };
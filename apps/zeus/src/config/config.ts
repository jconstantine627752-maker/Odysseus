export class OdinConfig {
    // Server Configuration
    public readonly port: number;
    public readonly host: string;
    public readonly nodeEnv: string;
    public readonly logLevel: string;

    // X402 Protocol Configuration
    public readonly x402RpcUrl: string;
    public readonly x402ChainId: number;
    public readonly x402BridgeContract: string;
    public readonly x402OracleAggregator: string;
    public readonly x402GovernanceToken: string;

    // Cross-Chain Configuration
    public readonly ethereumRpcUrl: string;
    public readonly polygonRpcUrl: string;
    public readonly arbitrumRpcUrl: string;
    public readonly optimismRpcUrl: string;

    // Security & Authentication
    public readonly odinApiKey: string;
    public readonly jwtSecret: string;
    public readonly encryptionKey: string;

    // Trading Configuration
    public readonly enableMevProtection: boolean;
    public readonly enableArbitrage: boolean;
    public readonly enableFlashLoans: boolean;
    public readonly enableOptionsTrading: boolean;
    public readonly maxSlippageBps: number;
    public readonly minProfitThresholdUsd: number;

    // Risk Management
    public readonly maxPositionSizeUsd: number;
    public readonly maxDailyTrades: number;
    public readonly maxConcurrentTrades: number;
    public readonly stopLossPct: number;
    public readonly takeProfitPct: number;
    public readonly maxDrawdownPct: number;

    // Wallet Configuration
    public readonly walletPrivateKey: string;
    public readonly walletAddress: string;

    // Oracle & Data Feeds
    public readonly chainlinkNodeUrl: string;
    public readonly bandProtocolApi: string;
    public readonly pythNetworkWs: string;

    // MEV Protection
    public readonly flashbotsRelayUrl: string;
    public readonly edenNetworkRpc: string;
    public readonly privateMempoolEnabled: boolean;

    // Cache & Storage
    public readonly redisUrl: string;
    public readonly redisPassword: string;
    public readonly cacheTtlSeconds: number;

    // Monitoring & Alerts
    public readonly discordWebhookUrl: string;
    public readonly telegramBotToken: string;
    public readonly telegramChatId: string;
    public readonly enableAlerts: boolean;

    // Development/Testing
    public readonly paperTrading: boolean;
    public readonly testNetwork: boolean;
    public readonly debugMode: boolean;
    public readonly verboseLogging: boolean;

    constructor() {
        // Server Configuration
        this.port = parseInt(process.env.ODIN_PORT || '9999');
        this.host = process.env.ODIN_HOST || '0.0.0.0';
        this.nodeEnv = process.env.NODE_ENV || 'development';
        this.logLevel = process.env.LOG_LEVEL || 'info';

        // X402 Protocol Configuration
        this.x402RpcUrl = process.env.X402_RPC_URL || 'https://x402-mainnet-rpc.com';
        this.x402ChainId = parseInt(process.env.X402_CHAIN_ID || '402');
        this.x402BridgeContract = process.env.X402_BRIDGE_CONTRACT || '';
        this.x402OracleAggregator = process.env.X402_ORACLE_AGGREGATOR || '';
        this.x402GovernanceToken = process.env.X402_GOVERNANCE_TOKEN || '';

        // Cross-Chain Configuration
        this.ethereumRpcUrl = process.env.ETHEREUM_RPC_URL || '';
        this.polygonRpcUrl = process.env.POLYGON_RPC_URL || '';
        this.arbitrumRpcUrl = process.env.ARBITRUM_RPC_URL || '';
        this.optimismRpcUrl = process.env.OPTIMISM_RPC_URL || '';

        // Security & Authentication
        this.odinApiKey = process.env.ODIN_API_KEY || '';
        this.jwtSecret = process.env.JWT_SECRET || '';
        this.encryptionKey = process.env.ENCRYPTION_KEY || '';

        // Trading Configuration
        this.enableMevProtection = process.env.ENABLE_MEV_PROTECTION === 'true';
        this.enableArbitrage = process.env.ENABLE_ARBITRAGE === 'true';
        this.enableFlashLoans = process.env.ENABLE_FLASH_LOANS === 'true';
        this.enableOptionsTrading = process.env.ENABLE_OPTIONS_TRADING === 'true';
        this.maxSlippageBps = parseInt(process.env.MAX_SLIPPAGE_BPS || '100');
        this.minProfitThresholdUsd = parseFloat(process.env.MIN_PROFIT_THRESHOLD_USD || '5.0');

        // Risk Management
        this.maxPositionSizeUsd = parseInt(process.env.MAX_POSITION_SIZE_USD || '50000');
        this.maxDailyTrades = parseInt(process.env.MAX_DAILY_TRADES || '100');
        this.maxConcurrentTrades = parseInt(process.env.MAX_CONCURRENT_TRADES || '5');
        this.stopLossPct = parseFloat(process.env.STOP_LOSS_PCT || '5.0');
        this.takeProfitPct = parseFloat(process.env.TAKE_PROFIT_PCT || '15.0');
        this.maxDrawdownPct = parseFloat(process.env.MAX_DRAWDOWN_PCT || '10.0');

        // Wallet Configuration
        this.walletPrivateKey = process.env.WALLET_PRIVATE_KEY || '';
        this.walletAddress = process.env.WALLET_ADDRESS || '';

        // Oracle & Data Feeds
        this.chainlinkNodeUrl = process.env.CHAINLINK_NODE_URL || '';
        this.bandProtocolApi = process.env.BAND_PROTOCOL_API || '';
        this.pythNetworkWs = process.env.PYTH_NETWORK_WS || '';

        // MEV Protection
        this.flashbotsRelayUrl = process.env.FLASHBOTS_RELAY_URL || '';
        this.edenNetworkRpc = process.env.EDEN_NETWORK_RPC || '';
        this.privateMempoolEnabled = process.env.PRIVATE_MEMPOOL_ENABLED === 'true';

        // Cache & Storage
        this.redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        this.redisPassword = process.env.REDIS_PASSWORD || '';
        this.cacheTtlSeconds = parseInt(process.env.CACHE_TTL_SECONDS || '300');

        // Monitoring & Alerts
        this.discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL || '';
        this.telegramBotToken = process.env.TELEGRAM_BOT_TOKEN || '';
        this.telegramChatId = process.env.TELEGRAM_CHAT_ID || '';
        this.enableAlerts = process.env.ENABLE_ALERTS === 'true';

        // Development/Testing
        this.paperTrading = process.env.PAPER_TRADING === 'true';
        this.testNetwork = process.env.TEST_NETWORK === 'true';
        this.debugMode = process.env.DEBUG_MODE === 'true';
        this.verboseLogging = process.env.VERBOSE_LOGGING === 'true';

        this.validateConfig();
    }

    private validateConfig(): void {
        const errors: string[] = [];

        // Validate required configurations
        if (!this.odinApiKey && this.nodeEnv === 'production') {
            errors.push('ODIN_API_KEY is required in production');
        }

        if (!this.walletPrivateKey && !this.paperTrading) {
            errors.push('WALLET_PRIVATE_KEY is required for live trading');
        }

        if (!this.x402RpcUrl) {
            errors.push('X402_RPC_URL is required');
        }

        if (this.enableMevProtection && !this.flashbotsRelayUrl) {
            errors.push('FLASHBOTS_RELAY_URL is required when MEV protection is enabled');
        }

        // Validate numeric ranges
        if (this.maxSlippageBps < 1 || this.maxSlippageBps > 10000) {
            errors.push('MAX_SLIPPAGE_BPS must be between 1 and 10000');
        }

        if (this.stopLossPct < 0 || this.stopLossPct > 100) {
            errors.push('STOP_LOSS_PCT must be between 0 and 100');
        }

        if (this.takeProfitPct < 0 || this.takeProfitPct > 1000) {
            errors.push('TAKE_PROFIT_PCT must be between 0 and 1000');
        }

        if (errors.length > 0) {
            throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
        }
    }

    public getChainConfig(chainId: number): { rpcUrl: string; name: string } | null {
        const chains: Record<number, { rpcUrl: string; name: string }> = {
            1: { rpcUrl: this.ethereumRpcUrl, name: 'Ethereum' },
            137: { rpcUrl: this.polygonRpcUrl, name: 'Polygon' },
            42161: { rpcUrl: this.arbitrumRpcUrl, name: 'Arbitrum' },
            10: { rpcUrl: this.optimismRpcUrl, name: 'Optimism' },
            [this.x402ChainId]: { rpcUrl: this.x402RpcUrl, name: 'X402' }
        };

        return chains[chainId] || null;
    }

    public isValidChain(chainId: number): boolean {
        return this.getChainConfig(chainId) !== null;
    }

    public toJSON() {
        return {
            server: {
                port: this.port,
                host: this.host,
                nodeEnv: this.nodeEnv,
                logLevel: this.logLevel
            },
            x402: {
                chainId: this.x402ChainId,
                rpcUrl: this.x402RpcUrl.replace(/\/[^\/]*$/, '/***'), // Hide API keys
                bridgeContract: this.x402BridgeContract,
                oracleAggregator: this.x402OracleAggregator
            },
            trading: {
                enableMevProtection: this.enableMevProtection,
                enableArbitrage: this.enableArbitrage,
                enableFlashLoans: this.enableFlashLoans,
                enableOptionsTrading: this.enableOptionsTrading,
                maxSlippageBps: this.maxSlippageBps,
                minProfitThresholdUsd: this.minProfitThresholdUsd
            },
            risk: {
                maxPositionSizeUsd: this.maxPositionSizeUsd,
                maxDailyTrades: this.maxDailyTrades,
                maxConcurrentTrades: this.maxConcurrentTrades,
                stopLossPct: this.stopLossPct,
                takeProfitPct: this.takeProfitPct,
                maxDrawdownPct: this.maxDrawdownPct
            },
            development: {
                paperTrading: this.paperTrading,
                testNetwork: this.testNetwork,
                debugMode: this.debugMode
            }
        };
    }
}
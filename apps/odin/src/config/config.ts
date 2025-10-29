export class OdinConfig {
    // Server Configuration
    public readonly port: number;
    public readonly host: string;
    public readonly nodeEnv: string;
    public readonly logLevel: string;

    // Payment Protocol Configuration
    public readonly paymentProtocolEnabled: boolean;

    // Cross-Chain Configuration
    public readonly ethereumRpcUrl: string;
    public readonly polygonRpcUrl: string;
    public readonly arbitrumRpcUrl: string;
    public readonly optimismRpcUrl: string;

    // Security & Authentication
    public readonly odinApiKey: string;
    public readonly jwtSecret: string;
    public readonly encryptionKey: string;

    // HTTP 402 Payment Configuration
    public readonly paymentRecipientAddress: string;
    public readonly paymentCallbackUrl: string;

    // Cache & Storage (for payment tracking)
    public readonly redisUrl: string;
    public readonly cacheTtlSeconds: number;

    constructor() {
        // Server Configuration
        this.port = parseInt(process.env.ODIN_PORT || '9999');
        this.host = process.env.ODIN_HOST || '0.0.0.0';
        this.nodeEnv = process.env.NODE_ENV || 'development';
        this.logLevel = process.env.LOG_LEVEL || 'info';

        // Payment Protocol Configuration
        this.paymentProtocolEnabled = process.env.PAYMENT_PROTOCOL_ENABLED === 'true' || true;

        // Cross-Chain Configuration
        this.ethereumRpcUrl = process.env.ETHEREUM_RPC_URL || '';
        this.polygonRpcUrl = process.env.POLYGON_RPC_URL || '';
        this.arbitrumRpcUrl = process.env.ARBITRUM_RPC_URL || '';
        this.optimismRpcUrl = process.env.OPTIMISM_RPC_URL || '';

        // Security & Authentication
        this.odinApiKey = process.env.ODIN_API_KEY || '';
        this.jwtSecret = process.env.JWT_SECRET || '';
        this.encryptionKey = process.env.ENCRYPTION_KEY || '';

        // HTTP 402 Payment Configuration
        this.paymentRecipientAddress = process.env.PAYMENT_RECIPIENT_ADDRESS || '';
        this.paymentCallbackUrl = process.env.PAYMENT_CALLBACK_URL || '';

        // Cache & Storage (for payment tracking)
        this.redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        this.cacheTtlSeconds = parseInt(process.env.CACHE_TTL_SECONDS || '300');

        this.validateConfig();
    }

    private validateConfig(): void {
        const errors: string[] = [];

        // Validate required configurations
        if (!this.odinApiKey && this.nodeEnv === 'production') {
            errors.push('ODIN_API_KEY is required in production');
        }





        // Validate payment configuration
        if (this.paymentProtocolEnabled && !this.paymentRecipientAddress) {
            errors.push('PAYMENT_RECIPIENT_ADDRESS is required when payment protocol is enabled');
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
            payment: {
                protocolEnabled: this.paymentProtocolEnabled,
                recipientAddress: this.paymentRecipientAddress?.replace(/^(.{6}).*(.{4})$/, '$1...$2') || '', // Hide most of address
                callbackUrl: this.paymentCallbackUrl
            },
            chains: {
                ethereum: !!this.ethereumRpcUrl,
                polygon: !!this.polygonRpcUrl,
                arbitrum: !!this.arbitrumRpcUrl,
                optimism: !!this.optimismRpcUrl
            }
        };
    }
}
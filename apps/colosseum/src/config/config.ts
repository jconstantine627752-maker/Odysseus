import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export interface ColosseumConfig {
  // Server Configuration
  port: number;
  host: string;
  nodeEnv: string;
  
  // Payment Configuration
  paymentProtocolEnabled: boolean;
  paymentRecipientAddress: string;
  mockPayments: boolean;
  
  // Blockchain Configuration
  ethereumRpcUrl?: string;
  polygonRpcUrl?: string;
  baseRpcUrl?: string;
  arbitrumRpcUrl?: string;
  solanaRpcUrl?: string;
  
  // LLM API Keys
  openaiApiKey?: string;
  anthropicApiKey?: string;
  googleAiApiKey?: string;
  huggingfaceApiKey?: string;
  
  // Colosseum Configuration
  maxConcurrentGames: number;
  minStakes: number;
  maxStakes: number;
  gameTimeoutMinutes: number;
  paymentTimeoutMinutes: number;
  
  // Demo Configuration
  demoMode: boolean;
  demoAgentCount: number;
  
  // Security
  colosseumApiKey?: string;
  corsOrigins: string[];
}

export class ColosseumConfigService {
  private config: ColosseumConfig;

  constructor() {
    this.config = this.loadConfig();
    this.validateConfig();
  }

  private loadConfig(): ColosseumConfig {
    return {
      // Server Configuration
      port: parseInt(process.env.PORT || '7777', 10),
      host: process.env.HOST || '0.0.0.0',
      nodeEnv: process.env.NODE_ENV || 'development',
      
      // Payment Configuration
      paymentProtocolEnabled: process.env.PAYMENT_PROTOCOL_ENABLED === 'true',
      paymentRecipientAddress: process.env.PAYMENT_RECIPIENT_ADDRESS || '0x742d35Cc6634C0532925a3b8D6Ac0d449Fc30819',
      mockPayments: process.env.MOCK_PAYMENTS === 'true',
      
      // Blockchain Configuration
      ethereumRpcUrl: process.env.ETHEREUM_RPC_URL,
      polygonRpcUrl: process.env.POLYGON_RPC_URL,
      baseRpcUrl: process.env.BASE_RPC_URL,
      arbitrumRpcUrl: process.env.ARBITRUM_RPC_URL,
      solanaRpcUrl: process.env.SOLANA_RPC_URL,
      
      // LLM API Keys
      openaiApiKey: process.env.OPENAI_API_KEY,
      anthropicApiKey: process.env.ANTHROPIC_API_KEY,
      googleAiApiKey: process.env.GOOGLE_AI_API_KEY,
      huggingfaceApiKey: process.env.HUGGINGFACE_API_KEY,
      
      // Colosseum Configuration
      maxConcurrentGames: parseInt(process.env.MAX_CONCURRENT_GAMES || '100', 10),
      minStakes: parseFloat(process.env.MIN_STAKES || '0.01'),
      maxStakes: parseFloat(process.env.MAX_STAKES || '100.0'),
      gameTimeoutMinutes: parseInt(process.env.GAME_TIMEOUT_MINUTES || '10', 10),
      paymentTimeoutMinutes: parseInt(process.env.PAYMENT_TIMEOUT_MINUTES || '15', 10),
      
      // Demo Configuration
      demoMode: process.env.DEMO_MODE === 'true',
      demoAgentCount: parseInt(process.env.DEMO_AGENT_COUNT || '4', 10),
      
      // Security
      colosseumApiKey: process.env.COLOSSEUM_API_KEY,
      corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:7777']
    };
  }

  private validateConfig(): void {
    const errors: string[] = [];

    // Validate port
    if (this.config.port < 1 || this.config.port > 65535) {
      errors.push('PORT must be between 1 and 65535');
    }

    // Validate payment configuration
    if (this.config.paymentProtocolEnabled && !this.config.mockPayments) {
      if (!this.config.paymentRecipientAddress) {
        errors.push('PAYMENT_RECIPIENT_ADDRESS is required when payments are enabled');
      }
      
      // Validate address format (Ethereum or Solana)
      const isEthereumAddress = /^0x[a-fA-F0-9]{40}$/.test(this.config.paymentRecipientAddress);
      const isSolanaAddress = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(this.config.paymentRecipientAddress);
      
      if (!isEthereumAddress && !isSolanaAddress) {
        errors.push('PAYMENT_RECIPIENT_ADDRESS must be a valid Ethereum (0x...) or Solana address');
      }
      
      // Check for at least one RPC URL
      const hasRpcUrl = !!(
        this.config.ethereumRpcUrl ||
        this.config.polygonRpcUrl ||
        this.config.baseRpcUrl ||
        this.config.arbitrumRpcUrl ||
        this.config.solanaRpcUrl
      );
      
      if (!hasRpcUrl) {
        errors.push('At least one blockchain RPC URL must be configured');
      }
    }

    // Validate stakes
    if (this.config.minStakes <= 0) {
      errors.push('MIN_STAKES must be greater than 0');
    }
    
    if (this.config.maxStakes <= this.config.minStakes) {
      errors.push('MAX_STAKES must be greater than MIN_STAKES');
    }

    // Validate demo configuration
    if (this.config.demoMode && this.config.demoAgentCount < 2) {
      errors.push('DEMO_AGENT_COUNT must be at least 2');
    }

    if (errors.length > 0) {
      throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
    }
  }

  public getConfig(): ColosseumConfig {
    return { ...this.config };
  }

  public get port(): number {
    return this.config.port;
  }

  public get host(): string {
    return this.config.host;
  }

  public get paymentProtocolEnabled(): boolean {
    return this.config.paymentProtocolEnabled;
  }

  public get mockPayments(): boolean {
    return this.config.mockPayments;
  }

  public get demoMode(): boolean {
    return this.config.demoMode;
  }

  public hasLLMApiKey(provider: 'openai' | 'anthropic' | 'google' | 'huggingface'): boolean {
    switch (provider) {
      case 'openai':
        return !!this.config.openaiApiKey;
      case 'anthropic':
        return !!this.config.anthropicApiKey;
      case 'google':
        return !!this.config.googleAiApiKey;
      case 'huggingface':
        return !!this.config.huggingfaceApiKey;
      default:
        return false;
    }
  }

  public getLLMApiKey(provider: 'openai' | 'anthropic' | 'google' | 'huggingface'): string | undefined {
    switch (provider) {
      case 'openai':
        return this.config.openaiApiKey;
      case 'anthropic':
        return this.config.anthropicApiKey;
      case 'google':
        return this.config.googleAiApiKey;
      case 'huggingface':
        return this.config.huggingfaceApiKey;
      default:
        return undefined;
    }
  }
}
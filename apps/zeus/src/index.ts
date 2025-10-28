// Zeus Trading Engine - Main Exports

export { ZeusServer } from './server';
export { ZeusRouter } from './routes/trading';

// Trading Services
export { ArbitrageEngine } from './services/arbitrage';
export { FlashLoanEngine } from './services/flashloan';
export { OptionsEngine } from './services/options';
export { PortfolioManager } from './services/portfolio';

// Configuration & Utils
export { OdinConfig } from './config/config';
export { createLogger } from './utils/logger';
export { 
    getCacheWithFallback, 
    getCacheKey, 
    setCache, 
    getCache 
} from './utils/cache';

// Trading Interfaces
export type {
    ArbitrageOpportunity,
    ArbitrageResult
} from './services/arbitrage';

export type {
    FlashLoanOpportunity,
    FlashLoanResult
} from './services/flashloan';

export type {
    OptionsChain,
    OptionsPosition,
    OptionsStrategy
} from './services/options';

export type {
    Portfolio,
    PortfolioPerformance,
    Order
} from './services/portfolio';

// Version information
export const ZEUS_VERSION = '1.0.0';
export const ZEUS_NAME = 'Zeus Trading Engine';
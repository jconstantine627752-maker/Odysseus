export interface ArbitrageOpportunity {
    id: string;
    tokenA: string;
    tokenB: string;
    exchangeA: string;
    exchangeB: string;
    priceA: string;
    priceB: string;
    profitPct: number;
    profitUsd: number;
    gasEstimate: string;
    minAmount: string;
    maxAmount: string;
    timestamp: string;
    risk: 'low' | 'medium' | 'high';
}
export interface ArbitrageResult {
    id: string;
    status: 'pending' | 'executed' | 'failed';
    profitRealized: string;
    gasUsed: string;
    transactions: string[];
    timestamp: string;
}
export declare class ArbitrageEngine {
    private config;
    private opportunities;
    constructor();
    findOpportunities(params?: {
        minProfit?: number;
        maxRisk?: number;
        chains?: number[];
    }): Promise<ArbitrageOpportunity[]>;
    executeArbitrage(params: {
        opportunityId: string;
        amount: string;
        maxSlippage: number;
    }): Promise<ArbitrageResult>;
    getHistory(params: {
        limit: number;
        offset: number;
        status?: string;
    }): Promise<ArbitrageResult[]>;
    executeTrade(params: {
        type: string;
        token: string;
        amount: string;
        price?: string;
    }): Promise<any>;
    private scanForOpportunities;
    private simulateArbitrage;
    private executeWithMevProtection;
    private executeStandardArbitrage;
}
//# sourceMappingURL=arbitrage.d.ts.map
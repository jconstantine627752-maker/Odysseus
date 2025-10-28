export interface FlashLoanOpportunity {
    id: string;
    token: string;
    amount: string;
    strategy: 'arbitrage' | 'liquidation' | 'refinancing';
    expectedProfit: string;
    gasEstimate: string;
    risk: 'low' | 'medium' | 'high';
    platform: string;
    timestamp: string;
}
export interface FlashLoanResult {
    id: string;
    status: 'pending' | 'executed' | 'failed';
    profit: string;
    gasUsed: string;
    transactionHash: string;
    timestamp: string;
}
export declare class FlashLoanEngine {
    private config;
    constructor();
    findOpportunities(params?: {
        token?: string;
        minProfit?: number;
    }): Promise<FlashLoanOpportunity[]>;
    executeFlashLoan(params: {
        token: string;
        amount: string;
        strategy: string;
        parameters: Record<string, any>;
    }): Promise<FlashLoanResult>;
    executeTrade(params: {
        type: string;
        token: string;
        amount: string;
        price?: string;
    }): Promise<any>;
    private scanFlashLoanOpportunities;
    private scanArbitrageOpportunities;
    private scanLiquidationOpportunities;
    private scanRefinancingOpportunities;
    private simulateFlashLoan;
    private executeArbitrageFlashLoan;
    private executeLiquidationFlashLoan;
    private executeRefinancingFlashLoan;
}
//# sourceMappingURL=flashloan.d.ts.map
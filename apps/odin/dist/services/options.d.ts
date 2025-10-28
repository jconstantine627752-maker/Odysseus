export interface OptionsChain {
    underlying: string;
    expiration: string;
    strikes: OptionsStrike[];
}
export interface OptionsStrike {
    strike: string;
    call: OptionsContract;
    put: OptionsContract;
}
export interface OptionsContract {
    price: string;
    volume: string;
    openInterest: string;
    impliedVolatility: string;
    delta: string;
    gamma: string;
    theta: string;
    vega: string;
}
export interface OptionsPosition {
    id: string;
    type: 'call' | 'put';
    underlying: string;
    strike: string;
    expiration: string;
    quantity: string;
    entryPrice: string;
    currentPrice: string;
    pnl: string;
    timestamp: string;
}
export declare class OptionsEngine {
    private config;
    constructor();
    getOptionsChains(params?: {
        underlying?: string;
        expiration?: string;
    }): Promise<OptionsChain[]>;
    executeStrategy(params: {
        strategy: string;
        legs: any[];
        amount: string;
    }): Promise<any>;
    getPositions(): Promise<OptionsPosition[]>;
    executeTrade(params: {
        type: string;
        token: string;
        amount: string;
        price?: string;
    }): Promise<any>;
    private fetchOptionsChains;
    private simulateOptionsStrategy;
    private executeCoveredCall;
    private executeProtectivePut;
    private executeIronCondor;
    private executeButterfly;
    private executeStraddle;
    private executeStrangle;
}
//# sourceMappingURL=options.d.ts.map
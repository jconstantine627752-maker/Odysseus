export interface Portfolio {
    totalValue: string;
    totalPnl: string;
    totalPnlPct: string;
    positions: Position[];
    allocation: Allocation[];
    performance: PerformanceMetrics;
}
export interface Position {
    token: string;
    symbol: string;
    amount: string;
    value: string;
    avgCost: string;
    currentPrice: string;
    pnl: string;
    pnlPct: string;
    allocation: string;
    lastUpdate: string;
}
export interface Allocation {
    category: string;
    percentage: number;
    value: string;
    target?: number;
    deviation?: number;
}
export interface PerformanceMetrics {
    dailyReturn: string;
    weeklyReturn: string;
    monthlyReturn: string;
    yearlyReturn: string;
    sharpeRatio: string;
    maxDrawdown: string;
    volatility: string;
    winRate: string;
}
export interface Order {
    id: string;
    type: 'buy' | 'sell';
    token: string;
    amount: string;
    price: string;
    status: 'pending' | 'filled' | 'cancelled' | 'failed';
    timestamp: string;
    filled?: string;
    remaining?: string;
}
export declare class PortfolioManager {
    private config;
    constructor();
    getPortfolio(): Promise<Portfolio>;
    rebalance(params: {
        targetAllocations: Record<string, number>;
        rebalanceThreshold: number;
    }): Promise<any>;
    getPerformance(timeframe: string): Promise<PerformanceMetrics>;
    executeTrade(params: {
        type: string;
        token: string;
        amount: string;
        price?: string;
    }): Promise<any>;
    getOrders(params: {
        status?: string;
        limit: number;
        offset: number;
    }): Promise<Order[]>;
    cancelOrder(orderId: string): Promise<any>;
    private getPositions;
    private calculateAllocation;
    private calculatePerformance;
    private calculateRebalanceActions;
    private simulateRebalance;
    private executeRebalance;
    private checkRiskLimits;
    private submitOrder;
}
//# sourceMappingURL=portfolio.d.ts.map
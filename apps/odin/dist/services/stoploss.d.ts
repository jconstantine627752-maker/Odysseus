export interface StopLoss {
    id: string;
    token: string;
    triggerPrice: string;
    amount?: string;
    type: 'percentage' | 'absolute';
    status: 'active' | 'triggered' | 'cancelled' | 'expired';
    createdAt: string;
    triggeredAt?: string;
    transactionHash?: string;
}
export declare class StopLossManager {
    private config;
    private activeStopLosses;
    constructor();
    setStopLoss(params: {
        token: string;
        triggerPrice: string;
        amount?: string;
        type?: 'percentage' | 'absolute';
    }): Promise<StopLoss>;
    getStopLosses(params?: {
        status?: string;
        token?: string;
    }): Promise<StopLoss[]>;
    updateStopLoss(id: string, updates: Partial<StopLoss>): Promise<StopLoss>;
    deleteStopLoss(id: string): Promise<{
        success: boolean;
    }>;
    private startMonitoring;
    private checkStopLosses;
    private getCurrentPrice;
    private triggerStopLoss;
    private executeSellOrder;
    private sendStopLossAlert;
    private sendDiscordAlert;
    private sendTelegramAlert;
}
//# sourceMappingURL=stoploss.d.ts.map
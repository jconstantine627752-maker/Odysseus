import { Router } from 'express';
export declare class RiskRouter {
    router: Router;
    private riskAssessment;
    private stopLossManager;
    constructor();
    private setupRoutes;
    private getTokenRiskAssessment;
    private getProtocolRiskAssessment;
    private getPortfolioExposure;
    private setStopLoss;
    private getStopLosses;
    private updateStopLoss;
    private deleteStopLoss;
    private getRiskAlerts;
    private getRiskMetrics;
    private getRiskLimits;
    private updateRiskLimits;
    private getDrawdownAnalysis;
    private getValueAtRisk;
}
//# sourceMappingURL=risk.d.ts.map
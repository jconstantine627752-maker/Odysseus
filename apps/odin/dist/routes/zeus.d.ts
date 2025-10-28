import { Router } from 'express';
export declare class ZeusRouter {
    router: Router;
    private arbitrageEngine;
    private flashLoanEngine;
    private optionsEngine;
    private portfolioManager;
    constructor();
    private setupRoutes;
    private getArbitrageOpportunities;
    private executeArbitrage;
    private getArbitrageHistory;
    private executeFlashLoan;
    private getFlashLoanOpportunities;
    private getOptionsChains;
    private executeOptionsStrategy;
    private getOptionsPositions;
    private getPortfolio;
    private rebalancePortfolio;
    private getPortfolioPerformance;
    private executeTrade;
    private getOrders;
    private cancelOrder;
}
//# sourceMappingURL=zeus.d.ts.map
export interface TokenRiskAssessment {
    token: string;
    chain: string;
    riskScore: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    factors: RiskFactor[];
    liquidity: LiquidityRisk;
    volatility: VolatilityRisk;
    concentration: ConcentrationRisk;
    smart_contract: SmartContractRisk;
    market: MarketRisk;
    timestamp: string;
}
export interface RiskFactor {
    factor: string;
    weight: number;
    score: number;
    impact: 'positive' | 'negative' | 'neutral';
    description: string;
}
export interface LiquidityRisk {
    score: number;
    depth: string;
    spread: string;
    volume24h: string;
    marketCap: string;
}
export interface VolatilityRisk {
    score: number;
    daily: string;
    weekly: string;
    monthly: string;
    annualized: string;
}
export interface ConcentrationRisk {
    score: number;
    topHolders: string;
    exchanges: string;
    geography: string;
}
export interface SmartContractRisk {
    score: number;
    audited: boolean;
    vulnerabilities: string[];
    upgradeability: boolean;
    governance: boolean;
}
export interface MarketRisk {
    score: number;
    correlation: string;
    beta: string;
    drawdown: string;
}
export interface RiskAlert {
    id: string;
    type: 'position' | 'portfolio' | 'market' | 'system';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    details: any;
    triggered: string;
    acknowledged: boolean;
}
export interface PortfolioExposure {
    totalRisk: number;
    diversification: number;
    concentrationRisk: number;
    sectorExposure: Record<string, number>;
    geographyExposure: Record<string, number>;
    correlationMatrix: Record<string, Record<string, number>>;
    stressTests: StressTestResult[];
}
export interface StressTestResult {
    scenario: string;
    portfolioImpact: string;
    worstPosition: string;
    recoveryTime: string;
}
export declare class RiskAssessment {
    private config;
    constructor();
    assessToken(token: string, chain?: string): Promise<TokenRiskAssessment>;
    assessProtocol(address: string, chain?: string): Promise<any>;
    getPortfolioExposure(timeframe: string): Promise<PortfolioExposure>;
    getRiskAlerts(params: {
        severity?: string;
        limit: number;
    }): Promise<RiskAlert[]>;
    getRiskMetrics(): Promise<any>;
    getRiskLimits(): Promise<any>;
    updateRiskLimits(limits: any): Promise<any>;
    getDrawdownAnalysis(timeframe: string): Promise<any>;
    getValueAtRisk(params: {
        confidence: number;
        timeframe: string;
    }): Promise<any>;
    private performTokenAnalysis;
    private performProtocolAnalysis;
    private calculatePortfolioExposure;
    private generateAlertMessage;
    private generateDrawdownPeriods;
    private validateRiskLimits;
}
//# sourceMappingURL=risk.d.ts.map
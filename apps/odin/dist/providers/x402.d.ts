export interface BridgeRequest {
    fromChain: number;
    toChain: number;
    token: string;
    amount: string;
    recipient: string;
}
export interface BridgeQuote {
    fromChain: number;
    toChain: number;
    token: string;
    amount: string;
    estimatedReceived: string;
    bridgeFee: string;
    gasFee: string;
    estimatedTime: string;
    route: string[];
}
export interface ProtocolInfo {
    address: string;
    name: string;
    symbol: string;
    totalSupply: string;
    verified: boolean;
    audit: {
        audited: boolean;
        auditor?: string;
        report?: string;
    };
    governance: {
        hasGovernance: boolean;
        governanceToken?: string;
        multisig?: boolean;
    };
}
export interface LiquidityInfo {
    pool: string;
    token0: string;
    token1: string;
    reserve0: string;
    reserve1: string;
    totalValueLocked: string;
    volume24h: string;
    fees24h: string;
    apr: string;
}
export declare function initializeX402Provider(): Promise<void>;
export declare class X402Provider {
    private config;
    private provider;
    constructor();
    getSupportedProtocols(): Promise<any[]>;
    getAvailableBridges(): Promise<any[]>;
    getOracleFeeds(): Promise<any[]>;
    executeBridge(request: BridgeRequest): Promise<any>;
    getBridgeRoutes(params: {
        fromChain: number;
        toChain: number;
        token: string;
    }): Promise<any[]>;
    getBridgeQuote(params: {
        fromChain: number;
        toChain: number;
        token: string;
        amount: string;
    }): Promise<BridgeQuote>;
    getOraclePrice(token: string, pair?: string): Promise<string>;
    getProtocolInfo(address: string): Promise<ProtocolInfo>;
    analyzeProtocolSecurity(address: string): Promise<any>;
    getLiquidityInfo(pool: string): Promise<LiquidityInfo>;
    getTopLiquidityPools(params: {
        limit: number;
        sortBy: string;
    }): Promise<LiquidityInfo[]>;
    private simulateBridgeTransaction;
}
//# sourceMappingURL=x402.d.ts.map
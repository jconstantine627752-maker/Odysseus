export declare class OdinConfig {
    readonly port: number;
    readonly host: string;
    readonly nodeEnv: string;
    readonly logLevel: string;
    readonly x402RpcUrl: string;
    readonly x402ChainId: number;
    readonly x402BridgeContract: string;
    readonly x402OracleAggregator: string;
    readonly x402GovernanceToken: string;
    readonly ethereumRpcUrl: string;
    readonly polygonRpcUrl: string;
    readonly arbitrumRpcUrl: string;
    readonly optimismRpcUrl: string;
    readonly odinApiKey: string;
    readonly jwtSecret: string;
    readonly encryptionKey: string;
    readonly enableMevProtection: boolean;
    readonly enableArbitrage: boolean;
    readonly enableFlashLoans: boolean;
    readonly enableOptionsTrading: boolean;
    readonly maxSlippageBps: number;
    readonly minProfitThresholdUsd: number;
    readonly maxPositionSizeUsd: number;
    readonly maxDailyTrades: number;
    readonly maxConcurrentTrades: number;
    readonly stopLossPct: number;
    readonly takeProfitPct: number;
    readonly maxDrawdownPct: number;
    readonly walletPrivateKey: string;
    readonly walletAddress: string;
    readonly chainlinkNodeUrl: string;
    readonly bandProtocolApi: string;
    readonly pythNetworkWs: string;
    readonly flashbotsRelayUrl: string;
    readonly edenNetworkRpc: string;
    readonly privateMempoolEnabled: boolean;
    readonly redisUrl: string;
    readonly redisPassword: string;
    readonly cacheTtlSeconds: number;
    readonly discordWebhookUrl: string;
    readonly telegramBotToken: string;
    readonly telegramChatId: string;
    readonly enableAlerts: boolean;
    readonly paperTrading: boolean;
    readonly testNetwork: boolean;
    readonly debugMode: boolean;
    readonly verboseLogging: boolean;
    constructor();
    private validateConfig;
    getChainConfig(chainId: number): {
        rpcUrl: string;
        name: string;
    } | null;
    isValidChain(chainId: number): boolean;
    toJSON(): {
        server: {
            port: number;
            host: string;
            nodeEnv: string;
            logLevel: string;
        };
        x402: {
            chainId: number;
            rpcUrl: string;
            bridgeContract: string;
            oracleAggregator: string;
        };
        trading: {
            enableMevProtection: boolean;
            enableArbitrage: boolean;
            enableFlashLoans: boolean;
            enableOptionsTrading: boolean;
            maxSlippageBps: number;
            minProfitThresholdUsd: number;
        };
        risk: {
            maxPositionSizeUsd: number;
            maxDailyTrades: number;
            maxConcurrentTrades: number;
            stopLossPct: number;
            takeProfitPct: number;
            maxDrawdownPct: number;
        };
        development: {
            paperTrading: boolean;
            testNetwork: boolean;
            debugMode: boolean;
        };
    };
}
//# sourceMappingURL=config.d.ts.map
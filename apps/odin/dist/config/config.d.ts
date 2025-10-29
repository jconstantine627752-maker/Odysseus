export declare class OdinConfig {
    readonly port: number;
    readonly host: string;
    readonly nodeEnv: string;
    readonly logLevel: string;
    readonly paymentProtocolEnabled: boolean;
    readonly ethereumRpcUrl: string;
    readonly polygonRpcUrl: string;
    readonly arbitrumRpcUrl: string;
    readonly optimismRpcUrl: string;
    readonly odinApiKey: string;
    readonly jwtSecret: string;
    readonly encryptionKey: string;
    readonly paymentRecipientAddress: string;
    readonly paymentCallbackUrl: string;
    readonly redisUrl: string;
    readonly cacheTtlSeconds: number;
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
        payment: {
            protocolEnabled: boolean;
            recipientAddress: string;
            callbackUrl: string;
        };
        chains: {
            ethereum: boolean;
            polygon: boolean;
            arbitrum: boolean;
            optimism: boolean;
        };
    };
}
//# sourceMappingURL=config.d.ts.map
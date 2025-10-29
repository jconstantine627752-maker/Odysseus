import { X402Provider } from '../src/providers/x402';
import { OdinConfig } from '../src/config/config';

describe('X402Provider', () => {
    let provider: X402Provider;
    let config: OdinConfig;

    beforeEach(() => {
        config = new OdinConfig();
        // Mock the provider initialization
        (global as any).x402Provider = {
            getBlockNumber: jest.fn(() => Promise.resolve(12345))
        };
        provider = new X402Provider();
    });

    describe('getSupportedProtocols', () => {
        test('should return list of supported protocols', async () => {
            const protocols = await provider.getSupportedProtocols();

            expect(Array.isArray(protocols)).toBe(true);
            expect(protocols.length).toBeGreaterThan(0);

            const protocol = protocols[0];
            expect(protocol).toHaveProperty('id');
            expect(protocol).toHaveProperty('name');
            expect(protocol).toHaveProperty('type');
            expect(protocol).toHaveProperty('address');
            expect(protocol).toHaveProperty('features');
            expect(Array.isArray(protocol.features)).toBe(true);
        });
    });

    describe('getAvailableBridges', () => {
        test('should return available bridge routes', async () => {
            const bridges = await provider.getAvailableBridges();

            expect(Array.isArray(bridges)).toBe(true);
            expect(bridges.length).toBeGreaterThan(0);

            const bridge = bridges[0];
            expect(bridge).toHaveProperty('id');
            expect(bridge).toHaveProperty('name');
            expect(bridge).toHaveProperty('fromChain');
            expect(bridge).toHaveProperty('toChain');
            expect(bridge).toHaveProperty('supportedTokens');
            expect(Array.isArray(bridge.supportedTokens)).toBe(true);
        });
    });

    describe('getOracleFeeds', () => {
        test('should return oracle price feeds', async () => {
            const feeds = await provider.getOracleFeeds();

            expect(Array.isArray(feeds)).toBe(true);
            expect(feeds.length).toBeGreaterThan(0);

            const feed = feeds[0];
            expect(feed).toHaveProperty('pair');
            expect(feed).toHaveProperty('address');
            expect(feed).toHaveProperty('price');
            expect(feed).toHaveProperty('decimals');
            expect(feed).toHaveProperty('lastUpdate');
            expect(feed).toHaveProperty('source');
        });
    });

    describe('getBridgeQuote', () => {
        test('should return bridge quote', async () => {
            const quote = await provider.getBridgeQuote({
                fromChain: 402,
                toChain: 1,
                token: 'USDC',
                amount: '1000'
            });

            expect(quote).toHaveProperty('fromChain');
            expect(quote).toHaveProperty('toChain');
            expect(quote).toHaveProperty('token');
            expect(quote).toHaveProperty('amount');
            expect(quote).toHaveProperty('estimatedReceived');
            expect(quote).toHaveProperty('bridgeFee');
            expect(quote).toHaveProperty('gasFee');
            expect(quote).toHaveProperty('estimatedTime');
            expect(quote).toHaveProperty('route');

            expect(quote.fromChain).toBe(402);
            expect(quote.toChain).toBe(1);
            expect(quote.token).toBe('USDC');
            expect(quote.amount).toBe('1000');
            expect(Array.isArray(quote.route)).toBe(true);
        });

        test('should calculate correct fees', async () => {
            const amount = '1000';
            const quote = await provider.getBridgeQuote({
                fromChain: 402,
                toChain: 1,
                token: 'USDC',
                amount
            });

            const bridgeFee = parseFloat(quote.bridgeFee);
            const estimatedReceived = parseFloat(quote.estimatedReceived);
            const originalAmount = parseFloat(amount);

            expect(bridgeFee).toBeGreaterThan(0);
            expect(estimatedReceived).toBeLessThan(originalAmount);
            expect(estimatedReceived + bridgeFee).toBeCloseTo(originalAmount, 2);
        });
    });

    describe('getOraclePrice', () => {
        test('should return price for known tokens', async () => {
            const price = await provider.getOraclePrice('X402', 'USD');
            
            expect(typeof price).toBe('string');
            expect(parseFloat(price)).toBeGreaterThan(0);
        });

        test('should return price for unknown tokens', async () => {
            const price = await provider.getOraclePrice('UNKNOWN_TOKEN', 'USD');
            
            expect(typeof price).toBe('string');
            expect(parseFloat(price)).toBeGreaterThan(0);
        });

        test('should default to USD pair', async () => {
            const price = await provider.getOraclePrice('X402');
            
            expect(typeof price).toBe('string');
            expect(parseFloat(price)).toBeGreaterThan(0);
        });
    });

    describe('getProtocolInfo', () => {
        test('should return protocol information', async () => {
            const address = '0x1234567890123456789012345678901234567890';
            const info = await provider.getProtocolInfo(address);

            expect(info).toHaveProperty('address');
            expect(info).toHaveProperty('name');
            expect(info).toHaveProperty('symbol');
            expect(info).toHaveProperty('totalSupply');
            expect(info).toHaveProperty('verified');
            expect(info).toHaveProperty('audit');
            expect(info).toHaveProperty('governance');

            expect(info.address).toBe(address);
            expect(typeof info.verified).toBe('boolean');
            expect(typeof info.audit.audited).toBe('boolean');
            expect(typeof info.governance.hasGovernance).toBe('boolean');
        });
    });

    describe('analyzeProtocolSecurity', () => {
        test('should return security analysis', async () => {
            const address = '0x1234567890123456789012345678901234567890';
            const analysis = await provider.analyzeProtocolSecurity(address);

            expect(analysis).toHaveProperty('address');
            expect(analysis).toHaveProperty('riskScore');
            expect(analysis).toHaveProperty('vulnerabilities');
            expect(analysis).toHaveProperty('audit');
            expect(analysis).toHaveProperty('codeQuality');
            expect(analysis).toHaveProperty('governance');

            expect(analysis.address).toBe(address);
            expect(typeof analysis.riskScore).toBe('number');
            expect(analysis.riskScore).toBeGreaterThanOrEqual(0);
            expect(analysis.riskScore).toBeLessThanOrEqual(100);
            expect(Array.isArray(analysis.vulnerabilities)).toBe(true);
        });
    });

    describe('getLiquidityInfo', () => {
        test('should return liquidity information', async () => {
            const pool = '0x1234567890123456789012345678901234567890';
            const info = await provider.getLiquidityInfo(pool);

            expect(info).toHaveProperty('pool');
            expect(info).toHaveProperty('token0');
            expect(info).toHaveProperty('token1');
            expect(info).toHaveProperty('reserve0');
            expect(info).toHaveProperty('reserve1');
            expect(info).toHaveProperty('totalValueLocked');
            expect(info).toHaveProperty('volume24h');
            expect(info).toHaveProperty('fees24h');
            expect(info).toHaveProperty('apr');

            expect(info.pool).toBe(pool);
            expect(typeof info.token0).toBe('string');
            expect(typeof info.token1).toBe('string');
        });
    });

    describe('getTopLiquidityPools', () => {
        test('should return top liquidity pools', async () => {
            const pools = await provider.getTopLiquidityPools({
                limit: 5,
                sortBy: 'tvl'
            });

            expect(Array.isArray(pools)).toBe(true);
            expect(pools.length).toBeLessThanOrEqual(5);

            if (pools.length > 0) {
                const pool = pools[0];
                expect(pool).toHaveProperty('pool');
                expect(pool).toHaveProperty('token0');
                expect(pool).toHaveProperty('token1');
                expect(pool).toHaveProperty('totalValueLocked');
                expect(pool).toHaveProperty('volume24h');
                expect(pool).toHaveProperty('apr');
            }
        });

        test('should respect limit parameter', async () => {
            const limit = 3;
            const pools = await provider.getTopLiquidityPools({
                limit,
                sortBy: 'volume'
            });

            expect(pools.length).toBeLessThanOrEqual(limit);
        });
    });

    describe('executeBridge', () => {
        test('should simulate bridge execution in paper trading mode', async () => {
            const bridgeRequest = {
                fromChain: 402,
                toChain: 1,
                token: 'USDC',
                amount: '1000',
                recipient: '0x1234567890123456789012345678901234567890'
            };

            const result = await provider.executeBridge(bridgeRequest);

            expect(result).toHaveProperty('transactionId');
            expect(result).toHaveProperty('status');
            expect(result).toHaveProperty('fromChain');
            expect(result).toHaveProperty('toChain');
            expect(result).toHaveProperty('amount');

            expect(result.status).toBe('pending');
            expect(result.fromChain).toBe(bridgeRequest.fromChain);
            expect(result.toChain).toBe(bridgeRequest.toChain);
            expect(result.amount).toBe(bridgeRequest.amount);
        });
    });
});
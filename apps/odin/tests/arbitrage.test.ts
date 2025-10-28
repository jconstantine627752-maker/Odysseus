import { ArbitrageEngine } from '../src/services/arbitrage';
import { OdinConfig } from '../src/config/config';

describe('ArbitrageEngine', () => {
    let arbitrageEngine: ArbitrageEngine;
    let config: OdinConfig;

    beforeEach(() => {
        config = new OdinConfig();
        arbitrageEngine = new ArbitrageEngine();
    });

    describe('findOpportunities', () => {
        test('should find arbitrage opportunities', async () => {
            const opportunities = await arbitrageEngine.findOpportunities({
                minProfit: 50,
                maxRisk: 2,
                chains: [1, 137, 42161]
            });

            expect(Array.isArray(opportunities)).toBe(true);
            expect(opportunities.length).toBeGreaterThanOrEqual(0);
            
            if (opportunities.length > 0) {
                const opportunity = opportunities[0];
                expect(opportunity).toHaveProperty('id');
                expect(opportunity).toHaveProperty('tokenA');
                expect(opportunity).toHaveProperty('tokenB');
                expect(opportunity).toHaveProperty('exchangeA');
                expect(opportunity).toHaveProperty('exchangeB');
                expect(opportunity).toHaveProperty('profitPct');
                expect(opportunity).toHaveProperty('profitUsd');
                expect(opportunity).toHaveProperty('risk');
                expect(['low', 'medium', 'high']).toContain(opportunity.risk);
            }
        });

        test('should filter opportunities by minimum profit', async () => {
            const minProfit = 100;
            const opportunities = await arbitrageEngine.findOpportunities({ minProfit });

            opportunities.forEach(opp => {
                expect(opp.profitUsd).toBeGreaterThanOrEqual(minProfit);
            });
        });

        test('should handle empty opportunities', async () => {
            const opportunities = await arbitrageEngine.findOpportunities({
                minProfit: 10000 // Very high threshold
            });

            expect(opportunities).toEqual([]);
        });
    });

    describe('executeArbitrage', () => {
        test('should execute arbitrage in paper trading mode', async () => {
            // First find an opportunity
            const opportunities = await arbitrageEngine.findOpportunities();
            
            if (opportunities.length === 0) {
                // Create a mock opportunity for testing
                const mockOpportunity = {
                    id: 'test_arb_123',
                    tokenA: 'X402',
                    tokenB: 'USDC',
                    exchangeA: 'X402DEX',
                    exchangeB: 'UniswapV3',
                    priceA: '25.00',
                    priceB: '25.50',
                    profitPct: 2.0,
                    profitUsd: 200,
                    gasEstimate: '150000',
                    minAmount: '100',
                    maxAmount: '10000',
                    timestamp: new Date().toISOString(),
                    risk: 'medium' as const
                };

                // Add to internal opportunities map
                (arbitrageEngine as any).opportunities.set(mockOpportunity.id, mockOpportunity);

                const result = await arbitrageEngine.executeArbitrage({
                    opportunityId: mockOpportunity.id,
                    amount: '1000',
                    maxSlippage: 100
                });

                expect(result).toHaveProperty('id');
                expect(result).toHaveProperty('status');
                expect(result).toHaveProperty('profitRealized');
                expect(result).toHaveProperty('gasUsed');
                expect(result).toHaveProperty('transactions');
                expect(result.status).toBe('executed');
                expect(Array.isArray(result.transactions)).toBe(true);
            }
        });

        test('should throw error for non-existent opportunity', async () => {
            await expect(arbitrageEngine.executeArbitrage({
                opportunityId: 'non_existent_id',
                amount: '1000',
                maxSlippage: 100
            })).rejects.toThrow('Arbitrage opportunity not found');
        });
    });

    describe('getHistory', () => {
        test('should return arbitrage history', async () => {
            const history = await arbitrageEngine.getHistory({
                limit: 10,
                offset: 0
            });

            expect(Array.isArray(history)).toBe(true);
            expect(history.length).toBeLessThanOrEqual(10);

            if (history.length > 0) {
                const entry = history[0];
                expect(entry).toHaveProperty('id');
                expect(entry).toHaveProperty('status');
                expect(entry).toHaveProperty('profitRealized');
                expect(entry).toHaveProperty('gasUsed');
                expect(entry).toHaveProperty('timestamp');
                expect(['pending', 'executed', 'failed']).toContain(entry.status);
            }
        });

        test('should filter history by status', async () => {
            const history = await arbitrageEngine.getHistory({
                limit: 50,
                offset: 0,
                status: 'executed'
            });

            history.forEach(entry => {
                expect(entry.status).toBe('executed');
            });
        });
    });

    describe('executeTrade', () => {
        test('should execute trade in paper mode', async () => {
            const result = await arbitrageEngine.executeTrade({
                type: 'buy',
                token: 'X402',
                amount: '100',
                price: '25.50'
            });

            expect(result).toHaveProperty('id');
            expect(result).toHaveProperty('status');
            expect(result).toHaveProperty('type');
            expect(result).toHaveProperty('token');
            expect(result).toHaveProperty('amount');
            expect(result.status).toBe('simulated');
            expect(result.type).toBe('buy');
            expect(result.token).toBe('X402');
            expect(result.amount).toBe('100');
        });
    });
});
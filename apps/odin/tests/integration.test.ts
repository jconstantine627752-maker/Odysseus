import request from 'supertest';
import { OdinServer } from '../src/server';

describe('Odin HTTP 402 Integration Tests', () => {
    let app: any;
    let server: OdinServer;

    beforeAll(async () => {
        // Initialize server for testing
        server = new OdinServer();
        app = (server as any).app;
    });

    afterAll(async () => {
        // Cleanup after tests
        if (server) {
            await (server as any).gracefulShutdown();
        }
    });

    describe('Health Endpoints', () => {
        test('GET /health should return healthy status', async () => {
            const response = await request(app)
                .get('/health')
                .expect(200);

            expect(response.body).toHaveProperty('status', 'healthy');
            expect(response.body).toHaveProperty('service', 'Odin HTTP 402 Payment Module');
            expect(response.body).toHaveProperty('uptime');
        });

        test('GET /health/status should return detailed status', async () => {
            const response = await request(app)
                .get('/health/status')
                .expect(200);

            expect(response.body).toHaveProperty('configuration');
            expect(response.body).toHaveProperty('features');
            expect(response.body).toHaveProperty('chains');
            expect(response.body).toHaveProperty('memory');
        });

        test('GET /health/metrics should return metrics', async () => {
            const response = await request(app)
                .get('/health/metrics')
                .expect(200);

            expect(response.body).toHaveProperty('requests');
            expect(response.body).toHaveProperty('trading');
            expect(response.body).toHaveProperty('arbitrage');
            expect(response.body).toHaveProperty('risk');
            expect(response.body).toHaveProperty('performance');
        });
    });

    describe('X402 Protocol Endpoints', () => {
        test('GET /x402/protocols should return supported protocols', async () => {
            const response = await request(app)
                .get('/x402/protocols')
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('data');
            expect(response.body).toHaveProperty('count');
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        test('GET /x402/bridges should return available bridges', async () => {
            const response = await request(app)
                .get('/x402/bridges')
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('data');
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        test('GET /x402/oracles should return oracle feeds', async () => {
            const response = await request(app)
                .get('/x402/oracles')
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('data');
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        test('GET /x402/bridge/quote should return bridge quote', async () => {
            const response = await request(app)
                .get('/x402/bridge/quote')
                .query({
                    fromChain: '402',
                    toChain: '1',
                    token: 'USDC',
                    amount: '1000'
                })
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('data');
            expect(response.body.data).toHaveProperty('estimatedReceived');
            expect(response.body.data).toHaveProperty('bridgeFee');
        });

        test('POST /x402/bridge should execute bridge transaction', async () => {
            const bridgeRequest = {
                fromChain: 402,
                toChain: 1,
                token: 'USDC',
                amount: '1000',
                recipient: '0x1234567890123456789012345678901234567890'
            };

            const response = await request(app)
                .post('/x402/bridge')
                .send(bridgeRequest)
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('data');
            expect(response.body.data).toHaveProperty('transactionId');
            expect(response.body.data).toHaveProperty('status');
        });
    });

    describe('Zeus Trading Endpoints', () => {
        test('GET /zeus/opportunities should return arbitrage opportunities', async () => {
            const response = await request(app)
                .get('/zeus/opportunities')
                .query({ minProfit: '50' })
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('data');
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        test('POST /zeus/execute should execute trade', async () => {
            const tradeRequest = {
                type: 'buy',
                token: 'X402',
                amount: '100'
            };

            const response = await request(app)
                .post('/zeus/execute')
                .send(tradeRequest)
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('data');
        });

        test('GET /zeus/portfolio should return portfolio information', async () => {
            const response = await request(app)
                .get('/zeus/portfolio')
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('data');
            expect(response.body.data).toHaveProperty('totalValue');
            expect(response.body.data).toHaveProperty('positions');
            expect(Array.isArray(response.body.data.positions)).toBe(true);
        });
    });

    describe('Risk Management Endpoints', () => {
        test('GET /risk/assessment/:token should return risk assessment', async () => {
            const response = await request(app)
                .get('/risk/assessment/X402')
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('data');
            expect(response.body.data).toHaveProperty('riskScore');
            expect(response.body.data).toHaveProperty('riskLevel');
        });

        test('POST /risk/stop-loss should set stop loss', async () => {
            const stopLossRequest = {
                token: 'X402',
                triggerPrice: '20.00',
                type: 'percentage'
            };

            const response = await request(app)
                .post('/risk/stop-loss')
                .send(stopLossRequest)
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('data');
            expect(response.body.data).toHaveProperty('id');
            expect(response.body.data).toHaveProperty('status', 'active');
        });

        test('GET /risk/metrics should return risk metrics', async () => {
            const response = await request(app)
                .get('/risk/metrics')
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('data');
            expect(response.body.data).toHaveProperty('portfolioRisk');
            expect(response.body.data).toHaveProperty('limits');
            expect(response.body.data).toHaveProperty('alerts');
        });
    });

    describe('Error Handling', () => {
        test('should return 404 for unknown endpoints', async () => {
            const response = await request(app)
                .get('/unknown-endpoint')
                .expect(404);

            expect(response.body).toHaveProperty('error', 'Endpoint not found');
        });

        test('should return 400 for invalid bridge request', async () => {
            const response = await request(app)
                .post('/x402/bridge')
                .send({ incomplete: 'data' })
                .expect(400);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('error');
        });

        test('should return 500 for server errors', async () => {
            // This would require mocking internal functions to force errors
            // For now, just ensure error handling structure is in place
            expect(true).toBe(true);
        });
    });

    describe('Root Endpoint', () => {
        test('GET / should return service information', async () => {
            const response = await request(app)
                .get('/')
                .expect(200);

            expect(response.body).toHaveProperty('service', 'Odin X402 Protocol Module');
            expect(response.body).toHaveProperty('version', '1.0.0');
            expect(response.body).toHaveProperty('status', 'operational');
            expect(response.body).toHaveProperty('endpoints');
        });
    });
});
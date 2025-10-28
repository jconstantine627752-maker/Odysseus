import { OdinConfig } from '../src/config/config';

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.ODIN_PORT = '9998';
process.env.PAPER_TRADING = 'true';
process.env.LOG_LEVEL = 'silent';
process.env.X402_RPC_URL = 'http://localhost:8545';
process.env.X402_CHAIN_ID = '402';
process.env.REDIS_URL = 'redis://localhost:6379/1';

// Global test setup
beforeAll(async () => {
    // Setup test environment
});

afterAll(async () => {
    // Cleanup test environment
});

// Mock external dependencies
jest.mock('redis', () => ({
    createClient: jest.fn(() => ({
        connect: jest.fn(),
        ping: jest.fn(),
        get: jest.fn(),
        setEx: jest.fn(),
        del: jest.fn(),
        quit: jest.fn(),
        on: jest.fn()
    }))
}));

jest.mock('ethers', () => ({
    JsonRpcProvider: jest.fn(() => ({
        getBlockNumber: jest.fn(() => Promise.resolve(12345)),
        getBalance: jest.fn(() => Promise.resolve('1000000000000000000'))
    })),
    ethers: {
        JsonRpcProvider: jest.fn()
    }
}));

jest.mock('axios', () => ({
    get: jest.fn(() => Promise.resolve({ data: {} })),
    post: jest.fn(() => Promise.resolve({ data: {} }))
}));
#!/usr/bin/env node

/**
 * Odin X402 Protocol Module
 * Startup script for the Odysseus trading platform
 */

import { logger } from './utils/logger';
import { OdinServer } from './server';

async function main() {
    try {
        logger.info('🔱 Starting Odin X402 Protocol Module...');
        
        const server = new OdinServer();
        await server.start();
        
        // Handle graceful shutdown
        process.on('SIGTERM', async () => {
            logger.info('Received SIGTERM, shutting down gracefully...');
            process.exit(0);
        });

        process.on('SIGINT', async () => {
            logger.info('Received SIGINT, shutting down gracefully...');
            process.exit(0);
        });

        process.on('uncaughtException', (error) => {
            logger.error('Uncaught Exception:', error);
            process.exit(1);
        });

        process.on('unhandledRejection', (reason, promise) => {
            logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
            process.exit(1);
        });

    } catch (error) {
        logger.error('Failed to start Odin server:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}
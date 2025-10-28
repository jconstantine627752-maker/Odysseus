#!/usr/bin/env node
"use strict";
/**
 * Odin X402 Protocol Module
 * Startup script for the Odysseus trading platform
 */
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("./utils/logger");
const server_1 = require("./server");
async function main() {
    try {
        logger_1.logger.info('🔱 Starting Odin X402 Protocol Module...');
        const server = new server_1.OdinServer();
        await server.start();
        // Handle graceful shutdown
        process.on('SIGTERM', async () => {
            logger_1.logger.info('Received SIGTERM, shutting down gracefully...');
            process.exit(0);
        });
        process.on('SIGINT', async () => {
            logger_1.logger.info('Received SIGINT, shutting down gracefully...');
            process.exit(0);
        });
        process.on('uncaughtException', (error) => {
            logger_1.logger.error('Uncaught Exception:', error);
            process.exit(1);
        });
        process.on('unhandledRejection', (reason, promise) => {
            logger_1.logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
            process.exit(1);
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to start Odin server:', error);
        process.exit(1);
    }
}
if (require.main === module) {
    main();
}
//# sourceMappingURL=index.js.map
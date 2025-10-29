"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StopLossManager = void 0;
const logger_1 = require("../utils/logger");
const config_1 = require("../config/config");
class StopLossManager {
    constructor() {
        this.activeStopLosses = new Map();
        this.config = new config_1.OdinConfig();
        this.startMonitoring();
    }
    async setStopLoss(params) {
        try {
            const stopLoss = {
                id: `sl_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                token: params.token,
                triggerPrice: params.triggerPrice,
                amount: params.amount,
                type: params.type || 'percentage',
                status: 'active',
                createdAt: new Date().toISOString()
            };
            this.activeStopLosses.set(stopLoss.id, stopLoss);
            logger_1.logger.info(`Stop loss set for ${params.token}: ${params.triggerPrice} (${params.type})`);
            return stopLoss;
        }
        catch (error) {
            logger_1.logger.error('Failed to set stop loss:', error);
            throw error;
        }
    }
    async getStopLosses(params) {
        try {
            let stopLosses = Array.from(this.activeStopLosses.values());
            if (params?.status) {
                stopLosses = stopLosses.filter(sl => sl.status === params.status);
            }
            if (params?.token) {
                stopLosses = stopLosses.filter(sl => sl.token === params.token);
            }
            // Add some mock historical data
            for (let i = 0; i < 5; i++) {
                stopLosses.push({
                    id: `sl_hist_${i}`,
                    token: ['ETH', 'WETH', 'USDC'][Math.floor(Math.random() * 3)],
                    triggerPrice: (Math.random() * 100).toFixed(4),
                    amount: (Math.random() * 1000).toFixed(2),
                    type: Math.random() > 0.5 ? 'percentage' : 'absolute',
                    status: ['triggered', 'cancelled', 'expired'][Math.floor(Math.random() * 3)],
                    createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
                    triggeredAt: Math.random() > 0.5 ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString() : undefined,
                    transactionHash: Math.random() > 0.5 ? `0x${Math.random().toString(16).substring(2, 66)}` : undefined
                });
            }
            return stopLosses.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
        catch (error) {
            logger_1.logger.error('Failed to get stop losses:', error);
            throw error;
        }
    }
    async updateStopLoss(id, updates) {
        try {
            const stopLoss = this.activeStopLosses.get(id);
            if (!stopLoss) {
                throw new Error('Stop loss not found');
            }
            const updated = { ...stopLoss, ...updates };
            this.activeStopLosses.set(id, updated);
            logger_1.logger.info(`Stop loss updated: ${id}`);
            return updated;
        }
        catch (error) {
            logger_1.logger.error('Failed to update stop loss:', error);
            throw error;
        }
    }
    async deleteStopLoss(id) {
        try {
            const exists = this.activeStopLosses.has(id);
            if (!exists) {
                throw new Error('Stop loss not found');
            }
            this.activeStopLosses.delete(id);
            logger_1.logger.info(`Stop loss deleted: ${id}`);
            return { success: true };
        }
        catch (error) {
            logger_1.logger.error('Failed to delete stop loss:', error);
            throw error;
        }
    }
    startMonitoring() {
        // Start price monitoring for stop losses
        setInterval(() => {
            this.checkStopLosses();
        }, 10000); // Check every 10 seconds
        logger_1.logger.info('Stop loss monitoring started');
    }
    async checkStopLosses() {
        try {
            const activeStopLosses = Array.from(this.activeStopLosses.values())
                .filter(sl => sl.status === 'active');
            for (const stopLoss of activeStopLosses) {
                const currentPrice = await this.getCurrentPrice(stopLoss.token);
                const triggerPrice = parseFloat(stopLoss.triggerPrice);
                let shouldTrigger = false;
                if (stopLoss.type === 'percentage') {
                    // For percentage stop loss, trigger when price drops by percentage
                    const dropPercentage = ((currentPrice - triggerPrice) / triggerPrice) * 100;
                    shouldTrigger = dropPercentage <= 0; // Price dropped to or below trigger
                }
                else {
                    // For absolute stop loss, trigger when price hits absolute value
                    shouldTrigger = currentPrice <= triggerPrice;
                }
                if (shouldTrigger) {
                    await this.triggerStopLoss(stopLoss, currentPrice);
                }
            }
        }
        catch (error) {
            logger_1.logger.error('Error checking stop losses:', error);
        }
    }
    async getCurrentPrice(token) {
        // Mock price feed - integrate with real price oracle
        const mockPrices = {
            'ETH': 2634.50 + (Math.random() - 0.5) * 50,
            'WETH': 2350 + (Math.random() - 0.5) * 100,
            'WBTC': 43500 + (Math.random() - 0.5) * 1000,
            'USDC': 1.00,
            'USDT': 1.00
        };
        return mockPrices[token] || Math.random() * 100;
    }
    async triggerStopLoss(stopLoss, currentPrice) {
        try {
            logger_1.logger.info(`Triggering stop loss for ${stopLoss.token} at price ${currentPrice}`);
            if (this.config.paperTrading) {
                // Simulate stop loss execution
                const updatedStopLoss = {
                    ...stopLoss,
                    status: 'triggered',
                    triggeredAt: new Date().toISOString(),
                    transactionHash: `0x${Math.random().toString(16).substring(2, 66)}`
                };
                this.activeStopLosses.set(stopLoss.id, updatedStopLoss);
                logger_1.logger.info(`Stop loss simulated: ${stopLoss.id}`);
                return;
            }
            // Real stop loss execution would go here
            // 1. Create sell order
            // 2. Submit to exchange
            // 3. Update status
            const updatedStopLoss = {
                ...stopLoss,
                status: 'triggered',
                triggeredAt: new Date().toISOString(),
                transactionHash: await this.executeSellOrder(stopLoss, currentPrice)
            };
            this.activeStopLosses.set(stopLoss.id, updatedStopLoss);
            // Send alert notification
            await this.sendStopLossAlert(updatedStopLoss, currentPrice);
        }
        catch (error) {
            logger_1.logger.error(`Failed to trigger stop loss ${stopLoss.id}:`, error);
            // Update status to error
            const errorStopLoss = {
                ...stopLoss,
                status: 'cancelled',
                triggeredAt: new Date().toISOString()
            };
            this.activeStopLosses.set(stopLoss.id, errorStopLoss);
        }
    }
    async executeSellOrder(stopLoss, currentPrice) {
        // Mock sell order execution
        logger_1.logger.info(`Executing sell order for ${stopLoss.token} at ${currentPrice}`);
        // Simulate order submission delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        return `0x${Math.random().toString(16).substring(2, 66)}`;
    }
    async sendStopLossAlert(stopLoss, triggeredPrice) {
        if (!this.config.enableAlerts) {
            return;
        }
        const message = `🚨 Stop Loss Triggered!\n` +
            `Token: ${stopLoss.token}\n` +
            `Trigger Price: ${stopLoss.triggerPrice}\n` +
            `Actual Price: ${triggeredPrice}\n` +
            `Amount: ${stopLoss.amount || 'All'}\n` +
            `Time: ${new Date().toLocaleString()}`;
        try {
            // Send Discord notification
            if (this.config.discordWebhookUrl) {
                await this.sendDiscordAlert(message);
            }
            // Send Telegram notification
            if (this.config.telegramBotToken && this.config.telegramChatId) {
                await this.sendTelegramAlert(message);
            }
            logger_1.logger.info('Stop loss alert sent successfully');
        }
        catch (error) {
            logger_1.logger.error('Failed to send stop loss alert:', error);
        }
    }
    async sendDiscordAlert(message) {
        // Mock Discord webhook - integrate with real webhook
        logger_1.logger.info('Discord alert sent:', message);
    }
    async sendTelegramAlert(message) {
        // Mock Telegram bot - integrate with real bot API
        logger_1.logger.info('Telegram alert sent:', message);
    }
}
exports.StopLossManager = StopLossManager;
//# sourceMappingURL=stoploss.js.map
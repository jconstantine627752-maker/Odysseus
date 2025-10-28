import { logger } from '../utils/logger';
import { OdinConfig } from '../config/config';

export interface StopLoss {
    id: string;
    token: string;
    triggerPrice: string;
    amount?: string;
    type: 'percentage' | 'absolute';
    status: 'active' | 'triggered' | 'cancelled' | 'expired';
    createdAt: string;
    triggeredAt?: string;
    transactionHash?: string;
}

export class StopLossManager {
    private config: OdinConfig;
    private activeStopLosses: Map<string, StopLoss> = new Map();

    constructor() {
        this.config = new OdinConfig();
        this.startMonitoring();
    }

    async setStopLoss(params: {
        token: string;
        triggerPrice: string;
        amount?: string;
        type?: 'percentage' | 'absolute';
    }): Promise<StopLoss> {
        try {
            const stopLoss: StopLoss = {
                id: `sl_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                token: params.token,
                triggerPrice: params.triggerPrice,
                amount: params.amount,
                type: params.type || 'percentage',
                status: 'active',
                createdAt: new Date().toISOString()
            };

            this.activeStopLosses.set(stopLoss.id, stopLoss);
            
            logger.info(`Stop loss set for ${params.token}: ${params.triggerPrice} (${params.type})`);
            return stopLoss;
        } catch (error) {
            logger.error('Failed to set stop loss:', error);
            throw error;
        }
    }

    async getStopLosses(params?: {
        status?: string;
        token?: string;
    }): Promise<StopLoss[]> {
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
                    token: ['X402', 'WETH', 'USDC'][Math.floor(Math.random() * 3)],
                    triggerPrice: (Math.random() * 100).toFixed(4),
                    amount: (Math.random() * 1000).toFixed(2),
                    type: Math.random() > 0.5 ? 'percentage' : 'absolute',
                    status: ['triggered', 'cancelled', 'expired'][Math.floor(Math.random() * 3)] as any,
                    createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
                    triggeredAt: Math.random() > 0.5 ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString() : undefined,
                    transactionHash: Math.random() > 0.5 ? `0x${Math.random().toString(16).substring(2, 66)}` : undefined
                });
            }

            return stopLosses.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        } catch (error) {
            logger.error('Failed to get stop losses:', error);
            throw error;
        }
    }

    async updateStopLoss(id: string, updates: Partial<StopLoss>): Promise<StopLoss> {
        try {
            const stopLoss = this.activeStopLosses.get(id);
            if (!stopLoss) {
                throw new Error('Stop loss not found');
            }

            const updated = { ...stopLoss, ...updates };
            this.activeStopLosses.set(id, updated);

            logger.info(`Stop loss updated: ${id}`);
            return updated;
        } catch (error) {
            logger.error('Failed to update stop loss:', error);
            throw error;
        }
    }

    async deleteStopLoss(id: string): Promise<{ success: boolean }> {
        try {
            const exists = this.activeStopLosses.has(id);
            if (!exists) {
                throw new Error('Stop loss not found');
            }

            this.activeStopLosses.delete(id);
            logger.info(`Stop loss deleted: ${id}`);
            
            return { success: true };
        } catch (error) {
            logger.error('Failed to delete stop loss:', error);
            throw error;
        }
    }

    private startMonitoring(): void {
        // Start price monitoring for stop losses
        setInterval(() => {
            this.checkStopLosses();
        }, 10000); // Check every 10 seconds

        logger.info('Stop loss monitoring started');
    }

    private async checkStopLosses(): Promise<void> {
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
                } else {
                    // For absolute stop loss, trigger when price hits absolute value
                    shouldTrigger = currentPrice <= triggerPrice;
                }

                if (shouldTrigger) {
                    await this.triggerStopLoss(stopLoss, currentPrice);
                }
            }
        } catch (error) {
            logger.error('Error checking stop losses:', error);
        }
    }

    private async getCurrentPrice(token: string): Promise<number> {
        // Mock price feed - integrate with real price oracle
        const mockPrices: Record<string, number> = {
            'X402': 25.50 + (Math.random() - 0.5) * 2,
            'WETH': 2350 + (Math.random() - 0.5) * 100,
            'WBTC': 43500 + (Math.random() - 0.5) * 1000,
            'USDC': 1.00,
            'USDT': 1.00
        };

        return mockPrices[token] || Math.random() * 100;
    }

    private async triggerStopLoss(stopLoss: StopLoss, currentPrice: number): Promise<void> {
        try {
            logger.info(`Triggering stop loss for ${stopLoss.token} at price ${currentPrice}`);

            if (this.config.paperTrading) {
                // Simulate stop loss execution
                const updatedStopLoss = {
                    ...stopLoss,
                    status: 'triggered' as const,
                    triggeredAt: new Date().toISOString(),
                    transactionHash: `0x${Math.random().toString(16).substring(2, 66)}`
                };

                this.activeStopLosses.set(stopLoss.id, updatedStopLoss);
                logger.info(`Stop loss simulated: ${stopLoss.id}`);
                return;
            }

            // Real stop loss execution would go here
            // 1. Create sell order
            // 2. Submit to exchange
            // 3. Update status

            const updatedStopLoss = {
                ...stopLoss,
                status: 'triggered' as const,
                triggeredAt: new Date().toISOString(),
                transactionHash: await this.executeSellOrder(stopLoss, currentPrice)
            };

            this.activeStopLosses.set(stopLoss.id, updatedStopLoss);
            
            // Send alert notification
            await this.sendStopLossAlert(updatedStopLoss, currentPrice);

        } catch (error) {
            logger.error(`Failed to trigger stop loss ${stopLoss.id}:`, error);
            
            // Update status to error
            const errorStopLoss = {
                ...stopLoss,
                status: 'cancelled' as const,
                triggeredAt: new Date().toISOString()
            };
            this.activeStopLosses.set(stopLoss.id, errorStopLoss);
        }
    }

    private async executeSellOrder(stopLoss: StopLoss, currentPrice: number): Promise<string> {
        // Mock sell order execution
        logger.info(`Executing sell order for ${stopLoss.token} at ${currentPrice}`);
        
        // Simulate order submission delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return `0x${Math.random().toString(16).substring(2, 66)}`;
    }

    private async sendStopLossAlert(stopLoss: StopLoss, triggeredPrice: number): Promise<void> {
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

            logger.info('Stop loss alert sent successfully');
        } catch (error) {
            logger.error('Failed to send stop loss alert:', error);
        }
    }

    private async sendDiscordAlert(message: string): Promise<void> {
        // Mock Discord webhook - integrate with real webhook
        logger.info('Discord alert sent:', message);
    }

    private async sendTelegramAlert(message: string): Promise<void> {
        // Mock Telegram bot - integrate with real bot API
        logger.info('Telegram alert sent:', message);
    }
}
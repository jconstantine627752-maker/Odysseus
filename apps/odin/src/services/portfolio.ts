import { logger } from '../utils/logger';
import { OdinConfig } from '../config/config';

export interface Portfolio {
    totalValue: string;
    totalPnl: string;
    totalPnlPct: string;
    positions: Position[];
    allocation: Allocation[];
    performance: PerformanceMetrics;
}

export interface Position {
    token: string;
    symbol: string;
    amount: string;
    value: string;
    avgCost: string;
    currentPrice: string;
    pnl: string;
    pnlPct: string;
    allocation: string;
    lastUpdate: string;
}

export interface Allocation {
    category: string;
    percentage: number;
    value: string;
    target?: number;
    deviation?: number;
}

export interface PerformanceMetrics {
    dailyReturn: string;
    weeklyReturn: string;
    monthlyReturn: string;
    yearlyReturn: string;
    sharpeRatio: string;
    maxDrawdown: string;
    volatility: string;
    winRate: string;
}

export interface Order {
    id: string;
    type: 'buy' | 'sell';
    token: string;
    amount: string;
    price: string;
    status: 'pending' | 'filled' | 'cancelled' | 'failed';
    timestamp: string;
    filled?: string;
    remaining?: string;
}

export class PortfolioManager {
    private config: OdinConfig;

    constructor() {
        this.config = new OdinConfig();
    }

    async getPortfolio(): Promise<Portfolio> {
        try {
            const positions = await this.getPositions();
            const allocation = this.calculateAllocation(positions);
            const performance = await this.calculatePerformance();
            
            const totalValue = positions.reduce((sum, pos) => sum + parseFloat(pos.value), 0);
            const totalPnl = positions.reduce((sum, pos) => sum + parseFloat(pos.pnl), 0);
            const totalPnlPct = totalValue > 0 ? (totalPnl / (totalValue - totalPnl)) * 100 : 0;

            return {
                totalValue: totalValue.toFixed(2),
                totalPnl: totalPnl.toFixed(2),
                totalPnlPct: totalPnlPct.toFixed(2),
                positions,
                allocation,
                performance
            };
        } catch (error) {
            logger.error('Failed to get portfolio:', error);
            throw error;
        }
    }

    async rebalance(params: {
        targetAllocations: Record<string, number>;
        rebalanceThreshold: number;
    }): Promise<any> {
        try {
            const portfolio = await this.getPortfolio();
            const rebalanceActions = this.calculateRebalanceActions(portfolio, params);

            if (this.config.paperTrading) {
                return this.simulateRebalance(rebalanceActions);
            }

            return await this.executeRebalance(rebalanceActions);
        } catch (error) {
            logger.error('Portfolio rebalancing failed:', error);
            throw error;
        }
    }

    async getPerformance(timeframe: string): Promise<PerformanceMetrics> {
        try {
            // Mock performance data - integrate with real tracking
            return {
                dailyReturn: (Math.random() * 4 - 2).toFixed(2), // -2% to +2%
                weeklyReturn: (Math.random() * 10 - 5).toFixed(2), // -5% to +5%
                monthlyReturn: (Math.random() * 20 - 10).toFixed(2), // -10% to +10%
                yearlyReturn: (Math.random() * 50 - 25).toFixed(2), // -25% to +25%
                sharpeRatio: (Math.random() * 2 + 0.5).toFixed(2),
                maxDrawdown: (Math.random() * 15 + 5).toFixed(2),
                volatility: (Math.random() * 30 + 10).toFixed(2),
                winRate: (Math.random() * 40 + 50).toFixed(1) // 50% to 90%
            };
        } catch (error) {
            logger.error('Failed to get portfolio performance:', error);
            throw error;
        }
    }

    async executeTrade(params: { type: string; token: string; amount: string; price?: string }): Promise<any> {
        try {
            if (this.config.paperTrading) {
                return {
                    id: `portfolio_trade_${Date.now()}`,
                    status: 'simulated',
                    ...params,
                    timestamp: new Date().toISOString()
                };
            }

            // Check risk limits before executing
            await this.checkRiskLimits(params);

            // Real trade execution
            const order = await this.submitOrder(params);
            return order;
        } catch (error) {
            logger.error('Portfolio trade execution failed:', error);
            throw error;
        }
    }

    async getOrders(params: {
        status?: string;
        limit: number;
        offset: number;
    }): Promise<Order[]> {
        try {
            // Mock orders data
            const orders: Order[] = [];
            const statuses: Order['status'][] = ['pending', 'filled', 'cancelled', 'failed'];

            for (let i = 0; i < params.limit; i++) {
                const status = params.status as Order['status'] || 
                    statuses[Math.floor(Math.random() * statuses.length)];
                
                orders.push({
                    id: `order_${Date.now() - i * 1000}`,
                    type: Math.random() > 0.5 ? 'buy' : 'sell',
                    token: ['X402', 'USDC', 'WETH'][Math.floor(Math.random() * 3)],
                    amount: (Math.random() * 1000 + 100).toFixed(2),
                    price: (Math.random() * 100 + 10).toFixed(4),
                    status,
                    timestamp: new Date(Date.now() - i * 1000 * 60).toISOString(),
                    filled: status === 'filled' ? (Math.random() * 1000 + 100).toFixed(2) : undefined,
                    remaining: status === 'pending' ? (Math.random() * 500).toFixed(2) : undefined
                });
            }

            return orders;
        } catch (error) {
            logger.error('Failed to get orders:', error);
            throw error;
        }
    }

    async cancelOrder(orderId: string): Promise<any> {
        try {
            if (this.config.paperTrading) {
                return {
                    orderId,
                    status: 'cancelled',
                    timestamp: new Date().toISOString()
                };
            }

            // Real order cancellation
            return {
                orderId,
                status: 'cancelled',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            logger.error('Order cancellation failed:', error);
            throw error;
        }
    }

    private async getPositions(): Promise<Position[]> {
        // Mock positions data
        const tokens = [
            { symbol: 'X402', name: 'X402 Token' },
            { symbol: 'USDC', name: 'USD Coin' },
            { symbol: 'WETH', name: 'Wrapped Ethereum' },
            { symbol: 'WBTC', name: 'Wrapped Bitcoin' }
        ];

        const positions: Position[] = [];

        for (const token of tokens) {
            const amount = Math.random() * 1000 + 100;
            const avgCost = Math.random() * 100 + 10;
            const currentPrice = avgCost * (1 + (Math.random() - 0.5) * 0.3);
            const value = amount * currentPrice;
            const pnl = amount * (currentPrice - avgCost);
            const pnlPct = (pnl / (amount * avgCost)) * 100;

            positions.push({
                token: token.symbol,
                symbol: token.symbol,
                amount: amount.toFixed(4),
                value: value.toFixed(2),
                avgCost: avgCost.toFixed(4),
                currentPrice: currentPrice.toFixed(4),
                pnl: pnl.toFixed(2),
                pnlPct: pnlPct.toFixed(2),
                allocation: '0', // Will be calculated
                lastUpdate: new Date().toISOString()
            });
        }

        return positions;
    }

    private calculateAllocation(positions: Position[]): Allocation[] {
        const totalValue = positions.reduce((sum, pos) => sum + parseFloat(pos.value), 0);

        const allocations: Allocation[] = [
            { category: 'X402 Ecosystem', percentage: 0, value: '0' },
            { category: 'Stablecoins', percentage: 0, value: '0' },
            { category: 'Blue Chip', percentage: 0, value: '0' },
            { category: 'DeFi', percentage: 0, value: '0' }
        ];

        // Update positions with allocation percentages
        positions.forEach(position => {
            const allocationPct = (parseFloat(position.value) / totalValue) * 100;
            position.allocation = allocationPct.toFixed(1);

            // Categorize and update allocations
            if (position.token === 'X402') {
                allocations[0].percentage += allocationPct;
                allocations[0].value = (parseFloat(allocations[0].value) + parseFloat(position.value)).toFixed(2);
            } else if (['USDC', 'USDT', 'DAI'].includes(position.token)) {
                allocations[1].percentage += allocationPct;
                allocations[1].value = (parseFloat(allocations[1].value) + parseFloat(position.value)).toFixed(2);
            } else if (['WETH', 'WBTC'].includes(position.token)) {
                allocations[2].percentage += allocationPct;
                allocations[2].value = (parseFloat(allocations[2].value) + parseFloat(position.value)).toFixed(2);
            } else {
                allocations[3].percentage += allocationPct;
                allocations[3].value = (parseFloat(allocations[3].value) + parseFloat(position.value)).toFixed(2);
            }
        });

        return allocations.map(alloc => ({
            ...alloc,
            percentage: Math.round(alloc.percentage * 100) / 100
        }));
    }

    private async calculatePerformance(): Promise<PerformanceMetrics> {
        return {
            dailyReturn: (Math.random() * 4 - 2).toFixed(2),
            weeklyReturn: (Math.random() * 10 - 5).toFixed(2),
            monthlyReturn: (Math.random() * 20 - 10).toFixed(2),
            yearlyReturn: (Math.random() * 50 - 25).toFixed(2),
            sharpeRatio: (Math.random() * 2 + 0.5).toFixed(2),
            maxDrawdown: (Math.random() * 15 + 5).toFixed(2),
            volatility: (Math.random() * 30 + 10).toFixed(2),
            winRate: (Math.random() * 40 + 50).toFixed(1)
        };
    }

    private calculateRebalanceActions(portfolio: Portfolio, params: {
        targetAllocations: Record<string, number>;
        rebalanceThreshold: number;
    }): any[] {
        const actions: any[] = [];
        const totalValue = parseFloat(portfolio.totalValue);

        for (const [category, targetPct] of Object.entries(params.targetAllocations)) {
            const currentAlloc = portfolio.allocation.find(a => a.category === category);
            if (!currentAlloc) continue;

            const deviation = Math.abs(currentAlloc.percentage - targetPct);
            if (deviation > params.rebalanceThreshold) {
                const targetValue = (totalValue * targetPct) / 100;
                const currentValue = parseFloat(currentAlloc.value);
                const difference = targetValue - currentValue;

                actions.push({
                    category,
                    action: difference > 0 ? 'buy' : 'sell',
                    amount: Math.abs(difference).toFixed(2),
                    currentPct: currentAlloc.percentage,
                    targetPct,
                    deviation
                });
            }
        }

        return actions;
    }

    private async simulateRebalance(actions: any[]): Promise<any> {
        return {
            id: `rebalance_${Date.now()}`,
            status: 'simulated',
            actions,
            timestamp: new Date().toISOString()
        };
    }

    private async executeRebalance(actions: any[]): Promise<any> {
        // Real rebalancing logic would go here
        return {
            id: `rebalance_${Date.now()}`,
            status: 'pending',
            actions,
            timestamp: new Date().toISOString()
        };
    }

    private async checkRiskLimits(params: { type: string; token: string; amount: string }): Promise<void> {
        const amount = parseFloat(params.amount);
        
        if (amount > this.config.maxPositionSizeUsd) {
            throw new Error(`Trade amount exceeds maximum position size of $${this.config.maxPositionSizeUsd}`);
        }

        // Additional risk checks would go here
    }

    private async submitOrder(params: { type: string; token: string; amount: string; price?: string }): Promise<Order> {
        return {
            id: `order_${Date.now()}`,
            type: params.type as 'buy' | 'sell',
            token: params.token,
            amount: params.amount,
            price: params.price || 'market',
            status: 'pending',
            timestamp: new Date().toISOString()
        };
    }
}
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RiskRouter = void 0;
const express_1 = require("express");
const logger_1 = require("../utils/logger");
const risk_1 = require("../services/risk");
const stoploss_1 = require("../services/stoploss");
const cache_1 = require("../utils/cache");
class RiskRouter {
    constructor() {
        this.router = (0, express_1.Router)();
        this.riskAssessment = new risk_1.RiskAssessment();
        this.stopLossManager = new stoploss_1.StopLossManager();
        this.setupRoutes();
    }
    setupRoutes() {
        // Risk assessment
        this.router.get('/assessment/:token', this.getTokenRiskAssessment.bind(this));
        this.router.get('/assessment/protocol/:address', this.getProtocolRiskAssessment.bind(this));
        this.router.get('/portfolio/exposure', this.getPortfolioExposure.bind(this));
        // Stop loss management
        this.router.post('/stop-loss', this.setStopLoss.bind(this));
        this.router.get('/stop-loss', this.getStopLosses.bind(this));
        this.router.put('/stop-loss/:id', this.updateStopLoss.bind(this));
        this.router.delete('/stop-loss/:id', this.deleteStopLoss.bind(this));
        // Risk monitoring
        this.router.get('/alerts', this.getRiskAlerts.bind(this));
        this.router.get('/metrics', this.getRiskMetrics.bind(this));
        this.router.get('/limits', this.getRiskLimits.bind(this));
        this.router.put('/limits', this.updateRiskLimits.bind(this));
        // Drawdown analysis
        this.router.get('/drawdown', this.getDrawdownAnalysis.bind(this));
        this.router.get('/var', this.getValueAtRisk.bind(this));
    }
    async getTokenRiskAssessment(req, res) {
        try {
            const { token } = req.params;
            const { chain } = req.query;
            const assessment = await (0, cache_1.getCacheWithFallback)((0, cache_1.getCacheKey)('token-risk', token, String(chain || 'x402')), async () => await this.riskAssessment.assessToken(token, String(chain || 'x402')), 600 // 10 minutes cache
            );
            res.json({
                success: true,
                data: assessment
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to get token risk assessment:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to assess token risk'
            });
        }
    }
    async getProtocolRiskAssessment(req, res) {
        try {
            const { address } = req.params;
            const { chain } = req.query;
            const assessment = await (0, cache_1.getCacheWithFallback)((0, cache_1.getCacheKey)('protocol-risk', address, String(chain || 'x402')), async () => await this.riskAssessment.assessProtocol(address, String(chain || 'x402')), 1800 // 30 minutes cache
            );
            res.json({
                success: true,
                data: assessment
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to get protocol risk assessment:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to assess protocol risk'
            });
        }
    }
    async getPortfolioExposure(req, res) {
        try {
            const { timeframe = '24h' } = req.query;
            const exposure = await (0, cache_1.getCacheWithFallback)((0, cache_1.getCacheKey)('portfolio-exposure', String(timeframe)), async () => await this.riskAssessment.getPortfolioExposure(String(timeframe)), 300 // 5 minutes cache
            );
            res.json({
                success: true,
                data: exposure
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to get portfolio exposure:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve portfolio exposure'
            });
        }
    }
    async setStopLoss(req, res) {
        try {
            const { token, triggerPrice, amount, type = 'percentage' } = req.body;
            if (!token || !triggerPrice) {
                res.status(400).json({
                    success: false,
                    error: 'Missing required parameters: token, triggerPrice'
                });
                return;
            }
            const result = await this.stopLossManager.setStopLoss({
                token,
                triggerPrice,
                amount,
                type
            });
            res.json({
                success: true,
                data: result,
                message: 'Stop loss set successfully'
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to set stop loss:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to set stop loss',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    async getStopLosses(req, res) {
        try {
            const { status, token } = req.query;
            const stopLosses = await this.stopLossManager.getStopLosses({
                status: status ? String(status) : undefined,
                token: token ? String(token) : undefined
            });
            res.json({
                success: true,
                data: stopLosses,
                count: stopLosses.length
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to get stop losses:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve stop losses'
            });
        }
    }
    async updateStopLoss(req, res) {
        try {
            const { id } = req.params;
            const updates = req.body;
            const result = await this.stopLossManager.updateStopLoss(id, updates);
            res.json({
                success: true,
                data: result,
                message: 'Stop loss updated successfully'
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to update stop loss:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update stop loss',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    async deleteStopLoss(req, res) {
        try {
            const { id } = req.params;
            const result = await this.stopLossManager.deleteStopLoss(id);
            res.json({
                success: true,
                data: result,
                message: 'Stop loss deleted successfully'
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to delete stop loss:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to delete stop loss'
            });
        }
    }
    async getRiskAlerts(req, res) {
        try {
            const { severity, limit = '50' } = req.query;
            const alerts = await this.riskAssessment.getRiskAlerts({
                severity: severity ? String(severity) : undefined,
                limit: Number(limit)
            });
            res.json({
                success: true,
                data: alerts,
                count: alerts.length
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to get risk alerts:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve risk alerts'
            });
        }
    }
    async getRiskMetrics(req, res) {
        try {
            const metrics = await (0, cache_1.getCacheWithFallback)((0, cache_1.getCacheKey)('risk-metrics'), async () => await this.riskAssessment.getRiskMetrics(), 180 // 3 minutes cache
            );
            res.json({
                success: true,
                data: metrics
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to get risk metrics:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve risk metrics'
            });
        }
    }
    async getRiskLimits(req, res) {
        try {
            const limits = await this.riskAssessment.getRiskLimits();
            res.json({
                success: true,
                data: limits
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to get risk limits:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve risk limits'
            });
        }
    }
    async updateRiskLimits(req, res) {
        try {
            const limits = req.body;
            const result = await this.riskAssessment.updateRiskLimits(limits);
            res.json({
                success: true,
                data: result,
                message: 'Risk limits updated successfully'
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to update risk limits:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update risk limits'
            });
        }
    }
    async getDrawdownAnalysis(req, res) {
        try {
            const { timeframe = '30d' } = req.query;
            const analysis = await (0, cache_1.getCacheWithFallback)((0, cache_1.getCacheKey)('drawdown-analysis', String(timeframe)), async () => await this.riskAssessment.getDrawdownAnalysis(String(timeframe)), 900 // 15 minutes cache
            );
            res.json({
                success: true,
                data: analysis
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to get drawdown analysis:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve drawdown analysis'
            });
        }
    }
    async getValueAtRisk(req, res) {
        try {
            const { confidence = '95', timeframe = '1d' } = req.query;
            const var95 = await (0, cache_1.getCacheWithFallback)((0, cache_1.getCacheKey)('value-at-risk', String(confidence), String(timeframe)), async () => await this.riskAssessment.getValueAtRisk({
                confidence: Number(confidence),
                timeframe: String(timeframe)
            }), 600 // 10 minutes cache
            );
            res.json({
                success: true,
                data: var95
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to get Value at Risk:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to calculate Value at Risk'
            });
        }
    }
}
exports.RiskRouter = RiskRouter;
//# sourceMappingURL=risk.js.map
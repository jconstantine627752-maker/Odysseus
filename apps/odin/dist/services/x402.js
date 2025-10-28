"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentService = exports.X402PaymentService = void 0;
exports.requirePayment = requirePayment;
const ethers_1 = require("ethers");
const logger_1 = require("../utils/logger");
// USDC contract addresses on different networks
const USDC_CONTRACTS = {
    ethereum: '0xA0b86a33E6441D28c20b4E5E6aa2Cd9C7e0C76a8',
    polygon: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
    base: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    arbitrum: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831'
};
class X402PaymentService {
    constructor() {
        this.providers = new Map();
        this.pendingPayments = new Map();
        this.initializeProviders();
    }
    initializeProviders() {
        // Initialize blockchain providers for different networks
        if (process.env.ETHEREUM_RPC_URL) {
            this.providers.set('ethereum', new ethers_1.ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL));
        }
        if (process.env.POLYGON_RPC_URL) {
            this.providers.set('polygon', new ethers_1.ethers.JsonRpcProvider(process.env.POLYGON_RPC_URL));
        }
        if (process.env.BASE_RPC_URL) {
            this.providers.set('base', new ethers_1.ethers.JsonRpcProvider(process.env.BASE_RPC_URL));
        }
        if (process.env.ARBITRUM_RPC_URL) {
            this.providers.set('arbitrum', new ethers_1.ethers.JsonRpcProvider(process.env.ARBITRUM_RPC_URL));
        }
    }
    /**
     * Create a payment request for X402 protocol
     */
    createPaymentRequest(amount, description, network = 'base', expirationMinutes = 10) {
        const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const recipient = process.env.PAYMENT_RECIPIENT_ADDRESS || '0x742d35Cc6634C0532925a3b8D6Ac0d449Fc30819';
        const paymentRequest = {
            paymentId,
            amount,
            currency: 'USDC',
            network,
            recipient,
            description,
            expiresAt: Date.now() + (expirationMinutes * 60 * 1000),
            callbackUrl: process.env.PAYMENT_CALLBACK_URL
        };
        this.pendingPayments.set(paymentId, paymentRequest);
        // Clean up expired payments after 1 hour
        setTimeout(() => {
            this.pendingPayments.delete(paymentId);
        }, 60 * 60 * 1000);
        logger_1.logger.info(`Created payment request: ${paymentId} for ${amount} USDC`);
        return paymentRequest;
    }
    /**
     * Verify a payment transaction on the blockchain
     */
    async verifyPayment(paymentId, proof) {
        const paymentRequest = this.pendingPayments.get(paymentId);
        if (!paymentRequest) {
            logger_1.logger.warn(`Payment request not found: ${paymentId}`);
            return false;
        }
        if (Date.now() > paymentRequest.expiresAt) {
            logger_1.logger.warn(`Payment request expired: ${paymentId}`);
            return false;
        }
        const provider = this.providers.get(proof.network);
        if (!provider) {
            logger_1.logger.error(`No provider configured for network: ${proof.network}`);
            return false;
        }
        try {
            // Get transaction receipt
            const receipt = await provider.getTransactionReceipt(proof.transactionHash);
            if (!receipt) {
                logger_1.logger.warn(`Transaction not found: ${proof.transactionHash}`);
                return false;
            }
            if (!receipt.status) {
                logger_1.logger.warn(`Transaction failed: ${proof.transactionHash}`);
                return false;
            }
            // Get transaction details
            const transaction = await provider.getTransaction(proof.transactionHash);
            if (!transaction) {
                logger_1.logger.warn(`Transaction details not found: ${proof.transactionHash}`);
                return false;
            }
            // Verify the transaction is to the correct USDC contract
            const expectedUsdcContract = USDC_CONTRACTS[proof.network];
            if (transaction.to?.toLowerCase() !== expectedUsdcContract.toLowerCase()) {
                logger_1.logger.warn(`Transaction not to USDC contract. Expected: ${expectedUsdcContract}, Got: ${transaction.to}`);
                return false;
            }
            // Parse USDC transfer from transaction logs
            const usdcInterface = new ethers_1.ethers.Interface([
                'event Transfer(address indexed from, address indexed to, uint256 value)'
            ]);
            let transferFound = false;
            let transferAmount = '0';
            let transferRecipient = '';
            for (const log of receipt.logs) {
                try {
                    const parsed = usdcInterface.parseLog({
                        topics: log.topics,
                        data: log.data
                    });
                    if (parsed && parsed.name === 'Transfer') {
                        transferRecipient = parsed.args.to.toLowerCase();
                        transferAmount = ethers_1.ethers.formatUnits(parsed.args.value, 6); // USDC has 6 decimals
                        transferFound = true;
                        break;
                    }
                }
                catch (error) {
                    // Log is not a Transfer event, continue
                    continue;
                }
            }
            if (!transferFound) {
                logger_1.logger.warn(`No USDC transfer found in transaction: ${proof.transactionHash}`);
                return false;
            }
            // Verify recipient matches payment request
            if (transferRecipient !== paymentRequest.recipient.toLowerCase()) {
                logger_1.logger.warn(`Payment sent to wrong recipient. Expected: ${paymentRequest.recipient}, Got: ${transferRecipient}`);
                return false;
            }
            // Verify amount matches (with small tolerance for rounding)
            const expectedAmount = parseFloat(paymentRequest.amount);
            const actualAmount = parseFloat(transferAmount);
            const tolerance = 0.01; // 1 cent tolerance
            if (Math.abs(actualAmount - expectedAmount) > tolerance) {
                logger_1.logger.warn(`Payment amount mismatch. Expected: ${expectedAmount}, Got: ${actualAmount}`);
                return false;
            }
            logger_1.logger.info(`Payment verified successfully: ${paymentId}`);
            logger_1.logger.info(`  Transaction: ${proof.transactionHash}`);
            logger_1.logger.info(`  Amount: ${transferAmount} USDC`);
            logger_1.logger.info(`  Recipient: ${transferRecipient}`);
            // Remove from pending payments
            this.pendingPayments.delete(paymentId);
            return true;
        }
        catch (error) {
            logger_1.logger.error(`Error verifying payment ${paymentId}:`, error);
            return false;
        }
    }
    /**
     * Get payment request details
     */
    getPaymentRequest(paymentId) {
        return this.pendingPayments.get(paymentId);
    }
    /**
     * Get all pending payments (for debugging)
     */
    getPendingPayments() {
        return Array.from(this.pendingPayments.values());
    }
}
exports.X402PaymentService = X402PaymentService;
/**
 * Express middleware for X402 Payment Required
 */
function requirePayment(amount, description, network = 'base') {
    return (req, res, next) => {
        const paymentService = req.app.locals.paymentService;
        if (!paymentService) {
            return res.status(500).json({
                error: 'Payment service not initialized'
            });
        }
        // Check if payment proof is provided
        const paymentProof = req.headers['x-payment-proof'];
        const paymentId = req.headers['x-payment-id'];
        if (paymentProof && paymentId) {
            // Verify the payment
            const proof = JSON.parse(paymentProof);
            paymentService.verifyPayment(paymentId, proof)
                .then(isValid => {
                if (isValid) {
                    logger_1.logger.info(`Payment verified for ${req.path}: ${paymentId}`);
                    next(); // Payment verified, continue to the protected resource
                }
                else {
                    // Payment verification failed, return 402
                    const paymentRequest = paymentService.createPaymentRequest(amount, description, network);
                    return res.status(402).json({
                        error: 'Payment verification failed',
                        paymentRequired: true,
                        paymentRequest
                    });
                }
            })
                .catch(error => {
                logger_1.logger.error('Payment verification error:', error);
                return res.status(500).json({
                    error: 'Payment verification failed'
                });
            });
        }
        else {
            // No payment provided, return 402 Payment Required
            const paymentRequest = paymentService.createPaymentRequest(amount, description, network);
            logger_1.logger.info(`Payment required for ${req.path}: ${paymentRequest.paymentId}`);
            return res.status(402).json({
                error: 'Payment Required',
                paymentRequired: true,
                paymentRequest,
                instructions: {
                    step1: 'Send the specified USDC amount to the recipient address',
                    step2: 'Include the transaction hash in x-payment-proof header',
                    step3: 'Include the payment ID in x-payment-id header',
                    step4: 'Retry your request with the payment proof'
                }
            });
        }
    };
}
exports.paymentService = new X402PaymentService();
//# sourceMappingURL=x402.js.map
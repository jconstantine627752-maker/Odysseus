import { Request, Response, NextFunction } from 'express';
import { ethers } from 'ethers';
import { logger } from '../utils/logger';
import { ColosseumConfigService } from '../config/config';

// USDC contract addresses on different networks
const USDC_CONTRACTS = {
  ethereum: '0xA0b86a33E6441D28c20b4E5E6aa2Cd9C7e0C76a8',
  polygon: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
  base: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  arbitrum: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831'
};

export interface PaymentRequest {
  paymentId: string;
  amount: string; // Amount in USDC (e.g., "1.50")
  currency: 'USDC';
  network: 'ethereum' | 'polygon' | 'base' | 'arbitrum';
  recipient: string; // Wallet address to receive payment
  description: string;
  expiresAt: number; // Unix timestamp
  callbackUrl?: string;
}

export interface PaymentProof {
  transactionHash: string;
  network: string;
  blockNumber?: number;
  timestamp?: number;
}

export class ColosseumX402Service {
  private providers: Map<string, ethers.JsonRpcProvider> = new Map();
  private pendingPayments: Map<string, PaymentRequest> = new Map();
  private config: ColosseumConfigService;

  constructor(config: ColosseumConfigService) {
    this.config = config;
    this.initializeProviders();
  }

  private initializeProviders() {
    const configData = this.config.getConfig();
    
    // Initialize blockchain providers for different networks
    if (configData.ethereumRpcUrl) {
      this.providers.set('ethereum', new ethers.JsonRpcProvider(configData.ethereumRpcUrl));
      logger.info('✓ Ethereum provider initialized');
    }
    if (configData.polygonRpcUrl) {
      this.providers.set('polygon', new ethers.JsonRpcProvider(configData.polygonRpcUrl));
      logger.info('✓ Polygon provider initialized');
    }
    if (configData.baseRpcUrl) {
      this.providers.set('base', new ethers.JsonRpcProvider(configData.baseRpcUrl));
      logger.info('✓ Base provider initialized');
    }
    if (configData.arbitrumRpcUrl) {
      this.providers.set('arbitrum', new ethers.JsonRpcProvider(configData.arbitrumRpcUrl));
      logger.info('✓ Arbitrum provider initialized');
    }

    if (this.providers.size === 0) {
      logger.warn('⚠️  No blockchain providers configured - only mock payments will work');
    }
  }

  /**
   * Create a payment request for X402 protocol
   */
  createPaymentRequest(
    amount: string,
    description: string,
    network: 'ethereum' | 'polygon' | 'base' | 'arbitrum' = 'base',
    expirationMinutes?: number
  ): PaymentRequest {
    const configData = this.config.getConfig();
    const paymentId = `colosseum_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const recipient = configData.paymentRecipientAddress;
    const timeout = expirationMinutes || configData.paymentTimeoutMinutes;
    
    const paymentRequest: PaymentRequest = {
      paymentId,
      amount,
      currency: 'USDC',
      network,
      recipient,
      description,
      expiresAt: Date.now() + (timeout * 60 * 1000)
    };

    this.pendingPayments.set(paymentId, paymentRequest);
    
    // Clean up expired payments
    setTimeout(() => {
      this.pendingPayments.delete(paymentId);
    }, (timeout + 10) * 60 * 1000); // Extra 10 minutes buffer

    logger.info(`Payment request created: ${paymentId} for ${amount} USDC on ${network}`);
    return paymentRequest;
  }

  /**
   * Verify a payment transaction on the blockchain
   */
  async verifyPayment(paymentId: string, proof: PaymentProof): Promise<boolean> {
    // Check if we're in mock payment mode
    if (this.config.mockPayments) {
      return this.verifyMockPayment(paymentId, proof);
    }

    const paymentRequest = this.pendingPayments.get(paymentId);
    if (!paymentRequest) {
      logger.warn(`Payment request not found: ${paymentId}`);
      return false;
    }

    if (Date.now() > paymentRequest.expiresAt) {
      logger.warn(`Payment request expired: ${paymentId}`);
      return false;
    }

    const provider = this.providers.get(proof.network);
    if (!provider) {
      logger.error(`No provider configured for network: ${proof.network}`);
      return false;
    }

    try {
      // Get transaction receipt
      const receipt = await provider.getTransactionReceipt(proof.transactionHash);
      if (!receipt) {
        logger.warn(`Transaction not found: ${proof.transactionHash}`);
        return false;
      }

      if (!receipt.status) {
        logger.warn(`Transaction failed: ${proof.transactionHash}`);
        return false;
      }

      // Get transaction details
      const transaction = await provider.getTransaction(proof.transactionHash);
      if (!transaction) {
        logger.warn(`Transaction details not found: ${proof.transactionHash}`);
        return false;
      }

      // Verify the transaction is to the correct USDC contract
      const expectedUsdcContract = USDC_CONTRACTS[proof.network as keyof typeof USDC_CONTRACTS];
      if (transaction.to?.toLowerCase() !== expectedUsdcContract.toLowerCase()) {
        logger.warn(`Transaction not to USDC contract. Expected: ${expectedUsdcContract}, Got: ${transaction.to}`);
        return false;
      }

      // Parse USDC transfer from transaction logs
      const usdcInterface = new ethers.Interface([
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
            transferAmount = ethers.formatUnits(parsed.args.value, 6); // USDC has 6 decimals
            transferFound = true;
            break;
          }
        } catch (error) {
          // Log is not a Transfer event, continue
          continue;
        }
      }

      if (!transferFound) {
        logger.warn(`No USDC transfer found in transaction: ${proof.transactionHash}`);
        return false;
      }

      // Verify recipient matches payment request
      if (transferRecipient !== paymentRequest.recipient.toLowerCase()) {
        logger.warn(`Payment sent to wrong recipient. Expected: ${paymentRequest.recipient}, Got: ${transferRecipient}`);
        return false;
      }

      // Verify amount matches (with small tolerance for rounding)
      const expectedAmount = parseFloat(paymentRequest.amount);
      const actualAmount = parseFloat(transferAmount);
      const tolerance = 0.01; // 1 cent tolerance

      if (Math.abs(actualAmount - expectedAmount) > tolerance) {
        logger.warn(`Payment amount mismatch. Expected: ${expectedAmount}, Got: ${actualAmount}`);
        return false;
      }

      logger.info(`✓ Payment verified: ${paymentId} - ${transferAmount} USDC from ${proof.transactionHash}`);

      // Remove from pending payments
      this.pendingPayments.delete(paymentId);

      return true;

    } catch (error) {
      logger.error(`Error verifying payment ${paymentId}:`, error);
      return false;
    }
  }

  /**
   * Mock payment verification for local testing
   */
  private verifyMockPayment(paymentId: string, proof: PaymentProof): boolean {
    const paymentRequest = this.pendingPayments.get(paymentId);
    if (!paymentRequest) {
      logger.warn(`Mock payment request not found: ${paymentId}`);
      return false;
    }

    if (Date.now() > paymentRequest.expiresAt) {
      logger.warn(`Mock payment request expired: ${paymentId}`);
      return false;
    }

    // Simple mock verification - just check if transaction hash looks valid
    const isValidTxHash = /^0x[a-fA-F0-9]{64}$/.test(proof.transactionHash);
    
    if (isValidTxHash) {
      logger.info(`✓ Mock payment verified: ${paymentId} - ${paymentRequest.amount} USDC (${proof.transactionHash})`);
      this.pendingPayments.delete(paymentId);
      return true;
    } else {
      logger.warn(`Invalid mock transaction hash: ${proof.transactionHash}`);
      return false;
    }
  }

  /**
   * Get payment request details
   */
  getPaymentRequest(paymentId: string): PaymentRequest | undefined {
    return this.pendingPayments.get(paymentId);
  }

  /**
   * Get all pending payments (for debugging)
   */
  getPendingPayments(): PaymentRequest[] {
    return Array.from(this.pendingPayments.values());
  }

  /**
   * Get payment statistics
   */
  getStats() {
    return {
      pendingPayments: this.pendingPayments.size,
      configuredNetworks: Array.from(this.providers.keys()),
      mockMode: this.config.mockPayments
    };
  }
}

/**
 * Express middleware for X402 Payment Required
 */
export function requirePayment(
  x402Service: ColosseumX402Service,
  amount: string,
  description: string,
  network: 'ethereum' | 'polygon' | 'base' | 'arbitrum' = 'base'
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Check if payment proof is provided
    const paymentProof = req.headers['x-payment-proof'] as string;
    const paymentId = req.headers['x-payment-id'] as string;

    if (paymentProof && paymentId) {
      try {
        // Verify the payment
        const proof: PaymentProof = JSON.parse(paymentProof);
        const isValid = await x402Service.verifyPayment(paymentId, proof);
        
        if (isValid) {
          logger.info(`✓ Payment verified for ${req.path}: ${paymentId}`);
          next(); // Payment verified, continue to the protected resource
        } else {
          // Payment verification failed, return 402
          const paymentRequest = x402Service.createPaymentRequest(amount, description, network);
          return res.status(402).json({
            error: 'Payment verification failed',
            paymentRequired: true,
            paymentRequest
          });
        }
      } catch (error) {
        logger.error('Payment verification error:', error);
        return res.status(500).json({
          error: 'Payment verification failed'
        });
      }
    } else {
      // No payment provided, return 402 Payment Required
      const paymentRequest = x402Service.createPaymentRequest(amount, description, network);
      
      logger.info(`Payment required for ${req.path}: ${paymentRequest.paymentId}`);
      
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
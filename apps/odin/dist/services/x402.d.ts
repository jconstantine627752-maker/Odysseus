import { Request, Response, NextFunction } from 'express';
export interface PaymentRequest {
    paymentId: string;
    amount: string;
    currency: 'USDC';
    network: 'ethereum' | 'polygon' | 'base' | 'arbitrum';
    recipient: string;
    description: string;
    expiresAt: number;
    callbackUrl?: string;
}
export interface PaymentProof {
    transactionHash: string;
    network: string;
    blockNumber?: number;
    timestamp?: number;
}
export declare class X402PaymentService {
    private providers;
    private pendingPayments;
    constructor();
    private initializeProviders;
    /**
     * Create a payment request for X402 protocol
     */
    createPaymentRequest(amount: string, description: string, network?: 'ethereum' | 'polygon' | 'base' | 'arbitrum', expirationMinutes?: number): PaymentRequest;
    /**
     * Verify a payment transaction on the blockchain
     */
    verifyPayment(paymentId: string, proof: PaymentProof): Promise<boolean>;
    /**
     * Get payment request details
     */
    getPaymentRequest(paymentId: string): PaymentRequest | undefined;
    /**
     * Get all pending payments (for debugging)
     */
    getPendingPayments(): PaymentRequest[];
}
/**
 * Express middleware for X402 Payment Required
 */
export declare function requirePayment(amount: string, description: string, network?: 'ethereum' | 'polygon' | 'base' | 'arbitrum'): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const paymentService: X402PaymentService;
//# sourceMappingURL=x402.d.ts.map
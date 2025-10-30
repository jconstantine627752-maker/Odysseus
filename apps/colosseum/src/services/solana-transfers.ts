/**
 * Solana USDC Transfer Service
 * 
 * Handles automatic USDC transfers between AI wallets on Solana
 * Winner receives USDC directly to their wallet after battle resolution
 */

import { 
  Connection, 
  Keypair, 
  PublicKey, 
  Transaction,
  sendAndConfirmTransaction,
  SystemProgram
} from '@solana/web3.js';
import { 
  getAssociatedTokenAddress, 
  createTransferInstruction,
  getAccount,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID
} from '@solana/spl-token';
import { logger } from '../utils/logger';
import * as bs58 from 'bs58';

export interface TransferResult {
  success: boolean;
  signature?: string;
  error?: string;
  solscanUrl?: string;
}

export class SolanaTransferService {
  private connection: Connection;
  private usdcMintAddress: PublicKey;
  private network: 'mainnet' | 'devnet';

  constructor(
    rpcUrl: string,
    usdcMintAddress: string,
    network: 'mainnet' | 'devnet' = 'mainnet'
  ) {
    this.connection = new Connection(rpcUrl, 'confirmed');
    this.usdcMintAddress = new PublicKey(usdcMintAddress);
    this.network = network;
    
    logger.info('✓ Solana Transfer Service initialized');
    logger.info(`  - Network: ${network}`);
    logger.info(`  - USDC Mint: ${usdcMintAddress}`);
  }

  /**
   * Transfer USDC from one wallet to another
   */
  async transferUSDC(
    fromPrivateKey: string,
    toWalletAddress: string,
    amountUSDC: number
  ): Promise<TransferResult> {
    try {
      logger.info(`💸 Initiating USDC transfer: ${amountUSDC} USDC to ${toWalletAddress}`);

      // Parse private key (base58 format)
      const fromKeypair = Keypair.fromSecretKey(bs58.decode(fromPrivateKey));
      const toPublicKey = new PublicKey(toWalletAddress);

      // USDC has 6 decimals
      const amountInSmallestUnit = Math.floor(amountUSDC * 1_000_000);

      // Get token accounts
      const fromTokenAccount = await getAssociatedTokenAddress(
        this.usdcMintAddress,
        fromKeypair.publicKey,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      const toTokenAccount = await getAssociatedTokenAddress(
        this.usdcMintAddress,
        toPublicKey,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      // Verify sender has sufficient balance
      const fromAccount = await getAccount(
        this.connection,
        fromTokenAccount,
        'confirmed',
        TOKEN_PROGRAM_ID
      );

      if (Number(fromAccount.amount) < amountInSmallestUnit) {
        const available = Number(fromAccount.amount) / 1_000_000;
        throw new Error(`Insufficient balance: has ${available} USDC, needs ${amountUSDC} USDC`);
      }

      // Create transfer instruction
      const transaction = new Transaction().add(
        createTransferInstruction(
          fromTokenAccount,
          toTokenAccount,
          fromKeypair.publicKey,
          amountInSmallestUnit,
          [],
          TOKEN_PROGRAM_ID
        )
      );

      // Send transaction
      logger.info('📡 Sending transaction to Solana...');
      const signature = await sendAndConfirmTransaction(
        this.connection,
        transaction,
        [fromKeypair],
        {
          commitment: 'confirmed',
          skipPreflight: false
        }
      );

      const solscanUrl = this.getSolscanUrl(signature);
      
      logger.info(`✅ Transfer successful!`);
      logger.info(`  - Amount: ${amountUSDC} USDC`);
      logger.info(`  - To: ${toWalletAddress}`);
      logger.info(`  - Signature: ${signature}`);
      logger.info(`  - Solscan: ${solscanUrl}`);

      return {
        success: true,
        signature,
        solscanUrl
      };

    } catch (error) {
      logger.error('❌ Transfer failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check USDC balance for a wallet
   */
  async getUSDCBalance(walletAddress: string): Promise<number> {
    try {
      const publicKey = new PublicKey(walletAddress);
      const tokenAccount = await getAssociatedTokenAddress(
        this.usdcMintAddress,
        publicKey,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      const account = await getAccount(
        this.connection,
        tokenAccount,
        'confirmed',
        TOKEN_PROGRAM_ID
      );

      return Number(account.amount) / 1_000_000;
    } catch (error) {
      logger.error(`Failed to get balance for ${walletAddress}:`, error);
      return 0;
    }
  }

  /**
   * Get Solscan URL for transaction
   */
  private getSolscanUrl(signature: string): string {
    const domain = this.network === 'devnet' 
      ? 'solscan.io?cluster=devnet' 
      : 'solscan.io';
    return `https://${domain}/tx/${signature}`;
  }

  /**
   * Verify a wallet has sufficient USDC
   */
  async verifyBalance(walletAddress: string, requiredAmount: number): Promise<boolean> {
    const balance = await this.getUSDCBalance(walletAddress);
    return balance >= requiredAmount;
  }

  /**
   * Get connection for health checks
   */
  async healthCheck(): Promise<boolean> {
    try {
      const slot = await this.connection.getSlot();
      return slot > 0;
    } catch (error) {
      logger.error('Solana connection health check failed:', error);
      return false;
    }
  }
}

/**
 * Helper to validate Solana address
 */
export function isValidSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

/**
 * Helper to convert private key from various formats
 */
export function normalizePrivateKey(privateKey: string): string {
  // Already base58
  if (privateKey.length === 88 || privateKey.length === 87) {
    return privateKey;
  }
  
  // Try to parse as JSON array [1,2,3...]
  try {
    const parsed = JSON.parse(privateKey);
    if (Array.isArray(parsed)) {
      return bs58.encode(Buffer.from(parsed));
    }
  } catch {}
  
  return privateKey;
}


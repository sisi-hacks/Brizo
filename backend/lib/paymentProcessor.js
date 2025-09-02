const StacksService = require('./stacks');
const DatabaseManager = require('./database');

class PaymentProcessor {
  constructor(dbManager) {
    this.stacksService = new StacksService();
    this.dbManager = dbManager;
    this.processingQueue = new Map(); // Track payments being processed
  }

  /**
   * Process a payment with real sBTC verification
   */
  async processPayment(paymentId, sbtcTxId, walletAddress) {
    try {
      // Check if payment is already being processed
      if (this.processingQueue.has(paymentId)) {
        throw new Error('Payment is already being processed');
      }

      // Add to processing queue
      this.processingQueue.set(paymentId, {
        startTime: Date.now(),
        status: 'processing',
      });

      // Get payment details from database
      const payment = await this.dbManager.get(
        'SELECT * FROM payments WHERE id = ?',
        [paymentId]
      );

      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.status === 'paid') {
        throw new Error('Payment already processed');
      }

      // Get merchant details
      const merchant = await this.dbManager.get(
        'SELECT * FROM merchants WHERE id = ?',
        [payment.merchantId]
      );

      if (!merchant) {
        throw new Error('Merchant not found');
      }

      // Validate the sBTC transaction
      const validation = await this.stacksService.validateSbtcPayment(
        sbtcTxId,
        merchant.walletAddress,
        payment.amount
      );

      if (!validation.valid) {
        throw new Error(`Payment validation failed: ${validation.error}`);
      }

      // Update payment status in database
      await this.dbManager.run(`
        UPDATE payments 
        SET status = 'paid', paidAt = CURRENT_TIMESTAMP, sbtcTxId = ?
        WHERE id = ?
      `, [sbtcTxId, paymentId]);

      // Remove from processing queue
      this.processingQueue.delete(paymentId);

      return {
        success: true,
        paymentId,
        status: 'paid',
        sbtcTxId,
        transaction: validation.transaction,
        message: 'Payment processed successfully',
        processedAt: new Date().toISOString(),
      };
    } catch (error) {
      // Remove from processing queue on error
      this.processingQueue.delete(paymentId);
      
      console.error('Payment processing error:', error);
      throw error;
    }
  }

  /**
   * Monitor a payment transaction
   */
  async monitorPayment(paymentId, sbtcTxId, maxAttempts = 30) {
    try {
      const result = await this.stacksService.monitorTransaction(sbtcTxId, maxAttempts);
      
      if (result.success) {
        // Update payment status if confirmed
        await this.dbManager.run(`
          UPDATE payments 
          SET status = 'paid', paidAt = CURRENT_TIMESTAMP, sbtcTxId = ?
          WHERE id = ? AND status = 'pending'
        `, [sbtcTxId, paymentId]);
      }

      return result;
    } catch (error) {
      console.error('Payment monitoring error:', error);
      throw error;
    }
  }

  /**
   * Get payment status with real-time verification
   */
  async getPaymentStatus(paymentId) {
    try {
      const payment = await this.dbManager.get(
        'SELECT * FROM payments WHERE id = ?',
        [paymentId]
      );

      if (!payment) {
        throw new Error('Payment not found');
      }

      // If payment has a transaction ID, verify it on-chain
      if (payment.sbtcTxId) {
        try {
          const txInfo = await this.stacksService.verifyTransaction(payment.sbtcTxId);
          
          // Update status if transaction is confirmed but payment status is still pending
          if (txInfo.confirmed && payment.status === 'pending') {
            await this.dbManager.run(`
              UPDATE payments 
              SET status = 'paid', paidAt = CURRENT_TIMESTAMP
              WHERE id = ?
            `, [paymentId]);
            
            payment.status = 'paid';
            payment.paidAt = new Date().toISOString();
          }

          return {
            ...payment,
            transaction: txInfo,
            onChainStatus: txInfo.status,
            confirmed: txInfo.confirmed,
          };
        } catch (error) {
          console.error('Error verifying transaction:', error);
          // Return payment info even if transaction verification fails
          return {
            ...payment,
            transactionError: error.message,
          };
        }
      }

      return payment;
    } catch (error) {
      console.error('Error getting payment status:', error);
      throw error;
    }
  }

  /**
   * Get merchant's sBTC balance
   */
  async getMerchantBalance(merchantId) {
    try {
      const merchant = await this.dbManager.get(
        'SELECT * FROM merchants WHERE id = ?',
        [merchantId]
      );

      if (!merchant) {
        throw new Error('Merchant not found');
      }

      const balance = await this.stacksService.getSbtcBalance(merchant.walletAddress);
      
      return {
        merchantId,
        walletAddress: merchant.walletAddress,
        sbtcBalance: balance.sbtcBalance,
        contract: balance.contract,
      };
    } catch (error) {
      console.error('Error getting merchant balance:', error);
      throw error;
    }
  }

  /**
   * Get merchant's recent transactions
   */
  async getMerchantTransactions(merchantId, limit = 10) {
    try {
      const merchant = await this.dbManager.get(
        'SELECT * FROM merchants WHERE id = ?',
        [merchantId]
      );

      if (!merchant) {
        throw new Error('Merchant not found');
      }

      const transactions = await this.stacksService.getRecentTransactions(
        merchant.walletAddress,
        limit
      );

      return {
        merchantId,
        walletAddress: merchant.walletAddress,
        transactions,
      };
    } catch (error) {
      console.error('Error getting merchant transactions:', error);
      throw error;
    }
  }

  /**
   * Validate a wallet address
   */
  async validateWalletAddress(address) {
    return this.stacksService.validateAddress(address);
  }

  /**
   * Get network status
   */
  async getNetworkStatus() {
    return this.stacksService.getNetworkStatus();
  }

  /**
   * Request testnet STX from faucet (for development)
   */
  async requestTestnetSTX(address) {
    return this.stacksService.requestTestnetSTX(address);
  }

  /**
   * Get processing queue status
   */
  getProcessingQueue() {
    const queue = Array.from(this.processingQueue.entries()).map(([paymentId, info]) => ({
      paymentId,
      ...info,
      duration: Date.now() - info.startTime,
    }));

    return {
      active: queue.length,
      payments: queue,
    };
  }

  /**
   * Clean up old processing entries
   */
  cleanupProcessingQueue() {
    const now = Date.now();
    const maxProcessingTime = 5 * 60 * 1000; // 5 minutes

    for (const [paymentId, info] of this.processingQueue.entries()) {
      if (now - info.startTime > maxProcessingTime) {
        console.log(`Cleaning up stale processing entry for payment ${paymentId}`);
        this.processingQueue.delete(paymentId);
      }
    }
  }
}

module.exports = PaymentProcessor;

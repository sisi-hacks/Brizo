const SmartContractService = require('./smartContract');
const DatabaseManager = require('./database');

/**
 * Contract Integration Service
 * 
 * This service bridges the gap between the traditional database-based
 * payment system and the smart contract-based system, providing a
 * hybrid approach for gradual migration.
 */
class ContractIntegrationService {
  constructor(dbManager) {
    this.smartContract = new SmartContractService();
    this.dbManager = dbManager;
    this.contractEnabled = process.env.CONTRACT_ENABLED === 'true';
    this.contractAddress = process.env.CONTRACT_ADDRESS;
    
    console.log(`🔗 Contract Integration Service initialized`);
    console.log(`📄 Contract enabled: ${this.contractEnabled}`);
    console.log(`📍 Contract address: ${this.contractAddress || 'Not set'}`);
  }

  /**
   * Create a payment (hybrid approach)
   * Creates in both database and smart contract if enabled
   */
  async createPayment(merchantId, amount, currency, description) {
    try {
      // Always create in database first
      const dbResult = await this.createPaymentInDatabase(merchantId, amount, currency, description);
      
      if (!dbResult.success) {
        return dbResult;
      }

      // If contract is enabled, also create in smart contract
      if (this.contractEnabled && this.contractAddress) {
        const contractResult = await this.createPaymentInContract(
          merchantId, 
          amount, 
          currency, 
          description
        );
        
        if (contractResult.success) {
          // Update database with contract transaction ID
          await this.updatePaymentWithContractTx(dbResult.paymentId, contractResult.txId);
          
          return {
            ...dbResult,
            contractTxId: contractResult.txId,
            contractEnabled: true
          };
        } else {
          console.warn('Contract payment creation failed, but database payment created:', contractResult.error);
        }
      }

      return {
        ...dbResult,
        contractEnabled: this.contractEnabled
      };

    } catch (error) {
      console.error('Error in hybrid payment creation:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Process a payment (hybrid approach)
   */
  async processPayment(paymentId, sbtcTxId, walletAddress) {
    try {
      // Get payment from database
      const payment = await this.dbManager.get(
        'SELECT * FROM payments WHERE id = ?',
        [paymentId]
      );

      if (!payment) {
        return { success: false, error: 'Payment not found' };
      }

      // Process in database first
      const dbResult = await this.processPaymentInDatabase(paymentId, sbtcTxId, walletAddress);
      
      if (!dbResult.success) {
        return dbResult;
      }

      // If contract is enabled, also process in smart contract
      if (this.contractEnabled && this.contractAddress && payment.contractPaymentId) {
        const contractResult = await this.processPaymentInContract(
          payment.contractPaymentId,
          sbtcTxId,
          walletAddress
        );
        
        if (contractResult.success) {
          return {
            ...dbResult,
            contractTxId: contractResult.txId,
            contractEnabled: true
          };
        } else {
          console.warn('Contract payment processing failed, but database payment processed:', contractResult.error);
        }
      }

      return {
        ...dbResult,
        contractEnabled: this.contractEnabled
      };

    } catch (error) {
      console.error('Error in hybrid payment processing:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get payment status (hybrid approach)
   */
  async getPaymentStatus(paymentId) {
    try {
      // Get from database
      const dbPayment = await this.dbManager.get(
        'SELECT * FROM payments WHERE id = ?',
        [paymentId]
      );

      if (!dbPayment) {
        return { success: false, error: 'Payment not found' };
      }

      let contractPayment = null;
      
      // If contract is enabled, also get from smart contract
      if (this.contractEnabled && this.contractAddress && dbPayment.contractPaymentId) {
        const contractResult = await this.smartContract.getPayment(dbPayment.contractPaymentId);
        if (contractResult.success) {
          contractPayment = contractResult.payment;
        }
      }

      return {
        success: true,
        payment: {
          ...dbPayment,
          contractPayment,
          contractEnabled: this.contractEnabled
        }
      };

    } catch (error) {
      console.error('Error getting hybrid payment status:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get merchant balance (hybrid approach)
   */
  async getMerchantBalance(merchantId) {
    try {
      // Get from database
      const dbMerchant = await this.dbManager.get(
        'SELECT * FROM merchants WHERE id = ?',
        [merchantId]
      );

      if (!dbMerchant) {
        return { success: false, error: 'Merchant not found' };
      }

      let contractBalance = null;
      
      // If contract is enabled, also get from smart contract
      if (this.contractEnabled && this.contractAddress) {
        const contractResult = await this.smartContract.getMerchantBalance(merchantId);
        if (contractResult.success) {
          contractBalance = contractResult.balance;
        }
      }

      return {
        success: true,
        merchant: {
          ...dbMerchant,
          contractBalance,
          contractEnabled: this.contractEnabled
        }
      };

    } catch (error) {
      console.error('Error getting hybrid merchant balance:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Register merchant in smart contract
   */
  async registerMerchantInContract(merchantId, name, walletAddress, privateKey) {
    try {
      if (!this.contractEnabled) {
        return { success: false, error: 'Contract integration is disabled' };
      }

      const result = await this.smartContract.registerMerchant(
        merchantId,
        name,
        walletAddress,
        privateKey
      );

      return result;
    } catch (error) {
      console.error('Error registering merchant in contract:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get contract statistics
   */
  async getContractStats() {
    try {
      if (!this.contractEnabled) {
        return { success: false, error: 'Contract integration is disabled' };
      }

      const result = await this.smartContract.getContractStats();
      return result;
    } catch (error) {
      console.error('Error getting contract stats:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Private helper methods

  async createPaymentInDatabase(merchantId, amount, currency, description) {
    try {
      const paymentId = require('uuid').v4();
      
      await this.dbManager.run(
        `INSERT INTO payments (id, merchantId, amount, currency, description, status, createdAt) 
         VALUES (?, ?, ?, ?, ?, 'pending', ?)`,
        [paymentId, merchantId, amount, currency, description, new Date().toISOString()]
      );

      return {
        success: true,
        paymentId,
        message: 'Payment created in database'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async createPaymentInContract(merchantId, amount, currency, description) {
    try {
      // Convert amount to micro-units (assuming sBTC uses 8 decimal places)
      const amountInMicroUnits = Math.floor(amount * 100000000);
      
      const result = await this.smartContract.createPayment(
        merchantId,
        amountInMicroUnits,
        currency,
        description,
        process.env.CONTRACT_PRIVATE_KEY // This should be set in environment
      );

      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async processPaymentInDatabase(paymentId, sbtcTxId, walletAddress) {
    try {
      await this.dbManager.run(
        `UPDATE payments SET status = 'paid', sbtcTxId = ?, processedAt = ? WHERE id = ?`,
        [sbtcTxId, new Date().toISOString(), paymentId]
      );

      return {
        success: true,
        message: 'Payment processed in database'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async processPaymentInContract(contractPaymentId, sbtcTxId, walletAddress) {
    try {
      const result = await this.smartContract.processPayment(
        contractPaymentId,
        sbtcTxId,
        walletAddress,
        process.env.CONTRACT_PRIVATE_KEY
      );

      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async updatePaymentWithContractTx(paymentId, contractTxId) {
    try {
      await this.dbManager.run(
        `UPDATE payments SET contractTxId = ? WHERE id = ?`,
        [contractTxId, paymentId]
      );
    } catch (error) {
      console.error('Error updating payment with contract transaction ID:', error);
    }
  }
}

module.exports = ContractIntegrationService;

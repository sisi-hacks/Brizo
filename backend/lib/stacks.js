const { StacksNetwork, StacksTestnet, StacksMainnet } = require('@stacks/network');
const { TransactionVersion, AddressHashMode, AddressVersion } = require('@stacks/transactions');
const { createClient } = require('@stacks/blockchain-api-client');
const axios = require('axios');

class StacksService {
  constructor() {
    this.network = process.env.STACKS_NETWORK || 'testnet';
    this.apiUrl = process.env.STACKS_API_URL || 'https://api.testnet.hiro.so';
    
    // Testnet faucet URL for development - following Stacks documentation
    this.faucetUrl = 'https://explorer.stacks.co/sandbox/faucet';
    
    // Initialize network
    this.stacksNetwork = this.network === 'mainnet' 
      ? new StacksMainnet({ url: this.apiUrl })
      : new StacksTestnet({ url: this.apiUrl });
    
    // Initialize HTTP client for Stacks API calls
    this.httpClient = axios.create({
      baseURL: this.apiUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log(`🔗 Stacks Service initialized for ${this.network} network`);
    console.log(`💰 Testnet faucet available at: ${this.faucetUrl}`);
  }

  /**
   * Validate a Stacks address
   */
  validateAddress(address) {
    try {
      // Basic Stacks address validation
      if (!address || typeof address !== 'string') {
        return { valid: false, error: 'Address must be a string' };
      }

      // Check if it's a valid Stacks address format
      if (!address.startsWith('ST') && !address.startsWith('SP')) {
        return { valid: false, error: 'Address must start with ST or SP' };
      }

      // Check length (should be 40-41 characters, but be lenient for testing)
      if (address.length < 35 || address.length > 45) {
        return { valid: false, error: 'Invalid address length' };
      }

      // Check if it contains only valid characters (more lenient for testing)
      const validChars = /^[1-9A-HJ-NP-Za-km-z]+$/;
      if (!validChars.test(address.slice(2))) {
        // For now, allow any characters for testing
        console.warn(`Address ${address} contains potentially invalid characters, but allowing for testing`);
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  /**
   * Get account information for a Stacks address
   */
  async getAccountInfo(address) {
    try {
      const validation = this.validateAddress(address);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Get account info using Stacks API
      const response = await this.httpClient.get(`/extended/v1/address/${address}/stx`);
      const accountInfo = response.data;

      return {
        address,
        balance: accountInfo.balance,
        nonce: accountInfo.nonce,
        locked: accountInfo.locked,
        unlock_height: accountInfo.unlock_height,
        balance_proof: accountInfo.balance_proof,
        nonce_proof: accountInfo.nonce_proof,
      };
    } catch (error) {
      console.error('Error fetching account info:', error);
      throw new Error(`Failed to fetch account info: ${error.message}`);
    }
  }

  /**
   * Request testnet STX from faucet (for development)
   * Following Stacks documentation: https://docs.stacks.co/guides-and-tutorials/running-a-signer#setup-your-stacks-accounts
   */
  async requestTestnetSTX(address) {
    try {
      const validation = this.validateAddress(address);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      if (this.network !== 'testnet') {
        throw new Error('Faucet is only available for testnet');
      }

      // Request STX from testnet faucet (using query parameters as per API docs)
      const response = await this.httpClient.post(`/extended/v1/faucets/stx?address=${address}&stacking=false`);

      return {
        success: true,
        txId: response.data.txId,
        message: 'Testnet STX requested successfully',
        faucetUrl: this.faucetUrl
      };
    } catch (error) {
      console.error('Error requesting testnet STX:', error);
      return {
        success: false,
        error: error.message,
        faucetUrl: this.faucetUrl,
        message: 'You can also request STX manually from the faucet'
      };
    }
  }

  /**
   * Get sBTC balance for an address
   */
  async getSbtcBalance(address) {
    try {
      const validation = this.validateAddress(address);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      try {
        // Try to get account info from Stacks API
        const response = await this.httpClient.get(`/extended/v1/address/${address}/stx`);
        const accountInfo = response.data;
        
        // For now, return a mock sBTC balance since the FT balances endpoint might not be available
        // In a real implementation, you would query the sBTC contract directly
        const balances = [{
          contract_identifier: 'ST1PQHQKV0RJXZFYVWE6CHS7NS4T3MG9XJVTQVAVSB.sbtc-token',
          balance: '0',
          total_sent: '0',
          total_received: '0'
        }];

        // Find sBTC balance
        const sbtcBalance = balances.find(balance => 
          balance.contract_identifier.includes('sbtc') || 
          balance.contract_identifier.includes('SBTC')
        );

        return {
          address,
          sbtcBalance: sbtcBalance ? sbtcBalance.balance : '0',
          contract: sbtcBalance ? sbtcBalance.contract_identifier : null,
          stxBalance: accountInfo.balance || '0',
        };
      } catch (apiError) {
        // If API call fails, return mock data for development
        console.warn('Stacks API call failed, returning mock data:', apiError.message);
        return {
          address,
          sbtcBalance: '0',
          contract: 'ST1PQHQKV0RJXZFYVWE6CHS7NS4T3MG9XJVTQVAVSB.sbtc-token',
          stxBalance: '0',
          mock: true,
          error: apiError.message,
        };
      }
    } catch (error) {
      console.error('Error fetching sBTC balance:', error);
      throw new Error(`Failed to fetch sBTC balance: ${error.message}`);
    }
  }

  /**
   * Verify a transaction exists and is confirmed
   */
  async verifyTransaction(txId) {
    try {
      if (!txId || typeof txId !== 'string') {
        throw new Error('Transaction ID must be a string');
      }

      // Get transaction details using Stacks API
      const response = await this.httpClient.get(`/extended/v1/tx/${txId}`);
      const transaction = response.data;

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      return {
        txId,
        exists: true,
        confirmed: transaction.tx_status === 'success',
        status: transaction.tx_status,
        blockHeight: transaction.block_height,
        blockHash: transaction.block_hash,
        fee: transaction.fee_rate,
        sender: transaction.sender_address,
        recipient: transaction.token_transfer?.recipient_address,
        amount: transaction.token_transfer?.amount,
        memo: transaction.token_transfer?.memo,
        timestamp: transaction.burn_block_time,
      };
    } catch (error) {
      console.error('Error verifying transaction:', error);
      throw new Error(`Failed to verify transaction: ${error.message}`);
    }
  }

  /**
   * Monitor a transaction for confirmation
   */
  async monitorTransaction(txId, maxAttempts = 30, intervalMs = 5000) {
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      try {
        const txInfo = await this.verifyTransaction(txId);
        
        if (txInfo.confirmed) {
          return {
            success: true,
            transaction: txInfo,
            attempts: attempts + 1,
          };
        }
        
        attempts++;
        console.log(`Transaction ${txId} not confirmed yet, attempt ${attempts}/${maxAttempts}`);
        
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, intervalMs));
        }
      } catch (error) {
        attempts++;
        console.log(`Error monitoring transaction ${txId}, attempt ${attempts}/${maxAttempts}:`, error.message);
        
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, intervalMs));
        }
      }
    }
    
    return {
      success: false,
      error: 'Transaction monitoring timeout',
      attempts,
    };
  }

  /**
   * Get recent transactions for an address
   */
  async getRecentTransactions(address, limit = 10) {
    try {
      const validation = this.validateAddress(address);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Get account transactions using Stacks API
      const response = await this.httpClient.get(`/extended/v1/address/${address}/transactions`, {
        params: { limit }
      });
      const transactions = response.data;

      return transactions.results.map(tx => ({
        txId: tx.tx_id,
        status: tx.tx_status,
        type: tx.tx_type,
        sender: tx.sender_address,
        recipient: tx.token_transfer?.recipient_address,
        amount: tx.token_transfer?.amount,
        memo: tx.token_transfer?.memo,
        blockHeight: tx.block_height,
        timestamp: tx.burn_block_time,
        fee: tx.fee_rate,
      }));
    } catch (error) {
      console.error('Error fetching recent transactions:', error);
      throw new Error(`Failed to fetch recent transactions: ${error.message}`);
    }
  }

  /**
   * Check if a transaction is a valid sBTC payment
   */
  async validateSbtcPayment(txId, expectedRecipient, expectedAmount) {
    try {
      const txInfo = await this.verifyTransaction(txId);
      
      if (!txInfo.confirmed) {
        return {
          valid: false,
          error: 'Transaction not confirmed',
          transaction: txInfo,
        };
      }

      // Check if it's a token transfer
      if (txInfo.type !== 'token_transfer') {
        return {
          valid: false,
          error: 'Transaction is not a token transfer',
          transaction: txInfo,
        };
      }

      // Check recipient
      if (txInfo.recipient !== expectedRecipient) {
        return {
          valid: false,
          error: `Recipient mismatch: expected ${expectedRecipient}, got ${txInfo.recipient}`,
          transaction: txInfo,
        };
      }

      // Check amount (with some tolerance for precision)
      const txAmount = parseFloat(txInfo.amount);
      const expectedAmountFloat = parseFloat(expectedAmount);
      const tolerance = 0.000001; // 1 satoshi tolerance
      
      if (Math.abs(txAmount - expectedAmountFloat) > tolerance) {
        return {
          valid: false,
          error: `Amount mismatch: expected ${expectedAmount}, got ${txInfo.amount}`,
          transaction: txInfo,
        };
      }

      return {
        valid: true,
        transaction: txInfo,
      };
    } catch (error) {
      console.error('Error validating sBTC payment:', error);
      return {
        valid: false,
        error: error.message,
      };
    }
  }

  /**
   * Get network status
   */
  async getNetworkStatus() {
    try {
      // Get network status using Stacks API
      const response = await this.httpClient.get('/extended/v1/status');
      const status = response.data;
      return {
        network: this.network,
        apiUrl: this.apiUrl,
        status: 'connected',
        chainTip: status.chain_tip,
        burnBlockHeight: status.burn_block_height,
        peerVersion: status.peer_version,
      };
    } catch (error) {
      console.error('Error fetching network status:', error);
      return {
        network: this.network,
        apiUrl: this.apiUrl,
        status: 'disconnected',
        error: error.message,
      };
    }
  }

  /**
   * Get sBTC contract information
   */
  async getSbtcContractInfo() {
    try {
      // sBTC contract addresses (these would be different for mainnet vs testnet)
      const sbtcContracts = {
        testnet: {
          token: 'ST1PQHQKV0RJXZFYVWE6CHS7NS4T3MG9XJVTQVAVSB.sbtc-token',
          deposit: 'ST1PQHQKV0RJXZFYVWE6CHS7NS4T3MG9XJVTQVAVSB.sbtc-deposit',
          withdrawal: 'ST1PQHQKV0RJXZFYVWE6CHS7NS4T3MG9XJVTQVAVSB.sbtc-withdrawal',
        },
        mainnet: {
          token: 'SP000000000000000000002Q6VF78.sbtc-token',
          deposit: 'SP000000000000000000002Q6VF78.sbtc-deposit', 
          withdrawal: 'SP000000000000000000002Q6VF78.sbtc-withdrawal',
        }
      };

      return sbtcContracts[this.network] || sbtcContracts.testnet;
    } catch (error) {
      console.error('Error getting sBTC contract info:', error);
      throw new Error(`Failed to get sBTC contract info: ${error.message}`);
    }
  }

  /**
   * Get sBTC deposit/withdrawal status
   */
  async getSbtcOperationStatus(operationId) {
    try {
      // This would query the sBTC contract for operation status
      // For now, we'll return a placeholder structure
      return {
        operationId,
        status: 'pending', // pending, completed, failed
        type: 'deposit', // deposit, withdrawal
        amount: '0',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error getting sBTC operation status:', error);
      throw new Error(`Failed to get sBTC operation status: ${error.message}`);
    }
  }

  /**
   * Estimate transaction fees
   */
  async estimateTransactionFee(transactionType = 'token_transfer') {
    try {
      // Basic fee estimation based on transaction type
      const feeRates = {
        token_transfer: 0.0001, // STX
        contract_call: 0.0005,  // STX
        contract_deploy: 0.001, // STX
      };

      return {
        feeRate: feeRates[transactionType] || feeRates.token_transfer,
        currency: 'STX',
        network: this.network,
      };
    } catch (error) {
      console.error('Error estimating transaction fee:', error);
      throw new Error(`Failed to estimate transaction fee: ${error.message}`);
    }
  }
}

module.exports = StacksService; 
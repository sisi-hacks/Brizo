/**
 * Stacks Testnet Integration Service
 * Provides testnet support and faucet integration for development
 * Handles testnet environment setup, faucet requests, and test data
 */

const axios = require('axios');
const { StacksTestnet } = require('@stacks/network');

class TestnetIntegrationService {
  constructor() {
    this.network = new StacksTestnet();
    this.baseUrl = 'https://api.testnet.hiro.so';
    this.faucetUrl = 'https://api.testnet.hiro.so/extended/v1/faucets/stx';
    this.testnetInfo = {
      name: 'Stacks Testnet',
      chainId: '2147483648',
      baseUrl: this.baseUrl,
      explorer: 'https://explorer.stacks.co/sandbox',
      faucet: 'https://explorer.stacks.co/sandbox/faucet',
      status: 'active'
    };
  }

  /**
   * Get testnet status and information
   * @returns {Object} Testnet status
   */
  async getTestnetStatus() {
    try {
      console.log('🔍 Checking testnet status...');
      
      // Check testnet API health
      const healthResponse = await axios.get(`${this.baseUrl}/extended/v1/status`);
      const networkStatus = healthResponse.data;

      // Check faucet availability
      const faucetResponse = await axios.get(this.faucetUrl);
      const faucetStatus = faucetResponse.status === 200 ? 'available' : 'unavailable';

      const status = {
        ...this.testnetInfo,
        apiStatus: networkStatus.status,
        faucetStatus: faucetStatus,
        lastChecked: new Date().toISOString(),
        networkInfo: {
          chainId: networkStatus.chain_id,
          burnHeight: networkStatus.burn_height,
          currentHeight: networkStatus.stacks_tip_height,
          microblocksAccepted: networkStatus.microblocks_accepted,
          microblocksStreamed: networkStatus.microblocks_streamed
        }
      };

      console.log('✅ Testnet status retrieved successfully');
      return status;

    } catch (error) {
      console.error('❌ Failed to get testnet status:', error.message);
      return {
        ...this.testnetInfo,
        status: 'error',
        error: error.message,
        lastChecked: new Date().toISOString()
      };
    }
  }

  /**
   * Request testnet STX from faucet
   * @param {string} address - Stacks address to receive STX
   * @param {boolean} stacking - Whether to enable stacking
   * @returns {Object} Faucet response
   */
  async requestTestnetSTX(address, stacking = false) {
    try {
      console.log(`💰 Requesting testnet STX for address: ${address}`);
      
      // Validate address format
      if (!this.isValidStacksAddress(address)) {
        throw new Error('Invalid Stacks address format');
      }

      // Request STX from faucet
      const response = await axios.post(this.faucetUrl, {
        address: address,
        stacking: stacking
      });

      if (response.status === 200) {
        console.log('✅ Testnet STX requested successfully');
        return {
          success: true,
          address: address,
          stacking: stacking,
          message: 'STX faucet request submitted successfully',
          txId: response.data.txId || null,
          timestamp: new Date().toISOString()
        };
      } else {
        throw new Error(`Faucet request failed with status: ${response.status}`);
      }

    } catch (error) {
      console.error('❌ Faucet request failed:', error.message);
      return {
        success: false,
        address: address,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get testnet account balance
   * @param {string} address - Stacks address
   * @returns {Object} Account balance
   */
  async getTestnetBalance(address) {
    try {
      console.log(`💳 Getting testnet balance for: ${address}`);

      // Get STX balance
      const stxResponse = await axios.get(`${this.baseUrl}/extended/v1/address/${address}/stx`);
      const stxBalance = stxResponse.data;

      // Get token balances (including sBTC)
      const tokensResponse = await axios.get(`${this.baseUrl}/extended/v1/address/${address}/balances`);
      const tokenBalances = tokensResponse.data;

      // Find sBTC balance
      const sbtcBalance = tokenBalances.fungible_tokens.find(token => 
        token.contract_id.includes('sbtc-token')
      ) || { balance: '0', total_sent: '0', total_received: '0' };

      const balance = {
        address: address,
        network: 'testnet',
        stx: {
          balance: stxBalance.balance,
          totalSent: stxBalance.total_sent,
          totalReceived: stxBalance.total_received,
          unlockHeight: stxBalance.unlock_height
        },
        sbtc: {
          balance: sbtcBalance.balance || '0',
          totalSent: sbtcBalance.total_sent || '0',
          totalReceived: sbtcBalance.total_received || '0'
        },
        lastUpdated: new Date().toISOString()
      };

      console.log('✅ Testnet balance retrieved successfully');
      return balance;

    } catch (error) {
      console.error('❌ Failed to get testnet balance:', error.message);
      return {
        address: address,
        network: 'testnet',
        error: error.message,
        lastUpdated: new Date().toISOString()
      };
    }
  }

  /**
   * Get testnet transaction history
   * @param {string} address - Stacks address
   * @param {number} limit - Number of transactions to retrieve
   * @returns {Object} Transaction history
   */
  async getTestnetTransactions(address, limit = 50) {
    try {
      console.log(`📜 Getting testnet transactions for: ${address}`);

      const response = await axios.get(`${this.baseUrl}/extended/v1/address/${address}/transactions`, {
        params: {
          limit: limit,
          offset: 0
        }
      });

      const transactions = response.data.results.map(tx => ({
        txId: tx.tx_id,
        type: tx.tx_type,
        status: tx.tx_status,
        blockHeight: tx.block_height,
        timestamp: tx.burn_block_time,
        fee: tx.fee_rate,
        sender: tx.sender_address,
        recipient: tx.recipient_address,
        amount: tx.amount || '0'
      }));

      console.log(`✅ Retrieved ${transactions.length} testnet transactions`);
      return {
        address: address,
        network: 'testnet',
        transactions: transactions,
        total: response.data.total,
        limit: limit,
        lastUpdated: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Failed to get testnet transactions:', error.message);
      return {
        address: address,
        network: 'testnet',
        error: error.message,
        lastUpdated: new Date().toISOString()
      };
    }
  }

  /**
   * Get testnet network statistics
   * @returns {Object} Network statistics
   */
  async getTestnetStats() {
    try {
      console.log('📊 Getting testnet network statistics...');

      const [statusResponse, blocksResponse, mempoolResponse] = await Promise.all([
        axios.get(`${this.baseUrl}/extended/v1/status`),
        axios.get(`${this.baseUrl}/extended/v1/block`),
        axios.get(`${this.baseUrl}/extended/v1/mempool`)
      ]);

      const stats = {
        network: 'testnet',
        status: statusResponse.data,
        latestBlock: blocksResponse.data,
        mempool: {
          count: mempoolResponse.data.total,
          size: mempoolResponse.data.total_fee_rate || '0'
        },
        lastUpdated: new Date().toISOString()
      };

      console.log('✅ Testnet statistics retrieved successfully');
      return stats;

    } catch (error) {
      console.error('❌ Failed to get testnet statistics:', error.message);
      return {
        network: 'testnet',
        error: error.message,
        lastUpdated: new Date().toISOString()
      };
    }
  }

  /**
   * Create testnet test data
   * @returns {Object} Test data
   */
  generateTestData() {
    return {
      testAddresses: [
        'ST1PQHQKV0RJXZFYVWE6CHS7NS4T3MG9XJVTQVAVSB',
        'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6X4XK5Z8HZ5',
        'ST3AM1A56AK2C1XAF9XP3SV9KKTGTRACU29JP65H9'
      ],
      testTransactions: [
        {
          txId: '0x1234567890abcdef',
          type: 'token_transfer',
          amount: '1000000',
          sender: 'ST1PQHQKV0RJXZFYVWE6CHS7NS4T3MG9XJVTQVAVSB',
          recipient: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6X4XK5Z8HZ5'
        }
      ],
      faucetInfo: {
        url: this.testnetInfo.faucet,
        requirements: 'Valid Stacks address',
        limits: 'Up to 1000 STX per request',
        cooldown: '24 hours between requests'
      }
    };
  }

  /**
   * Validate Stacks address format
   * @param {string} address - Address to validate
   * @returns {boolean} Is valid
   */
  isValidStacksAddress(address) {
    // Basic Stacks address validation
    const stacksAddressRegex = /^ST[0-9A-Z]{33}$/;
    return stacksAddressRegex.test(address);
  }

  /**
   * Get testnet environment info
   * @returns {Object} Environment information
   */
  getEnvironmentInfo() {
    return {
      network: 'testnet',
      baseUrl: this.baseUrl,
      explorer: this.testnetInfo.explorer,
      faucet: this.testnetInfo.faucet,
      chainId: this.testnetInfo.chainId,
      features: [
        'Free STX faucet',
        'Test sBTC operations',
        'Smart contract testing',
        'Transaction simulation',
        'Network monitoring'
      ],
      usage: [
        'Development and testing',
        'Smart contract deployment',
        'Wallet integration testing',
        'sBTC operations testing',
        'Performance testing'
      ]
    };
  }

  /**
   * Health check for testnet services
   * @returns {Object} Health status
   */
  async healthCheck() {
    try {
      const checks = await Promise.allSettled([
        this.getTestnetStatus(),
        axios.get(`${this.baseUrl}/extended/v1/status`),
        axios.get(this.faucetUrl)
      ]);

      const health = {
        timestamp: new Date().toISOString(),
        network: 'testnet',
        services: {
          api: checks[1].status === 'fulfilled' ? 'healthy' : 'unhealthy',
          faucet: checks[2].status === 'fulfilled' ? 'healthy' : 'unhealthy',
          integration: checks[0].status === 'fulfilled' ? 'healthy' : 'unhealthy'
        },
        overall: checks.every(check => check.status === 'fulfilled') ? 'healthy' : 'degraded'
      };

      return health;

    } catch (error) {
      return {
        timestamp: new Date().toISOString(),
        network: 'testnet',
        status: 'unhealthy',
        error: error.message
      };
    }
  }
}

module.exports = TestnetIntegrationService;

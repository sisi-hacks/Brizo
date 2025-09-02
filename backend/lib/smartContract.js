const { StacksNetwork, StacksTestnet, StacksMainnet } = require('@stacks/network');
const { 
  makeContractCall, 
  broadcastTransaction, 
  callReadOnlyFunction,
  contractPrincipalCV,
  standardPrincipalCV,
  uintCV,
  stringUtf8CV,
  someCV,
  noneCV,
  responseOkCV,
  responseErrorCV
} = require('@stacks/transactions');
const { TransactionVersion, AddressHashMode, AddressVersion } = require('@stacks/transactions');

class SmartContractService {
  constructor() {
    this.network = process.env.STACKS_NETWORK || 'testnet';
    this.apiUrl = process.env.STACKS_API_URL || 'https://api.testnet.hiro.so';
    
    // Contract details
    this.contractAddress = process.env.CONTRACT_ADDRESS || 'ST1PQHQKV0RJXZFYVWE6CHS7NS4T3MG9XJVTQVAVSB';
    this.contractName = 'brizo-payments';
    this.traitName = 'brizo-payments-trait';
    
    // Initialize network
    this.stacksNetwork = this.network === 'mainnet' 
      ? new StacksMainnet({ url: this.apiUrl })
      : new StacksTestnet({ url: this.apiUrl });
    
    console.log(`🔗 Smart Contract Service initialized for ${this.network} network`);
    console.log(`📄 Contract: ${this.contractAddress}.${this.contractName}`);
  }

  /**
   * Create a new payment in the smart contract
   */
  async createPayment(merchantId, amount, currency, description, privateKey) {
    try {
      const functionArgs = [
        stringUtf8CV(merchantId),
        uintCV(amount),
        stringUtf8CV(currency),
        stringUtf8CV(description)
      ];

      const txOptions = {
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        functionName: 'create-payment',
        functionArgs,
        senderKey: privateKey,
        network: this.stacksNetwork,
        fee: 1000, // 0.001 STX
        nonce: await this.getNonce(privateKey)
      };

      const transaction = await makeContractCall(txOptions);
      const broadcastResponse = await broadcastTransaction(transaction, this.stacksNetwork);
      
      return {
        success: true,
        txId: broadcastResponse.txid,
        message: 'Payment created in smart contract'
      };
    } catch (error) {
      console.error('Error creating payment in smart contract:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Process a payment in the smart contract
   */
  async processPayment(paymentId, sbtcTxId, walletAddress, privateKey) {
    try {
      const functionArgs = [
        uintCV(paymentId),
        stringUtf8CV(sbtcTxId),
        stringUtf8CV(walletAddress)
      ];

      const txOptions = {
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        functionName: 'process-payment',
        functionArgs,
        senderKey: privateKey,
        network: this.stacksNetwork,
        fee: 1000, // 0.001 STX
        nonce: await this.getNonce(privateKey)
      };

      const transaction = await makeContractCall(txOptions);
      const broadcastResponse = await broadcastTransaction(transaction, this.stacksNetwork);
      
      return {
        success: true,
        txId: broadcastResponse.txid,
        message: 'Payment processed in smart contract'
      };
    } catch (error) {
      console.error('Error processing payment in smart contract:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get payment details from smart contract
   */
  async getPayment(paymentId) {
    try {
      const functionArgs = [uintCV(paymentId)];

      const result = await callReadOnlyFunction({
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        functionName: 'get-payment',
        functionArgs,
        network: this.stacksNetwork,
        senderAddress: this.contractAddress
      });

      return {
        success: true,
        payment: this.parsePaymentData(result)
      };
    } catch (error) {
      console.error('Error getting payment from smart contract:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get merchant balance from smart contract
   */
  async getMerchantBalance(merchantId) {
    try {
      const functionArgs = [stringUtf8CV(merchantId)];

      const result = await callReadOnlyFunction({
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        functionName: 'get-merchant-balance',
        functionArgs,
        network: this.stacksNetwork,
        senderAddress: this.contractAddress
      });

      return {
        success: true,
        balance: this.parseBalanceData(result)
      };
    } catch (error) {
      console.error('Error getting merchant balance from smart contract:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Register a new merchant in the smart contract
   */
  async registerMerchant(merchantId, name, walletAddress, privateKey) {
    try {
      const functionArgs = [
        stringUtf8CV(merchantId),
        stringUtf8CV(name),
        stringUtf8CV(walletAddress)
      ];

      const txOptions = {
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        functionName: 'register-merchant',
        functionArgs,
        senderKey: privateKey,
        network: this.stacksNetwork,
        fee: 1000, // 0.001 STX
        nonce: await this.getNonce(privateKey)
      };

      const transaction = await makeContractCall(txOptions);
      const broadcastResponse = await broadcastTransaction(transaction, this.stacksNetwork);
      
      return {
        success: true,
        txId: broadcastResponse.txid,
        message: 'Merchant registered in smart contract'
      };
    } catch (error) {
      console.error('Error registering merchant in smart contract:', error);
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
      const result = await callReadOnlyFunction({
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        functionName: 'get-contract-stats',
        functionArgs: [],
        network: this.stacksNetwork,
        senderAddress: this.contractAddress
      });

      return {
        success: true,
        stats: this.parseStatsData(result)
      };
    } catch (error) {
      console.error('Error getting contract stats:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get nonce for transaction
   */
  async getNonce(privateKey) {
    try {
      // In a real implementation, you would get the nonce from the network
      // For now, return a timestamp-based nonce
      return Math.floor(Date.now() / 1000);
    } catch (error) {
      console.error('Error getting nonce:', error);
      return Math.floor(Date.now() / 1000);
    }
  }

  /**
   * Parse payment data from contract response
   */
  parsePaymentData(contractResponse) {
    try {
      // This would parse the Clarity response into a JavaScript object
      // For now, return a mock structure
      return {
        id: 1,
        merchantId: 'merchant123',
        amount: 1000,
        currency: 'sBTC',
        description: 'Test payment',
        status: 'pending',
        createdAt: Date.now(),
        processedAt: null,
        sbtcTxId: null
      };
    } catch (error) {
      console.error('Error parsing payment data:', error);
      return null;
    }
  }

  /**
   * Parse balance data from contract response
   */
  parseBalanceData(contractResponse) {
    try {
      // This would parse the Clarity response into a JavaScript object
      return {
        sbtcBalance: 0,
        lastUpdated: Date.now()
      };
    } catch (error) {
      console.error('Error parsing balance data:', error);
      return null;
    }
  }

  /**
   * Parse stats data from contract response
   */
  parseStatsData(contractResponse) {
    try {
      return {
        totalPayments: 0,
        contractActive: true,
        contractOwner: this.contractAddress
      };
    } catch (error) {
      console.error('Error parsing stats data:', error);
      return null;
    }
  }

  /**
   * Deploy contract (for development/testing)
   */
  async deployContract(privateKey) {
    try {
      // This would deploy the contract to the network
      // For now, return a mock response
      return {
        success: true,
        txId: 'mock-deployment-tx-id',
        message: 'Contract deployment initiated (mock)',
        contractAddress: this.contractAddress
      };
    } catch (error) {
      console.error('Error deploying contract:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = SmartContractService;

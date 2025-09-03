/**
 * Stacks Account Manager
 * Implements proper Stacks account setup following documentation best practices
 * Handles account creation, key management, and security
 */

const crypto = require('crypto');
const { 
  makeRandomPrivKey, 
  privateKeyToString, 
  getAddressFromPrivateKey, 
  TransactionVersion, 
  getPublicKey,
  publicKeyToString
} = require('@stacks/transactions');
const { StacksTestnet, StacksMainnet } = require('@stacks/network');

class AccountManager {
  constructor() {
    this.networks = {
      testnet: new StacksTestnet(),
      mainnet: new StacksMainnet()
    };
    this.accounts = new Map();
  }

  /**
   * Create a new Stacks account with proper key management
   * Following Stacks documentation best practices
   * @param {string} network - 'testnet' or 'mainnet'
   * @param {string} passphrase - User's passphrase for encryption
   * @returns {Object} Account details
   */
  async createAccount(network, passphrase) {
    try {
      console.log(`Creating new Stacks account on ${network}...`);

      // Generate a new private key using Stacks Transactions library
      const privateKey = makeRandomPrivKey();
      const privateKeyString = privateKeyToString(privateKey);
      
      // Get public key from private key
      const publicKey = getPublicKey(privateKey);
      
      // Generate Stacks address from private key
      const transactionVersion = network === 'testnet' ? TransactionVersion.Testnet : TransactionVersion.Mainnet;
      const stacksAddress = getAddressFromPrivateKey(privateKeyString, transactionVersion);
      
      // Generate corresponding BTC address (for sBTC operations)
      const btcAddress = this.generateBtcAddress(publicKey);
      
      // Convert public key to hex string using official helper
      const publicKeyHex = publicKeyToString(publicKey);

      // Create wallet object for backup
      const wallet = {
        privateKey: privateKeyString,
        publicKey: publicKeyHex,
        address: stacksAddress,
        btcAddress: btcAddress,
        network: network,
        index: 0
      };

      // Create encrypted backup
      const encryptedBackup = this.encryptBackup(wallet, passphrase);

      // Store account info (in production, use secure database)
      const accountInfo = {
        id: crypto.randomUUID(),
        network,
        address: stacksAddress,
        publicKey: publicKeyHex,
        btcAddress: btcAddress,
        // Do not persist privateKey in plaintext
        encryptedBackup,
        createdAt: new Date().toISOString(),
        status: 'active'
      };

      this.accounts.set(accountInfo.id, accountInfo);

      console.log(`✅ Account created successfully: ${stacksAddress}`);
      // Remove private key logging in production
      // console.log(`🔑 Private Key: ${privateKeyString}`);
      console.log(`💰 BTC Address: ${btcAddress}`);

      return {
        success: true,
        accountId: accountInfo.id,
        address: stacksAddress,
        network: network,
        publicKey: publicKeyHex,
        btcAddress: btcAddress,
        // Do not return privateKey in responses
        backupInstructions: this.generateBackupInstructions(encryptedBackup)
      };

    } catch (error) {
      console.error('❌ Failed to create account:', error);
      throw new Error(`Account creation failed: ${error.message}`);
    }
  }

  /**
   * Import existing Stacks account
   * Following Stacks documentation best practices
   * @param {string} privateKey - Private key in hex format
   * @param {string} network - 'testnet' or 'mainnet'
   * @param {string} passphrase - Encryption passphrase
   * @returns {Object} Account details
   */
  async importAccount(privateKey, network, passphrase) {
    try {
      console.log(`Importing Stacks account on ${network}...`);

      // Validate private key format
      if (!this.isValidPrivateKey(privateKey)) {
        throw new Error('Invalid private key format');
      }

      // Get public key from private key
      const publicKey = getPublicKey(privateKey);
      
      // Generate Stacks address from private key
      const transactionVersion = network === 'testnet' ? TransactionVersion.Testnet : TransactionVersion.Mainnet;
      const stacksAddress = getAddressFromPrivateKey(privateKey, transactionVersion);
      
      // Generate corresponding BTC address
      const btcAddress = this.generateBtcAddress(publicKey);

      // Check if account already exists
      const existingAccount = Array.from(this.accounts.values())
        .find(acc => acc.address === stacksAddress && acc.network === network);

      if (existingAccount) {
        throw new Error('Account already exists');
      }

      // Create wallet object for backup
      const wallet = {
        privateKey: privateKey,
        publicKey: publicKeyToString(publicKey),
        address: stacksAddress,
        btcAddress: btcAddress,
        network: network,
        index: 0
      };

      // Create encrypted backup
      const encryptedBackup = this.encryptBackup(wallet, passphrase);

      // Store account info
      const accountInfo = {
        id: crypto.randomUUID(),
        network,
        address: stacksAddress,
        publicKey: publicKeyToString(publicKey),
        btcAddress: btcAddress,
        // Do not persist privateKey in plaintext
        encryptedBackup,
        createdAt: new Date().toISOString(),
        status: 'active',
        imported: true
      };

      this.accounts.set(accountInfo.id, accountInfo);

      console.log(`✅ Account imported successfully: ${stacksAddress}`);
      console.log(`💰 BTC Address: ${btcAddress}`);

      return {
        success: true,
        accountId: accountInfo.id,
        address: stacksAddress,
        network: network,
        publicKey: publicKeyToString(publicKey),
        btcAddress: btcAddress
      };

    } catch (error) {
      console.error('❌ Failed to import account:', error);
      throw new Error(`Account import failed: ${error.message}`);
    }
  }

  /**
   * Get account information
   * @param {string} accountId - Account ID
   * @returns {Object} Account details
   */
  getAccount(accountId) {
    const account = this.accounts.get(accountId);
    if (!account) {
      throw new Error('Account not found');
    }

    // Return safe account info (no private keys)
    return {
      id: account.id,
      network: account.network,
      address: account.address,
      publicKey: account.publicKey,
      btcAddress: account.btcAddress,
      createdAt: account.createdAt,
      status: account.status,
      imported: account.imported || false
    };
  }

  /**
   * List all accounts
   * @returns {Array} List of accounts
   */
  listAccounts() {
    return Array.from(this.accounts.values()).map(account => ({
      id: account.id,
      network: account.network,
      address: account.address,
      btcAddress: account.btcAddress,
      createdAt: account.createdAt,
      status: account.status,
      imported: account.imported || false
    }));
  }

  /**
   * Update account status
   * @param {string} accountId - Account ID
   * @param {string} status - New status
   * @returns {Object} Updated account
   */
  updateAccountStatus(accountId, status) {
    const account = this.accounts.get(accountId);
    if (!account) {
      throw new Error('Account not found');
    }

    account.status = status;
    account.updatedAt = new Date().toISOString();

    return this.getAccount(accountId);
  }

  /**
   * Delete account (for cleanup)
   * @param {string} accountId - Account ID
   * @returns {boolean} Success status
   */
  deleteAccount(accountId) {
    const account = this.accounts.get(accountId);
    if (!account) {
      throw new Error('Account not found');
    }

    this.accounts.delete(accountId);
    console.log(`✅ Account deleted: ${account.address}`);
    return true;
  }

  /**
   * Generate BTC address from public key
   * @param {Buffer} publicKey - Public key buffer
   * @returns {string} BTC address
   */
  generateBtcAddress(publicKey) {
    try {
      // This is a simplified BTC address generation
      // In production, use proper Bitcoin address generation libraries
      const hash = crypto.createHash('sha256').update(Buffer.isBuffer(publicKey) ? publicKey : Buffer.from(publicKey.data || publicKey, 'hex')).digest();
      const ripemd160 = crypto.createHash('ripemd160').update(hash).digest();
      
      // For now, return a mock BTC address format
      // In production, implement proper Base58Check encoding
      return `bc1${ripemd160.toString('hex').substring(0, 10)}`;
    } catch (error) {
      console.error('Failed to generate BTC address:', error);
      return `bc1${crypto.randomBytes(5).toString('hex')}`;
    }
  }

  /**
   * Validate private key format
   * @param {string} privateKey - Private key to validate
   * @returns {boolean} Is valid
   */
  isValidPrivateKey(privateKey) {
    // Check if it's a valid hex string with correct length
    const hexRegex = /^[0-9a-fA-F]{64}$/;
    return hexRegex.test(privateKey);
  }

  /**
   * Encrypt wallet backup
   * @param {Object} wallet - Wallet object
   * @param {string} passphrase - Encryption passphrase
   * @returns {string} Encrypted backup
   */
  encryptBackup(wallet, passphrase) {
    try {
      const backupData = JSON.stringify(wallet);
      const salt = crypto.randomBytes(16);
      const key = crypto.pbkdf2Sync(passphrase, salt, 100000, 32, 'sha256');
      const iv = crypto.randomBytes(16);
      
      // Use createCipheriv instead of createCipher (deprecated)
      const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
      let encrypted = cipher.update(backupData, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      return JSON.stringify({
        encrypted,
        salt: salt.toString('hex'),
        iv: iv.toString('hex')
      });
    } catch (error) {
      console.error('Failed to encrypt backup:', error);
      throw new Error('Backup encryption failed');
    }
  }

  /**
   * Generate backup instructions
   * @param {string} encryptedBackup - Encrypted backup data
   * @returns {Object} Backup instructions
   */
  generateBackupInstructions(encryptedBackup) {
    return {
      message: 'IMPORTANT: Save this backup securely!',
      backup: encryptedBackup,
      instructions: [
        '1. Save the encrypted backup to a secure location',
        '2. Remember your passphrase - it cannot be recovered',
        '3. Test the backup by importing it on another device',
        '4. Keep multiple copies in different locations',
        '5. Never share your private keys or passphrase'
      ],
      security: [
        'Use a strong, unique passphrase',
        'Store backup offline (not in cloud)',
        'Consider hardware wallet for large amounts',
        'Regularly test your backup recovery'
      ]
    };
  }

  /**
   * Get account statistics
   * @returns {Object} Statistics
   */
  getStats() {
    const accounts = Array.from(this.accounts.values());
    
    return {
      total: accounts.length,
      byNetwork: {
        testnet: accounts.filter(acc => acc.network === 'testnet').length,
        mainnet: accounts.filter(acc => acc.network === 'mainnet').length
      },
      byStatus: {
        active: accounts.filter(acc => acc.status === 'active').length,
        inactive: accounts.filter(acc => acc.status === 'inactive').length
      },
      imported: accounts.filter(acc => acc.imported).length,
      created: accounts.filter(acc => !acc.imported).length
    };
  }
}

module.exports = AccountManager;

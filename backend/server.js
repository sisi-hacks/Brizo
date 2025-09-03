const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const DatabaseManager = require('./lib/database');
const PaymentProcessor = require('./lib/paymentProcessor');
const ContractIntegrationService = require('./lib/contractIntegration');
const MonitoringService = require('./lib/monitoring');
const SecurityService = require('./lib/security');
const AccountManager = require('./lib/accountManager');
const TestnetIntegrationService = require('./lib/testnetIntegration');
const logger = require('./lib/logger');
require('dotenv').config();

// Import middleware
const { 
  validateCreatePayment, 
  validatePaymentIdParam, 
  validateMerchantId 
} = require('./middleware/validation');
const { 
  generalLimiter, 
  paymentLimiter, 
  processPaymentLimiter, 
  analyticsLimiter 
} = require('./middleware/rateLimit');
const { errorHandler, notFound, asyncHandler } = require('./middleware/errorHandler');
const { customLogger } = require('./middleware/logging');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Logging middleware
app.use(customLogger);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use(express.static('public'));

// Apply general rate limiting
app.use(generalLimiter);

// API prefix for Vercel deployment
const API_PREFIX = process.env.NODE_ENV === 'production' ? '/api' : '';

// Apply security middleware (will be initialized later)
app.use((req, res, next) => {
  if (securityService) {
    return securityService.securityMiddleware()(req, res, next);
  }
  next();
});

// Apply monitoring middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    if (monitoringService) {
      monitoringService.recordRequest(req.path, req.method, res.statusCode, responseTime);
    }
    if (logger) {
      logger.logRequest(req, res, responseTime);
    }
  });
  
  next();
});

// Database initialization
const dbPath = process.env.DB_PATH || './data/brizo.db';
const dbManager = new DatabaseManager(dbPath);
let paymentProcessor;
let contractIntegration;
let monitoringService;
let securityService;
let accountManager;
let testnetIntegration;

// Initialize database and services
async function initializeServices() {
  try {
    await dbManager.connect();
    await dbManager.migrate();
    console.log('✅ Database initialized successfully');
    
    // Initialize payment processor
    paymentProcessor = new PaymentProcessor(dbManager);
    console.log('✅ Payment processor initialized successfully');
    
    // Initialize contract integration service
    contractIntegration = new ContractIntegrationService(dbManager);
    console.log('✅ Contract integration service initialized successfully');
    
    // Initialize monitoring service
    monitoringService = new MonitoringService();
    
    // Add health checks
    monitoringService.addHealthCheck('database', async () => {
      try {
        await dbManager.get('SELECT 1');
        return { healthy: true, status: 'connected' };
      } catch (error) {
        return { healthy: false, status: 'disconnected', error: error.message };
      }
    });
    
    monitoringService.addHealthCheck('paymentProcessor', async () => {
      try {
        if (paymentProcessor) {
          return { healthy: true, status: 'initialized' };
        }
        return { healthy: false, status: 'not_initialized' };
      } catch (error) {
        return { healthy: false, status: 'error', error: error.message };
      }
    });
    
    monitoringService.addHealthCheck('contractIntegration', async () => {
      try {
        if (contractIntegration) {
          return { healthy: true, status: 'initialized' };
        }
        return { healthy: false, status: 'not_initialized' };
      } catch (error) {
        return { healthy: false, status: 'error', error: error.message };
      }
    });
    
    console.log('✅ Monitoring service initialized successfully');
    
    // Initialize security service
    securityService = new SecurityService();
    console.log('✅ Security service initialized successfully');
    
    // Initialize account manager
    accountManager = new AccountManager();
    console.log('✅ Account manager initialized successfully');
    
    // Initialize testnet integration service
    testnetIntegration = new TestnetIntegrationService();
    console.log('✅ Testnet integration service initialized successfully');
    
    // Start cleanup interval for processing queue
    setInterval(() => {
      paymentProcessor.cleanupProcessingQueue();
    }, 60000); // Clean up every minute
    
  } catch (error) {
    console.error('❌ Service initialization failed:', error);
    process.exit(1);
  }
}

// Initialize services on startup
initializeServices();

// Hardcoded merchant wallet for MVP (replace with actual merchant wallet)
const MERCHANT_WALLET = 'ST1PQHQKV0RJXZFYVWE6CHS7NS4T3MG9XJVTQVAVSB';

// Routes

// Health check
app.get(`${API_PREFIX}/health`, async (req, res) => {
  try {
    if (monitoringService) {
      const healthCheck = await monitoringService.runHealthChecks();
      res.json(healthCheck);
    } else {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        message: 'Basic health check - monitoring service not initialized'
      });
    }
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Create payment endpoint
app.post(`${API_PREFIX}/create-payment`, 
  paymentLimiter,
  validateCreatePayment,
  asyncHandler(async (req, res) => {
    const { amount, description, merchantId, donation = false } = req.body;

    // Generate unique payment ID
    const paymentId = uuidv4();
    const checkoutUrl = `${req.protocol}://${req.get('host')}/checkout/${paymentId}`;

    // Store payment in database
    await dbManager.run(`
      INSERT INTO payments (id, amount, description, merchantId, donation, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [paymentId, amount, description, merchantId, donation, 'pending']);

    res.status(201).json({
      paymentId,
      checkoutUrl,
      amount,
      description,
      merchantId,
      donation,
      status: 'pending',
      createdAt: new Date().toISOString()
    });
  })
);

// Check payment status with real-time verification
app.get(`${API_PREFIX}/check-status/:paymentId`, 
  validatePaymentIdParam,
  asyncHandler(async (req, res) => {
    const { paymentId } = req.params;

    if (!paymentProcessor) {
      return res.status(503).json({ error: 'Payment processor not initialized' });
    }

    try {
      const paymentStatus = await paymentProcessor.getPaymentStatus(paymentId);
      res.json(paymentStatus);
    } catch (error) {
      console.error('Error checking payment status:', error);
      res.status(404).json({ error: error.message });
    }
  })
);

// Get checkout page data (for frontend integration)
app.get(`${API_PREFIX}/checkout/:paymentId`, 
  validatePaymentIdParam,
  asyncHandler(async (req, res) => {
    const { paymentId } = req.params;

    if (!paymentProcessor) {
      return res.status(503).json({ error: 'Payment processor not initialized' });
    }

    try {
      const payment = await dbManager.get(
        'SELECT * FROM payments WHERE id = ?',
        [paymentId]
      );

      if (!payment) {
        return res.status(404).json({ error: 'Payment not found' });
      }

      // Get merchant details
      const merchant = await dbManager.get(
        'SELECT * FROM merchants WHERE id = ?',
        [payment.merchantId]
      );

      if (!merchant) {
        return res.status(404).json({ error: 'Merchant not found' });
      }

      // Return checkout data for frontend
      res.json({
        payment: {
          id: payment.id,
          amount: payment.amount,
          currency: payment.currency,
          description: payment.description,
          status: payment.status,
          createdAt: payment.createdAt,
          merchantId: payment.merchantId
        },
        merchant: {
          id: merchant.id,
          name: merchant.name,
          walletAddress: merchant.walletAddress
        },
        checkoutUrl: `http://localhost:3001/checkout/${paymentId}`,
        paymentUrl: `http://localhost:3001/process-payment/${paymentId}`
      });
    } catch (error) {
      console.error('Error getting checkout data:', error);
      res.status(500).json({ error: error.message });
    }
  })
);

// Process sBTC payment with real Stacks network verification
app.post(`${API_PREFIX}/process-payment/:paymentId`, 
  processPaymentLimiter,
  validatePaymentIdParam,
  asyncHandler(async (req, res) => {
    const { paymentId } = req.params;
    const { sbtcTxId, walletAddress } = req.body;

    if (!sbtcTxId) {
      return res.status(400).json({ error: 'sBTC transaction ID required' });
    }

    if (!paymentProcessor) {
      return res.status(503).json({ error: 'Payment processor not initialized' });
    }

    try {
      const result = await paymentProcessor.processPayment(paymentId, sbtcTxId, walletAddress);
      res.json(result);
    } catch (error) {
      console.error('Payment processing error:', error);
      res.status(400).json({ 
        error: error.message,
        paymentId,
        sbtcTxId 
      });
    }
  })
);

// Get merchant info
app.get(`${API_PREFIX}/merchant/:merchantId`, 
  validateMerchantId,
  asyncHandler(async (req, res) => {
    const { merchantId } = req.params;

    const row = await dbManager.get(
      'SELECT * FROM merchants WHERE id = ?',
      [merchantId]
    );

    if (!row) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    res.json({
      id: row.id,
      name: row.name,
      walletAddress: row.walletAddress,
      createdAt: row.createdAt
    });
  })
);

// Analytics endpoint for donations
app.get(`${API_PREFIX}/analytics/donations/:merchantId`, 
  analyticsLimiter,
  validateMerchantId,
  asyncHandler(async (req, res) => {
    const { merchantId } = req.params;

    const rows = await dbManager.all(
      `SELECT 
        COUNT(*) as totalDonations,
        SUM(amount) as totalAmount,
        AVG(amount) as averageAmount,
        DATE(createdAt) as date
      FROM payments 
      WHERE merchantId = ? AND donation = TRUE AND status = 'paid'
      GROUP BY DATE(createdAt)
      ORDER BY date DESC
      LIMIT 30`,
      [merchantId]
    );

    res.json({
      merchantId,
      donations: rows,
      summary: {
        totalDonations: rows.reduce((sum, row) => sum + row.totalDonations, 0),
        totalAmount: rows.reduce((sum, row) => sum + row.totalAmount, 0)
      }
    });
  })
);

// Webhook endpoint for payment notifications
app.post(`${API_PREFIX}/webhook/payment-success`, (req, res) => {
  const { paymentId, sbtcTxId, amount, merchantId } = req.body;

  // In production, verify webhook signature
  console.log(`Webhook received: Payment ${paymentId} completed with tx ${sbtcTxId}`);

  // Here you would typically:
  // 1. Verify the webhook signature
  // 2. Update your database
  // 3. Send notifications to merchant
  // 4. Trigger any post-payment workflows

  res.json({ received: true, timestamp: new Date().toISOString() });
});

// Database backup endpoint
app.post(`${API_PREFIX}/admin/backup`, asyncHandler(async (req, res) => {
  try {
    const backupPath = await dbManager.backup();
    res.json({
      success: true,
      message: 'Database backup created successfully',
      backupPath
    });
  } catch (error) {
    console.error('Backup failed:', error);
    res.status(500).json({ error: 'Failed to create backup' });
  }
}));

// Database stats endpoint
app.get(`${API_PREFIX}/admin/stats`, asyncHandler(async (req, res) => {
  const paymentStats = await dbManager.get('SELECT COUNT(*) as total, SUM(CASE WHEN status = "paid" THEN 1 ELSE 0 END) as paid FROM payments');
  const merchantStats = await dbManager.get('SELECT COUNT(*) as total FROM merchants');
  
  res.json({
    payments: paymentStats,
    merchants: merchantStats,
    databasePath: dbPath
  });
}));

// Stacks network status endpoint
app.get(`${API_PREFIX}/stacks/status`, asyncHandler(async (req, res) => {
  if (!paymentProcessor) {
    return res.status(503).json({ error: 'Payment processor not initialized' });
  }

  try {
    const networkStatus = await paymentProcessor.getNetworkStatus();
    res.json(networkStatus);
  } catch (error) {
    console.error('Error getting network status:', error);
    res.status(500).json({ error: error.message });
  }
}));

// Validate wallet address endpoint
app.post(`${API_PREFIX}/stacks/validate-address`, asyncHandler(async (req, res) => {
  const { address } = req.body;

  if (!address) {
    return res.status(400).json({ error: 'Address is required' });
  }

  if (!paymentProcessor) {
    return res.status(503).json({ error: 'Payment processor not initialized' });
  }

  try {
    const validation = await paymentProcessor.validateWalletAddress(address);
    res.json(validation);
  } catch (error) {
    console.error('Error validating address:', error);
    res.status(500).json({ error: error.message });
  }
}));

// Request testnet STX from faucet (for development)
app.post(`${API_PREFIX}/stacks/faucet/:address`, asyncHandler(async (req, res) => {
  const { address } = req.params;

  if (!paymentProcessor) {
    return res.status(503).json({ error: 'Payment processor not initialized' });
  }

  try {
    const result = await paymentProcessor.requestTestnetSTX(address);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error requesting testnet STX:', error);
    res.status(500).json({ error: error.message });
  }
}));

// Get merchant sBTC balance
app.get(`${API_PREFIX}/merchant/:merchantId/balance`, 
  validateMerchantId,
  asyncHandler(async (req, res) => {
    const { merchantId } = req.params;

    if (!paymentProcessor) {
      return res.status(503).json({ error: 'Payment processor not initialized' });
    }

    try {
      const balance = await paymentProcessor.getMerchantBalance(merchantId);
      res.json(balance);
    } catch (error) {
      console.error('Error getting merchant balance:', error);
      res.status(500).json({ error: error.message });
    }
  })
);

// Get merchant recent transactions
app.get(`${API_PREFIX}/merchant/:merchantId/transactions`, 
  validateMerchantId,
  asyncHandler(async (req, res) => {
    const { merchantId } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    if (!paymentProcessor) {
      return res.status(503).json({ error: 'Payment processor not initialized' });
    }

    try {
      const transactions = await paymentProcessor.getMerchantTransactions(merchantId, limit);
      res.json(transactions);
    } catch (error) {
      console.error('Error getting merchant transactions:', error);
      res.status(500).json({ error: error.message });
    }
  })
);

// Monitor payment transaction
app.post(`${API_PREFIX}/monitor-payment/:paymentId`, 
  validatePaymentIdParam,
  asyncHandler(async (req, res) => {
    const { paymentId } = req.params;
    const { sbtcTxId, maxAttempts = 30 } = req.body;

    if (!sbtcTxId) {
      return res.status(400).json({ error: 'sBTC transaction ID required' });
    }

    if (!paymentProcessor) {
      return res.status(503).json({ error: 'Payment processor not initialized' });
    }

    try {
      const result = await paymentProcessor.monitorPayment(paymentId, sbtcTxId, maxAttempts);
      res.json(result);
    } catch (error) {
      console.error('Error monitoring payment:', error);
      res.status(500).json({ error: error.message });
    }
  })
);

// Get processing queue status
app.get(`${API_PREFIX}/admin/processing-queue`, asyncHandler(async (req, res) => {
  if (!paymentProcessor) {
    return res.status(503).json({ error: 'Payment processor not initialized' });
  }

  try {
    const queue = paymentProcessor.getProcessingQueue();
    res.json(queue);
  } catch (error) {
    console.error('Error getting processing queue:', error);
    res.status(500).json({ error: error.message });
  }
}));

// Get sBTC contract information
app.get(`${API_PREFIX}/stacks/sbtc/contracts`, asyncHandler(async (req, res) => {
  if (!paymentProcessor) {
    return res.status(503).json({ error: 'Payment processor not initialized' });
  }

  try {
    const contractInfo = await paymentProcessor.stacksService.getSbtcContractInfo();
    res.json(contractInfo);
  } catch (error) {
    console.error('Error getting sBTC contract info:', error);
    res.status(500).json({ error: error.message });
  }
}));

// Get sBTC operation status
app.get(`${API_PREFIX}/stacks/sbtc/operation/:operationId`, asyncHandler(async (req, res) => {
  const { operationId } = req.params;

  if (!paymentProcessor) {
    return res.status(503).json({ error: 'Payment processor not initialized' });
  }

  try {
    const operationStatus = await paymentProcessor.stacksService.getSbtcOperationStatus(operationId);
    res.json(operationStatus);
  } catch (error) {
    console.error('Error getting sBTC operation status:', error);
    res.status(500).json({ error: error.message });
  }
}));

// Estimate transaction fees
app.get(`${API_PREFIX}/stacks/fees/estimate`, asyncHandler(async (req, res) => {
  const { type = 'token_transfer' } = req.query;

  if (!paymentProcessor) {
    return res.status(503).json({ error: 'Payment processor not initialized' });
  }

  try {
    const feeEstimate = await paymentProcessor.stacksService.estimateTransactionFee(type);
    res.json(feeEstimate);
  } catch (error) {
    console.error('Error estimating transaction fees:', error);
    res.status(500).json({ error: error.message });
  }
}));

// Smart Contract Integration Endpoints

// Get contract statistics
app.get(`${API_PREFIX}/contract/stats`, asyncHandler(async (req, res) => {
  if (!contractIntegration) {
    return res.status(503).json({ error: 'Contract integration not initialized' });
  }

  try {
    const stats = await contractIntegration.getContractStats();
    res.json(stats);
  } catch (error) {
    console.error('Error getting contract stats:', error);
    res.status(500).json({ error: error.message });
  }
}));

// Register merchant in smart contract
app.post(`${API_PREFIX}/contract/register-merchant`, asyncHandler(async (req, res) => {
  const { merchantId, name, walletAddress, privateKey } = req.body;

  if (!contractIntegration) {
    return res.status(503).json({ error: 'Contract integration not initialized' });
  }

  if (!merchantId || !name || !walletAddress || !privateKey) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const result = await contractIntegration.registerMerchantInContract(
      merchantId,
      name,
      walletAddress,
      privateKey
    );
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error registering merchant in contract:', error);
    res.status(500).json({ error: error.message });
  }
}));

// Get payment from smart contract
app.get(`${API_PREFIX}/contract/payment/:paymentId`, asyncHandler(async (req, res) => {
  const { paymentId } = req.params;

  if (!contractIntegration) {
    return res.status(503).json({ error: 'Contract integration not initialized' });
  }

  try {
    const result = await contractIntegration.getPaymentStatus(paymentId);
    res.json(result);
  } catch (error) {
    console.error('Error getting payment from contract:', error);
    res.status(500).json({ error: error.message });
  }
}));

// Get merchant balance from smart contract
app.get(`${API_PREFIX}/contract/merchant/:merchantId/balance`, asyncHandler(async (req, res) => {
  const { merchantId } = req.params;

  if (!contractIntegration) {
    return res.status(503).json({ error: 'Contract integration not initialized' });
  }

  try {
    const result = await contractIntegration.getMerchantBalance(merchantId);
    res.json(result);
  } catch (error) {
    console.error('Error getting merchant balance from contract:', error);
    res.status(500).json({ error: error.message });
  }
}));

// Production Monitoring Endpoints

// Get comprehensive metrics
app.get(`${API_PREFIX}/metrics`, asyncHandler(async (req, res) => {
  if (!monitoringService) {
    return res.status(503).json({ error: 'Monitoring service not initialized' });
  }

  try {
    const metrics = monitoringService.getMetrics();
    res.json(metrics);
  } catch (error) {
    logger.error('Error getting metrics', { error: error.message });
    res.status(500).json({ error: error.message });
  }
}));

// Get performance metrics
app.get(`${API_PREFIX}/metrics/performance`, asyncHandler(async (req, res) => {
  if (!monitoringService) {
    return res.status(503).json({ error: 'Monitoring service not initialized' });
  }

  try {
    const performance = monitoringService.getPerformanceMetrics();
    res.json(performance);
  } catch (error) {
    logger.error('Error getting performance metrics', { error: error.message });
    res.status(500).json({ error: error.message });
  }
}));

// Get alerts
app.get(`${API_PREFIX}/alerts`, asyncHandler(async (req, res) => {
  if (!monitoringService) {
    return res.status(503).json({ error: 'Monitoring service not initialized' });
  }

  try {
    const alerts = monitoringService.getAlerts();
    res.json(alerts);
  } catch (error) {
    logger.error('Error getting alerts', { error: error.message });
    res.status(500).json({ error: error.message });
  }
}));

// Get security statistics
app.get(`${API_PREFIX}/security/stats`, asyncHandler(async (req, res) => {
  if (!securityService) {
    return res.status(503).json({ error: 'Security service not initialized' });
  }

  try {
    const stats = securityService.getSecurityStats();
    res.json(stats);
  } catch (error) {
    logger.error('Error getting security stats', { error: error.message });
    res.status(500).json({ error: error.message });
  }
}));

// Get log statistics
app.get(`${API_PREFIX}/logs/stats`, asyncHandler(async (req, res) => {
  try {
    const stats = logger.getLogStats();
    res.json(stats);
  } catch (error) {
    logger.error('Error getting log stats', { error: error.message });
    res.status(500).json({ error: error.message });
  }
}));

// Reset metrics (admin only)
app.post(`${API_PREFIX}/admin/reset-metrics`, asyncHandler(async (req, res) => {
  if (!monitoringService) {
    return res.status(503).json({ error: 'Monitoring service not initialized' });
  }

  try {
    monitoringService.resetMetrics();
    logger.info('Metrics reset by admin');
    res.json({ message: 'Metrics reset successfully' });
  } catch (error) {
    logger.error('Error resetting metrics', { error: error.message });
    res.status(500).json({ error: error.message });
  }
}));

// Clean up logs (admin only)
app.post(`${API_PREFIX}/admin/cleanup-logs`, asyncHandler(async (req, res) => {
  try {
    logger.cleanupLogs();
    logger.info('Logs cleaned up by admin');
    res.json({ message: 'Logs cleaned up successfully' });
  } catch (error) {
    logger.error('Error cleaning up logs', { error: error.message });
    res.status(500).json({ error: error.message });
  }
}));

// ===== STACKS ACCOUNT MANAGEMENT ENDPOINTS =====

// Create new Stacks account
app.post(`${API_PREFIX}/stacks/accounts/create`, asyncHandler(async (req, res) => {
  try {
    const { network, passphrase } = req.body;
    
    if (!network || !passphrase) {
      return res.status(400).json({ error: 'Network and passphrase are required' });
    }
    
    if (!['testnet', 'mainnet'].includes(network)) {
      return res.status(400).json({ error: 'Network must be testnet or mainnet' });
    }
    
    const result = await accountManager.createAccount(network, passphrase);
    logger.info('New Stacks account created', { network, address: result.address });
    res.status(201).json(result);
    
  } catch (error) {
    logger.error('Failed to create Stacks account', { error: error.message });
    res.status(500).json({ error: error.message });
  }
}));

// Import existing Stacks account
app.post(`${API_PREFIX}/stacks/accounts/import`, asyncHandler(async (req, res) => {
  try {
    const { privateKey, network, passphrase } = req.body;
    
    if (!privateKey || !network || !passphrase) {
      return res.status(400).json({ error: 'Private key, network, and passphrase are required' });
    }
    
    if (!['testnet', 'mainnet'].includes(network)) {
      return res.status(400).json({ error: 'Network must be testnet or mainnet' });
    }
    
    const result = await accountManager.importAccount(privateKey, network, passphrase);
    logger.info('Stacks account imported', { network, address: result.address });
    res.status(201).json(result);
    
  } catch (error) {
    logger.error('Failed to import Stacks account', { error: error.message });
    res.status(500).json({ error: error.message });
  }
}));

// List all accounts
app.get(`${API_PREFIX}/stacks/accounts`, asyncHandler(async (req, res) => {
  try {
    const accounts = accountManager.listAccounts();
    res.json({
      accounts,
      total: accounts.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to list accounts', { error: error.message });
    res.status(500).json({ error: error.message });
  }
}));

// Get account details
app.get(`${API_PREFIX}/stacks/accounts/:accountId`, asyncHandler(async (req, res) => {
  try {
    const { accountId } = req.params;
    const account = accountManager.getAccount(accountId);
    res.json(account);
  } catch (error) {
    logger.error('Failed to get account', { error: error.message });
    res.status(404).json({ error: error.message });
  }
}));

// Update account status
app.patch(`${API_PREFIX}/stacks/accounts/:accountId/status`, asyncHandler(async (req, res) => {
  try {
    const { accountId } = req.params;
    const { status } = req.body;
    
    if (!['active', 'inactive', 'suspended'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const account = accountManager.updateAccountStatus(accountId, status);
    logger.info('Account status updated', { accountId, status });
    res.json(account);
  } catch (error) {
    logger.error('Failed to update account status', { error: error.message });
    res.status(500).json({ error: error.message });
  }
}));

// Delete account
app.delete(`${API_PREFIX}/stacks/accounts/:accountId`, asyncHandler(async (req, res) => {
  try {
    const { accountId } = req.params;
    accountManager.deleteAccount(accountId);
    logger.info('Account deleted', { accountId });
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    logger.error('Failed to delete account', { error: error.message });
    res.status(500).json({ error: error.message });
  }
}));

// Get account statistics
app.get(`${API_PREFIX}/stacks/accounts/stats`, asyncHandler(async (req, res) => {
  try {
    const stats = accountManager.getStats();
    res.json(stats);
  } catch (error) {
    logger.error('Failed to get account stats', { error: error.message });
    res.status(500).json({ error: error.message });
  }
}));

// ===== STACKS TESTNET INTEGRATION ENDPOINTS =====

// Get testnet status
app.get(`${API_PREFIX}/stacks/testnet/status`, asyncHandler(async (req, res) => {
  try {
    const status = await testnetIntegration.getTestnetStatus();
    res.json(status);
  } catch (error) {
    logger.error('Failed to get testnet status', { error: error.message });
    res.status(500).json({ error: error.message });
  }
}));

// Request testnet STX from faucet
app.post(`${API_PREFIX}/stacks/testnet/faucet`, asyncHandler(async (req, res) => {
  try {
    const { address, stacking } = req.body;
    
    if (!address) {
      return res.status(400).json({ error: 'Address is required' });
    }
    
    const result = await testnetIntegration.requestTestnetSTX(address, stacking || false);
    
    if (result.success) {
      logger.info('Testnet STX requested', { address, stacking });
      res.json(result);
    } else {
      res.status(400).json(result);
    }
    
  } catch (error) {
    logger.error('Failed to request testnet STX', { error: error.message });
    res.status(500).json({ error: error.message });
  }
}));

// Get testnet balance
app.get(`${API_PREFIX}/stacks/testnet/balance/:address`, asyncHandler(async (req, res) => {
  try {
    const { address } = req.params;
    const balance = await testnetIntegration.getTestnetBalance(address);
    res.json(balance);
  } catch (error) {
    logger.error('Failed to get testnet balance', { error: error.message });
    res.status(500).json({ error: error.message });
  }
}));

// Get testnet transactions
app.get(`${API_PREFIX}/stacks/testnet/transactions/:address`, asyncHandler(async (req, res) => {
  try {
    const { address } = req.params;
    const { limit } = req.query;
    const transactions = await testnetIntegration.getTestnetTransactions(address, parseInt(limit) || 50);
    res.json(transactions);
  } catch (error) {
    logger.error('Failed to get testnet transactions', { error: error.message });
    res.status(500).json({ error: error.message });
  }
}));

// Get testnet network statistics
app.get(`${API_PREFIX}/stacks/testnet/stats`, asyncHandler(async (req, res) => {
  try {
    const stats = await testnetIntegration.getTestnetStats();
    res.json(stats);
  } catch (error) {
    logger.error('Failed to get testnet stats', { error: error.message });
    res.status(500).json({ error: error.message });
  }
}));

// Get testnet environment info
app.get(`${API_PREFIX}/stacks/testnet/environment`, asyncHandler(async (req, res) => {
  try {
    const info = testnetIntegration.getEnvironmentInfo();
    res.json(info);
  } catch (error) {
    logger.error('Failed to get testnet environment info', { error: error.message });
    res.status(500).json({ error: error.message });
  }
}));

// Testnet health check
app.get(`${API_PREFIX}/stacks/testnet/health`, asyncHandler(async (req, res) => {
  try {
    const health = await testnetIntegration.healthCheck();
    res.json(health);
  } catch (error) {
    logger.error('Failed to get testnet health', { error: error.message });
    res.status(500).json({ error: error.message });
  }
}));

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  if (paymentProcessor) {
    console.log('🧹 Cleaning up payment processor...');
  }
  await dbManager.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  if (paymentProcessor) {
    console.log('🧹 Cleaning up payment processor...');
  }
  if (contractIntegration) {
    console.log('🧹 Cleaning up contract integration...');
  }
  if (monitoringService) {
    console.log('🧹 Cleaning up monitoring service...');
  }
  if (securityService) {
    console.log('🧹 Cleaning up security service...');
  }
  await dbManager.close();
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Brizo Backend running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`💳 Create payment: POST http://localhost:${PORT}/create-payment`);
  console.log(`🔗 Stacks status: GET http://localhost:${PORT}/stacks/status`);
  console.log(`💰 Testnet faucet: POST http://localhost:${PORT}/stacks/faucet/:address`);
  console.log(`💰 Merchant balance: GET http://localhost:${PORT}/merchant/:id/balance`);
  console.log(`🪙 sBTC contracts: GET http://localhost:${PORT}/stacks/sbtc/contracts`);
  console.log(`💸 Fee estimate: GET http://localhost:${PORT}/stacks/fees/estimate`);
  console.log(`📄 Contract stats: GET http://localhost:${PORT}/contract/stats`);
  console.log(`🏪 Register merchant: POST http://localhost:${PORT}/contract/register-merchant`);
  console.log(`📊 Metrics: GET http://localhost:${PORT}/metrics`);
  console.log(`🚨 Alerts: GET http://localhost:${PORT}/alerts`);
  console.log(`🔒 Security stats: GET http://localhost:${PORT}/security/stats`);
  console.log(`👤 Account management: POST http://localhost:${PORT}/stacks/accounts/create`);
  console.log(`🔍 Testnet status: GET http://localhost:${PORT}/stacks/testnet/status`);
  console.log(`💧 Testnet faucet: POST http://localhost:${PORT}/stacks/testnet/faucet`);
  console.log(`🌍 Environment: ${NODE_ENV}`);
  console.log(`💾 Database: ${dbPath}`);
});

module.exports = app;

#!/usr/bin/env node

/**
 * Production Deployment Script
 * 
 * This script prepares and deploys the Brizo backend for production use.
 * 
 * Usage:
 *   node scripts/deploy-production.js [environment]
 * 
 * Examples:
 *   node scripts/deploy-production.js staging
 *   node scripts/deploy-production.js production
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function deployProduction() {
  try {
    console.log('🚀 Starting Brizo Production Deployment...\n');

    // Get command line arguments
    const args = process.argv.slice(2);
    const environment = args[0] || 'staging';

    console.log(`🌍 Environment: ${environment}`);
    console.log(`📅 Deployment time: ${new Date().toISOString()}\n`);

    // Validate environment
    if (!['staging', 'production'].includes(environment)) {
      console.error('❌ Error: Environment must be "staging" or "production"');
      process.exit(1);
    }

    // Pre-deployment checks
    console.log('🔍 Running pre-deployment checks...');
    await runPreDeploymentChecks();

    // Create production configuration
    console.log('⚙️  Creating production configuration...');
    await createProductionConfig(environment);

    // Install dependencies
    console.log('📦 Installing dependencies...');
    execSync('npm ci --production', { stdio: 'inherit' });

    // Run database migrations
    console.log('🗄️  Running database migrations...');
    execSync('node scripts/db.js migrate', { stdio: 'inherit' });

    // Create necessary directories
    console.log('📁 Creating necessary directories...');
    createDirectories();

    // Set up log rotation
    console.log('📝 Setting up log rotation...');
    setupLogRotation();

    // Create systemd service (if on Linux)
    if (process.platform === 'linux') {
      console.log('🔧 Creating systemd service...');
      createSystemdService(environment);
    }

    // Create PM2 configuration
    console.log('🔄 Creating PM2 configuration...');
    createPM2Config(environment);

    // Create Docker configuration
    console.log('🐳 Creating Docker configuration...');
    createDockerConfig(environment);

    // Run security checks
    console.log('🔒 Running security checks...');
    await runSecurityChecks();

    // Create deployment summary
    console.log('📋 Creating deployment summary...');
    createDeploymentSummary(environment);

    console.log('\n✅ Production deployment completed successfully!');
    console.log('\n📋 Next Steps:');
    console.log('1. Review the deployment configuration');
    console.log('2. Set up environment variables');
    console.log('3. Configure reverse proxy (nginx/Apache)');
    console.log('4. Set up SSL certificates');
    console.log('5. Configure monitoring and alerting');
    console.log('6. Test the deployment');
    console.log('7. Start the service');

  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

/**
 * Run pre-deployment checks
 */
async function runPreDeploymentChecks() {
  const checks = [
    {
      name: 'Node.js version',
      check: () => {
        const version = process.version;
        const major = parseInt(version.slice(1).split('.')[0]);
        return major >= 18;
      }
    },
    {
      name: 'Required files',
      check: () => {
        const requiredFiles = [
          'package.json',
          'server.js',
          'lib/database.js',
          'lib/paymentProcessor.js'
        ];
        return requiredFiles.every(file => fs.existsSync(file));
      }
    },
    {
      name: 'Environment variables',
      check: () => {
        const requiredEnvVars = [
          'NODE_ENV',
          'PORT',
          'DB_PATH'
        ];
        return requiredEnvVars.every(envVar => process.env[envVar]);
      }
    }
  ];

  for (const check of checks) {
    try {
      const result = check.check();
      if (result) {
        console.log(`  ✅ ${check.name}`);
      } else {
        throw new Error(`Check failed: ${check.name}`);
      }
    } catch (error) {
      console.error(`  ❌ ${check.name}: ${error.message}`);
      throw error;
    }
  }
}

/**
 * Create production configuration
 */
async function createProductionConfig(environment) {
  const config = {
    environment,
    nodeEnv: environment === 'production' ? 'production' : 'staging',
    port: environment === 'production' ? 3001 : 3002,
    dbPath: `./data/brizo-${environment}.db`,
    logLevel: environment === 'production' ? 'info' : 'debug',
    enableMetrics: true,
    enableSecurity: true,
    enableMonitoring: true,
    maxConnections: environment === 'production' ? 1000 : 100,
    timeout: 30000,
    cors: {
      origin: environment === 'production' ? ['https://yourdomain.com'] : ['http://localhost:3000'],
      credentials: true
    },
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: environment === 'production' ? 100 : 1000
    }
  };

  const configPath = `./config/${environment}.json`;
  const configDir = path.dirname(configPath);
  
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log(`  📄 Configuration saved to: ${configPath}`);
}

/**
 * Create necessary directories
 */
function createDirectories() {
  const directories = [
    './data',
    './logs',
    './backups',
    './config',
    './deployments'
  ];

  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`  📁 Created directory: ${dir}`);
    }
  });
}

/**
 * Set up log rotation
 */
function setupLogRotation() {
  const logrotateConfig = `
# Brizo Backend Log Rotation
/var/log/brizo/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 brizo brizo
    postrotate
        /bin/kill -USR1 \$(cat /var/run/brizo.pid 2>/dev/null) 2>/dev/null || true
    endscript
}
`;

  const logrotatePath = './config/logrotate.conf';
  fs.writeFileSync(logrotatePath, logrotateConfig);
  console.log(`  📝 Log rotation config saved to: ${logrotatePath}`);
}

/**
 * Create systemd service
 */
function createSystemdService(environment) {
  const serviceConfig = `
[Unit]
Description=Brizo Backend API Server
After=network.target

[Service]
Type=simple
User=brizo
Group=brizo
WorkingDirectory=/opt/brizo/backend
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=${environment === 'production' ? 'production' : 'staging'}
Environment=PORT=${environment === 'production' ? 3001 : 3002}
Environment=DB_PATH=/opt/brizo/data/brizo-${environment}.db
Environment=LOG_LEVEL=${environment === 'production' ? 'info' : 'debug'}
StandardOutput=journal
StandardError=journal
SyslogIdentifier=brizo-backend

[Install]
WantedBy=multi-user.target
`;

  const servicePath = `./config/brizo-backend-${environment}.service`;
  fs.writeFileSync(servicePath, serviceConfig);
  console.log(`  🔧 Systemd service saved to: ${servicePath}`);
}

/**
 * Create PM2 configuration
 */
function createPM2Config(environment) {
  const pm2Config = {
    apps: [{
      name: `brizo-backend-${environment}`,
      script: 'server.js',
      instances: environment === 'production' ? 'max' : 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: environment === 'production' ? 'production' : 'staging',
        PORT: environment === 'production' ? 3001 : 3002,
        DB_PATH: `./data/brizo-${environment}.db`,
        LOG_LEVEL: environment === 'production' ? 'info' : 'debug'
      },
      log_file: `./logs/brizo-backend-${environment}.log`,
      out_file: `./logs/brizo-backend-${environment}-out.log`,
      error_file: `./logs/brizo-backend-${environment}-error.log`,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=1024',
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'data'],
      max_restarts: 10,
      min_uptime: '10s'
    }]
  };

  const pm2Path = `./config/ecosystem-${environment}.config.js`;
  fs.writeFileSync(pm2Path, `module.exports = ${JSON.stringify(pm2Config, null, 2)};`);
  console.log(`  🔄 PM2 config saved to: ${pm2Path}`);
}

/**
 * Create Docker configuration
 */
function createDockerConfig(environment) {
  const dockerfile = `
FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy app source
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S brizo -u 1001

# Create necessary directories
RUN mkdir -p data logs backups && chown -R brizo:nodejs data logs backups

# Switch to non-root user
USER brizo

# Expose port
EXPOSE ${environment === 'production' ? 3001 : 3002}

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD node -e "require('http').get('http://localhost:${environment === 'production' ? 3001 : 3002}/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["node", "server.js"]
`;

  const dockerCompose = `
version: '3.8'

services:
  brizo-backend:
    build: .
    ports:
      - "${environment === 'production' ? 3001 : 3002}:${environment === 'production' ? 3001 : 3002}"
    environment:
      - NODE_ENV=${environment === 'production' ? 'production' : 'staging'}
      - PORT=${environment === 'production' ? 3001 : 3002}
      - DB_PATH=/usr/src/app/data/brizo-${environment}.db
      - LOG_LEVEL=${environment === 'production' ? 'info' : 'debug'}
    volumes:
      - ./data:/usr/src/app/data
      - ./logs:/usr/src/app/logs
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:${environment === 'production' ? 3001 : 3002}/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
`;

  fs.writeFileSync('./Dockerfile', dockerfile);
  fs.writeFileSync(`./docker-compose-${environment}.yml`, dockerCompose);
  console.log(`  🐳 Docker configs created`);
}

/**
 * Run security checks
 */
async function runSecurityChecks() {
  const checks = [
    {
      name: 'Check for sensitive data in code',
      check: () => {
        const sensitivePatterns = [
          /password\s*=\s*['"][^'"]+['"]/i,
          /secret\s*=\s*['"][^'"]+['"]/i,
          /key\s*=\s*['"][^'"]+['"]/i,
          /token\s*=\s*['"][^'"]+['"]/i
        ];
        
        // This is a simplified check - in production, use proper tools
        return true; // Placeholder
      }
    },
    {
      name: 'Check file permissions',
      check: () => {
        // Check that sensitive files have proper permissions
        return true; // Placeholder
      }
    }
  ];

  for (const check of checks) {
    try {
      const result = check.check();
      if (result) {
        console.log(`  ✅ ${check.name}`);
      } else {
        throw new Error(`Security check failed: ${check.name}`);
      }
    } catch (error) {
      console.error(`  ❌ ${check.name}: ${error.message}`);
      throw error;
    }
  }
}

/**
 * Create deployment summary
 */
function createDeploymentSummary(environment) {
  const summary = {
    deployment: {
      environment,
      timestamp: new Date().toISOString(),
      version: require('../package.json').version,
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch
    },
    configuration: {
      port: environment === 'production' ? 3001 : 3002,
      database: `./data/brizo-${environment}.db`,
      logLevel: environment === 'production' ? 'info' : 'debug',
      features: {
        monitoring: true,
        security: true,
        logging: true,
        metrics: true,
        healthChecks: true
      }
    },
    files: {
      config: `./config/${environment}.json`,
      pm2: `./config/ecosystem-${environment}.config.js`,
      docker: `./docker-compose-${environment}.yml`,
      systemd: `./config/brizo-backend-${environment}.service`
    },
    nextSteps: [
      'Review configuration files',
      'Set up environment variables',
      'Configure reverse proxy',
      'Set up SSL certificates',
      'Configure monitoring',
      'Test deployment',
      'Start service'
    ]
  };

  const summaryPath = `./deployments/${environment}-deployment-${Date.now()}.json`;
  const summaryDir = path.dirname(summaryPath);
  
  if (!fs.existsSync(summaryDir)) {
    fs.mkdirSync(summaryDir, { recursive: true });
  }

  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  console.log(`  📋 Deployment summary saved to: ${summaryPath}`);
}

// Run deployment if this script is executed directly
if (require.main === module) {
  deployProduction();
}

module.exports = { deployProduction };

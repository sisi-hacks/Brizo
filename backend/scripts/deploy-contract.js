#!/usr/bin/env node

/**
 * Brizo Smart Contract Deployment Script
 * 
 * This script deploys the Brizo payment system smart contract to the Stacks network.
 * 
 * Usage:
 *   node scripts/deploy-contract.js [network] [private-key]
 * 
 * Examples:
 *   node scripts/deploy-contract.js testnet
 *   node scripts/deploy-contract.js mainnet 0x1234...
 */

const fs = require('fs');
const path = require('path');
const SmartContractService = require('../lib/smartContract');

async function deployContract() {
  try {
    console.log('🚀 Starting Brizo Smart Contract Deployment...\n');

    // Get command line arguments
    const args = process.argv.slice(2);
    const network = args[0] || 'testnet';
    const privateKey = args[1] || process.env.STACKS_PRIVATE_KEY;

    if (!privateKey) {
      console.error('❌ Error: Private key is required');
      console.log('Usage: node scripts/deploy-contract.js [network] [private-key]');
      console.log('Or set STACKS_PRIVATE_KEY environment variable');
      process.exit(1);
    }

    console.log(`📡 Network: ${network}`);
    console.log(`🔑 Private Key: ${privateKey.substring(0, 10)}...`);

    // Read contract files
    const contractPath = path.join(__dirname, '../contracts/brizo-payments.clar');
    const traitPath = path.join(__dirname, '../contracts/brizo-trait.clar');

    if (!fs.existsSync(contractPath)) {
      console.error('❌ Error: Contract file not found at', contractPath);
      process.exit(1);
    }

    if (!fs.existsSync(traitPath)) {
      console.error('❌ Error: Trait file not found at', traitPath);
      process.exit(1);
    }

    const contractCode = fs.readFileSync(contractPath, 'utf8');
    const traitCode = fs.readFileSync(traitPath, 'utf8');

    console.log('📄 Contract files loaded successfully');
    console.log(`📊 Contract size: ${contractCode.length} characters`);
    console.log(`📊 Trait size: ${traitCode.length} characters\n`);

    // Initialize smart contract service
    const contractService = new SmartContractService();

    // Deploy contract
    console.log('🔄 Deploying contract to network...');
    const deploymentResult = await contractService.deployContract(privateKey);

    if (deploymentResult.success) {
      console.log('✅ Contract deployed successfully!');
      console.log(`📄 Transaction ID: ${deploymentResult.txId}`);
      console.log(`📍 Contract Address: ${deploymentResult.contractAddress}`);
      console.log(`🔗 Network: ${network}`);
      
      // Save deployment info
      const deploymentInfo = {
        network,
        contractAddress: deploymentResult.contractAddress,
        txId: deploymentResult.txId,
        deployedAt: new Date().toISOString(),
        contractName: 'brizo-payments',
        traitName: 'brizo-payments-trait'
      };

      const deploymentPath = path.join(__dirname, '../deployments', `${network}-deployment.json`);
      const deploymentDir = path.dirname(deploymentPath);
      
      if (!fs.existsSync(deploymentDir)) {
        fs.mkdirSync(deploymentDir, { recursive: true });
      }

      fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
      console.log(`💾 Deployment info saved to: ${deploymentPath}`);

      // Test contract functions
      console.log('\n🧪 Testing contract functions...');
      
      // Get contract stats
      const statsResult = await contractService.getContractStats();
      if (statsResult.success) {
        console.log('✅ Contract stats retrieved:', statsResult.stats);
      } else {
        console.log('⚠️  Contract stats test failed:', statsResult.error);
      }

      console.log('\n🎉 Deployment completed successfully!');
      console.log('\n📋 Next Steps:');
      console.log('1. Update your .env file with the contract address');
      console.log('2. Register merchants using the contract');
      console.log('3. Test payment creation and processing');
      console.log('4. Integrate with your frontend application');

    } else {
      console.error('❌ Contract deployment failed:', deploymentResult.error);
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Deployment error:', error);
    process.exit(1);
  }
}

// Run deployment if this script is executed directly
if (require.main === module) {
  deployContract();
}

module.exports = { deployContract };

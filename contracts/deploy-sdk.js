#!/usr/bin/env node

const { Clarinet } = require('@hirosystems/clarinet-sdk');
const { StacksTestnet } = require('@stacks/network');
const { makeSTXTokenTransfer } = require('@stacks/transactions');
const fs = require('fs');

// Configuration
const PRIVATE_KEY = process.env.STX_PRIVATE_KEY || '';
const ADDRESS = process.env.STX_ADDRESS || '';

// Contract files to deploy
const CONTRACTS = [
  { name: 'brizo-trait', file: 'brizo-trait.clar' },
  { name: 'brizo-payments', file: 'brizo-payments.clar' },
  { name: 'brizo-sbtc-integration', file: 'brizo-sbtc-integration.clar' },
  { name: 'deploy', file: 'deploy.clar' }
];

async function deployContracts() {
  console.log('🚀 Brizo Smart Contract Deployment using Clarinet JS SDK');
  console.log('========================================================');
  console.log(`Network: Stacks Testnet`);
  console.log(`Address: ${ADDRESS}`);
  console.log(`Contracts: ${CONTRACTS.length}`);
  console.log('');

  try {
    // Initialize Clarinet
    const clarinet = new Clarinet();
    
    // Check contracts
    console.log('📋 Checking contracts...');
    const checkResult = await clarinet.check();
    
    if (checkResult.success) {
      console.log('✅ All contracts passed validation');
    } else {
      console.log('❌ Contract validation failed:', checkResult.errors);
      return;
    }

    // Deploy to testnet
    console.log('🌐 Deploying to testnet...');
    
    for (const contract of CONTRACTS) {
      console.log(`📦 Deploying ${contract.name}...`);
      
      // Read contract source
      const source = fs.readFileSync(contract.file, 'utf8');
      
      // Deploy contract
      const deployResult = await clarinet.deploy({
        contractName: contract.name,
        contractSource: source,
        network: 'testnet',
        fee: 6000,
        nonce: 0
      });
      
      if (deployResult.success) {
        console.log(`✅ ${contract.name} deployed successfully!`);
        console.log(`   Transaction ID: ${deployResult.txid}`);
        console.log(`   Contract Address: ${ADDRESS}.${contract.name}`);
      } else {
        console.log(`❌ ${contract.name} deployment failed:`, deployResult.error);
      }
      console.log('');
    }

    console.log('🎉 Deployment complete!');
    console.log('📋 Next steps:');
    console.log('   1. Update frontend/lib/contracts.ts with deployed addresses');
    console.log('   2. Test contract functions on testnet');
    console.log('   3. Deploy to mainnet when ready');
    console.log('');
    console.log('🔗 View on Explorer: https://explorer.hiro.so/');

  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    console.log('');
    console.log('💡 Troubleshooting:');
    console.log('   - Check your testnet STX balance');
    console.log('   - Verify network connectivity');
    console.log('   - Check contract syntax');
  }
}

deployContracts();

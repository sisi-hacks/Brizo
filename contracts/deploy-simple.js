#!/usr/bin/env node

const fs = require('fs');

// Configuration
const PRIVATE_KEY = '2ada55bf9aeb119a2f3c7d0d9b8f2a54a52d178d706337a1623b1df1d2a31aa8';
const ADDRESS = 'STWK85PM6VAZGQP3MWGMRTH8AYBBSAR0YST91KFE';

// Contract files to deploy
const CONTRACTS = [
  { name: 'brizo-trait', file: 'brizo-trait.clar' },
  { name: 'brizo-payments', file: 'brizo-payments.clar' },
  { name: 'brizo-sbtc-integration', file: 'brizo-sbtc-integration.clar' },
  { name: 'deploy', file: 'deploy.clar' }
];

async function deployContracts() {
  console.log('🚀 Brizo Smart Contract Deployment');
  console.log('==================================');
  console.log(`Network: Stacks Testnet`);
  console.log(`Address: ${ADDRESS}`);
  console.log(`Contracts: ${CONTRACTS.length}`);
  console.log('');

  try {
    // Check contracts exist
    console.log('📋 Checking contract files...');
    for (const contract of CONTRACTS) {
      if (fs.existsSync(contract.file)) {
        const stats = fs.statSync(contract.file);
        console.log(`✅ ${contract.name}: ${stats.size} bytes`);
      } else {
        console.log(`❌ ${contract.name}: File not found`);
        return;
      }
    }

    console.log('');
    console.log('🌐 Ready for deployment!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('   1. Use Clarinet CLI: clarinet deployments apply --testnet');
    console.log('   2. Or use Stacks CLI with testnet configuration');
    console.log('   3. Update frontend with deployed addresses');
    console.log('');
    console.log('💡 Since the tools had issues, you can also:');
    console.log('   - Deploy manually via Hiro Explorer');
    console.log('   - Use the Stacks web wallet');
    console.log('   - Contact Hiro support for assistance');
    console.log('');
    console.log('🔗 Useful Links:');
    console.log('   - Testnet Explorer: https://explorer.hiro.so/');
    console.log('   - Hiro Wallet: https://wallet.hiro.so/');
    console.log('   - Testnet Faucet: https://faucet.hiro.so/');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

deployContracts();

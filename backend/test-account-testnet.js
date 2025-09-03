/**
 * Test Script for Stacks Account Management and Testnet Integration
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';
const API_PREFIX = process.env.NODE_ENV === 'production' ? '/api' : '';

async function testAccountManagement() {
  console.log('👤 Testing Account Management...\n');
  
  try {
    // Create testnet account
    const createResponse = await axios.post(`${BASE_URL}${API_PREFIX}/stacks/accounts/create`, {
      network: 'testnet',
      passphrase: 'test-passphrase-123'
    });
    
    if (createResponse.status === 201) {
      console.log('✅ Account created successfully');
      console.log(`📍 Address: ${createResponse.data.address}`);
      
      // List accounts
      const listResponse = await axios.get(`${BASE_URL}${API_PREFIX}/stacks/accounts`);
      console.log(`📊 Total accounts: ${listResponse.data.total}`);
      
      // Get account details
      const accountId = createResponse.data.accountId;
      const detailsResponse = await axios.get(`${BASE_URL}${API_PREFIX}/stacks/accounts/${accountId}`);
      console.log(`📋 Account status: ${detailsResponse.data.status}`);
      
    }
  } catch (error) {
    console.log('❌ Account management test failed:', error.message);
  }
}

async function testTestnetIntegration() {
  console.log('\n🔍 Testing Testnet Integration...\n');
  
  try {
    // Get testnet status
    const statusResponse = await axios.get(`${BASE_URL}${API_PREFIX}/stacks/testnet/status`);
    console.log('✅ Testnet status retrieved');
    console.log(`🌐 Network: ${statusResponse.data.name}`);
    
    // Get testnet environment
    const envResponse = await axios.get(`${BASE_URL}${API_PREFIX}/stacks/testnet/environment`);
    console.log(`🔗 Explorer: ${envResponse.data.explorer}`);
    
    // Get testnet balance
    const testAddress = 'ST1PQHQKV0RJXZFYVWE6CHS7NS4T3MG9XJVTQVAVSB';
    const balanceResponse = await axios.get(`${BASE_URL}${API_PREFIX}/stacks/testnet/balance/${testAddress}`);
    console.log(`💰 Balance retrieved for ${testAddress}`);
    
  } catch (error) {
    console.log('❌ Testnet integration test failed:', error.message);
  }
}

async function runTests() {
  console.log('🧪 Starting Account and Testnet Tests...\n');
  
  await testAccountManagement();
  await testTestnetIntegration();
  
  console.log('\n🎯 Tests completed!');
}

if (require.main === module) {
  runTests();
}

module.exports = { testAccountManagement, testTestnetIntegration };

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testBackend() {
  console.log('🧪 Testing Brizo Backend API...\n');

  try {
    // Test health check
    console.log('1. Testing health check...');
    const health = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check:', health.data);

    // Test create payment
    console.log('\n2. Testing create payment...');
    const payment = await axios.post(`${BASE_URL}/create-payment`, {
      amount: 0.01,
      description: 'Test Product',
      merchantId: 'merchant123',
      donation: false
    });
    console.log('✅ Payment created:', payment.data);

    const paymentId = payment.data.paymentId;

    // Test check status
    console.log('\n3. Testing check status...');
    const status = await axios.get(`${BASE_URL}/check-status/${paymentId}`);
    console.log('✅ Payment status:', status.data);

    // Test process payment
    console.log('\n4. Testing process payment...');
    const processed = await axios.post(`${BASE_URL}/process-payment/${paymentId}`, {
      sbtcTxId: '0x123456789abcdef',
      walletAddress: 'ST1PQHQKV0RJXZFYVWE6CHS7NS4T3MG9XJVTQVAVSB'
    });
    console.log('✅ Payment processed:', processed.data);

    // Test final status
    console.log('\n5. Testing final status...');
    const finalStatus = await axios.get(`${BASE_URL}/check-status/${paymentId}`);
    console.log('✅ Final status:', finalStatus.data);

    // Test merchant info
    console.log('\n6. Testing merchant info...');
    const merchant = await axios.get(`${BASE_URL}/merchant/merchant123`);
    console.log('✅ Merchant info:', merchant.data);

    // Test donation analytics
    console.log('\n7. Testing donation analytics...');
    const analytics = await axios.get(`${BASE_URL}/analytics/donations/merchant123`);
    console.log('✅ Donation analytics:', analytics.data);

    console.log('\n🎉 All tests passed! Backend is working correctly.');

  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testBackend();
}

module.exports = { testBackend };

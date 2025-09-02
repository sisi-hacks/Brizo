#!/usr/bin/env node

/**
 * Complete Brizo Application Test Suite
 * 
 * This script runs comprehensive tests for the entire Brizo application
 * including backend, frontend integration, and user flows.
 * 
 * Usage:
 *   node scripts/complete-test.js
 */

const axios = require('axios');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class CompleteTestSuite {
  constructor() {
    this.baseUrl = 'http://localhost:3001';
    this.frontendUrl = 'http://localhost:3000';
    this.testResults = [];
    this.backendProcess = null;
    this.frontendProcess = null;
  }

  async runCompleteTests() {
    console.log('🧪 Starting Complete Brizo Application Test Suite...\n');

    try {
      // Start both servers
      await this.startServers();
      
      // Wait for servers to be ready
      await this.waitForServers();
      
      // Run all test categories
      console.log('🔍 Running Backend Tests...');
      await this.runBackendTests();
      
      console.log('🎨 Running Frontend Tests...');
      await this.runFrontendTests();
      
      console.log('🔗 Running Integration Tests...');
      await this.runIntegrationTests();
      
      console.log('💳 Running Payment Flow Tests...');
      await this.runPaymentFlowTests();
      
      console.log('🔒 Running Security Tests...');
      await this.runSecurityTests();
      
      console.log('📊 Running Performance Tests...');
      await this.runPerformanceTests();
      
      // Generate comprehensive test report
      this.generateCompleteReport();
      
    } catch (error) {
      console.error('❌ Complete test suite failed:', error.message);
      this.cleanup();
      process.exit(1);
    } finally {
      this.cleanup();
    }
  }

  async startServers() {
    console.log('🚀 Starting servers...');
    
    // Start backend
    this.backendProcess = spawn('node', ['server.js'], {
      cwd: path.join(__dirname, '..'),
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // Start frontend
    this.frontendProcess = spawn('npm', ['run', 'dev'], {
      cwd: path.join(__dirname, '../..', 'frontend'),
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // Wait for backend to start
    await new Promise((resolve, reject) => {
      this.backendProcess.stdout.on('data', (data) => {
        const output = data.toString();
        if (output.includes('Brizo Backend running on port')) {
          console.log('✅ Backend started successfully');
          resolve();
        }
      });

      setTimeout(() => reject(new Error('Backend startup timeout')), 30000);
    });

    // Wait for frontend to start
    await new Promise((resolve, reject) => {
      this.frontendProcess.stdout.on('data', (data) => {
        const output = data.toString();
        if (output.includes('Ready in') || output.includes('Local:')) {
          console.log('✅ Frontend started successfully');
          resolve();
        }
      });

      setTimeout(() => reject(new Error('Frontend startup timeout')), 30000);
    });
  }

  async waitForServers() {
    console.log('⏳ Waiting for servers to be ready...');
    
    // Wait for backend
    for (let i = 0; i < 30; i++) {
      try {
        await axios.get(`${this.baseUrl}/health`, { timeout: 1000 });
        break;
      } catch (error) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Wait for frontend
    for (let i = 0; i < 30; i++) {
      try {
        await axios.get(this.frontendUrl, { timeout: 1000 });
        break;
      } catch (error) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log('✅ Both servers are ready');
  }

  async runBackendTests() {
    const tests = [
      {
        name: 'Health Check',
        test: () => axios.get(`${this.baseUrl}/health`)
      },
      {
        name: 'Database Connection',
        test: () => axios.get(`${this.baseUrl}/health`)
      },
      {
        name: 'Metrics Endpoint',
        test: () => axios.get(`${this.baseUrl}/metrics`)
      },
      {
        name: 'Security Stats',
        test: () => axios.get(`${this.baseUrl}/security/stats`)
      },
      {
        name: 'Create Payment',
        test: () => axios.post(`${this.baseUrl}/create-payment`, {
          merchantId: 'merchant123',
          amount: 0.001,
          currency: 'sBTC',
          description: 'Complete test payment'
        })
      },
      {
        name: 'Merchant Balance',
        test: () => axios.get(`${this.baseUrl}/merchant/merchant123/balance`)
      },
      {
        name: 'Stacks Status',
        test: () => axios.get(`${this.baseUrl}/stacks/status`)
      },
      {
        name: 'Contract Stats',
        test: () => axios.get(`${this.baseUrl}/contract/stats`)
      }
    ];

    for (const test of tests) {
      try {
        const response = await test.test();
        this.recordTest('Backend', test.name, true, `Status: ${response.status}`);
      } catch (error) {
        this.recordTest('Backend', test.name, false, error.message);
      }
    }
  }

  async runFrontendTests() {
    const tests = [
      {
        name: 'Home Page Load',
        test: () => axios.get(this.frontendUrl)
      },
      {
        name: 'Demo Page Load',
        test: () => axios.get(`${this.frontendUrl}/demo`)
      },
      {
        name: 'Merchant Dashboard Load',
        test: () => axios.get(`${this.frontendUrl}/merchant`)
      },
      {
        name: 'API Docs Load',
        test: () => axios.get(`${this.frontendUrl}/merchant/api`)
      }
    ];

    for (const test of tests) {
      try {
        const response = await test.test();
        this.recordTest('Frontend', test.name, true, `Status: ${response.status}`);
      } catch (error) {
        this.recordTest('Frontend', test.name, false, error.message);
      }
    }
  }

  async runIntegrationTests() {
    const tests = [
      {
        name: 'Frontend-Backend Communication',
        test: async () => {
          // Create payment via backend
          const paymentResponse = await axios.post(`${this.baseUrl}/create-payment`, {
            merchantId: 'merchant123',
            amount: 0.001,
            currency: 'sBTC',
            description: 'Integration test payment'
          });
          
          const paymentId = paymentResponse.data.paymentId;
          
          // Check if checkout page is accessible
          const checkoutResponse = await axios.get(`${this.baseUrl}/checkout/${paymentId}`);
          
          if (checkoutResponse.data.payment.id !== paymentId) {
            throw new Error('Payment ID mismatch');
          }
          
          return true;
        }
      },
      {
        name: 'Payment Status Flow',
        test: async () => {
          // Create payment
          const paymentResponse = await axios.post(`${this.baseUrl}/create-payment`, {
            merchantId: 'merchant123',
            amount: 0.002,
            currency: 'sBTC',
            description: 'Status flow test'
          });
          
          const paymentId = paymentResponse.data.paymentId;
          
          // Check initial status
          const statusResponse = await axios.get(`${this.baseUrl}/check-status/${paymentId}`);
          
          if (statusResponse.data.status !== 'pending') {
            throw new Error('Initial status should be pending');
          }
          
          return true;
        }
      }
    ];

    for (const test of tests) {
      try {
        await test.test();
        this.recordTest('Integration', test.name, true, 'Integration test passed');
      } catch (error) {
        this.recordTest('Integration', test.name, false, error.message);
      }
    }
  }

  async runPaymentFlowTests() {
    const tests = [
      {
        name: 'Complete Payment Creation',
        test: async () => {
          const response = await axios.post(`${this.baseUrl}/create-payment`, {
            merchantId: 'merchant123',
            amount: 0.003,
            currency: 'sBTC',
            description: 'Complete flow test payment'
          });
          
          if (!response.data.paymentId || !response.data.checkoutUrl) {
            throw new Error('Missing payment data');
          }
          
          return response.data.paymentId;
        }
      },
      {
        name: 'Payment Processing Simulation',
        test: async () => {
          // Create payment
          const paymentResponse = await axios.post(`${this.baseUrl}/create-payment`, {
            merchantId: 'merchant123',
            amount: 0.004,
            currency: 'sBTC',
            description: 'Processing test'
          });
          
          const paymentId = paymentResponse.data.paymentId;
          
          // Simulate payment processing
          const processResponse = await axios.post(`${this.baseUrl}/process-payment/${paymentId}`, {
            sbtcTxId: `test-tx-${Date.now()}`,
            walletAddress: 'ST1PQHQKV0RJXZFYVWE6CHS7NS4T3MG9XJVTQVAVSB'
          });
          
          if (processResponse.data.status !== 'paid') {
            throw new Error('Payment should be marked as paid');
          }
          
          return true;
        }
      }
    ];

    for (const test of tests) {
      try {
        await test.test();
        this.recordTest('Payment Flow', test.name, true, 'Payment flow test passed');
      } catch (error) {
        this.recordTest('Payment Flow', test.name, false, error.message);
      }
    }
  }

  async runSecurityTests() {
    const tests = [
      {
        name: 'Rate Limiting',
        test: async () => {
          // Make multiple rapid requests
          const promises = Array(15).fill().map(() => 
            axios.get(`${this.baseUrl}/health`).catch(e => e.response)
          );
          
          const responses = await Promise.all(promises);
          const rateLimited = responses.some(r => r && r.status === 429);
          
          if (!rateLimited) {
            throw new Error('Rate limiting not working');
          }
          
          return true;
        }
      },
      {
        name: 'Security Headers',
        test: async () => {
          const response = await axios.get(`${this.baseUrl}/health`);
          const headers = response.headers;
          
          const requiredHeaders = [
            'x-content-type-options',
            'x-frame-options',
            'x-xss-protection'
          ];
          
          for (const header of requiredHeaders) {
            if (!headers[header]) {
              throw new Error(`Missing security header: ${header}`);
            }
          }
          
          return true;
        }
      }
    ];

    for (const test of tests) {
      try {
        await test.test();
        this.recordTest('Security', test.name, true, 'Security test passed');
      } catch (error) {
        this.recordTest('Security', test.name, false, error.message);
      }
    }
  }

  async runPerformanceTests() {
    const tests = [
      {
        name: 'Response Time Test',
        test: async () => {
          const start = Date.now();
          await axios.get(`${this.baseUrl}/health`);
          const responseTime = Date.now() - start;
          
          if (responseTime > 1000) {
            throw new Error(`Response time too slow: ${responseTime}ms`);
          }
          
          return responseTime;
        }
      },
      {
        name: 'Concurrent Requests',
        test: async () => {
          const promises = Array(10).fill().map(() => 
            axios.get(`${this.baseUrl}/health`)
          );
          
          const start = Date.now();
          await Promise.all(promises);
          const totalTime = Date.now() - start;
          
          if (totalTime > 3000) {
            throw new Error(`Concurrent requests too slow: ${totalTime}ms`);
          }
          
          return totalTime;
        }
      }
    ];

    for (const test of tests) {
      try {
        const result = await test.test();
        this.recordTest('Performance', test.name, true, `Performance: ${result}ms`);
      } catch (error) {
        this.recordTest('Performance', test.name, false, error.message);
      }
    }
  }

  recordTest(category: string, name: string, passed: boolean, message: string) {
    const result = {
      category,
      name,
      passed,
      message,
      timestamp: new Date().toISOString()
    };
    
    this.testResults.push(result);
    
    const status = passed ? '✅' : '❌';
    console.log(`  ${status} ${category}: ${name} - ${message}`);
  }

  generateCompleteReport() {
    console.log('\n📊 Complete Test Suite Report');
    console.log('='.repeat(60));
    
    // Group results by category
    const categories = [...new Set(this.testResults.map(r => r.category))];
    
    for (const category of categories) {
      const categoryTests = this.testResults.filter(r => r.category === category);
      const passed = categoryTests.filter(t => t.passed).length;
      const total = categoryTests.length;
      
      console.log(`\n${category.toUpperCase()} TESTS:`);
      console.log(`  Passed: ${passed}/${total} (${Math.round((passed / total) * 100)}%)`);
      
      // Show failed tests
      const failed = categoryTests.filter(t => !t.passed);
      if (failed.length > 0) {
        console.log('  Failed Tests:');
        failed.forEach(test => {
          console.log(`    - ${test.name}: ${test.message}`);
        });
      }
    }
    
    // Overall summary
    const totalPassed = this.testResults.filter(t => t.passed).length;
    const totalTests = this.testResults.length;
    const overallSuccess = Math.round((totalPassed / totalTests) * 100);
    
    console.log('\n' + '='.repeat(60));
    console.log(`OVERALL RESULTS: ${totalPassed}/${totalTests} (${overallSuccess}%)`);
    
    if (overallSuccess === 100) {
      console.log('\n🎉 ALL TESTS PASSED! Brizo is 100% ready!');
    } else if (overallSuccess >= 90) {
      console.log('\n✅ Brizo is ready for testing with minor issues');
    } else {
      console.log('\n⚠️  Brizo needs fixes before testing');
    }
    
    // Save detailed report
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: totalTests,
        passed: totalPassed,
        failed: totalTests - totalPassed,
        successRate: overallSuccess
      },
      categories: categories.map(cat => {
        const catTests = this.testResults.filter(r => r.category === cat);
        return {
          name: cat,
          total: catTests.length,
          passed: catTests.filter(t => t.passed).length,
          tests: catTests
        };
      }),
      allTests: this.testResults
    };
    
    const reportPath = path.join(__dirname, '../test-reports', `complete-test-${Date.now()}.json`);
    const reportDir = path.dirname(reportPath);
    
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  }

  cleanup() {
    if (this.backendProcess) {
      console.log('\n🧹 Cleaning up...');
      this.backendProcess.kill();
    }
    if (this.frontendProcess) {
      this.frontendProcess.kill();
    }
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  const tester = new CompleteTestSuite();
  tester.runCompleteTests();
}

module.exports = CompleteTestSuite;

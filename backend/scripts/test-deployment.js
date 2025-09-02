#!/usr/bin/env node

/**
 * Test Deployment Script
 * 
 * This script runs a comprehensive test of the Brizo backend deployment
 * to ensure everything is working correctly before going live.
 * 
 * Usage:
 *   node scripts/test-deployment.js
 */

const axios = require('axios');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class TestDeployment {
  constructor() {
    this.baseUrl = 'http://localhost:3001';
    this.testResults = [];
    this.serverProcess = null;
  }

  async runTests() {
    console.log('🧪 Starting Brizo Backend Test Deployment...\n');

    try {
      // Start the server
      await this.startServer();
      
      // Wait for server to be ready
      await this.waitForServer();
      
      // Run all tests
      await this.runHealthChecks();
      await this.runAPITests();
      await this.runSecurityTests();
      await this.runPerformanceTests();
      await this.runIntegrationTests();
      
      // Generate test report
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Test deployment failed:', error.message);
      this.cleanup();
      process.exit(1);
    } finally {
      this.cleanup();
    }
  }

  async startServer() {
    console.log('🚀 Starting server...');
    
    return new Promise((resolve, reject) => {
      this.serverProcess = spawn('node', ['server.js'], {
        cwd: process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe']
      });

      this.serverProcess.stdout.on('data', (data) => {
        const output = data.toString();
        if (output.includes('Brizo Backend running on port')) {
          console.log('✅ Server started successfully');
          resolve();
        }
      });

      this.serverProcess.stderr.on('data', (data) => {
        console.error('Server error:', data.toString());
      });

      this.serverProcess.on('error', (error) => {
        reject(error);
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        reject(new Error('Server startup timeout'));
      }, 30000);
    });
  }

  async waitForServer() {
    console.log('⏳ Waiting for server to be ready...');
    
    for (let i = 0; i < 30; i++) {
      try {
        await axios.get(`${this.baseUrl}/health`, { timeout: 1000 });
        console.log('✅ Server is ready');
        return;
      } catch (error) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    throw new Error('Server not ready after 30 seconds');
  }

  async runHealthChecks() {
    console.log('\n🏥 Running health checks...');
    
    const tests = [
      {
        name: 'Basic Health Check',
        test: () => axios.get(`${this.baseUrl}/health`)
      },
      {
        name: 'Database Health Check',
        test: () => axios.get(`${this.baseUrl}/health`)
      },
      {
        name: 'Metrics Endpoint',
        test: () => axios.get(`${this.baseUrl}/metrics`)
      },
      {
        name: 'Security Stats',
        test: () => axios.get(`${this.baseUrl}/security/stats`)
      }
    ];

    for (const test of tests) {
      try {
        const response = await test.test();
        this.recordTest(test.name, true, `Status: ${response.status}`);
      } catch (error) {
        this.recordTest(test.name, false, error.message);
      }
    }
  }

  async runAPITests() {
    console.log('\n🔌 Running API tests...');
    
    const tests = [
      {
        name: 'Create Payment',
        test: async () => {
          const response = await axios.post(`${this.baseUrl}/create-payment`, {
            merchantId: 'merchant123',
            amount: 0.001,
            currency: 'sBTC',
            description: 'Test payment'
          });
          return response.data;
        }
      },
      {
        name: 'Get Merchant Balance',
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
        this.recordTest(test.name, true, `Response received`);
      } catch (error) {
        this.recordTest(test.name, false, error.message);
      }
    }
  }

  async runSecurityTests() {
    console.log('\n🔒 Running security tests...');
    
    const tests = [
      {
        name: 'Rate Limiting',
        test: async () => {
          // Make multiple rapid requests
          const promises = Array(10).fill().map(() => 
            axios.get(`${this.baseUrl}/health`).catch(e => e.response)
          );
          const responses = await Promise.all(promises);
          const rateLimited = responses.some(r => r && r.status === 429);
          if (rateLimited) {
            throw new Error('Rate limiting not working');
          }
          return true;
        }
      },
      {
        name: 'CORS Headers',
        test: async () => {
          const response = await axios.options(`${this.baseUrl}/health`);
          return response.headers['access-control-allow-origin'];
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
        this.recordTest(test.name, true, 'Security check passed');
      } catch (error) {
        this.recordTest(test.name, false, error.message);
      }
    }
  }

  async runPerformanceTests() {
    console.log('\n⚡ Running performance tests...');
    
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
          const promises = Array(20).fill().map(() => 
            axios.get(`${this.baseUrl}/health`)
          );
          const start = Date.now();
          await Promise.all(promises);
          const totalTime = Date.now() - start;
          
          if (totalTime > 5000) {
            throw new Error(`Concurrent requests too slow: ${totalTime}ms`);
          }
          return totalTime;
        }
      }
    ];

    for (const test of tests) {
      try {
        const result = await test.test();
        this.recordTest(test.name, true, `Performance: ${result}ms`);
      } catch (error) {
        this.recordTest(test.name, false, error.message);
      }
    }
  }

  async runIntegrationTests() {
    console.log('\n🔗 Running integration tests...');
    
    const tests = [
      {
        name: 'Payment Flow Integration',
        test: async () => {
          // Create payment
          const createResponse = await axios.post(`${this.baseUrl}/create-payment`, {
            merchantId: 'merchant123',
            amount: 0.001,
            currency: 'sBTC',
            description: 'Integration test payment'
          });
          
          const paymentId = createResponse.data.paymentId;
          
          // Check payment status
          const statusResponse = await axios.get(`${this.baseUrl}/check-status/${paymentId}`);
          
          if (statusResponse.data.status !== 'pending') {
            throw new Error('Payment status not pending');
          }
          
          return paymentId;
        }
      },
      {
        name: 'Database Integration',
        test: async () => {
          const response = await axios.get(`${this.baseUrl}/merchant/merchant123/balance`);
          if (!response.data.merchantId) {
            throw new Error('Database integration failed');
          }
          return true;
        }
      }
    ];

    for (const test of tests) {
      try {
        const result = await test.test();
        this.recordTest(test.name, true, 'Integration test passed');
      } catch (error) {
        this.recordTest(test.name, false, error.message);
      }
    }
  }

  recordTest(name, passed, message) {
    const result = {
      name,
      passed,
      message,
      timestamp: new Date().toISOString()
    };
    
    this.testResults.push(result);
    
    const status = passed ? '✅' : '❌';
    console.log(`  ${status} ${name}: ${message}`);
  }

  generateReport() {
    console.log('\n📊 Test Deployment Report');
    console.log('='.repeat(50));
    
    const passed = this.testResults.filter(t => t.passed).length;
    const failed = this.testResults.filter(t => !t.passed).length;
    const total = this.testResults.length;
    
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Success Rate: ${Math.round((passed / total) * 100)}%`);
    
    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.testResults.filter(t => !t.passed).forEach(test => {
        console.log(`  - ${test.name}: ${test.message}`);
      });
    }
    
    // Save report to file
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total,
        passed,
        failed,
        successRate: Math.round((passed / total) * 100)
      },
      tests: this.testResults
    };
    
    const reportPath = path.join(__dirname, '../test-reports', `deployment-test-${Date.now()}.json`);
    const reportDir = path.dirname(reportPath);
    
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Report saved to: ${reportPath}`);
    
    if (failed === 0) {
      console.log('\n🎉 All tests passed! Deployment is ready.');
    } else {
      console.log('\n⚠️  Some tests failed. Please review before deployment.');
    }
  }

  cleanup() {
    if (this.serverProcess) {
      console.log('\n🧹 Cleaning up...');
      this.serverProcess.kill();
    }
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  const tester = new TestDeployment();
  tester.runTests();
}

module.exports = TestDeployment;

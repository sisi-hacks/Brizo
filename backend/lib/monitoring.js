const fs = require('fs');
const path = require('path');

/**
 * Monitoring and Metrics Service
 * 
 * Provides comprehensive monitoring, metrics collection, and health checks
 * for production-ready deployment.
 */
class MonitoringService {
  constructor() {
    this.metrics = {
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        byEndpoint: {},
        byMethod: {},
        responseTimes: []
      },
      payments: {
        created: 0,
        processed: 0,
        failed: 0,
        totalVolume: 0,
        averageAmount: 0
      },
      system: {
        uptime: Date.now(),
        memoryUsage: {},
        cpuUsage: 0,
        diskUsage: {},
        lastHealthCheck: null
      },
      errors: {
        total: 0,
        byType: {},
        recent: []
      }
    };
    
    this.healthChecks = new Map();
    this.alerts = [];
    this.metricsPath = process.env.METRICS_PATH || './data/metrics.json';
    
    // Start metrics collection
    this.startMetricsCollection();
    
    console.log('📊 Monitoring service initialized');
  }

  /**
   * Record a request metric
   */
  recordRequest(endpoint, method, statusCode, responseTime) {
    this.metrics.requests.total++;
    
    if (statusCode >= 200 && statusCode < 400) {
      this.metrics.requests.successful++;
    } else {
      this.metrics.requests.failed++;
    }

    // Record by endpoint
    if (!this.metrics.requests.byEndpoint[endpoint]) {
      this.metrics.requests.byEndpoint[endpoint] = { total: 0, successful: 0, failed: 0 };
    }
    this.metrics.requests.byEndpoint[endpoint].total++;
    if (statusCode >= 200 && statusCode < 400) {
      this.metrics.requests.byEndpoint[endpoint].successful++;
    } else {
      this.metrics.requests.byEndpoint[endpoint].failed++;
    }

    // Record by method
    if (!this.metrics.requests.byMethod[method]) {
      this.metrics.requests.byMethod[method] = { total: 0, successful: 0, failed: 0 };
    }
    this.metrics.requests.byMethod[method].total++;
    if (statusCode >= 200 && statusCode < 400) {
      this.metrics.requests.byMethod[method].successful++;
    } else {
      this.metrics.requests.byMethod[method].failed++;
    }

    // Record response time
    this.metrics.requests.responseTimes.push(responseTime);
    if (this.metrics.requests.responseTimes.length > 1000) {
      this.metrics.requests.responseTimes = this.metrics.requests.responseTimes.slice(-1000);
    }
  }

  /**
   * Record a payment metric
   */
  recordPayment(type, amount = 0, success = true) {
    if (type === 'created') {
      this.metrics.payments.created++;
    } else if (type === 'processed') {
      this.metrics.payments.processed++;
      if (success) {
        this.metrics.payments.totalVolume += amount;
        this.metrics.payments.averageAmount = 
          this.metrics.payments.totalVolume / this.metrics.payments.processed;
      }
    } else if (type === 'failed') {
      this.metrics.payments.failed++;
    }
  }

  /**
   * Record an error
   */
  recordError(error, context = {}) {
    this.metrics.errors.total++;
    
    const errorType = error.constructor.name || 'UnknownError';
    if (!this.metrics.errors.byType[errorType]) {
      this.metrics.errors.byType[errorType] = 0;
    }
    this.metrics.errors.byType[errorType]++;

    // Store recent errors
    this.metrics.errors.recent.push({
      timestamp: new Date().toISOString(),
      type: errorType,
      message: error.message,
      stack: error.stack,
      context
    });

    // Keep only last 100 errors
    if (this.metrics.errors.recent.length > 100) {
      this.metrics.errors.recent = this.metrics.errors.recent.slice(-100);
    }

    // Check for alert conditions
    this.checkAlerts(errorType, error.message);
  }

  /**
   * Add a health check
   */
  addHealthCheck(name, checkFunction) {
    this.healthChecks.set(name, checkFunction);
  }

  /**
   * Run all health checks
   */
  async runHealthChecks() {
    const results = {};
    let overallHealthy = true;

    for (const [name, checkFunction] of this.healthChecks) {
      try {
        const result = await checkFunction();
        results[name] = {
          healthy: result.healthy !== false,
          status: result.status || 'ok',
          details: result.details || {},
          timestamp: new Date().toISOString()
        };
        
        if (!results[name].healthy) {
          overallHealthy = false;
        }
      } catch (error) {
        results[name] = {
          healthy: false,
          status: 'error',
          error: error.message,
          timestamp: new Date().toISOString()
        };
        overallHealthy = false;
      }
    }

    // Update system metrics
    this.metrics.system.lastHealthCheck = new Date().toISOString();
    this.metrics.system.uptime = Date.now() - this.metrics.system.uptime;

    return {
      healthy: overallHealthy,
      timestamp: new Date().toISOString(),
      checks: results,
      metrics: this.getSystemMetrics()
    };
  }

  /**
   * Get system metrics
   */
  getSystemMetrics() {
    const memUsage = process.memoryUsage();
    this.metrics.system.memoryUsage = {
      rss: Math.round(memUsage.rss / 1024 / 1024), // MB
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
      external: Math.round(memUsage.external / 1024 / 1024) // MB
    };

    return {
      uptime: Math.round((Date.now() - this.metrics.system.uptime) / 1000), // seconds
      memory: this.metrics.system.memoryUsage,
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch
    };
  }

  /**
   * Get comprehensive metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      system: {
        ...this.metrics.system,
        ...this.getSystemMetrics()
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    const responseTimes = this.metrics.requests.responseTimes;
    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
      : 0;

    const sortedResponseTimes = [...responseTimes].sort((a, b) => a - b);
    const p95Index = Math.floor(sortedResponseTimes.length * 0.95);
    const p99Index = Math.floor(sortedResponseTimes.length * 0.99);

    return {
      averageResponseTime: Math.round(avgResponseTime),
      p95ResponseTime: sortedResponseTimes[p95Index] || 0,
      p99ResponseTime: sortedResponseTimes[p99Index] || 0,
      requestsPerSecond: this.calculateRequestsPerSecond(),
      errorRate: this.calculateErrorRate(),
      successRate: this.calculateSuccessRate()
    };
  }

  /**
   * Calculate requests per second
   */
  calculateRequestsPerSecond() {
    const uptimeSeconds = (Date.now() - this.metrics.system.uptime) / 1000;
    return uptimeSeconds > 0 ? Math.round(this.metrics.requests.total / uptimeSeconds * 100) / 100 : 0;
  }

  /**
   * Calculate error rate
   */
  calculateErrorRate() {
    const total = this.metrics.requests.total;
    return total > 0 ? Math.round((this.metrics.requests.failed / total) * 10000) / 100 : 0;
  }

  /**
   * Calculate success rate
   */
  calculateSuccessRate() {
    const total = this.metrics.requests.total;
    return total > 0 ? Math.round((this.metrics.requests.successful / total) * 10000) / 100 : 0;
  }

  /**
   * Check for alert conditions
   */
  checkAlerts(errorType, message) {
    // High error rate alert
    if (this.calculateErrorRate() > 10) {
      this.addAlert('high_error_rate', `Error rate is ${this.calculateErrorRate()}%`);
    }

    // Memory usage alert
    const memUsage = this.metrics.system.memoryUsage;
    if (memUsage.heapUsed > 500) { // 500MB
      this.addAlert('high_memory_usage', `Memory usage is ${memUsage.heapUsed}MB`);
    }

    // Specific error type alerts
    if (this.metrics.errors.byType[errorType] > 10) {
      this.addAlert('frequent_errors', `Frequent ${errorType} errors: ${this.metrics.errors.byType[errorType]}`);
    }
  }

  /**
   * Add an alert
   */
  addAlert(type, message) {
    const alert = {
      type,
      message,
      timestamp: new Date().toISOString(),
      resolved: false
    };

    // Check if similar alert already exists
    const existingAlert = this.alerts.find(a => 
      a.type === type && !a.resolved && 
      (Date.now() - new Date(a.timestamp).getTime()) < 300000 // 5 minutes
    );

    if (!existingAlert) {
      this.alerts.push(alert);
      console.warn(`🚨 ALERT: ${type} - ${message}`);
    }
  }

  /**
   * Get alerts
   */
  getAlerts() {
    return {
      active: this.alerts.filter(a => !a.resolved),
      all: this.alerts,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Resolve an alert
   */
  resolveAlert(type) {
    this.alerts.forEach(alert => {
      if (alert.type === type && !alert.resolved) {
        alert.resolved = true;
        alert.resolvedAt = new Date().toISOString();
      }
    });
  }

  /**
   * Start metrics collection
   */
  startMetricsCollection() {
    // Collect system metrics every 30 seconds
    setInterval(() => {
      this.getSystemMetrics();
    }, 30000);

    // Save metrics to file every 5 minutes
    setInterval(() => {
      this.saveMetrics();
    }, 300000);

    // Clean up old alerts every hour
    setInterval(() => {
      this.cleanupAlerts();
    }, 3600000);
  }

  /**
   * Save metrics to file
   */
  saveMetrics() {
    try {
      const metricsData = {
        timestamp: new Date().toISOString(),
        metrics: this.getMetrics(),
        performance: this.getPerformanceMetrics(),
        alerts: this.getAlerts()
      };

      const metricsDir = path.dirname(this.metricsPath);
      if (!fs.existsSync(metricsDir)) {
        fs.mkdirSync(metricsDir, { recursive: true });
      }

      fs.writeFileSync(this.metricsPath, JSON.stringify(metricsData, null, 2));
    } catch (error) {
      console.error('Error saving metrics:', error);
    }
  }

  /**
   * Load metrics from file
   */
  loadMetrics() {
    try {
      if (fs.existsSync(this.metricsPath)) {
        const data = JSON.parse(fs.readFileSync(this.metricsPath, 'utf8'));
        if (data.metrics) {
          this.metrics = { ...this.metrics, ...data.metrics };
        }
        if (data.alerts) {
          this.alerts = data.alerts;
        }
      }
    } catch (error) {
      console.error('Error loading metrics:', error);
    }
  }

  /**
   * Clean up old alerts
   */
  cleanupAlerts() {
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    this.alerts = this.alerts.filter(alert => 
      new Date(alert.timestamp).getTime() > oneDayAgo
    );
  }

  /**
   * Reset metrics
   */
  resetMetrics() {
    this.metrics = {
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        byEndpoint: {},
        byMethod: {},
        responseTimes: []
      },
      payments: {
        created: 0,
        processed: 0,
        failed: 0,
        totalVolume: 0,
        averageAmount: 0
      },
      system: {
        uptime: Date.now(),
        memoryUsage: {},
        cpuUsage: 0,
        diskUsage: {},
        lastHealthCheck: null
      },
      errors: {
        total: 0,
        byType: {},
        recent: []
      }
    };
    this.alerts = [];
    console.log('📊 Metrics reset');
  }
}

module.exports = MonitoringService;

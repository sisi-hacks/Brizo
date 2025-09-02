const fs = require('fs');
const path = require('path');

/**
 * Enhanced Logging Service
 * 
 * Provides structured logging with different levels, file rotation,
 * and production-ready features.
 */
class Logger {
  constructor(options = {}) {
    this.level = options.level || process.env.LOG_LEVEL || 'info';
    this.logDir = options.logDir || process.env.LOG_DIR || './logs';
    this.maxFileSize = options.maxFileSize || 10 * 1024 * 1024; // 10MB
    this.maxFiles = options.maxFiles || 5;
    this.enableConsole = options.enableConsole !== false;
    this.enableFile = options.enableFile !== false;
    
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      http: 3,
      debug: 4
    };

    this.colors = {
      error: '\x1b[31m', // Red
      warn: '\x1b[33m',  // Yellow
      info: '\x1b[36m',  // Cyan
      http: '\x1b[35m',  // Magenta
      debug: '\x1b[90m', // Gray
      reset: '\x1b[0m'
    };

    // Ensure log directory exists
    if (this.enableFile && !fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }

    // Initialize log files
    this.logFiles = {
      error: path.join(this.logDir, 'error.log'),
      combined: path.join(this.logDir, 'combined.log'),
      access: path.join(this.logDir, 'access.log')
    };

    console.log(`📝 Logger initialized - Level: ${this.level}, Directory: ${this.logDir}`);
  }

  /**
   * Log a message
   */
  log(level, message, meta = {}) {
    if (this.levels[level] > this.levels[this.level]) {
      return;
    }

    const logEntry = this.createLogEntry(level, message, meta);
    
    if (this.enableConsole) {
      this.logToConsole(logEntry);
    }
    
    if (this.enableFile) {
      this.logToFile(logEntry, level);
    }
  }

  /**
   * Create a structured log entry
   */
  createLogEntry(level, message, meta) {
    return {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message,
      meta: {
        ...meta,
        pid: process.pid,
        hostname: require('os').hostname(),
        service: 'brizo-backend'
      }
    };
  }

  /**
   * Log to console with colors
   */
  logToConsole(logEntry) {
    const color = this.colors[logEntry.level.toLowerCase()] || this.colors.reset;
    const reset = this.colors.reset;
    
    const metaStr = Object.keys(logEntry.meta).length > 0 
      ? ` ${JSON.stringify(logEntry.meta)}` 
      : '';
    
    console.log(
      `${color}[${logEntry.timestamp}] ${logEntry.level}: ${logEntry.message}${metaStr}${reset}`
    );
  }

  /**
   * Log to file
   */
  logToFile(logEntry, level) {
    try {
      const logLine = JSON.stringify(logEntry) + '\n';
      
      // Write to combined log
      fs.appendFileSync(this.logFiles.combined, logLine);
      
      // Write to level-specific log if it's an error
      if (level === 'error') {
        fs.appendFileSync(this.logFiles.error, logLine);
      }
      
      // Check file size and rotate if necessary
      this.rotateLogFile(this.logFiles.combined);
      if (level === 'error') {
        this.rotateLogFile(this.logFiles.error);
      }
    } catch (error) {
      console.error('Error writing to log file:', error);
    }
  }

  /**
   * Rotate log file if it exceeds max size
   */
  rotateLogFile(filePath) {
    try {
      const stats = fs.statSync(filePath);
      if (stats.size > this.maxFileSize) {
        // Rotate existing files
        for (let i = this.maxFiles - 1; i > 0; i--) {
          const oldFile = `${filePath}.${i}`;
          const newFile = `${filePath}.${i + 1}`;
          if (fs.existsSync(oldFile)) {
            fs.renameSync(oldFile, newFile);
          }
        }
        
        // Move current file to .1
        fs.renameSync(filePath, `${filePath}.1`);
        
        // Create new empty file
        fs.writeFileSync(filePath, '');
      }
    } catch (error) {
      console.error('Error rotating log file:', error);
    }
  }

  /**
   * Log levels
   */
  error(message, meta = {}) {
    this.log('error', message, meta);
  }

  warn(message, meta = {}) {
    this.log('warn', message, meta);
  }

  info(message, meta = {}) {
    this.log('info', message, meta);
  }

  http(message, meta = {}) {
    this.log('http', message, meta);
  }

  debug(message, meta = {}) {
    this.log('debug', message, meta);
  }

  /**
   * Log HTTP requests
   */
  logRequest(req, res, responseTime) {
    const meta = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      contentLength: res.get('Content-Length')
    };

    this.http(`${req.method} ${req.url}`, meta);
  }

  /**
   * Log payment events
   */
  logPayment(event, paymentId, meta = {}) {
    this.info(`Payment ${event}`, {
      paymentId,
      event,
      ...meta
    });
  }

  /**
   * Log merchant events
   */
  logMerchant(event, merchantId, meta = {}) {
    this.info(`Merchant ${event}`, {
      merchantId,
      event,
      ...meta
    });
  }

  /**
   * Log Stacks events
   */
  logStacks(event, meta = {}) {
    this.info(`Stacks ${event}`, {
      event,
      ...meta
    });
  }

  /**
   * Log contract events
   */
  logContract(event, meta = {}) {
    this.info(`Contract ${event}`, {
      event,
      ...meta
    });
  }

  /**
   * Log system events
   */
  logSystem(event, meta = {}) {
    this.info(`System ${event}`, {
      event,
      ...meta
    });
  }

  /**
   * Log security events
   */
  logSecurity(event, meta = {}) {
    this.warn(`Security ${event}`, {
      event,
      ...meta
    });
  }

  /**
   * Get log statistics
   */
  getLogStats() {
    const stats = {
      files: {},
      totalSize: 0
    };

    try {
      for (const [type, filePath] of Object.entries(this.logFiles)) {
        if (fs.existsSync(filePath)) {
          const fileStats = fs.statSync(filePath);
          stats.files[type] = {
            size: fileStats.size,
            modified: fileStats.mtime,
            exists: true
          };
          stats.totalSize += fileStats.size;
        } else {
          stats.files[type] = {
            size: 0,
            modified: null,
            exists: false
          };
        }
      }
    } catch (error) {
      this.error('Error getting log stats', { error: error.message });
    }

    return stats;
  }

  /**
   * Clean up old log files
   */
  cleanupLogs() {
    try {
      const files = fs.readdirSync(this.logDir);
      const now = Date.now();
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

      files.forEach(file => {
        const filePath = path.join(this.logDir, file);
        const stats = fs.statSync(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          fs.unlinkSync(filePath);
          this.info(`Cleaned up old log file: ${file}`);
        }
      });
    } catch (error) {
      this.error('Error cleaning up logs', { error: error.message });
    }
  }
}

// Create singleton instance
const logger = new Logger();

module.exports = logger;

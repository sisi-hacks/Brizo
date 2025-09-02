const crypto = require('crypto');
const rateLimit = require('express-rate-limit');

/**
 * Security Service
 * 
 * Provides comprehensive security features for production deployment
 */
class SecurityService {
  constructor() {
    this.failedAttempts = new Map();
    this.blockedIPs = new Set();
    this.trustedIPs = new Set();
    this.apiKeys = new Map();
    
    // Security configuration
    this.config = {
      maxFailedAttempts: parseInt(process.env.MAX_FAILED_ATTEMPTS) || 5,
      lockoutDuration: parseInt(process.env.LOCKOUT_DURATION) || 15 * 60 * 1000, // 15 minutes
      maxRequestsPerMinute: parseInt(process.env.MAX_REQUESTS_PER_MINUTE) || 100,
      maxRequestsPerHour: parseInt(process.env.MAX_REQUESTS_PER_HOUR) || 1000,
      enableIPWhitelist: process.env.ENABLE_IP_WHITELIST === 'true',
      enableAPIKeys: process.env.ENABLE_API_KEYS === 'true',
      enableCORS: process.env.ENABLE_CORS !== 'false',
      enableHelmet: process.env.ENABLE_HELMET !== 'false'
    };

    // Load trusted IPs from environment
    if (process.env.TRUSTED_IPS) {
      process.env.TRUSTED_IPS.split(',').forEach(ip => {
        this.trustedIPs.add(ip.trim());
      });
    }

    // Load API keys from environment
    if (process.env.API_KEYS) {
      process.env.API_KEYS.split(',').forEach(key => {
        const [name, value] = key.split(':');
        if (name && value) {
          this.apiKeys.set(name.trim(), value.trim());
        }
      });
    }

    console.log('🔒 Security service initialized');
    console.log(`🛡️  Max failed attempts: ${this.config.maxFailedAttempts}`);
    console.log(`⏰ Lockout duration: ${this.config.lockoutDuration / 1000}s`);
    console.log(`🔑 API keys enabled: ${this.config.enableAPIKeys}`);
  }

  /**
   * Generate a secure API key
   */
  generateAPIKey(name) {
    const key = crypto.randomBytes(32).toString('hex');
    this.apiKeys.set(name, key);
    return key;
  }

  /**
   * Validate API key
   */
  validateAPIKey(key) {
    if (!this.config.enableAPIKeys) {
      return true; // API keys disabled
    }

    return Array.from(this.apiKeys.values()).includes(key);
  }

  /**
   * Check if IP is blocked
   */
  isIPBlocked(ip) {
    return this.blockedIPs.has(ip);
  }

  /**
   * Check if IP is trusted
   */
  isIPTrusted(ip) {
    if (!this.config.enableIPWhitelist) {
      return true; // IP whitelist disabled
    }

    return this.trustedIPs.has(ip);
  }

  /**
   * Record failed attempt
   */
  recordFailedAttempt(ip, endpoint) {
    const key = `${ip}:${endpoint}`;
    const attempts = this.failedAttempts.get(key) || { count: 0, firstAttempt: Date.now() };
    
    attempts.count++;
    attempts.lastAttempt = Date.now();
    this.failedAttempts.set(key, attempts);

    // Block IP if too many failed attempts
    if (attempts.count >= this.config.maxFailedAttempts) {
      this.blockIP(ip, `Too many failed attempts on ${endpoint}`);
    }

    return attempts.count;
  }

  /**
   * Record successful attempt
   */
  recordSuccessfulAttempt(ip, endpoint) {
    const key = `${ip}:${endpoint}`;
    this.failedAttempts.delete(key);
  }

  /**
   * Block an IP address
   */
  blockIP(ip, reason) {
    this.blockedIPs.add(ip);
    console.warn(`🚫 IP blocked: ${ip} - ${reason}`);
    
    // Auto-unblock after lockout duration
    setTimeout(() => {
      this.unblockIP(ip);
    }, this.config.lockoutDuration);
  }

  /**
   * Unblock an IP address
   */
  unblockIP(ip) {
    this.blockedIPs.delete(ip);
    console.log(`✅ IP unblocked: ${ip}`);
  }

  /**
   * Get rate limiter for general requests
   */
  getGeneralRateLimiter() {
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: this.config.maxRequestsPerMinute,
      message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes'
      },
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => {
        this.recordFailedAttempt(req.ip, 'rate_limit');
        res.status(429).json({
          error: 'Too many requests from this IP, please try again later.',
          retryAfter: '15 minutes'
        });
      }
    });
  }

  /**
   * Get rate limiter for payment processing
   */
  getPaymentRateLimiter() {
    return rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 10, // 10 payment attempts per minute
      message: {
        error: 'Too many payment attempts, please try again later.',
        retryAfter: '1 minute'
      },
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => {
        this.recordFailedAttempt(req.ip, 'payment_rate_limit');
        res.status(429).json({
          error: 'Too many payment attempts, please try again later.',
          retryAfter: '1 minute'
        });
      }
    });
  }

  /**
   * Get rate limiter for authentication
   */
  getAuthRateLimiter() {
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // 5 auth attempts per 15 minutes
      message: {
        error: 'Too many authentication attempts, please try again later.',
        retryAfter: '15 minutes'
      },
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => {
        this.recordFailedAttempt(req.ip, 'auth_rate_limit');
        res.status(429).json({
          error: 'Too many authentication attempts, please try again later.',
          retryAfter: '15 minutes'
        });
      }
    });
  }

  /**
   * Security middleware
   */
  securityMiddleware() {
    return (req, res, next) => {
      const ip = req.ip || req.connection.remoteAddress;
      
      // Check if IP is blocked
      if (this.isIPBlocked(ip)) {
        return res.status(403).json({
          error: 'IP address is blocked due to suspicious activity',
          retryAfter: '15 minutes'
        });
      }

      // Check if IP is trusted (if whitelist enabled)
      if (!this.isIPTrusted(ip)) {
        return res.status(403).json({
          error: 'IP address not in whitelist',
          retryAfter: 'Contact administrator'
        });
      }

      // Add security headers
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

      next();
    };
  }

  /**
   * API key middleware
   */
  apiKeyMiddleware() {
    return (req, res, next) => {
      if (!this.config.enableAPIKeys) {
        return next();
      }

      const apiKey = req.headers['x-api-key'] || req.query.apiKey;
      
      if (!apiKey) {
        return res.status(401).json({
          error: 'API key required',
          message: 'Please provide an API key in the X-API-Key header or apiKey query parameter'
        });
      }

      if (!this.validateAPIKey(apiKey)) {
        this.recordFailedAttempt(req.ip, 'invalid_api_key');
        return res.status(401).json({
          error: 'Invalid API key',
          message: 'The provided API key is not valid'
        });
      }

      next();
    };
  }

  /**
   * Validate input data
   */
  validateInput(data, rules) {
    const errors = [];

    for (const [field, rule] of Object.entries(rules)) {
      const value = data[field];

      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push(`${field} is required`);
        continue;
      }

      if (value !== undefined && value !== null) {
        if (rule.type && typeof value !== rule.type) {
          errors.push(`${field} must be of type ${rule.type}`);
        }

        if (rule.minLength && value.length < rule.minLength) {
          errors.push(`${field} must be at least ${rule.minLength} characters`);
        }

        if (rule.maxLength && value.length > rule.maxLength) {
          errors.push(`${field} must be no more than ${rule.maxLength} characters`);
        }

        if (rule.pattern && !rule.pattern.test(value)) {
          errors.push(`${field} format is invalid`);
        }

        if (rule.min && value < rule.min) {
          errors.push(`${field} must be at least ${rule.min}`);
        }

        if (rule.max && value > rule.max) {
          errors.push(`${field} must be no more than ${rule.max}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Sanitize input data
   */
  sanitizeInput(data) {
    const sanitized = {};

    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        // Remove potentially dangerous characters
        sanitized[key] = value
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '')
          .trim();
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Generate secure random string
   */
  generateSecureRandom(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Hash sensitive data
   */
  hashData(data, salt = null) {
    const actualSalt = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(data, actualSalt, 10000, 64, 'sha512').toString('hex');
    return { hash, salt: actualSalt };
  }

  /**
   * Verify hashed data
   */
  verifyHash(data, hash, salt) {
    const computedHash = crypto.pbkdf2Sync(data, salt, 10000, 64, 'sha512').toString('hex');
    return computedHash === hash;
  }

  /**
   * Get security statistics
   */
  getSecurityStats() {
    return {
      blockedIPs: this.blockedIPs.size,
      trustedIPs: this.trustedIPs.size,
      failedAttempts: this.failedAttempts.size,
      apiKeys: this.apiKeys.size,
      config: this.config
    };
  }

  /**
   * Clean up old failed attempts
   */
  cleanupFailedAttempts() {
    const now = Date.now();
    const maxAge = this.config.lockoutDuration * 2; // 2x lockout duration

    for (const [key, attempts] of this.failedAttempts.entries()) {
      if (now - attempts.firstAttempt > maxAge) {
        this.failedAttempts.delete(key);
      }
    }
  }
}

module.exports = SecurityService;

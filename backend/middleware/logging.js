const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Custom token for request body
morgan.token('body', (req) => {
  if (req.method === 'POST' || req.method === 'PUT') {
    return JSON.stringify(req.body);
  }
  return '';
});

// Custom token for response time in a more readable format
morgan.token('response-time-ms', (req, res) => {
  if (!res._header || !req._startAt) return '';
  const diff = process.hrtime(req._startAt);
  const ms = diff[0] * 1e3 + diff[1] * 1e-6;
  return ms.toFixed(2);
});

// Custom format for detailed logging
const detailedFormat = ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time-ms ms :body';

// Create write streams
const accessLogStream = fs.createWriteStream(
  path.join(logsDir, 'access.log'),
  { flags: 'a' }
);

const errorLogStream = fs.createWriteStream(
  path.join(logsDir, 'error.log'),
  { flags: 'a' }
);

// Skip logging for health checks and static files
const skipLogging = (req, res) => {
  return req.url === '/health' || req.url.startsWith('/static');
};

// Access logger
const accessLogger = morgan(detailedFormat, {
  stream: accessLogStream,
  skip: skipLogging
});

// Error logger
const errorLogger = morgan(detailedFormat, {
  stream: errorLogStream,
  skip: (req, res) => {
    return skipLogging(req, res) || res.statusCode < 400;
  }
});

// Console logger for development
const consoleLogger = morgan('combined', {
  skip: skipLogging
});

// Custom logging middleware
const customLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log request
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - ${req.ip}`);
  
  // Log response
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logEntry = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      contentLength: res.get('Content-Length') || 0
    };
    
    // Log to file
    const logLine = JSON.stringify(logEntry) + '\n';
    fs.appendFileSync(path.join(logsDir, 'api.log'), logLine);
    
    // Console output for important events
    if (res.statusCode >= 400) {
      console.error(`❌ ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`);
    } else if (res.statusCode >= 300) {
      console.warn(`⚠️  ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`);
    } else {
      console.log(`✅ ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`);
    }
  });
  
  next();
};

module.exports = {
  accessLogger,
  errorLogger,
  consoleLogger,
  customLogger
};

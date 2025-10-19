const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: {
    service: 'engineer-cv-api',
    environment: process.env.NODE_ENV || 'development',
    version: process.env.BUILD_VERSION || '1.0.0'
  },
  transports: [
    // Error log file
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: parseInt(process.env.LOG_MAX_SIZE?.replace('m', '')) * 1024 * 1024 || 10 * 1024 * 1024,
      maxFiles: parseInt(process.env.LOG_MAX_FILES) || 5,
      tailable: true
    }),
    
    // Combined log file
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: parseInt(process.env.LOG_MAX_SIZE?.replace('m', '')) * 1024 * 1024 || 10 * 1024 * 1024,
      maxFiles: parseInt(process.env.LOG_MAX_FILES) || 5,
      tailable: true
    }),
    
    // Daily rotate file
    new winston.transports.DailyRotateFile({
      filename: path.join(logsDir, 'app-%DATE%.log'),
      datePattern: process.env.LOG_DATE_PATTERN || 'YYYY-MM-DD',
      maxSize: process.env.LOG_MAX_SIZE || '10m',
      maxFiles: process.env.LOG_MAX_FILES || '5d',
      zippedArchive: true
    })
  ],
  
  // Handle uncaught exceptions and rejections
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log')
    })
  ],
  
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log')
    })
  ]
});

// Add console transport for non-production environments
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat
  }));
}

// Create specialized loggers for different components
const createComponentLogger = (component) => {
  return logger.child({ component });
};

// HTTP request logger middleware
const httpLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log request
  logger.info('HTTP Request', {
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    userId: req.user?.id,
    requestId: req.id
  });
  
  // Log response
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? 'warn' : 'info';
    
    logger.log(logLevel, 'HTTP Response', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('Content-Length'),
      userId: req.user?.id,
      requestId: req.id
    });
  });
  
  next();
};

// Database operation logger
const dbLogger = createComponentLogger('database');

// Authentication logger
const authLogger = createComponentLogger('auth');

// File upload logger
const uploadLogger = createComponentLogger('upload');

// Security logger
const securityLogger = createComponentLogger('security');

// Performance logger
const performanceLogger = createComponentLogger('performance');

// Business logic logger
const businessLogger = createComponentLogger('business');

// Error logger with context
const logError = (error, context = {}) => {
  logger.error('Application Error', {
    message: error.message,
    stack: error.stack,
    name: error.name,
    code: error.code,
    statusCode: error.statusCode,
    ...context
  });
};

// Success operation logger
const logSuccess = (operation, data = {}) => {
  logger.info('Operation Success', {
    operation,
    ...data
  });
};

// Warning logger
const logWarning = (message, data = {}) => {
  logger.warn('Warning', {
    message,
    ...data
  });
};

// Security event logger
const logSecurityEvent = (event, data = {}) => {
  securityLogger.warn('Security Event', {
    event,
    timestamp: new Date().toISOString(),
    ...data
  });
};

// Performance metric logger
const logPerformance = (metric, value, unit = 'ms', context = {}) => {
  performanceLogger.info('Performance Metric', {
    metric,
    value,
    unit,
    timestamp: new Date().toISOString(),
    ...context
  });
};

// Database operation logger
const logDatabaseOperation = (operation, collection, data = {}) => {
  dbLogger.info('Database Operation', {
    operation,
    collection,
    timestamp: new Date().toISOString(),
    ...data
  });
};

// Authentication event logger
const logAuthEvent = (event, userId, data = {}) => {
  authLogger.info('Auth Event', {
    event,
    userId,
    timestamp: new Date().toISOString(),
    ...data
  });
};

// File upload event logger
const logUploadEvent = (event, filename, userId, data = {}) => {
  uploadLogger.info('Upload Event', {
    event,
    filename,
    userId,
    timestamp: new Date().toISOString(),
    ...data
  });
};

// Business event logger
const logBusinessEvent = (event, data = {}) => {
  businessLogger.info('Business Event', {
    event,
    timestamp: new Date().toISOString(),
    ...data
  });
};

// Log system startup
const logStartup = (port, environment) => {
  logger.info('Server Startup', {
    port,
    environment,
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    pid: process.pid,
    timestamp: new Date().toISOString()
  });
};

// Log system shutdown
const logShutdown = (signal) => {
  logger.info('Server Shutdown', {
    signal,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
};

// Graceful shutdown handler
const gracefulShutdown = (signal) => {
  logShutdown(signal);
  
  // Close logger transports
  logger.end();
  
  // Exit process
  process.exit(0);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = {
  logger,
  httpLogger,
  dbLogger,
  authLogger,
  uploadLogger,
  securityLogger,
  performanceLogger,
  businessLogger,
  createComponentLogger,
  logError,
  logSuccess,
  logWarning,
  logSecurityEvent,
  logPerformance,
  logDatabaseOperation,
  logAuthEvent,
  logUploadEvent,
  logBusinessEvent,
  logStartup,
  logShutdown,
  gracefulShutdown
};

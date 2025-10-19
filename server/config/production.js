const path = require('path');
const fs = require('fs');

/**
 * Production Configuration Module
 * Handles all production-specific settings and optimizations
 */

// Environment validation
const requiredEnvVars = [
  'NODE_ENV',
  'MONGODB_URL',
  'JWT_SECRET',
  'FRONTEND_URL'
];

const validateProductionEnvironment = () => {
  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Validate JWT secret strength
  if (process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long for production');
  }

  // Validate MongoDB URL format
  if (!process.env.MONGODB_URL.startsWith('mongodb://') && !process.env.MONGODB_URL.startsWith('mongodb+srv://')) {
    throw new Error('Invalid MONGODB_URL format');
  }

  // Validate frontend URL
  if (!process.env.FRONTEND_URL.startsWith('https://') && process.env.NODE_ENV === 'production') {
    console.warn('WARNING: FRONTEND_URL should use HTTPS in production');
  }
};

// Server configuration
const getServerConfig = () => ({
  port: parseInt(process.env.PORT) || 3000,
  host: process.env.HOST || '0.0.0.0',
  timeout: parseInt(process.env.SERVER_TIMEOUT) || 30000,
  keepAliveTimeout: parseInt(process.env.KEEP_ALIVE_TIMEOUT) || 5000,
  headersTimeout: parseInt(process.env.HEADERS_TIMEOUT) || 60000,
  maxConnections: parseInt(process.env.MAX_CONNECTIONS) || 1000,
  clustering: {
    enabled: process.env.ENABLE_CLUSTERING === 'true',
    workers: parseInt(process.env.CLUSTER_WORKERS) || require('os').cpus().length,
    maxWorkers: 4 // Limit maximum workers
  }
});

// Database configuration for production
const getDatabaseConfig = () => ({
  url: process.env.MONGODB_URL,
  options: {
    // Connection pool settings
    maxPoolSize: parseInt(process.env.DB_MAX_POOL_SIZE) || 10,
    minPoolSize: parseInt(process.env.DB_MIN_POOL_SIZE) || 2,
    
    // Timeout settings
    serverSelectionTimeoutMS: parseInt(process.env.DB_SERVER_SELECTION_TIMEOUT) || 5000,
    socketTimeoutMS: parseInt(process.env.DB_SOCKET_TIMEOUT) || 45000,
    connectTimeoutMS: parseInt(process.env.DB_CONNECT_TIMEOUT) || 10000,
    
    // Retry settings
    retryWrites: true,
    retryReads: true,
    maxIdleTimeMS: parseInt(process.env.DB_MAX_IDLE_TIME) || 30000,
    
    // Write concern
    w: 'majority',
    wtimeoutMS: parseInt(process.env.DB_WRITE_TIMEOUT) || 5000,
    
    // Read preference
    readPreference: 'primaryPreferred',
    
    // Compression
    compressors: ['zlib'],
    zlibCompressionLevel: 6,
    
    // Monitoring
    monitorCommands: process.env.NODE_ENV !== 'production',
    
    // Buffer settings
    bufferMaxEntries: 0, // Disable mongoose buffering
    bufferCommands: false,
    
    // Auto index
    autoIndex: false, // Don't build indexes in production
    autoCreate: false // Don't create collections automatically
  }
});

// Cache configuration
const getCacheConfig = () => ({
  enabled: process.env.ENABLE_CACHE === 'true',
  redis: {
    url: process.env.REDIS_URL,
    options: {
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      enableReadyCheck: true,
      maxRetriesPerRequest: null,
      lazyConnect: true,
      keepAlive: 30000,
      family: 4, // IPv4
      connectTimeout: 10000,
      commandTimeout: 5000
    }
  },
  memory: {
    max: parseInt(process.env.MEMORY_CACHE_MAX) || 100,
    ttl: parseInt(process.env.CACHE_TTL) || 3600,
    checkperiod: parseInt(process.env.CACHE_CHECK_PERIOD) || 600
  },
  compression: {
    enabled: process.env.ENABLE_CACHE_COMPRESSION === 'true',
    threshold: parseInt(process.env.CACHE_COMPRESSION_THRESHOLD) || 1024
  }
});

// Security configuration
const getSecurityConfig = () => ({
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    algorithm: 'HS256',
    issuer: 'engineer-cv',
    audience: 'engineer-cv-users'
  },
  bcrypt: {
    rounds: parseInt(process.env.BCRYPT_ROUNDS) || 12
  },
  session: {
    secret: process.env.SESSION_SECRET || process.env.JWT_SECRET,
    maxAge: parseInt(process.env.SESSION_MAX_AGE) || 86400000, // 24 hours
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict'
  },
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || [process.env.FRONTEND_URL],
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  },
  helmet: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        manifestSrc: ["'self'"]
      }
    },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    },
    noSniff: true,
    xssFilter: true,
    referrerPolicy: { policy: 'same-origin' }
  }
});

// File upload configuration
const getUploadConfig = () => ({
  directory: path.resolve(process.env.UPLOAD_DIR || './uploads'),
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
  allowedTypes: (process.env.ALLOWED_FILE_TYPES || 'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain').split(','),
  maxFiles: parseInt(process.env.MAX_FILES_PER_UPLOAD) || 1,
  preservePath: false,
  createParentPath: true,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024,
    files: parseInt(process.env.MAX_FILES_PER_UPLOAD) || 1,
    fields: 10,
    fieldNameSize: 50,
    fieldSize: 1024 * 1024 // 1MB
  }
});

// Logging configuration
const getLoggingConfig = () => ({
  level: process.env.LOG_LEVEL || 'info',
  file: {
    enabled: true,
    filename: process.env.LOG_FILE || './logs/app.log',
    maxSize: process.env.LOG_MAX_SIZE || '10m',
    maxFiles: parseInt(process.env.LOG_MAX_FILES) || 5,
    datePattern: process.env.LOG_DATE_PATTERN || 'YYYY-MM-DD'
  },
  console: {
    enabled: process.env.NODE_ENV !== 'production',
    colorize: process.env.NODE_ENV !== 'production'
  },
  database: {
    enabled: process.env.LOG_DATABASE_QUERIES === 'true',
    slowQueryThreshold: parseInt(process.env.SLOW_QUERY_THRESHOLD) || 1000
  }
});

// Monitoring configuration
const getMonitoringConfig = () => ({
  enabled: process.env.ENABLE_METRICS === 'true',
  port: parseInt(process.env.METRICS_PORT) || 9090,
  healthCheck: {
    interval: parseInt(process.env.HEALTH_CHECK_INTERVAL) || 30000,
    timeout: parseInt(process.env.HEALTH_CHECK_TIMEOUT) || 5000
  },
  metrics: {
    collectDefault: true,
    timeout: 5000,
    gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
    eventLoopMonitoringPrecision: 10
  }
});

// Performance configuration
const getPerformanceConfig = () => ({
  compression: {
    enabled: process.env.ENABLE_COMPRESSION === 'true',
    level: parseInt(process.env.COMPRESSION_LEVEL) || 6,
    threshold: parseInt(process.env.COMPRESSION_THRESHOLD) || 1024,
    filter: (req, res) => {
      if (req.headers['x-no-compression']) return false;
      return true;
    }
  },
  etag: process.env.ENABLE_ETAG !== 'false',
  staticFiles: {
    maxAge: process.env.STATIC_MAX_AGE || '1d',
    etag: true,
    lastModified: true,
    setHeaders: (res, path) => {
      if (path.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache');
      }
    }
  }
});

// SSL configuration
const getSSLConfig = () => {
  if (process.env.SSL_ENABLED !== 'true') {
    return { enabled: false };
  }

  const certPath = process.env.SSL_CERT_PATH;
  const keyPath = process.env.SSL_KEY_PATH;

  if (!certPath || !keyPath) {
    throw new Error('SSL_CERT_PATH and SSL_KEY_PATH must be provided when SSL is enabled');
  }

  if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
    throw new Error('SSL certificate or key file not found');
  }

  return {
    enabled: true,
    cert: fs.readFileSync(certPath),
    key: fs.readFileSync(keyPath),
    port: parseInt(process.env.SSL_PORT) || 443
  };
};

// Initialize production configuration
const initializeProductionConfig = () => {
  // Validate environment
  validateProductionEnvironment();

  // Create necessary directories
  const uploadDir = path.resolve(process.env.UPLOAD_DIR || './uploads');
  const logsDir = path.resolve('./logs');
  const backupDir = path.resolve('./backups');

  [uploadDir, logsDir, backupDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  // Set Node.js production optimizations
  if (process.env.NODE_ENV === 'production') {
    process.env.NODE_OPTIONS = process.env.NODE_OPTIONS || '--max-old-space-size=2048';
  }

  return {
    server: getServerConfig(),
    database: getDatabaseConfig(),
    cache: getCacheConfig(),
    security: getSecurityConfig(),
    upload: getUploadConfig(),
    logging: getLoggingConfig(),
    monitoring: getMonitoringConfig(),
    performance: getPerformanceConfig(),
    ssl: getSSLConfig()
  };
};

module.exports = {
  validateProductionEnvironment,
  getServerConfig,
  getDatabaseConfig,
  getCacheConfig,
  getSecurityConfig,
  getUploadConfig,
  getLoggingConfig,
  getMonitoringConfig,
  getPerformanceConfig,
  getSSLConfig,
  initializeProductionConfig
};

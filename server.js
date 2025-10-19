const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment-specific configuration
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' :
                process.env.NODE_ENV === 'development' ? '.env.development' : '.env';

if (fs.existsSync(envFile)) {
  dotenv.config({ path: envFile });
  console.log(`📄 Loaded environment from ${envFile}`);
} else {
  dotenv.config();
  console.log('📄 Loaded environment from .env');
}
const multer = require('multer');
const session = require('express-session');
const compression = require('compression');
const cluster = require('cluster');
const os = require('os');
const passport = require('./server/config/passport');

// Import logging and monitoring utilities (temporarily disabled for development)
// const {
//   logger,
//   httpLogger,
//   logStartup,
//   logError,
//   gracefulShutdown
// } = require('./server/utils/logger');
// const {
//   systemMonitor,
//   requestMonitoringMiddleware,
//   databaseMonitoringMiddleware,
//   errorMonitoringMiddleware,
//   healthCheckHandler,
//   metricsHandler
// } = require('./server/middleware/monitoring');
const {
  generalLimiter,
  helmetConfig,
  sanitizeInput,
  securityHeaders,
  corsOptions,
  mongoSanitize,
  hpp
} = require('./server/middleware/security');
const {
  validateEnvironment,
  getSessionConfig,
  getDatabaseConfig
} = require('./server/config/security');
const {
  cacheHealthCheck,
  compressCache,
  warmUpCache
} = require('./server/middleware/cache');
const {
  createIndexes,
  optimizeConnection,
  scheduleMaintenanceTasks
} = require('./server/utils/dbOptimization');

// Environment variables already loaded above

// Validate environment variables
validateEnvironment();

// Production clustering setup
const numCPUs = os.cpus().length;
const isProduction = process.env.NODE_ENV === 'production';
const enableClustering = process.env.ENABLE_CLUSTERING === 'true' && isProduction;

if (enableClustering && cluster.isMaster) {
  console.log(`Master process ${process.pid} is running`);
  console.log(`Starting ${Math.min(numCPUs, 4)} worker processes`); // Limit to 4 workers

  // Fork workers
  const numWorkers = Math.min(numCPUs, 4);
  for (let i = 0; i < numWorkers; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.warn(`Worker ${worker.process.pid} died with code ${code} and signal ${signal}`);
    console.log('Starting a new worker');
    cluster.fork();
  });

  // Graceful shutdown for master
  process.on('SIGTERM', () => {
    console.log('Master received SIGTERM, shutting down gracefully');
    for (const id in cluster.workers) {
      cluster.workers[id].kill();
    }
  });

  // Exit master process - use process.exit instead of return
  process.exit(0);
}

// Worker process or single process mode
console.log(`Worker process ${process.pid} starting`);

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Initialize database monitoring (temporarily disabled)
// databaseMonitoringMiddleware();

// Request monitoring and logging middleware (temporarily disabled)
// app.use(requestMonitoringMiddleware);
// app.use(httpLogger);

// Performance middleware - TEMPORARILY DISABLED to fix ERR_CONTENT_DECODING_FAILED
// app.use(compression({
//   filter: (req, res) => {
//     // Don't compress responses if the request includes a cache-control: no-transform directive
//     if (req.headers['cache-control'] && req.headers['cache-control'].includes('no-transform')) {
//       return false;
//     }
//     // Don't compress auth endpoints to avoid ERR_CONTENT_DECODING_FAILED
//     if (req.path && (req.path.includes('/auth/') || req.path.includes('/upload'))) {
//       return false;
//     }
//     // Use compression filter function
//     return compression.filter(req, res);
//   },
//   level: parseInt(process.env.COMPRESSION_LEVEL) || 6, // Compression level (1-9, 6 is default)
//   threshold: 1024 // Only compress responses larger than 1KB
// }));

// Cache middleware
app.use(cacheHealthCheck);
app.use(compressCache);

// Security middleware
app.use(helmetConfig);
app.use(securityHeaders);
app.use(generalLimiter);
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(mongoSanitize);
app.use(hpp);
app.use(sanitizeInput);

// Session middleware (for OAuth)
app.use(session(getSessionConfig()));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Static files for uploaded resumes with caching
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: '1d', // Cache static files for 1 day
  etag: true,
  lastModified: true
}));

// Database connection with graceful fallback
async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URL, getDatabaseConfig().options);
    console.log('✅ Connected to MongoDB');

    // Optimize database connection
    optimizeConnection();

    // Create database indexes for better performance
    await createIndexes();

    // Schedule maintenance tasks
    scheduleMaintenanceTasks();

    // Warm up cache with frequently accessed data
    await warmUpCache();

    console.log('Database initialization completed');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    console.log('⚠️  Running in development mode without database');
    console.error('Please check:');
    console.error('1. MongoDB URL is correct');
    console.error('2. Network connectivity');
    console.error('3. MongoDB Atlas IP whitelist settings');
    console.log('4. Or install MongoDB locally for development');
    return false;
  }
}

// Connect to database (non-blocking)
connectToDatabase();

// MongoDB connection event listeners
mongoose.connection.on('connected', () => {
  console.log('🔗 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('🔌 Mongoose disconnected from MongoDB');
});

mongoose.connection.on('reconnected', () => {
  console.log('🔗 Mongoose reconnected to MongoDB');
});

// Routes
app.use('/api/auth', require('./server/routes/auth'));
app.use('/api/resumes', require('./server/routes/resumes'));
app.use('/api/jobs', require('./server/routes/jobs'));
app.use('/api/users', require('./server/routes/users'));
app.use('/api/admin', require('./server/routes/admin'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Engineer.CV Backend Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.version
  });
});

// Metrics endpoint (simplified for development)
app.get('/api/metrics', (req, res) => {
  res.json({
    status: 'OK',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});

// Legacy health check for backward compatibility
app.get('/api/status', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Engineer.CV Backend Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.version,
    environment: process.env.NODE_ENV,
    pid: process.pid
  });
});

// Performance monitoring endpoint (simplified for development)
app.get('/api/performance', async (req, res) => {
  try {
    const { getDatabaseStats } = require('./server/utils/dbOptimization');
    const { getCacheStats } = require('./server/middleware/cache');

    const dbStats = await getDatabaseStats();
    const cacheStats = getCacheStats();

    res.json({
      success: true,
      data: {
        server: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          cpu: process.cpuUsage(),
          version: process.version,
          pid: process.pid,
          environment: process.env.NODE_ENV
        },
        database: dbStats,
        cache: cacheStats,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Performance metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get performance metrics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server Error:', error);

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 ? 'Internal server error' : message,
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

// 404 handler
app.use('*', (req, res) => {
  console.log(`Route not found: ${req.method} ${req.url}`);

  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL}`);
});

// Set server timeout
server.timeout = 30000; // 30 seconds

// Handle server errors
server.on('error', (error) => {
  console.error('Server error:', error);
  process.exit(1);
});

// Graceful shutdown handlers
const shutdown = async (signal) => {
  console.log(`\n🚨 Received ${signal}. Graceful shutdown...`);

  // Stop accepting new connections
  server.close(() => {
    console.log('HTTP server closed');
  });

  // Close database connection
  try {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed.');
  } catch (error) {
    console.error('Error closing database:', error);
  }

  console.log('Graceful shutdown completed');
  process.exit(0);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
  process.exit(1);
});

// Worker process exit handler (for clustering)
if (cluster.isWorker) {
  process.on('disconnect', () => {
    console.log('Worker disconnected from master, shutting down');
    shutdown('disconnect');
  });
}

module.exports = app;
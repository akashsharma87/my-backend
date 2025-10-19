const mongoose = require('mongoose');
const { performanceLogger, logError } = require('../utils/logger');
const { getCacheStats } = require('./cache');

// System metrics collection
class SystemMonitor {
  constructor() {
    this.metrics = {
      requests: {
        total: 0,
        success: 0,
        errors: 0,
        averageResponseTime: 0,
        responseTimeHistory: []
      },
      database: {
        connections: 0,
        queries: 0,
        errors: 0,
        averageQueryTime: 0
      },
      memory: {
        used: 0,
        free: 0,
        total: 0,
        percentage: 0
      },
      cpu: {
        usage: 0,
        loadAverage: []
      },
      uptime: 0,
      lastHealthCheck: null,
      errors: []
    };
    
    this.startTime = Date.now();
    this.healthCheckInterval = null;
    
    // Start monitoring
    this.startMonitoring();
  }

  startMonitoring() {
    // Collect metrics every 30 seconds
    this.healthCheckInterval = setInterval(() => {
      this.collectMetrics();
    }, parseInt(process.env.HEALTH_CHECK_INTERVAL) || 30000);
    
    // Log metrics every 5 minutes
    setInterval(() => {
      this.logMetrics();
    }, 5 * 60 * 1000);
  }

  collectMetrics() {
    try {
      // Memory metrics
      const memUsage = process.memoryUsage();
      this.metrics.memory = {
        used: memUsage.heapUsed,
        free: memUsage.heapTotal - memUsage.heapUsed,
        total: memUsage.heapTotal,
        percentage: (memUsage.heapUsed / memUsage.heapTotal) * 100,
        rss: memUsage.rss,
        external: memUsage.external
      };

      // CPU metrics
      this.metrics.cpu = {
        usage: process.cpuUsage(),
        loadAverage: process.loadavg()
      };

      // Uptime
      this.metrics.uptime = process.uptime();

      // Database metrics
      if (mongoose.connection.readyState === 1) {
        this.metrics.database.connections = mongoose.connections.length;
      }

      this.metrics.lastHealthCheck = new Date().toISOString();
      
    } catch (error) {
      logError(error, { component: 'monitoring', operation: 'collectMetrics' });
    }
  }

  logMetrics() {
    performanceLogger.info('System Metrics', {
      ...this.metrics,
      timestamp: new Date().toISOString()
    });
  }

  recordRequest(responseTime, statusCode) {
    this.metrics.requests.total++;
    
    if (statusCode >= 200 && statusCode < 400) {
      this.metrics.requests.success++;
    } else {
      this.metrics.requests.errors++;
    }

    // Update response time metrics
    this.metrics.requests.responseTimeHistory.push(responseTime);
    
    // Keep only last 100 response times
    if (this.metrics.requests.responseTimeHistory.length > 100) {
      this.metrics.requests.responseTimeHistory.shift();
    }

    // Calculate average response time
    const sum = this.metrics.requests.responseTimeHistory.reduce((a, b) => a + b, 0);
    this.metrics.requests.averageResponseTime = sum / this.metrics.requests.responseTimeHistory.length;
  }

  recordDatabaseQuery(queryTime) {
    this.metrics.database.queries++;
    
    // Update average query time (simple moving average)
    const currentAvg = this.metrics.database.averageQueryTime;
    const count = this.metrics.database.queries;
    this.metrics.database.averageQueryTime = ((currentAvg * (count - 1)) + queryTime) / count;
  }

  recordError(error, context = {}) {
    this.metrics.errors.push({
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      context
    });

    // Keep only last 50 errors
    if (this.metrics.errors.length > 50) {
      this.metrics.errors.shift();
    }
  }

  getMetrics() {
    return {
      ...this.metrics,
      timestamp: new Date().toISOString(),
      startTime: this.startTime
    };
  }

  getHealthStatus() {
    const now = Date.now();
    const uptime = now - this.startTime;
    
    // Check various health indicators
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: uptime,
      checks: {
        database: this.checkDatabaseHealth(),
        memory: this.checkMemoryHealth(),
        responseTime: this.checkResponseTimeHealth(),
        errorRate: this.checkErrorRateHealth()
      }
    };

    // Determine overall health status
    const failedChecks = Object.values(health.checks).filter(check => !check.healthy);
    if (failedChecks.length > 0) {
      health.status = failedChecks.some(check => check.critical) ? 'critical' : 'degraded';
    }

    return health;
  }

  checkDatabaseHealth() {
    const isConnected = mongoose.connection.readyState === 1;
    return {
      healthy: isConnected,
      critical: !isConnected,
      message: isConnected ? 'Database connected' : 'Database disconnected',
      details: {
        readyState: mongoose.connection.readyState,
        connections: mongoose.connections.length
      }
    };
  }

  checkMemoryHealth() {
    const memoryPercentage = this.metrics.memory.percentage;
    const isHealthy = memoryPercentage < 85;
    const isCritical = memoryPercentage > 95;
    
    return {
      healthy: isHealthy,
      critical: isCritical,
      message: `Memory usage: ${memoryPercentage.toFixed(2)}%`,
      details: this.metrics.memory
    };
  }

  checkResponseTimeHealth() {
    const avgResponseTime = this.metrics.requests.averageResponseTime;
    const isHealthy = avgResponseTime < 1000; // 1 second
    const isCritical = avgResponseTime > 5000; // 5 seconds
    
    return {
      healthy: isHealthy,
      critical: isCritical,
      message: `Average response time: ${avgResponseTime.toFixed(2)}ms`,
      details: {
        averageResponseTime: avgResponseTime,
        totalRequests: this.metrics.requests.total
      }
    };
  }

  checkErrorRateHealth() {
    const total = this.metrics.requests.total;
    const errors = this.metrics.requests.errors;
    const errorRate = total > 0 ? (errors / total) * 100 : 0;
    
    const isHealthy = errorRate < 5; // 5% error rate
    const isCritical = errorRate > 20; // 20% error rate
    
    return {
      healthy: isHealthy,
      critical: isCritical,
      message: `Error rate: ${errorRate.toFixed(2)}%`,
      details: {
        errorRate,
        totalRequests: total,
        totalErrors: errors
      }
    };
  }

  stop() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
  }
}

// Create global monitor instance
const systemMonitor = new SystemMonitor();

// Request monitoring middleware
const requestMonitoringMiddleware = (req, res, next) => {
  const startTime = Date.now();
  
  // Add request ID for tracing
  req.id = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    systemMonitor.recordRequest(responseTime, res.statusCode);
    
    // Log slow requests
    if (responseTime > 2000) {
      performanceLogger.warn('Slow Request', {
        method: req.method,
        url: req.url,
        responseTime: `${responseTime}ms`,
        statusCode: res.statusCode,
        requestId: req.id
      });
    }
  });
  
  next();
};

// Database monitoring middleware
const databaseMonitoringMiddleware = () => {
  // Monitor mongoose queries
  mongoose.set('debug', (collectionName, method, query, doc, options) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`MongoDB Query: ${collectionName}.${method}`, query);
    }
  });

  // Monitor connection events
  mongoose.connection.on('connected', () => {
    performanceLogger.info('Database Connected', {
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name
    });
  });

  mongoose.connection.on('error', (error) => {
    systemMonitor.recordError(error, { component: 'database' });
    logError(error, { component: 'database' });
  });

  mongoose.connection.on('disconnected', () => {
    performanceLogger.warn('Database Disconnected');
  });
};

// Error monitoring middleware
const errorMonitoringMiddleware = (error, req, res, next) => {
  systemMonitor.recordError(error, {
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    userId: req.user?.id,
    requestId: req.id
  });
  
  next(error);
};

// Health check endpoint handler
const healthCheckHandler = async (req, res) => {
  try {
    const health = systemMonitor.getHealthStatus();
    const cacheStats = getCacheStats();
    
    const response = {
      ...health,
      cache: cacheStats,
      version: process.env.BUILD_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    };
    
    const statusCode = health.status === 'healthy' ? 200 : 
                      health.status === 'degraded' ? 200 : 503;
    
    res.status(statusCode).json(response);
  } catch (error) {
    logError(error, { component: 'health-check' });
    res.status(500).json({
      status: 'error',
      message: 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
};

// Metrics endpoint handler
const metricsHandler = (req, res) => {
  try {
    const metrics = systemMonitor.getMetrics();
    res.json(metrics);
  } catch (error) {
    logError(error, { component: 'metrics' });
    res.status(500).json({
      error: 'Failed to retrieve metrics',
      timestamp: new Date().toISOString()
    });
  }
};

// Graceful shutdown handler
const gracefulShutdown = (signal) => {
  console.log(`Received ${signal}. Starting graceful shutdown...`);
  
  systemMonitor.stop();
  
  // Close database connection
  mongoose.connection.close(() => {
    console.log('Database connection closed.');
    process.exit(0);
  });
};

// Handle shutdown signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

module.exports = {
  systemMonitor,
  requestMonitoringMiddleware,
  databaseMonitoringMiddleware,
  errorMonitoringMiddleware,
  healthCheckHandler,
  metricsHandler,
  gracefulShutdown
};

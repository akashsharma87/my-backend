const NodeCache = require('node-cache');

// Create cache instances for different types of data
const apiCache = new NodeCache({ 
  stdTTL: 300, // 5 minutes default
  checkperiod: 60, // Check for expired keys every minute
  useClones: false // Better performance, but be careful with object mutations
});

const userCache = new NodeCache({ 
  stdTTL: 900, // 15 minutes for user data
  checkperiod: 120,
  useClones: false
});

const resumeCache = new NodeCache({ 
  stdTTL: 600, // 10 minutes for resume data
  checkperiod: 90,
  useClones: false
});

const jobCache = new NodeCache({ 
  stdTTL: 1800, // 30 minutes for job listings
  checkperiod: 300,
  useClones: false
});

/**
 * Generic cache middleware factory
 * @param {NodeCache} cache - Cache instance to use
 * @param {Function} keyGenerator - Function to generate cache key from request
 * @param {number} ttl - Time to live in seconds (optional)
 */
const createCacheMiddleware = (cache, keyGenerator, ttl) => {
  return (req, res, next) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const key = keyGenerator(req);
    const cachedData = cache.get(key);

    if (cachedData) {
      // Add cache headers
      res.set({
        'X-Cache': 'HIT',
        'Cache-Control': 'public, max-age=300'
      });
      
      return res.json(cachedData);
    }

    // Store original json method
    const originalJson = res.json;

    // Override json method to cache the response
    res.json = function(data) {
      // Only cache successful responses
      if (res.statusCode === 200 && data && data.success !== false) {
        cache.set(key, data, ttl);
      }

      // Add cache headers
      res.set({
        'X-Cache': 'MISS',
        'Cache-Control': 'public, max-age=300'
      });

      // Call original json method
      return originalJson.call(this, data);
    };

    next();
  };
};

/**
 * Cache middleware for API responses
 * @param {number} ttl - Time to live in seconds
 */
const cacheApiResponse = (ttl = 300) => {
  return createCacheMiddleware(
    apiCache,
    (req) => `api:${req.originalUrl}:${JSON.stringify(req.query)}`,
    ttl
  );
};

/**
 * Cache middleware for user data
 * @param {number} ttl - Time to live in seconds
 */
const cacheUserData = (ttl = 900) => {
  return createCacheMiddleware(
    userCache,
    (req) => `user:${req.user?.id || 'anonymous'}:${req.originalUrl}`,
    ttl
  );
};

/**
 * Cache middleware for resume data
 * @param {number} ttl - Time to live in seconds
 */
const cacheResumeData = (ttl = 600) => {
  return createCacheMiddleware(
    resumeCache,
    (req) => `resume:${req.originalUrl}:${JSON.stringify(req.query)}`,
    ttl
  );
};

/**
 * Cache middleware for job data
 * @param {number} ttl - Time to live in seconds
 */
const cacheJobData = (ttl = 1800) => {
  return createCacheMiddleware(
    jobCache,
    (req) => `job:${req.originalUrl}:${JSON.stringify(req.query)}`,
    ttl
  );
};

/**
 * Invalidate cache for specific patterns
 * @param {string} pattern - Pattern to match cache keys
 * @param {NodeCache} cache - Cache instance (optional, defaults to all)
 */
const invalidateCache = (pattern, cache = null) => {
  const caches = cache ? [cache] : [apiCache, userCache, resumeCache, jobCache];
  
  caches.forEach(cacheInstance => {
    const keys = cacheInstance.keys();
    const keysToDelete = keys.filter(key => key.includes(pattern));
    
    if (keysToDelete.length > 0) {
      cacheInstance.del(keysToDelete);
      console.log(`Invalidated ${keysToDelete.length} cache entries for pattern: ${pattern}`);
    }
  });
};

/**
 * Middleware to invalidate cache on data modifications
 */
const invalidateCacheOnModification = (patterns = []) => {
  return (req, res, next) => {
    // Only invalidate on non-GET requests
    if (req.method === 'GET') {
      return next();
    }

    // Store original json method
    const originalJson = res.json;

    // Override json method to invalidate cache after successful operations
    res.json = function(data) {
      // Only invalidate on successful operations
      if (res.statusCode < 400 && data && data.success !== false) {
        patterns.forEach(pattern => {
          invalidateCache(pattern);
        });
      }

      // Call original json method
      return originalJson.call(this, data);
    };

    next();
  };
};

/**
 * Get cache statistics
 */
const getCacheStats = () => {
  return {
    api: {
      keys: apiCache.keys().length,
      hits: apiCache.getStats().hits,
      misses: apiCache.getStats().misses,
      ksize: apiCache.getStats().ksize,
      vsize: apiCache.getStats().vsize
    },
    user: {
      keys: userCache.keys().length,
      hits: userCache.getStats().hits,
      misses: userCache.getStats().misses,
      ksize: userCache.getStats().ksize,
      vsize: userCache.getStats().vsize
    },
    resume: {
      keys: resumeCache.keys().length,
      hits: resumeCache.getStats().hits,
      misses: resumeCache.getStats().misses,
      ksize: resumeCache.getStats().ksize,
      vsize: resumeCache.getStats().vsize
    },
    job: {
      keys: jobCache.keys().length,
      hits: jobCache.getStats().hits,
      misses: jobCache.getStats().misses,
      ksize: jobCache.getStats().ksize,
      vsize: jobCache.getStats().vsize
    }
  };
};

/**
 * Clear all caches
 */
const clearAllCaches = () => {
  apiCache.flushAll();
  userCache.flushAll();
  resumeCache.flushAll();
  jobCache.flushAll();
  console.log('All caches cleared');
};

/**
 * Warm up cache with frequently accessed data
 */
const warmUpCache = async () => {
  try {
    // This would typically pre-load frequently accessed data
    console.log('Cache warm-up completed');
  } catch (error) {
    console.error('Cache warm-up failed:', error);
  }
};

/**
 * Cache health check middleware
 */
const cacheHealthCheck = (req, res, next) => {
  if (req.path === '/api/cache/health') {
    const stats = getCacheStats();
    const totalKeys = Object.values(stats).reduce((sum, cache) => sum + cache.keys, 0);
    const totalHits = Object.values(stats).reduce((sum, cache) => sum + cache.hits, 0);
    const totalMisses = Object.values(stats).reduce((sum, cache) => sum + cache.misses, 0);
    const hitRate = totalHits + totalMisses > 0 ? (totalHits / (totalHits + totalMisses) * 100).toFixed(2) : 0;

    return res.json({
      success: true,
      data: {
        ...stats,
        summary: {
          totalKeys,
          totalHits,
          totalMisses,
          hitRate: `${hitRate}%`
        }
      }
    });
  }
  next();
};

/**
 * Compression middleware for cached responses - TEMPORARILY DISABLED
 */
const compressCache = (req, res, next) => {
  // TEMPORARILY DISABLED to fix ERR_CONTENT_DECODING_FAILED
  // const originalJson = res.json;

  // res.json = function(data) {
  //   // Don't add compression headers for auth and upload endpoints to avoid ERR_CONTENT_DECODING_FAILED
  //   if (req.path && (req.path.includes('/auth/') || req.path.includes('/upload'))) {
  //     return originalJson.call(this, data);
  //   }

  //   // Add compression headers for large responses
  //   if (JSON.stringify(data).length > 1024) { // 1KB threshold
  //     res.set('Content-Encoding', 'gzip');
  //   }

  //   return originalJson.call(this, data);
  // };

  next();
};

// Event listeners for cache events
apiCache.on('set', (key, value) => {
  console.log(`Cache SET: ${key}`);
});

apiCache.on('expired', (key, value) => {
  console.log(`Cache EXPIRED: ${key}`);
});

apiCache.on('del', (key, value) => {
  console.log(`Cache DELETE: ${key}`);
});

module.exports = {
  // Cache middleware
  cacheApiResponse,
  cacheUserData,
  cacheResumeData,
  cacheJobData,
  
  // Cache management
  invalidateCache,
  invalidateCacheOnModification,
  clearAllCaches,
  warmUpCache,
  
  // Cache utilities
  getCacheStats,
  cacheHealthCheck,
  compressCache,
  
  // Direct cache access (use with caution)
  apiCache,
  userCache,
  resumeCache,
  jobCache
};

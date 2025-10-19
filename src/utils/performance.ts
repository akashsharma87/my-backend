// Performance optimization utilities

/**
 * Debounce function to limit the rate of function calls
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @param immediate - Execute immediately on first call
 */
export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number,
  immediate = false
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    
    const callNow = immediate && !timeout;
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) func(...args);
  };
};

/**
 * Throttle function to limit function execution frequency
 * @param func - Function to throttle
 * @param limit - Time limit in milliseconds
 */
export const throttle = <T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Lazy load images with intersection observer
 * @param imageElement - Image element to lazy load
 * @param src - Image source URL
 * @param placeholder - Placeholder image URL
 */
export const lazyLoadImage = (
  imageElement: HTMLImageElement,
  src: string,
  placeholder?: string
): void => {
  if (placeholder) {
    imageElement.src = placeholder;
  }

  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        img.src = src;
        img.classList.remove('lazy');
        observer.unobserve(img);
      }
    });
  });

  imageObserver.observe(imageElement);
};

/**
 * Preload critical resources
 * @param urls - Array of URLs to preload
 * @param type - Resource type (image, script, style)
 */
export const preloadResources = (
  urls: string[],
  type: 'image' | 'script' | 'style' = 'image'
): Promise<void[]> => {
  const promises = urls.map(url => {
    return new Promise<void>((resolve, reject) => {
      if (type === 'image') {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = url;
      } else {
        const link = document.createElement('link');
        link.rel = type === 'script' ? 'preload' : 'prefetch';
        link.as = type === 'script' ? 'script' : 'style';
        link.href = url;
        link.onload = () => resolve();
        link.onerror = reject;
        document.head.appendChild(link);
      }
    });
  });

  return Promise.all(promises);
};

/**
 * Measure and log performance metrics
 * @param name - Performance mark name
 * @param startTime - Start time (optional)
 */
export const measurePerformance = (name: string, startTime?: number): void => {
  if (typeof window !== 'undefined' && window.performance) {
    if (startTime) {
      const duration = performance.now() - startTime;
      console.log(`${name}: ${duration.toFixed(2)}ms`);
    } else {
      performance.mark(name);
    }
  }
};

/**
 * Get performance metrics
 */
export const getPerformanceMetrics = (): Record<string, number> => {
  if (typeof window === 'undefined' || !window.performance) {
    return {};
  }

  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  
  return {
    // Page load metrics
    domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
    loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
    
    // Network metrics
    dnsLookup: navigation.domainLookupEnd - navigation.domainLookupStart,
    tcpConnection: navigation.connectEnd - navigation.connectStart,
    serverResponse: navigation.responseEnd - navigation.requestStart,
    
    // Rendering metrics
    domProcessing: navigation.domComplete - navigation.domLoading,
    
    // Total metrics
    totalLoadTime: navigation.loadEventEnd - navigation.navigationStart,
    firstContentfulPaint: getFirstContentfulPaint(),
    largestContentfulPaint: getLargestContentfulPaint()
  };
};

/**
 * Get First Contentful Paint metric
 */
const getFirstContentfulPaint = (): number => {
  const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0];
  return fcpEntry ? fcpEntry.startTime : 0;
};

/**
 * Get Largest Contentful Paint metric
 */
const getLargestContentfulPaint = (): number => {
  return new Promise<number>((resolve) => {
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      resolve(lastEntry.startTime);
    }).observe({ entryTypes: ['largest-contentful-paint'] });
  }) as unknown as number;
};

/**
 * Optimize bundle loading with dynamic imports
 * @param importFunction - Dynamic import function
 * @param fallback - Fallback component
 */
export const optimizeImport = async <T>(
  importFunction: () => Promise<{ default: T }>,
  fallback?: T
): Promise<T> => {
  try {
    const module = await importFunction();
    return module.default;
  } catch (error) {
    console.error('Failed to load module:', error);
    if (fallback) {
      return fallback;
    }
    throw error;
  }
};

/**
 * Cache API responses in memory
 */
class MemoryCache {
  private cache = new Map<string, { data: unknown; timestamp: number; ttl: number }>();

  set(key: string, data: unknown, ttl = 300000): void { // 5 minutes default
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

export const memoryCache = new MemoryCache();

/**
 * Create a cached version of an async function
 * @param fn - Async function to cache
 * @param keyGenerator - Function to generate cache key
 * @param ttl - Time to live in milliseconds
 */
export const createCachedFunction = <T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  keyGenerator: (...args: T) => string,
  ttl = 300000
) => {
  return async (...args: T): Promise<R> => {
    const key = keyGenerator(...args);
    const cached = memoryCache.get<R>(key);
    
    if (cached !== null) {
      return cached;
    }

    const result = await fn(...args);
    memoryCache.set(key, result, ttl);
    return result;
  };
};

/**
 * Batch multiple API calls
 * @param calls - Array of API call functions
 * @param batchSize - Number of calls to execute in parallel
 */
export const batchApiCalls = async <T>(
  calls: (() => Promise<T>)[],
  batchSize = 5
): Promise<T[]> => {
  const results: T[] = [];
  
  for (let i = 0; i < calls.length; i += batchSize) {
    const batch = calls.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(call => call()));
    results.push(...batchResults);
  }
  
  return results;
};

/**
 * Check if user prefers reduced motion
 */
export const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Get connection speed information
 */
export const getConnectionInfo = (): {
  effectiveType: string;
  downlink: number;
  rtt: number;
} | null => {
  if (typeof navigator === 'undefined' || !('connection' in navigator)) {
    return null;
  }

  const connection = (navigator as any).connection;
  return {
    effectiveType: connection.effectiveType || 'unknown',
    downlink: connection.downlink || 0,
    rtt: connection.rtt || 0
  };
};

import { config } from '../config/api';

const API_BASE_URL = config.API_BASE_URL;

// Cache for API responses
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

// Pending requests to prevent duplicate calls
const pendingRequests = new Map<string, Promise<any>>();

// Request queue for batching
const requestQueue = new Map<string, { resolve: Function; reject: Function; timestamp: number }[]>();

interface ApiCallOptions extends RequestInit {
  cache?: boolean;
  cacheTTL?: number;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

// Generate cache key from URL and options
const generateCacheKey = (url: string, options: ApiCallOptions = {}): string => {
  const { method = 'GET', body } = options;
  const bodyStr = body ? (typeof body === 'string' ? body : JSON.stringify(body)) : '';
  return `${method}:${url}:${bodyStr}`;
};

// Check if cached data is still valid
const getCachedData = (key: string): any | null => {
  const cached = cache.get(key);
  if (!cached) return null;
  
  if (Date.now() - cached.timestamp > cached.ttl) {
    cache.delete(key);
    return null;
  }
  
  return cached.data;
};

// Store data in cache
const setCachedData = (key: string, data: any, ttl: number = 300000): void => {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl
  });
};

// Clear cache entries
export const clearCache = (pattern?: string): void => {
  if (!pattern) {
    cache.clear();
    return;
  }
  
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  }
};

// Optimized API call with caching, deduplication, and retry logic
export const optimizedApiCall = async (
  endpoint: string, 
  options: ApiCallOptions = {}
): Promise<any> => {
  const {
    cache: useCache = true,
    cacheTTL = 300000, // 5 minutes default
    timeout = 10000, // 10 seconds default
    retries = 3,
    retryDelay = 1000,
    ...fetchOptions
  } = options;

  const url = `${API_BASE_URL}${endpoint}`;
  const cacheKey = generateCacheKey(url, options);
  
  // Check cache first for GET requests - but only if cache is enabled
  if (useCache && (!fetchOptions.method || fetchOptions.method === 'GET')) {
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      console.log(`[API CACHE] Using cached data for ${endpoint}`);
      return cachedData;
    }
  }

  // If cache is disabled, clear any existing cache for this endpoint
  if (!useCache) {
    cache.delete(cacheKey);
    console.log(`[API CACHE] Cache disabled, cleared cache for ${endpoint}`);
  }

  // Check if request is already pending (deduplication)
  if (pendingRequests.has(cacheKey)) {
    return pendingRequests.get(cacheKey);
  }

  // Prepare request configuration
  const token = localStorage.getItem('token');
  const config: RequestInit = {
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
      ...fetchOptions.headers,
    },
    ...fetchOptions,
  };

  // Don't set Content-Type for FormData
  if (!(fetchOptions.body instanceof FormData) && 
      !Object.prototype.hasOwnProperty.call(config.headers || {}, 'Content-Type')) {
    config.headers = {
      'Content-Type': 'application/json',
      ...config.headers,
    };
  }

  // Create the request promise with timeout and retry logic
  const requestPromise = (async (): Promise<any> => {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // Create timeout promise
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), timeout);
        });

        // Make the actual request
        const fetchPromise = fetch(url, config);
        
        // Race between fetch and timeout
        const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;
        
        if (!response.ok) {
          let errorData;
          try {
            errorData = await response.json();
          } catch {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          throw new Error(errorData.message || 'Something went wrong');
        }

        const data = await response.json();
        
        // Cache successful GET responses
        if (useCache && (!fetchOptions.method || fetchOptions.method === 'GET')) {
          setCachedData(cacheKey, data, cacheTTL);
        }

        return data;
        
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on certain errors
        if (error instanceof Error && 
            (error.message.includes('400') || 
             error.message.includes('401') || 
             error.message.includes('403') || 
             error.message.includes('404'))) {
          break;
        }
        
        // Wait before retry (exponential backoff)
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
        }
      }
    }
    
    throw lastError;
  })();

  // Store pending request
  pendingRequests.set(cacheKey, requestPromise);

  try {
    const result = await requestPromise;
    return result;
  } finally {
    // Clean up pending request
    pendingRequests.delete(cacheKey);
  }
};

// Batch multiple API calls
export const batchApiCalls = async <T>(
  calls: (() => Promise<T>)[],
  batchSize: number = 5
): Promise<T[]> => {
  const results: T[] = [];
  
  for (let i = 0; i < calls.length; i += batchSize) {
    const batch = calls.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(call => call()));
    results.push(...batchResults);
  }
  
  return results;
};

// Debounced API call
export const debouncedApiCall = (() => {
  const debounceMap = new Map<string, NodeJS.Timeout>();
  
  return (
    key: string,
    apiCall: () => Promise<any>,
    delay: number = 300
  ): Promise<any> => {
    return new Promise((resolve, reject) => {
      // Clear existing timeout
      if (debounceMap.has(key)) {
        clearTimeout(debounceMap.get(key)!);
      }
      
      // Set new timeout
      const timeoutId = setTimeout(async () => {
        try {
          const result = await apiCall();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          debounceMap.delete(key);
        }
      }, delay);
      
      debounceMap.set(key, timeoutId);
    });
  };
})();

// Preload data
export const preloadData = async (endpoints: string[]): Promise<void> => {
  const preloadPromises = endpoints.map(endpoint => 
    optimizedApiCall(endpoint, { cache: true, cacheTTL: 600000 }) // 10 minutes cache
      .catch(error => console.warn(`Failed to preload ${endpoint}:`, error))
  );
  
  await Promise.allSettled(preloadPromises);
};

export default optimizedApiCall;

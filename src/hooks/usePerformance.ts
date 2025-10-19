import { useEffect, useRef, useState, useCallback } from 'react';
import { getPerformanceMetrics, measurePerformance, getConnectionInfo } from '../utils/performance';

interface PerformanceMetrics {
  domContentLoaded: number;
  loadComplete: number;
  dnsLookup: number;
  tcpConnection: number;
  serverResponse: number;
  domProcessing: number;
  totalLoadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
}

interface ConnectionInfo {
  effectiveType: string;
  downlink: number;
  rtt: number;
}

/**
 * Hook for monitoring component performance
 * @param componentName - Name of the component for tracking
 */
export const useComponentPerformance = (componentName: string) => {
  const mountTime = useRef<number>(0);
  const renderCount = useRef<number>(0);

  useEffect(() => {
    mountTime.current = performance.now();
    measurePerformance(`${componentName}-mount-start`);

    return () => {
      const unmountTime = performance.now();
      const totalMountTime = unmountTime - mountTime.current;
      console.log(`${componentName} was mounted for ${totalMountTime.toFixed(2)}ms`);
      measurePerformance(`${componentName}-unmount`);
    };
  }, [componentName]);

  useEffect(() => {
    renderCount.current += 1;
    measurePerformance(`${componentName}-render-${renderCount.current}`);
  });

  const logRenderCount = useCallback(() => {
    console.log(`${componentName} has rendered ${renderCount.current} times`);
  }, [componentName]);

  return { renderCount: renderCount.current, logRenderCount };
};

/**
 * Hook for monitoring page performance metrics
 */
export const usePagePerformance = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadMetrics = () => {
      try {
        const performanceMetrics = getPerformanceMetrics();
        const connection = getConnectionInfo();
        
        setMetrics(performanceMetrics as PerformanceMetrics);
        setConnectionInfo(connection);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to load performance metrics:', error);
        setIsLoading(false);
      }
    };

    // Wait for page to fully load before collecting metrics
    if (document.readyState === 'complete') {
      loadMetrics();
    } else {
      window.addEventListener('load', loadMetrics);
      return () => window.removeEventListener('load', loadMetrics);
    }
  }, []);

  const refreshMetrics = useCallback(() => {
    setIsLoading(true);
    const performanceMetrics = getPerformanceMetrics();
    const connection = getConnectionInfo();
    
    setMetrics(performanceMetrics as PerformanceMetrics);
    setConnectionInfo(connection);
    setIsLoading(false);
  }, []);

  return {
    metrics,
    connectionInfo,
    isLoading,
    refreshMetrics
  };
};

/**
 * Hook for measuring API call performance
 */
export const useApiPerformance = () => {
  const [apiMetrics, setApiMetrics] = useState<Record<string, number>>({});

  const measureApiCall = useCallback(async <T>(
    apiName: string,
    apiCall: () => Promise<T>
  ): Promise<T> => {
    const startTime = performance.now();
    
    try {
      const result = await apiCall();
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      setApiMetrics(prev => ({
        ...prev,
        [apiName]: duration
      }));
      
      console.log(`API call ${apiName} took ${duration.toFixed(2)}ms`);
      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      setApiMetrics(prev => ({
        ...prev,
        [`${apiName}-error`]: duration
      }));
      
      console.error(`API call ${apiName} failed after ${duration.toFixed(2)}ms:`, error);
      throw error;
    }
  }, []);

  const getAverageApiTime = useCallback((apiName: string): number => {
    const relevantMetrics = Object.entries(apiMetrics)
      .filter(([key]) => key.startsWith(apiName) && !key.includes('error'))
      .map(([, value]) => value);
    
    if (relevantMetrics.length === 0) return 0;
    
    return relevantMetrics.reduce((sum, time) => sum + time, 0) / relevantMetrics.length;
  }, [apiMetrics]);

  return {
    apiMetrics,
    measureApiCall,
    getAverageApiTime
  };
};

/**
 * Hook for monitoring memory usage
 */
export const useMemoryMonitor = () => {
  const [memoryInfo, setMemoryInfo] = useState<{
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  } | null>(null);

  useEffect(() => {
    const updateMemoryInfo = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        setMemoryInfo({
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit
        });
      }
    };

    updateMemoryInfo();
    const interval = setInterval(updateMemoryInfo, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const getMemoryUsagePercentage = useCallback((): number => {
    if (!memoryInfo) return 0;
    return (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100;
  }, [memoryInfo]);

  return {
    memoryInfo,
    getMemoryUsagePercentage
  };
};

/**
 * Hook for detecting slow renders
 */
export const useRenderPerformance = (componentName: string, threshold = 16) => {
  const renderStart = useRef<number>(0);
  const slowRenderCount = useRef<number>(0);

  useEffect(() => {
    renderStart.current = performance.now();
  });

  useEffect(() => {
    const renderEnd = performance.now();
    const renderTime = renderEnd - renderStart.current;

    if (renderTime > threshold) {
      slowRenderCount.current += 1;
      console.warn(
        `Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms (threshold: ${threshold}ms)`
      );
    }
  });

  return {
    slowRenderCount: slowRenderCount.current
  };
};

/**
 * Hook for monitoring bundle loading performance
 */
export const useBundlePerformance = () => {
  const [bundleMetrics, setBundleMetrics] = useState<{
    totalBundleSize: number;
    loadedChunks: string[];
    failedChunks: string[];
  }>({
    totalBundleSize: 0,
    loadedChunks: [],
    failedChunks: []
  });

  useEffect(() => {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      
      entries.forEach((entry) => {
        if (entry.name.includes('.js') || entry.name.includes('.css')) {
          setBundleMetrics(prev => ({
            ...prev,
            totalBundleSize: prev.totalBundleSize + (entry as any).transferSize || 0,
            loadedChunks: [...prev.loadedChunks, entry.name]
          }));
        }
      });
    });

    observer.observe({ entryTypes: ['resource'] });

    return () => observer.disconnect();
  }, []);

  return bundleMetrics;
};

/**
 * Hook for optimizing images based on connection speed
 */
export const useImageOptimization = () => {
  const [shouldLoadHighQuality, setShouldLoadHighQuality] = useState(true);

  useEffect(() => {
    const connection = getConnectionInfo();
    
    if (connection) {
      // Load lower quality images on slow connections
      const isSlowConnection = connection.effectiveType === '2g' || 
                              connection.effectiveType === 'slow-2g' ||
                              connection.downlink < 1;
      
      setShouldLoadHighQuality(!isSlowConnection);
    }
  }, []);

  const getOptimizedImageUrl = useCallback((baseUrl: string, highQuality = true): string => {
    if (!shouldLoadHighQuality && highQuality) {
      // Return a lower quality version
      return baseUrl.replace(/\.(jpg|jpeg|png)$/i, '_low.$1');
    }
    return baseUrl;
  }, [shouldLoadHighQuality]);

  return {
    shouldLoadHighQuality,
    getOptimizedImageUrl
  };
};

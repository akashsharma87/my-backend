import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Database, Zap, Clock, TrendingUp } from 'lucide-react';
import { usePagePerformance, useMemoryMonitor } from '../hooks/usePerformance';

interface PerformanceData {
  server: {
    uptime: number;
    memory: {
      rss: number;
      heapUsed: number;
      heapTotal: number;
      external: number;
    };
    cpu: {
      user: number;
      system: number;
    };
    version: string;
  };
  database: {
    database: {
      collections: number;
      dataSize: number;
      indexSize: number;
      storageSize: number;
    };
    collections: Record<string, any>;
  };
  cache: {
    api: {
      keys: number;
      hits: number;
      misses: number;
    };
    user: {
      keys: number;
      hits: number;
      misses: number;
    };
    resume: {
      keys: number;
      hits: number;
      misses: number;
    };
    job: {
      keys: number;
      hits: number;
      misses: number;
    };
  };
}

const PerformanceMonitor: React.FC = () => {
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { metrics: pageMetrics } = usePagePerformance();
  const { memoryInfo, getMemoryUsagePercentage } = useMemoryMonitor();

  useEffect(() => {
    fetchPerformanceData();
    const interval = setInterval(fetchPerformanceData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchPerformanceData = async () => {
    try {
      const response = await fetch('/api/performance');
      if (!response.ok) {
        throw new Error('Failed to fetch performance data');
      }
      const data = await response.json();
      setPerformanceData(data.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const calculateCacheHitRate = (hits: number, misses: number): string => {
    const total = hits + misses;
    if (total === 0) return '0%';
    return ((hits / total) * 100).toFixed(1) + '%';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Error loading performance data: {error}</p>
        <button
          onClick={fetchPerformanceData}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!performanceData) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Activity className="w-6 h-6 text-primary-600" />
        <h2 className="text-2xl font-bold text-mono-900">Performance Monitor</h2>
      </div>

      {/* Server Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-md p-6"
      >
        <div className="flex items-center space-x-2 mb-4">
          <Zap className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold text-mono-900">Server Performance</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-sm text-green-600 font-medium">Uptime</div>
            <div className="text-2xl font-bold text-green-700">
              {formatUptime(performanceData.server.uptime)}
            </div>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-sm text-blue-600 font-medium">Memory Usage</div>
            <div className="text-2xl font-bold text-blue-700">
              {formatBytes(performanceData.server.memory.heapUsed)}
            </div>
            <div className="text-xs text-blue-500">
              / {formatBytes(performanceData.server.memory.heapTotal)}
            </div>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-sm text-purple-600 font-medium">Node.js Version</div>
            <div className="text-2xl font-bold text-purple-700">
              {performanceData.server.version}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Database Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-lg shadow-md p-6"
      >
        <div className="flex items-center space-x-2 mb-4">
          <Database className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-mono-900">Database Performance</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-sm text-blue-600 font-medium">Collections</div>
            <div className="text-2xl font-bold text-blue-700">
              {performanceData.database.database.collections}
            </div>
          </div>
          
          <div className="bg-indigo-50 rounded-lg p-4">
            <div className="text-sm text-indigo-600 font-medium">Data Size</div>
            <div className="text-2xl font-bold text-indigo-700">
              {formatBytes(performanceData.database.database.dataSize)}
            </div>
          </div>
          
          <div className="bg-cyan-50 rounded-lg p-4">
            <div className="text-sm text-cyan-600 font-medium">Index Size</div>
            <div className="text-2xl font-bold text-cyan-700">
              {formatBytes(performanceData.database.database.indexSize)}
            </div>
          </div>
          
          <div className="bg-teal-50 rounded-lg p-4">
            <div className="text-sm text-teal-600 font-medium">Storage Size</div>
            <div className="text-2xl font-bold text-teal-700">
              {formatBytes(performanceData.database.database.storageSize)}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Cache Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-lg shadow-md p-6"
      >
        <div className="flex items-center space-x-2 mb-4">
          <TrendingUp className="w-5 h-5 text-orange-600" />
          <h3 className="text-lg font-semibold text-mono-900">Cache Performance</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Object.entries(performanceData.cache).map(([cacheType, cacheData]) => (
            <div key={cacheType} className="bg-orange-50 rounded-lg p-4">
              <div className="text-sm text-orange-600 font-medium capitalize">
                {cacheType} Cache
              </div>
              <div className="text-lg font-bold text-orange-700">
                {calculateCacheHitRate(cacheData.hits, cacheData.misses)}
              </div>
              <div className="text-xs text-orange-500">
                {cacheData.keys} keys, {cacheData.hits} hits
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Client-side Performance */}
      {(pageMetrics || memoryInfo) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <div className="flex items-center space-x-2 mb-4">
            <Clock className="w-5 h-5 text-yellow-600" />
            <h3 className="text-lg font-semibold text-mono-900">Client Performance</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {pageMetrics && (
              <>
                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="text-sm text-yellow-600 font-medium">DOM Content Loaded</div>
                  <div className="text-2xl font-bold text-yellow-700">
                    {pageMetrics.domContentLoaded.toFixed(0)}ms
                  </div>
                </div>
                
                <div className="bg-amber-50 rounded-lg p-4">
                  <div className="text-sm text-amber-600 font-medium">Total Load Time</div>
                  <div className="text-2xl font-bold text-amber-700">
                    {pageMetrics.totalLoadTime.toFixed(0)}ms
                  </div>
                </div>
              </>
            )}
            
            {memoryInfo && (
              <div className="bg-red-50 rounded-lg p-4">
                <div className="text-sm text-red-600 font-medium">Memory Usage</div>
                <div className="text-2xl font-bold text-red-700">
                  {getMemoryUsagePercentage().toFixed(1)}%
                </div>
                <div className="text-xs text-red-500">
                  {formatBytes(memoryInfo.usedJSHeapSize)}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default PerformanceMonitor;

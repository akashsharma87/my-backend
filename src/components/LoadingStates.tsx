import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, RefreshCw, WifiOff } from 'lucide-react';

// Inline loading spinner for buttons
export const ButtonSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'sm' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  return (
    <div className={`animate-spin rounded-full border-2 border-current border-t-transparent ${sizeClasses[size]}`} />
  );
};

// Page-level loading spinner
export const PageSpinner: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <motion.div
        className="w-8 h-8 border-2 border-mono-300 border-t-mono-900 rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
      <p className="text-mono-600 text-sm">{message}</p>
    </div>
  );
};

// Skeleton loader for resume cards
export const ResumeCardSkeleton: React.FC = () => {
  return (
    <div className="card-minimal p-6 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="h-4 bg-mono-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-mono-200 rounded w-1/2"></div>
        </div>
        <div className="h-8 w-8 bg-mono-200 rounded"></div>
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-3 bg-mono-200 rounded w-full"></div>
        <div className="h-3 bg-mono-200 rounded w-2/3"></div>
      </div>
      <div className="flex space-x-2">
        <div className="h-8 bg-mono-200 rounded w-24"></div>
        <div className="h-8 bg-mono-200 rounded w-20"></div>
      </div>
    </div>
  );
};

// Error display component
interface ErrorDisplayProps {
  error: string | Error;
  onRetry?: () => void;
  showRetry?: boolean;
  className?: string;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ 
  error, 
  onRetry, 
  showRetry = true,
  className = ""
}) => {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const isNetworkError = errorMessage.toLowerCase().includes('network') || 
                         errorMessage.toLowerCase().includes('fetch') ||
                         errorMessage.toLowerCase().includes('connection');

  return (
    <motion.div
      className={`flex flex-col items-center justify-center p-8 text-center space-y-4 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center space-x-2 text-mono-600">
        {isNetworkError ? (
          <WifiOff className="h-6 w-6" />
        ) : (
          <AlertCircle className="h-6 w-6" />
        )}
        <span className="text-lg font-medium">
          {isNetworkError ? 'Connection Error' : 'Something went wrong'}
        </span>
      </div>
      
      <p className="text-mono-600 max-w-md">
        {errorMessage}
      </p>
      
      {showRetry && onRetry && (
        <motion.button
          onClick={onRetry}
          className="inline-flex items-center px-4 py-2 bg-mono-900 text-mono-0 rounded hover:bg-mono-800 transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </motion.button>
      )}
    </motion.div>
  );
};

// Network status indicator
export const NetworkStatus: React.FC = () => {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 bg-red-500 text-white px-4 py-2 text-center text-sm z-50"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      exit={{ y: -100 }}
    >
      <div className="flex items-center justify-center space-x-2">
        <WifiOff className="h-4 w-4" />
        <span>You're offline. Some features may not work.</span>
      </div>
    </motion.div>
  );
};

// Loading overlay for forms
export const LoadingOverlay: React.FC<{ 
  isLoading: boolean; 
  message?: string;
  children: React.ReactNode;
}> = ({ isLoading, message = 'Processing...', children }) => {
  return (
    <div className="relative">
      {children}
      {isLoading && (
        <motion.div
          className="absolute inset-0 bg-mono-0 bg-opacity-75 flex items-center justify-center z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="flex flex-col items-center space-y-3">
            <ButtonSpinner size="lg" />
            <p className="text-mono-700 text-sm font-medium">{message}</p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

// Progress indicator
interface ProgressIndicatorProps {
  current: number;
  total: number;
  label?: string;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ 
  current, 
  total, 
  label 
}) => {
  const percentage = Math.round((current / total) * 100);

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between text-sm text-mono-600 mb-2">
          <span>{label}</span>
          <span>{current} of {total}</span>
        </div>
      )}
      <div className="w-full bg-mono-200 rounded-full h-2">
        <motion.div
          className="bg-mono-900 h-2 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  );
};

// Retry wrapper component
interface RetryWrapperProps {
  children: React.ReactNode;
  onRetry: () => void;
  error?: string | Error | null;
  loading?: boolean;
  maxRetries?: number;
}

export const RetryWrapper: React.FC<RetryWrapperProps> = ({
  children,
  onRetry,
  error,
  loading = false,
  maxRetries = 3
}) => {
  const [retryCount, setRetryCount] = React.useState(0);

  const handleRetry = () => {
    if (retryCount < maxRetries) {
      setRetryCount(prev => prev + 1);
      onRetry();
    }
  };

  if (loading) {
    return <PageSpinner />;
  }

  if (error) {
    return (
      <ErrorDisplay
        error={error}
        onRetry={retryCount < maxRetries ? handleRetry : undefined}
        showRetry={retryCount < maxRetries}
      />
    );
  }

  return <>{children}</>;
};

export default {
  ButtonSpinner,
  PageSpinner,
  ResumeCardSkeleton,
  ErrorDisplay,
  NetworkStatus,
  LoadingOverlay,
  ProgressIndicator,
  RetryWrapper
};

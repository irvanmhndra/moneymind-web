import React, { useState, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import { AlertCircle, RefreshCw, X } from 'lucide-react';

interface AsyncError {
  message: string;
  code?: string;
  timestamp: Date;
  operation?: string;
}

interface AsyncErrorBoundaryProps {
  children: ReactNode;
  onError?: (error: AsyncError) => void;
  showNotification?: boolean;
  autoRetry?: boolean;
  maxRetries?: number;
}

export const AsyncErrorBoundary: React.FC<AsyncErrorBoundaryProps> = ({
  children,
  onError,
  showNotification = true,
  autoRetry = false,
  maxRetries = 3
}) => {
  const [errors, setErrors] = useState<AsyncError[]>([]);
  const [retryCount, setRetryCount] = useState(0);

  const addError = useCallback((error: AsyncError) => {
    setErrors(prev => [...prev, error]);
    if (onError) {
      onError(error);
    }
  }, [onError]);

  const removeError = useCallback((index: number) => {
    setErrors(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors([]);
    setRetryCount(0);
  }, []);

  const retry = useCallback(() => {
    if (retryCount < maxRetries) {
      setRetryCount(prev => prev + 1);
      setErrors([]);
    }
  }, [retryCount, maxRetries]);

  // Auto-retry logic
  useEffect(() => {
    if (autoRetry && errors.length > 0 && retryCount < maxRetries) {
      const timer = setTimeout(() => {
        retry();
      }, Math.pow(2, retryCount) * 1000); // Exponential backoff

      return () => clearTimeout(timer);
    }
  }, [autoRetry, errors.length, retry, retryCount, maxRetries]);

  // Provide error handling context to children
  const contextValue = {
    addError,
    clearErrors: clearAllErrors,
    hasErrors: errors.length > 0,
    errors
  };

  return (
    <AsyncErrorContext.Provider value={contextValue}>
      {children}

      {/* Error Notifications */}
      {showNotification && errors.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2" style={{ maxWidth: '400px' }}>
          {errors.map((error, index) => (
            <ErrorNotification
              key={`${error.timestamp.getTime()}-${index}`}
              error={error}
              onDismiss={() => removeError(index)}
              onRetry={autoRetry ? retry : undefined}
              canRetry={retryCount < maxRetries}
            />
          ))}
        </div>
      )}
    </AsyncErrorContext.Provider>
  );
};

// Error Notification Component
interface ErrorNotificationProps {
  error: AsyncError;
  onDismiss: () => void;
  onRetry?: () => void;
  canRetry?: boolean;
}

const ErrorNotification: React.FC<ErrorNotificationProps> = ({
  error,
  onDismiss,
  onRetry,
  canRetry
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Auto-dismiss after 10 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onDismiss, 300);
    }, 10000);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300);
  };

  return (
    <div
      className={`transform transition-all duration-300 ease-in-out ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className="bg-red-50 border border-red-200 rounded-lg shadow-lg p-4 max-w-sm">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-red-400" />
          </div>
          <div className="ml-3 w-0 flex-1">
            <p className="text-sm font-medium text-red-800">
              {error.operation ? `${error.operation} failed` : 'Error occurred'}
            </p>
            <p className="mt-1 text-sm text-red-700">
              {error.message}
            </p>
            {error.code && (
              <p className="mt-1 text-xs text-red-600">
                Code: {error.code}
              </p>
            )}

            {onRetry && canRetry && (
              <div className="mt-3">
                <button
                  onClick={onRetry}
                  className="text-sm font-medium text-red-800 hover:text-red-900 flex items-center"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Retry
                </button>
              </div>
            )}
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={handleDismiss}
              className="bg-red-50 rounded-md inline-flex text-red-400 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Context for async error handling
interface AsyncErrorContextType {
  addError: (error: AsyncError) => void;
  clearErrors: () => void;
  hasErrors: boolean;
  errors: AsyncError[];
}

const AsyncErrorContext = React.createContext<AsyncErrorContextType>({
  addError: () => {},
  clearErrors: () => {},
  hasErrors: false,
  errors: []
});

// Hook to use async error context
export const useAsyncError = () => {
  const context = React.useContext(AsyncErrorContext);
  if (!context) {
    throw new Error('useAsyncError must be used within an AsyncErrorBoundary');
  }
  return context;
};

// Higher-order component to wrap async operations
export const withAsyncErrorHandling = <T extends Record<string, unknown>>(
  Component: React.ComponentType<T>
) => {
  const WrappedComponent: React.FC<T> = (props) => {
    return (
      <AsyncErrorBoundary>
        <Component {...props} />
      </AsyncErrorBoundary>
    );
  };

  WrappedComponent.displayName = `withAsyncErrorHandling(${Component.displayName || Component.name})`;

  return WrappedComponent;
};

// Utility function to handle async operations with error catching
export const handleAsyncOperation = async (
  operation: () => Promise<unknown>,
  addError: (error: AsyncError) => void,
  operationName?: string
): Promise<unknown> => {
  try {
    return await operation();
  } catch (error: unknown) {
    const asyncError: AsyncError = {
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      code: (error as { code?: string; status?: number })?.code || (error as { code?: string; status?: number })?.status?.toString(),
      timestamp: new Date(),
      operation: operationName
    };

    addError(asyncError);
    return null;
  }
};

export default AsyncErrorBoundary;
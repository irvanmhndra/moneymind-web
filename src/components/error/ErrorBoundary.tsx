import { Component } from 'react';
import type { ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

interface ErrorInfo {
  componentStack: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  level?: 'page' | 'component' | 'critical';
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Enhanced error logging to console
    console.group('🚨 ErrorBoundary caught an error');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Component stack:', errorInfo.componentStack);
    console.error('Full error object:', error);
    console.error('Full errorInfo object:', errorInfo);
    console.error('Current route:', window.location.pathname);
    console.error('Error boundary level:', this.props.level || 'component');
    console.groupEnd();

    // Update state with error info
    this.setState({
      errorInfo
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In a real app, you would send this to an error reporting service
    this.logErrorToService(error, errorInfo);
  }

  private logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // This would typically send the error to a service like Sentry, LogRocket, etc.
    const errorReport = {
      errorId: this.state.errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      level: this.props.level || 'component'
    };

    // Simulate error logging (in real app, this would be an API call)
    localStorage.setItem(`error_${this.state.errorId}`, JSON.stringify(errorReport));
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    });
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleReportError = () => {
    const errorReport = {
      errorId: this.state.errorId,
      message: this.state.error?.message,
      timestamp: new Date().toISOString()
    };

    // Create mailto link with error details
    const subject = `MoneyMind Error Report - ${this.state.errorId}`;
    const body = `Error Details:\n\nError ID: ${errorReport.errorId}\nMessage: ${errorReport.message}\nTimestamp: ${errorReport.timestamp}\nPage: ${window.location.href}\n\nPlease describe what you were doing when this error occurred:\n\n`;

    const mailtoLink = `mailto:support@moneymind.app?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink);
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Different error UIs based on error level
      const { level = 'component' } = this.props;

      if (level === 'critical') {
        return (
          <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
              <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                <div className="text-center">
                  <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
                  <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Something went wrong
                  </h2>
                  <p className="mt-2 text-center text-sm text-gray-600">
                    We encountered a critical error. Please try reloading the page.
                  </p>
                  <div className="mt-6 text-xs text-gray-500">
                    Error ID: {this.state.errorId}
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <button
                    onClick={this.handleReload}
                    className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reload Page
                  </button>

                  <button
                    onClick={this.handleGoHome}
                    className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Go to Dashboard
                  </button>

                  <button
                    onClick={this.handleReportError}
                    className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Bug className="w-4 h-4 mr-2" />
                    Report Error
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      }

      if (level === 'page') {
        return (
          <div className="min-h-96 flex items-center justify-center bg-white rounded-lg border border-gray-200">
            <div className="text-center p-8">
              <AlertTriangle className="mx-auto h-16 w-16 text-yellow-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Page Error
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                This page encountered an error and couldn't load properly.
              </p>

              <div className="space-x-3">
                <button
                  onClick={this.handleRetry}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </button>

                <button
                  onClick={this.handleGoHome}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Dashboard
                </button>
              </div>

              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700">
                  Error Details
                </summary>
                <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded border overflow-auto">
                  <div><strong>Error:</strong> {this.state.error?.message}</div>
                  <div><strong>Error ID:</strong> {this.state.errorId}</div>
                </div>
              </details>
            </div>
          </div>
        );
      }

      // Default component-level error UI
      return (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Component Error
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>This component encountered an error. You can try refreshing or continue using the app.</p>
              </div>
              <div className="mt-4">
                <div className="-mx-2 -my-1.5 flex">
                  <button
                    onClick={this.handleRetry}
                    className="bg-red-50 px-2 py-1.5 rounded-md text-sm font-medium text-red-800 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-600"
                  >
                    Retry
                  </button>
                  <button
                    onClick={this.handleReportError}
                    className="ml-3 bg-red-50 px-2 py-1.5 rounded-md text-sm font-medium text-red-800 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-600"
                  >
                    Report
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
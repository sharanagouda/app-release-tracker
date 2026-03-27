import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  darkMode?: boolean;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    const { hasError, error } = this.state;
    const { children, darkMode = false, fallback } = this.props;

    if (hasError) {
      if (fallback) return <>{fallback}</>;

      return (
        <div
          className={`min-h-screen flex items-center justify-center p-6 ${
            darkMode ? 'bg-gray-900' : 'bg-gray-50'
          }`}
        >
          <div
            className={`max-w-md w-full rounded-xl shadow-lg border p-8 text-center ${
              darkMode
                ? 'bg-gray-800 border-gray-700'
                : 'bg-white border-gray-200'
            }`}
          >
            <div
              className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                darkMode ? 'bg-red-900/30' : 'bg-red-100'
              }`}
            >
              <AlertTriangle
                className={`w-8 h-8 ${
                  darkMode ? 'text-red-400' : 'text-red-600'
                }`}
              />
            </div>

            <h2
              className={`text-xl font-semibold mb-2 ${
                darkMode ? 'text-gray-100' : 'text-gray-900'
              }`}
            >
              Something went wrong
            </h2>

            <p
              className={`text-sm mb-4 ${
                darkMode ? 'text-gray-400' : 'text-gray-600'
              }`}
            >
              An unexpected error occurred. You can try refreshing the page or
              resetting the component.
            </p>

            {error && (
              <details
                className={`text-left text-xs rounded-lg p-3 mb-6 ${
                  darkMode
                    ? 'bg-gray-900/50 text-gray-400'
                    : 'bg-gray-50 text-gray-600'
                }`}
              >
                <summary className="cursor-pointer font-medium mb-1">
                  Error details
                </summary>
                <pre className="whitespace-pre-wrap break-all mt-2">
                  {error.message}
                </pre>
              </details>
            )}

            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  darkMode
                    ? 'bg-blue-600 hover:bg-blue-500 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  darkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return <>{children}</>;
  }
}

import { Component, type ReactNode, type ErrorInfo as ReactErrorInfo } from 'react';
import { logger } from './logger';
import type { ErrorInfo, FallbackRender } from './types';

interface ErrorBoundaryProps {
  children: ReactNode;
  name: string;
  fallback?: ReactNode | FallbackRender;
  onError?: (error: Error, errorInfo: ReactErrorInfo) => void;
  level?: 'fatal' | 'recoverable';
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, reactErrorInfo: ReactErrorInfo): void {
    const errorInfo: ErrorInfo = {
      componentStack: reactErrorInfo.componentStack || '',
      errorBoundaryName: this.props.name,
      timestamp: new Date(),
    };

    this.setState({ errorInfo });

    // Log to monitoring
    logger.componentError(error, errorInfo);

    // Call optional error handler
    this.props.onError?.(error, reactErrorInfo);
  }

  reset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback, level = 'recoverable' } = this.props;

    if (hasError && error) {
      // Custom fallback render function
      if (typeof fallback === 'function') {
        return fallback({ error, reset: this.reset, errorInfo: errorInfo || undefined });
      }

      // Custom fallback element
      if (fallback) {
        return fallback;
      }

      // Default fallback
      return <DefaultErrorFallback error={error} reset={this.reset} level={level} />;
    }

    return children;
  }
}

// Default error UI
interface DefaultErrorFallbackProps {
  error: Error;
  reset: () => void;
  level: 'fatal' | 'recoverable';
}

function DefaultErrorFallback({ error, reset, level }: DefaultErrorFallbackProps) {
  const isFatal = level === 'fatal';

  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center rounded-lg bg-gray-900/50 p-6 text-center">
      <div className="mb-4 text-4xl" role="img" aria-label={isFatal ? 'Error' : 'Warning'}>
        {isFatal ? '😵' : '😕'}
      </div>

      <h2 className="mb-2 text-xl font-semibold text-white">
        {isFatal ? 'Something went wrong' : 'Oops! A hiccup occurred'}
      </h2>

      <p className="mb-4 max-w-md text-sm text-gray-400">
        {isFatal
          ? "We're sorry, but something unexpected happened. Our team has been notified."
          : "Don't worry, you can try again or refresh the page."}
      </p>

      {/* Show error details in development */}
      {import.meta.env.DEV && (
        <details className="mb-4 w-full max-w-md">
          <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-400">
            Error details
          </summary>
          <pre className="mt-2 overflow-auto rounded bg-gray-900 p-3 text-left text-xs text-red-400">
            {error.message}
            {error.stack && (
              <>
                {'\n\n'}
                {error.stack}
              </>
            )}
          </pre>
        </details>
      )}

      <div className="flex gap-3">
        {!isFatal && (
          <button
            onClick={reset}
            className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900"
          >
            Try Again
          </button>
        )}
        <button
          onClick={() => window.location.reload()}
          className="rounded-lg bg-gray-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900"
        >
          Refresh Page
        </button>
      </div>
    </div>
  );
}

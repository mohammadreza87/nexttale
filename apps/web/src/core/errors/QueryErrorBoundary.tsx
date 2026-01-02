import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { ErrorBoundary } from './ErrorBoundary';
import type { ReactNode } from 'react';

interface QueryErrorBoundaryProps {
  children: ReactNode;
}

/**
 * Error boundary specifically for React Query errors
 * Provides retry functionality that resets query state
 */
export function QueryErrorBoundary({ children }: QueryErrorBoundaryProps) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          name="QueryErrorBoundary"
          level="recoverable"
          fallback={({ error, reset: localReset }) => (
            <QueryErrorFallback
              error={error}
              onRetry={() => {
                reset(); // Reset React Query state
                localReset(); // Reset error boundary state
              }}
            />
          )}
        >
          {children}
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}

interface QueryErrorFallbackProps {
  error: Error;
  onRetry: () => void;
}

function QueryErrorFallback({ error, onRetry }: QueryErrorFallbackProps) {
  // Determine error type for better messaging
  const isNetworkError =
    error.message.includes('fetch') ||
    error.message.includes('network') ||
    error.message.includes('Failed to fetch');

  const isTimeoutError = error.message.includes('timeout');

  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center rounded-lg bg-gray-900/50 p-6 text-center">
      <div className="mb-4 text-4xl" role="img" aria-label="Connection error">
        {isNetworkError ? '📡' : isTimeoutError ? '⏱️' : '🔄'}
      </div>

      <h2 className="mb-2 text-xl font-semibold text-white">
        {isNetworkError
          ? 'Connection Problem'
          : isTimeoutError
            ? 'Request Timed Out'
            : 'Failed to Load Data'}
      </h2>

      <p className="mb-4 max-w-md text-sm text-gray-400">
        {isNetworkError
          ? 'Please check your internet connection and try again.'
          : isTimeoutError
            ? 'The server took too long to respond. Please try again.'
            : 'There was a problem fetching the data. Please try again.'}
      </p>

      {import.meta.env.DEV && <p className="mb-4 text-xs text-red-400">{error.message}</p>}

      <button
        onClick={onRetry}
        className="rounded-lg bg-purple-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900"
      >
        Retry
      </button>
    </div>
  );
}

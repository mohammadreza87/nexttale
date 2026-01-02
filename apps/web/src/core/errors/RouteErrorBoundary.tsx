import { useRouteError, isRouteErrorResponse, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { logger } from './logger';

/**
 * Error boundary for React Router errors
 * Handles 404s and other route-level errors
 */
export function RouteErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();

  useEffect(() => {
    // Log the error
    const errorObj = error instanceof Error ? error : new Error(String(error));
    logger.error('Route error', errorObj, {
      route: window.location.pathname,
      isRouteError: isRouteErrorResponse(error),
    });
  }, [error]);

  // Handle React Router error responses (404, etc.)
  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 p-6 text-center">
          <div className="mb-6 text-8xl">🔍</div>
          <h1 className="mb-3 text-3xl font-bold text-white">Page Not Found</h1>
          <p className="mb-8 max-w-md text-gray-400">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => navigate(-1)}
              className="rounded-lg bg-gray-700 px-6 py-3 font-medium text-white transition-colors hover:bg-gray-600"
            >
              Go Back
            </button>
            <button
              onClick={() => navigate('/')}
              className="rounded-lg bg-purple-600 px-6 py-3 font-medium text-white transition-colors hover:bg-purple-700"
            >
              Go Home
            </button>
          </div>
        </div>
      );
    }

    // Other HTTP errors
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 p-6 text-center">
        <div className="mb-6 text-8xl">😵</div>
        <h1 className="mb-3 text-3xl font-bold text-white">Error {error.status}</h1>
        <p className="mb-8 max-w-md text-gray-400">
          {error.statusText || 'An unexpected error occurred.'}
        </p>
        <button
          onClick={() => navigate('/')}
          className="rounded-lg bg-purple-600 px-6 py-3 font-medium text-white transition-colors hover:bg-purple-700"
        >
          Go Home
        </button>
      </div>
    );
  }

  // Handle unknown errors
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 p-6 text-center">
      <div className="mb-6 text-8xl">💥</div>
      <h1 className="mb-3 text-3xl font-bold text-white">Something Went Wrong</h1>
      <p className="mb-8 max-w-md text-gray-400">
        We encountered an unexpected error. Our team has been notified and is working on it.
      </p>

      {import.meta.env.DEV && error instanceof Error && (
        <pre className="mb-8 max-w-2xl overflow-auto rounded-lg bg-gray-900 p-4 text-left text-sm text-red-400">
          {error.message}
          {error.stack && `\n\n${error.stack}`}
        </pre>
      )}

      <div className="flex gap-4">
        <button
          onClick={() => window.location.reload()}
          className="rounded-lg bg-gray-700 px-6 py-3 font-medium text-white transition-colors hover:bg-gray-600"
        >
          Refresh Page
        </button>
        <button
          onClick={() => navigate('/')}
          className="rounded-lg bg-purple-600 px-6 py-3 font-medium text-white transition-colors hover:bg-purple-700"
        >
          Go Home
        </button>
      </div>
    </div>
  );
}

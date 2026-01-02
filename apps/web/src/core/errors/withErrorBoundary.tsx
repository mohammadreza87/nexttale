import { ErrorBoundary } from './ErrorBoundary';
import type { ComponentType, ReactNode } from 'react';
import type { FallbackRender } from './types';

interface WithErrorBoundaryOptions {
  fallback?: ReactNode | FallbackRender;
  level?: 'fatal' | 'recoverable';
  onError?: (error: Error) => void;
}

/**
 * HOC to wrap components with an error boundary
 *
 * @example
 * const SafeComponent = withErrorBoundary(MyComponent, 'MyComponent');
 *
 * @example
 * const SafeComponent = withErrorBoundary(MyComponent, 'MyComponent', {
 *   fallback: <CustomError />,
 *   level: 'recoverable',
 * });
 */
export function withErrorBoundary<P extends object>(
  Component: ComponentType<P>,
  name: string,
  options: WithErrorBoundaryOptions = {}
): ComponentType<P> {
  const { fallback, level = 'recoverable', onError } = options;

  function WrappedComponent(props: P) {
    return (
      <ErrorBoundary
        name={name}
        fallback={fallback}
        level={level}
        onError={onError ? (error) => onError(error) : undefined}
      >
        <Component {...props} />
      </ErrorBoundary>
    );
  }

  // Preserve display name for debugging
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name || 'Component'})`;

  return WrappedComponent;
}

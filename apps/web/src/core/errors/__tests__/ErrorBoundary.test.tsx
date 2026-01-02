import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '../ErrorBoundary';
import { logger } from '../logger';

// Mock the logger
vi.mock('../logger', () => ({
  logger: {
    componentError: vi.fn(),
  },
}));

// Component that throws an error
function ThrowError({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
}

// Suppress console.error during tests
const originalError = console.error;
beforeEach(() => {
  console.error = vi.fn();
});

afterEach(() => {
  console.error = originalError;
  vi.clearAllMocks();
});

describe('ErrorBoundary', () => {
  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary name="test">
        <div>Child content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  it('renders default fallback when error occurs (recoverable level)', () => {
    render(
      <ErrorBoundary name="test">
        <ThrowError shouldThrow />
      </ErrorBoundary>
    );

    // Default level is "recoverable" which shows "Oops! A hiccup occurred"
    expect(screen.getByText('Oops! A hiccup occurred')).toBeInTheDocument();
  });

  it('renders default fallback when error occurs (fatal level)', () => {
    render(
      <ErrorBoundary name="test" level="fatal">
        <ThrowError shouldThrow />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders custom fallback ReactNode when provided', () => {
    render(
      <ErrorBoundary name="test" fallback={<div>Custom error</div>}>
        <ThrowError shouldThrow />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error')).toBeInTheDocument();
  });

  it('renders custom fallback function when provided', () => {
    const customFallback = vi.fn(({ error, reset }) => (
      <div>
        <span>Error: {error.message}</span>
        <button onClick={reset}>Reset</button>
      </div>
    ));

    render(
      <ErrorBoundary name="test" fallback={customFallback}>
        <ThrowError shouldThrow />
      </ErrorBoundary>
    );

    expect(screen.getByText('Error: Test error')).toBeInTheDocument();
    expect(customFallback).toHaveBeenCalled();
  });

  it('logs error to logger', () => {
    render(
      <ErrorBoundary name="TestComponent">
        <ThrowError shouldThrow />
      </ErrorBoundary>
    );

    expect(logger.componentError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        errorBoundaryName: 'TestComponent',
      })
    );
  });

  it('calls onError callback when error occurs', () => {
    const onError = vi.fn();

    render(
      <ErrorBoundary name="test" onError={onError}>
        <ThrowError shouldThrow />
      </ErrorBoundary>
    );

    // onError is called with (error, reactErrorInfo)
    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );
  });

  it('shows Try Again button for recoverable level', () => {
    render(
      <ErrorBoundary name="test" level="recoverable">
        <ThrowError shouldThrow />
      </ErrorBoundary>
    );

    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('hides Try Again button for fatal level', () => {
    render(
      <ErrorBoundary name="test" level="fatal">
        <ThrowError shouldThrow />
      </ErrorBoundary>
    );

    expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
  });

  it('shows Refresh Page button', () => {
    render(
      <ErrorBoundary name="test">
        <ThrowError shouldThrow />
      </ErrorBoundary>
    );

    expect(screen.getByText('Refresh Page')).toBeInTheDocument();
  });
});

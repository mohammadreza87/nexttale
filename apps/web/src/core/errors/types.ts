import type { ReactNode } from 'react';

/**
 * Error system types
 */

export interface ErrorInfo {
  componentStack: string;
  errorBoundaryName: string;
  timestamp: Date;
}

export interface AppError extends Error {
  code?: string;
  isRecoverable?: boolean;
  context?: Record<string, unknown>;
  originalError?: Error;
}

export type ErrorLevel = 'fatal' | 'error' | 'warning' | 'info';

export interface LogEntry {
  level: ErrorLevel;
  message: string;
  error?: Error;
  context?: Record<string, unknown>;
  timestamp: Date;
  url?: string;
  userId?: string;
}

export interface ErrorBoundaryFallbackProps {
  error: Error;
  reset: () => void;
  errorInfo?: ErrorInfo;
}

export type FallbackRender = (props: ErrorBoundaryFallbackProps) => ReactNode;

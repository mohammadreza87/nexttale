# Phase 1: Foundation Implementation Specification

> **Status: ✅ COMPLETED** - See [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md) for current status

> **NextTale Scalability & Production Readiness**
> Complete implementation guide with priorities, tests, and migration strategy

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Priority Matrix](#2-priority-matrix)
3. [Architecture Overview](#3-architecture-overview)
4. [Implementation Guide](#4-implementation-guide)
   - 4.1 [Core Infrastructure](#41-core-infrastructure)
   - 4.2 [Error Boundary System](#42-error-boundary-system)
   - 4.3 [Data Layer & Repository Pattern](#43-data-layer--repository-pattern)
   - 4.4 [Database Optimizations](#44-database-optimizations)
   - 4.5 [React Query Integration](#45-react-query-integration)
   - 4.6 [Service Layer Refactoring](#46-service-layer-refactoring)
5. [Testing Strategy](#5-testing-strategy)
6. [Migration Plan](#6-migration-plan)
7. [Verification Checklist](#7-verification-checklist)

---

## 1. Executive Summary

### Current Problems

| Issue | Impact at Scale | Solution |
|-------|-----------------|----------|
| N+1 Queries | 61 DB calls for 20 stories | PostgreSQL functions |
| No Error Boundaries | One error crashes entire app | Layered error handling |
| Direct Supabase Coupling | Can't add caching/monitoring | Repository pattern |
| No Data Layer Abstraction | Untestable, duplicated code | Clean architecture |

### Target Outcomes

- **98% reduction** in database queries
- **Zero crash propagation** - errors contained to components
- **100% testable** data layer with mocked dependencies
- **Safe rollout** via feature flags with instant rollback

### Timeline

| Week | Focus | Deliverables |
|------|-------|--------------|
| 1 | Foundation | Feature flags, error boundaries, core types |
| 2 | Data Layer | Repositories, DB functions, React Query hooks |
| 3 | Migration | Service refactoring, testing, monitoring |
| 4 | Validation | Load testing, bug fixes, documentation |

---

## 2. Priority Matrix

### P0 - Critical (Week 1)

| Task | Files | Est. Hours |
|------|-------|------------|
| Feature flags system | `src/core/config/featureFlags.ts` | 2 |
| Error logger | `src/core/errors/logger.ts` | 2 |
| Base ErrorBoundary | `src/core/errors/ErrorBoundary.tsx` | 3 |
| Route error handling | `src/core/errors/RouteErrorBoundary.tsx` | 2 |
| Query error boundary | `src/core/errors/QueryErrorBoundary.tsx` | 2 |
| Integrate into App.tsx | `src/App.tsx` | 3 |

### P1 - High (Week 2)

| Task | Files | Est. Hours |
|------|-------|------------|
| Database client wrapper | `src/data/client.ts` | 2 |
| Base repository | `src/data/repositories/BaseRepository.ts` | 4 |
| Story repository | `src/data/repositories/StoryRepository.ts` | 6 |
| Feed repository | `src/data/repositories/FeedRepository.ts` | 4 |
| DB function: get_stories_feed | SQL migration | 4 |
| DB function: get_unified_feed | SQL migration | 4 |
| DB function: get_story_with_metadata | SQL migration | 2 |

### P2 - Medium (Week 3)

| Task | Files | Est. Hours |
|------|-------|------------|
| React Query hooks | `src/data/hooks/*.ts` | 6 |
| Refactor storyService | `src/lib/storyService.ts` | 4 |
| Refactor feedService | `src/lib/feedService.ts` | 4 |
| Migration monitoring | `src/core/monitoring/` | 3 |
| Unit tests | `src/**/__tests__/` | 8 |

### P3 - Polish (Week 4)

| Task | Files | Est. Hours |
|------|-------|------------|
| Integration tests | `src/__tests__/integration/` | 6 |
| Performance benchmarks | `scripts/benchmark.ts` | 4 |
| Documentation | `docs/` | 4 |
| Cleanup & optimization | Various | 4 |

---

## 3. Architecture Overview

### Target Directory Structure

```
src/
├── core/                           # Cross-cutting concerns
│   ├── config/
│   │   └── featureFlags.ts         # Feature flag system
│   ├── errors/
│   │   ├── types.ts                # Error types
│   │   ├── logger.ts               # Error logging & monitoring
│   │   ├── ErrorBoundary.tsx       # Base error boundary
│   │   ├── QueryErrorBoundary.tsx  # React Query errors
│   │   ├── RouteErrorBoundary.tsx  # Router errors
│   │   ├── withErrorBoundary.tsx   # HOC wrapper
│   │   └── index.ts                # Public exports
│   └── monitoring/
│       └── metrics.ts              # Performance tracking
│
├── data/                           # Data access layer
│   ├── client.ts                   # Supabase client wrapper
│   ├── types.ts                    # Data layer types
│   ├── repositories/
│   │   ├── BaseRepository.ts       # Abstract base class
│   │   ├── StoryRepository.ts      # Story data access
│   │   ├── FeedRepository.ts       # Feed aggregation
│   │   ├── UserRepository.ts       # User data access
│   │   └── index.ts
│   ├── hooks/                      # React Query integration
│   │   ├── useStories.ts
│   │   ├── useFeed.ts
│   │   ├── useUser.ts
│   │   └── index.ts
│   └── index.ts
│
├── lib/                            # Business logic (existing, modified)
│   ├── storyService.ts             # Uses StoryRepository
│   ├── feedService.ts              # Uses FeedRepository
│   ├── subscriptionService.ts
│   ├── queryClient.ts              # React Query config
│   └── ...
│
├── components/                     # UI components (existing)
├── features/                       # Feature modules (existing)
├── hooks/                          # Custom hooks (existing)
├── stores/                         # Zustand stores (existing)
└── App.tsx                         # Entry point (modified)
```

### Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              PRESENTATION LAYER                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  Components (StoryReader, TikTokFeed, etc.)                             ││
│  │       │                                                                  ││
│  │       ▼                                                                  ││
│  │  React Query Hooks (useStories, useFeed)                                ││
│  │       │ - Caching                                                        ││
│  │       │ - Background refetch                                             ││
│  │       │ - Optimistic updates                                             ││
│  └───────┼──────────────────────────────────────────────────────────────────┘│
│          │                                                                   │
├──────────┼───────────────────────────────────────────────────────────────────┤
│          ▼                           DATA LAYER                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  Repositories (StoryRepository, FeedRepository)                         ││
│  │       │ - Business logic                                                 ││
│  │       │ - Data transformation                                            ││
│  │       │ - Error handling                                                 ││
│  │       ▼                                                                  ││
│  │  Database Client (client.ts)                                            ││
│  │       │ - Supabase wrapper                                               ││
│  │       │ - RPC calls to DB functions                                      ││
│  └───────┼──────────────────────────────────────────────────────────────────┘│
│          │                                                                   │
├──────────┼───────────────────────────────────────────────────────────────────┤
│          ▼                          DATABASE LAYER                           │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  PostgreSQL Functions                                                    ││
│  │       │ - get_stories_feed()     → Single query for feed                 ││
│  │       │ - get_unified_feed()     → Mixed content feed                    ││
│  │       │ - get_story_with_metadata() → Story detail                       ││
│  │       ▼                                                                  ││
│  │  Tables (stories, story_nodes, user_profiles, etc.)                     ││
│  │       + Optimized indexes                                                ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Implementation Guide

### 4.1 Core Infrastructure

#### 4.1.1 Feature Flags System

**File: `src/core/config/featureFlags.ts`**

```typescript
/**
 * Feature Flags System
 *
 * Enables safe rollout of new features with:
 * - Boolean flags for on/off features
 * - Percentage-based rollout for gradual deployment
 * - User-specific targeting
 */

type FlagName =
  | 'USE_REPOSITORY_PATTERN'
  | 'USE_OPTIMIZED_QUERIES'
  | 'ENABLE_ERROR_BOUNDARIES'
  | 'ENABLE_QUERY_HOOKS';

interface FeatureFlagsConfig {
  // Static flags from environment
  flags: Record<FlagName, boolean>;

  // Percentage rollout (0-100)
  rolloutPercentages: Partial<Record<FlagName, number>>;
}

class FeatureFlags {
  private config: FeatureFlagsConfig;

  constructor() {
    this.config = {
      flags: {
        USE_REPOSITORY_PATTERN: this.getEnvFlag('VITE_FF_REPOSITORY_PATTERN', false),
        USE_OPTIMIZED_QUERIES: this.getEnvFlag('VITE_FF_OPTIMIZED_QUERIES', false),
        ENABLE_ERROR_BOUNDARIES: this.getEnvFlag('VITE_FF_ERROR_BOUNDARIES', true),
        ENABLE_QUERY_HOOKS: this.getEnvFlag('VITE_FF_QUERY_HOOKS', false),
      },
      rolloutPercentages: {
        USE_REPOSITORY_PATTERN: this.getEnvNumber('VITE_FF_REPOSITORY_PATTERN_PCT', 0),
        USE_OPTIMIZED_QUERIES: this.getEnvNumber('VITE_FF_OPTIMIZED_QUERIES_PCT', 0),
      },
    };
  }

  private getEnvFlag(key: string, defaultValue: boolean): boolean {
    const value = import.meta.env[key];
    if (value === undefined) return defaultValue;
    return value === 'true' || value === '1';
  }

  private getEnvNumber(key: string, defaultValue: number): number {
    const value = import.meta.env[key];
    if (value === undefined) return defaultValue;
    const num = parseInt(value, 10);
    return isNaN(num) ? defaultValue : Math.min(100, Math.max(0, num));
  }

  /**
   * Check if a feature is enabled globally
   */
  isEnabled(flag: FlagName): boolean {
    return this.config.flags[flag] ?? false;
  }

  /**
   * Check if a feature is enabled for a specific user
   * Uses deterministic hashing for consistent experience
   */
  isEnabledForUser(flag: FlagName, userId: string): boolean {
    // First check if globally enabled
    if (this.isEnabled(flag)) return true;

    // Check percentage rollout
    const percentage = this.config.rolloutPercentages[flag];
    if (percentage === undefined || percentage === 0) return false;
    if (percentage >= 100) return true;

    // Deterministic hash for consistent user experience
    const hash = this.hashUserId(userId, flag);
    return hash < percentage;
  }

  /**
   * Deterministic hash function
   * Same user + flag always returns same value (0-99)
   */
  private hashUserId(userId: string, flag: string): number {
    const str = `${userId}:${flag}`;
    let hash = 0;

    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash >>> 0; // Convert to unsigned 32-bit
    }

    return hash % 100;
  }

  /**
   * Get all flag states (for debugging/monitoring)
   */
  getAllFlags(): Record<FlagName, boolean> {
    return { ...this.config.flags };
  }

  /**
   * Override a flag at runtime (for testing)
   */
  setFlag(flag: FlagName, value: boolean): void {
    if (import.meta.env.DEV || import.meta.env.MODE === 'test') {
      this.config.flags[flag] = value;
    }
  }
}

// Singleton instance
export const featureFlags = new FeatureFlags();

// Convenience exports
export const isFeatureEnabled = (flag: FlagName) => featureFlags.isEnabled(flag);
export const isFeatureEnabledForUser = (flag: FlagName, userId: string) =>
  featureFlags.isEnabledForUser(flag, userId);
```

**Test: `src/core/config/__tests__/featureFlags.test.ts`**

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock import.meta.env before importing the module
const mockEnv: Record<string, string> = {};

vi.mock('import.meta', () => ({
  env: mockEnv,
}));

describe('FeatureFlags', () => {
  beforeEach(() => {
    vi.resetModules();
    Object.keys(mockEnv).forEach(key => delete mockEnv[key]);
  });

  describe('isEnabled', () => {
    it('returns false for disabled flags', async () => {
      const { featureFlags } = await import('../featureFlags');
      expect(featureFlags.isEnabled('USE_REPOSITORY_PATTERN')).toBe(false);
    });

    it('returns true when flag is explicitly enabled', async () => {
      mockEnv.VITE_FF_REPOSITORY_PATTERN = 'true';
      const { featureFlags } = await import('../featureFlags');
      expect(featureFlags.isEnabled('USE_REPOSITORY_PATTERN')).toBe(true);
    });
  });

  describe('isEnabledForUser', () => {
    it('returns consistent result for same user', async () => {
      mockEnv.VITE_FF_REPOSITORY_PATTERN_PCT = '50';
      const { featureFlags } = await import('../featureFlags');

      const userId = 'user-123';
      const result1 = featureFlags.isEnabledForUser('USE_REPOSITORY_PATTERN', userId);
      const result2 = featureFlags.isEnabledForUser('USE_REPOSITORY_PATTERN', userId);

      expect(result1).toBe(result2);
    });

    it('returns true when percentage is 100', async () => {
      mockEnv.VITE_FF_REPOSITORY_PATTERN_PCT = '100';
      const { featureFlags } = await import('../featureFlags');

      expect(featureFlags.isEnabledForUser('USE_REPOSITORY_PATTERN', 'any-user')).toBe(true);
    });

    it('returns false when percentage is 0', async () => {
      mockEnv.VITE_FF_REPOSITORY_PATTERN_PCT = '0';
      const { featureFlags } = await import('../featureFlags');

      expect(featureFlags.isEnabledForUser('USE_REPOSITORY_PATTERN', 'any-user')).toBe(false);
    });
  });

  describe('setFlag', () => {
    it('allows override in dev mode', async () => {
      mockEnv.DEV = 'true';
      const { featureFlags } = await import('../featureFlags');

      featureFlags.setFlag('USE_REPOSITORY_PATTERN', true);
      expect(featureFlags.isEnabled('USE_REPOSITORY_PATTERN')).toBe(true);
    });
  });
});
```

---

#### 4.1.2 Environment Configuration

**File: `.env.example` (update)**

```bash
# Existing
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Feature Flags - Phase 1
VITE_FF_REPOSITORY_PATTERN=false
VITE_FF_REPOSITORY_PATTERN_PCT=0
VITE_FF_OPTIMIZED_QUERIES=false
VITE_FF_OPTIMIZED_QUERIES_PCT=0
VITE_FF_ERROR_BOUNDARIES=true
VITE_FF_QUERY_HOOKS=false

# Error Monitoring
VITE_ERROR_REPORTING_ENABLED=true
```

---

### 4.2 Error Boundary System

#### 4.2.1 Error Types

**File: `src/core/errors/types.ts`**

```typescript
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

export type FallbackRender = (props: ErrorBoundaryFallbackProps) => React.ReactNode;
```

---

#### 4.2.2 Error Logger

**File: `src/core/errors/logger.ts`**

```typescript
import type { LogEntry, ErrorLevel, ErrorInfo } from './types';

/**
 * Centralized error logging with monitoring integration
 */
class ErrorLogger {
  private isDev = import.meta.env.DEV;
  private isEnabled = import.meta.env.VITE_ERROR_REPORTING_ENABLED !== 'false';
  private buffer: LogEntry[] = [];
  private flushInterval: number | null = null;

  constructor() {
    // Flush buffer every 10 seconds in production
    if (!this.isDev && typeof window !== 'undefined') {
      this.flushInterval = window.setInterval(() => this.flush(), 10000);
    }
  }

  /**
   * Log an entry
   */
  log(entry: Omit<LogEntry, 'timestamp' | 'url'>): void {
    const fullEntry: LogEntry = {
      ...entry,
      timestamp: new Date(),
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    };

    // Always log to console in dev
    if (this.isDev) {
      this.logToConsole(fullEntry);
    }

    // Buffer for production monitoring
    if (this.isEnabled && !this.isDev) {
      this.buffer.push(fullEntry);

      // Immediate flush for fatal/error
      if (entry.level === 'fatal' || entry.level === 'error') {
        this.flush();
      }
    }
  }

  private logToConsole(entry: LogEntry): void {
    const prefix = `[${entry.level.toUpperCase()}]`;
    const args: unknown[] = [prefix, entry.message];

    if (entry.error) args.push(entry.error);
    if (entry.context) args.push(entry.context);

    switch (entry.level) {
      case 'fatal':
      case 'error':
        console.error(...args);
        break;
      case 'warning':
        console.warn(...args);
        break;
      default:
        console.log(...args);
    }
  }

  /**
   * Flush buffered logs to monitoring service
   */
  private flush(): void {
    if (this.buffer.length === 0) return;

    const entries = this.buffer.splice(0, this.buffer.length);

    // Send to monitoring (Datadog RUM if available)
    if (typeof window !== 'undefined' && (window as any).DD_RUM) {
      entries.forEach(entry => {
        if (entry.error) {
          (window as any).DD_RUM.addError(entry.error, {
            level: entry.level,
            message: entry.message,
            ...entry.context,
          });
        } else {
          (window as any).DD_RUM.addAction(entry.message, {
            level: entry.level,
            ...entry.context,
          });
        }
      });
    } else {
      // Fallback: send via beacon API
      this.sendViaBeacon(entries);
    }
  }

  private sendViaBeacon(entries: LogEntry[]): void {
    if (!('sendBeacon' in navigator)) return;

    const payload = entries.map(e => ({
      level: e.level,
      message: e.message,
      stack: e.error?.stack,
      context: e.context,
      timestamp: e.timestamp.toISOString(),
      url: e.url,
    }));

    // You would replace this with your actual logging endpoint
    try {
      navigator.sendBeacon(
        '/api/log-errors',
        JSON.stringify(payload)
      );
    } catch {
      // Silently fail - logging should never break the app
    }
  }

  // Convenience methods
  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    this.log({ level: 'error', message, error, context });
  }

  fatal(message: string, error?: Error, context?: Record<string, unknown>): void {
    this.log({ level: 'fatal', message, error, context });
  }

  warning(message: string, context?: Record<string, unknown>): void {
    this.log({ level: 'warning', message, context });
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log({ level: 'info', message, context });
  }

  /**
   * Log React component error with boundary info
   */
  componentError(error: Error, errorInfo: ErrorInfo): void {
    this.error('React component error', error, {
      componentStack: errorInfo.componentStack,
      boundaryName: errorInfo.errorBoundaryName,
      timestamp: errorInfo.timestamp.toISOString(),
    });
  }

  /**
   * Cleanup on unmount
   */
  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flush();
  }
}

// Singleton
export const logger = new ErrorLogger();

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => logger.destroy());
}
```

---

#### 4.2.3 Base Error Boundary

**File: `src/core/errors/ErrorBoundary.tsx`**

```typescript
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
      return (
        <DefaultErrorFallback
          error={error}
          reset={this.reset}
          level={level}
        />
      );
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
```

---

#### 4.2.4 Query Error Boundary

**File: `src/core/errors/QueryErrorBoundary.tsx`**

```typescript
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
                reset();      // Reset React Query state
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
  const isNetworkError = error.message.includes('fetch') ||
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

      {import.meta.env.DEV && (
        <p className="mb-4 text-xs text-red-400">
          {error.message}
        </p>
      )}

      <button
        onClick={onRetry}
        className="rounded-lg bg-purple-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900"
      >
        Retry
      </button>
    </div>
  );
}
```

---

#### 4.2.5 Route Error Boundary

**File: `src/core/errors/RouteErrorBoundary.tsx`**

```typescript
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
            The page you're looking for doesn't exist or has been moved.
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
        <h1 className="mb-3 text-3xl font-bold text-white">
          Error {error.status}
        </h1>
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
```

---

#### 4.2.6 HOC Wrapper

**File: `src/core/errors/withErrorBoundary.tsx`**

```typescript
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
```

---

#### 4.2.7 Error System Exports

**File: `src/core/errors/index.ts`**

```typescript
// Types
export type {
  ErrorInfo,
  AppError,
  ErrorLevel,
  LogEntry,
  ErrorBoundaryFallbackProps,
  FallbackRender,
} from './types';

// Components
export { ErrorBoundary } from './ErrorBoundary';
export { QueryErrorBoundary } from './QueryErrorBoundary';
export { RouteErrorBoundary } from './RouteErrorBoundary';
export { withErrorBoundary } from './withErrorBoundary';

// Utilities
export { logger } from './logger';
```

---

#### 4.2.8 Error Boundary Tests

**File: `src/core/errors/__tests__/ErrorBoundary.test.tsx`**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '../ErrorBoundary';
import { logger } from '../logger';

// Mock logger
vi.mock('../logger', () => ({
  logger: {
    componentError: vi.fn(),
    error: vi.fn(),
  },
}));

// Component that throws
function ThrowingComponent({ shouldThrow = true }: { shouldThrow?: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>Content loaded</div>;
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Suppress console.error for cleaner test output
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('renders children when no error', () => {
    render(
      <ErrorBoundary name="Test">
        <div>Hello World</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('renders default fallback when error occurs', () => {
    render(
      <ErrorBoundary name="Test">
        <ThrowingComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Oops! A hiccup occurred')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
  });

  it('renders fatal fallback with correct message', () => {
    render(
      <ErrorBoundary name="Test" level="fatal">
        <ThrowingComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Try Again' })).not.toBeInTheDocument();
  });

  it('renders custom fallback element', () => {
    render(
      <ErrorBoundary name="Test" fallback={<div>Custom Error UI</div>}>
        <ThrowingComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom Error UI')).toBeInTheDocument();
  });

  it('renders custom fallback function with error and reset', () => {
    render(
      <ErrorBoundary
        name="Test"
        fallback={({ error, reset }) => (
          <div>
            <span>Error: {error.message}</span>
            <button onClick={reset}>Reset</button>
          </div>
        )}
      >
        <ThrowingComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Error: Test error')).toBeInTheDocument();
  });

  it('logs error to monitoring service', () => {
    render(
      <ErrorBoundary name="TestBoundary">
        <ThrowingComponent />
      </ErrorBoundary>
    );

    expect(logger.componentError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        errorBoundaryName: 'TestBoundary',
      })
    );
  });

  it('resets error state when reset is called', () => {
    const TestComponent = () => {
      const [shouldThrow, setShouldThrow] = React.useState(true);

      return (
        <ErrorBoundary
          name="Test"
          fallback={({ reset }) => (
            <button onClick={() => { setShouldThrow(false); reset(); }}>
              Fix and Retry
            </button>
          )}
        >
          <ThrowingComponent shouldThrow={shouldThrow} />
        </ErrorBoundary>
      );
    };

    render(<TestComponent />);

    // Error state
    expect(screen.getByRole('button', { name: 'Fix and Retry' })).toBeInTheDocument();

    // Click reset
    fireEvent.click(screen.getByRole('button', { name: 'Fix and Retry' }));

    // Should show content now
    expect(screen.getByText('Content loaded')).toBeInTheDocument();
  });

  it('calls onError callback when error occurs', () => {
    const onError = vi.fn();

    render(
      <ErrorBoundary name="Test" onError={onError}>
        <ThrowingComponent />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );
  });
});

// Need React import for useState in test
import React from 'react';
```

---

### 4.3 Data Layer & Repository Pattern

#### 4.3.1 Database Client

**File: `src/data/client.ts`**

```typescript
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';

type Tables = Database['public']['Tables'];

/**
 * Typed database client wrapper
 * Provides type-safe access to Supabase tables and RPC functions
 */
export const db = {
  // Table accessors
  stories: () => supabase.from('stories'),
  storyNodes: () => supabase.from('story_nodes'),
  storyChoices: () => supabase.from('story_choices'),
  storyComments: () => supabase.from('story_comments'),
  storyReactions: () => supabase.from('story_reactions'),
  userProfiles: () => supabase.from('user_profiles'),
  userFollows: () => supabase.from('user_follows'),
  interactiveContent: () => supabase.from('interactive_content'),
  musicContent: () => supabase.from('music_content'),

  // RPC function caller with typed params
  rpc: <T>(
    fn: string,
    params: Record<string, unknown> = {}
  ): Promise<{ data: T | null; error: Error | null }> => {
    return supabase.rpc(fn, params) as Promise<{ data: T | null; error: Error | null }>;
  },

  // Auth helper
  auth: supabase.auth,

  // Storage helper
  storage: supabase.storage,

  // Realtime helper (for future use)
  realtime: supabase.channel.bind(supabase),
};

/**
 * Helper to handle Supabase errors consistently
 */
export function handleDbError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return new Error(String((error as { message: unknown }).message));
  }
  return new Error('An unknown database error occurred');
}

/**
 * Type for paginated results
 */
export interface PaginatedResult<T> {
  data: T[];
  hasMore: boolean;
  total: number;
}
```

---

#### 4.3.2 Data Layer Types

**File: `src/data/types.ts`**

```typescript
// Re-export core types
export type {
  Story,
  StoryNode,
  StoryChoice,
  StoryReaction,
  UserProfile,
  StoryOutline,
  StoryMemory,
} from '@/lib/types';

// Paginated result type
export interface PaginatedResult<T> {
  data: T[];
  hasMore: boolean;
  total: number;
}

// Feed item types
export interface StoryFeedItem {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  cover_video_url: string | null;
  likes_count: number;
  dislikes_count: number;
  comment_count: number;
  completion_count: number;
  created_at: string;
  estimated_duration: number | null;
  creator_id: string | null;
  creator_name: string | null;
  creator_avatar: string | null;
  generation_status: string | null;
  language: string | null;
}

export interface UnifiedFeedItem {
  id: string;
  title: string;
  description: string | null;
  feed_type: 'story' | 'game' | 'tool' | 'quiz' | 'widget' | 'visualization' | 'music';
  thumbnail_url: string | null;
  preview_url: string | null;
  likes_count: number;
  dislikes_count: number;
  view_count: number;
  comment_count: number;
  created_at: string;
  created_by: string | null;
  estimated_duration: number | null;
  creator_name: string | null;
  creator_avatar: string | null;
  extra_data: Record<string, unknown> | null;
}

export interface StoryWithMetadata {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  cover_video_url: string | null;
  age_range: string | null;
  estimated_duration: number | null;
  story_context: string | null;
  likes_count: number;
  dislikes_count: number;
  comment_count: number;
  completion_count: number;
  created_at: string;
  created_by: string | null;
  is_public: boolean;
  generation_status: string | null;
  generation_progress: number | null;
  language: string | null;
  narrator_enabled: boolean | null;
  video_enabled: boolean | null;
  art_style: string | null;
  creator_name: string | null;
  creator_avatar: string | null;
  total_nodes: number;
  total_choices: number;
}

export interface NodeWithChoices {
  node: {
    id: string;
    story_id: string;
    node_key: string;
    content: string;
    is_ending: boolean | null;
    ending_type: string | null;
    order_index: number | null;
    image_url: string | null;
    image_prompt: string | null;
    audio_url: string | null;
    video_url: string | null;
    created_at: string | null;
  };
  choices: Array<{
    id: string;
    from_node_id: string;
    to_node_id: string;
    choice_text: string;
    consequence_hint: string | null;
    choice_order: number | null;
    to_node: {
      id: string;
      node_key: string;
      content: string;
      is_ending: boolean | null;
    } | null;
  }>;
}
```

---

#### 4.3.3 Base Repository

**File: `src/data/repositories/BaseRepository.ts`**

```typescript
import { db, handleDbError, type PaginatedResult } from '../client';
import { logger } from '@/core/errors';

export interface QueryOptions {
  filters?: Record<string, unknown>;
  orderBy?: string;
  ascending?: boolean;
  limit?: number;
  offset?: number;
  select?: string;
}

/**
 * Abstract base repository with common CRUD operations
 */
export abstract class BaseRepository<T extends { id: string }> {
  protected abstract tableName: string;
  protected abstract defaultSelect: string;

  /**
   * Find a single record by ID
   */
  async findById(id: string): Promise<T | null> {
    try {
      const { data, error } = await db[this.tableName as keyof typeof db]()
        .select(this.defaultSelect)
        .eq('id', id)
        .maybeSingle();

      if (error) throw handleDbError(error);
      return data as T | null;
    } catch (error) {
      logger.error(`${this.tableName}.findById failed`, error as Error, { id });
      throw error;
    }
  }

  /**
   * Find multiple records with pagination
   */
  async findMany(options: QueryOptions = {}): Promise<PaginatedResult<T>> {
    const {
      filters = {},
      orderBy = 'created_at',
      ascending = false,
      limit = 20,
      offset = 0,
      select = this.defaultSelect,
    } = options;

    try {
      // Build query
      let query = db[this.tableName as keyof typeof db]()
        .select(select, { count: 'exact' });

      // Apply filters
      for (const [key, value] of Object.entries(filters)) {
        if (value === null) {
          query = query.is(key, null);
        } else if (Array.isArray(value)) {
          query = query.in(key, value);
        } else {
          query = query.eq(key, value);
        }
      }

      // Apply ordering and pagination
      query = query
        .order(orderBy, { ascending })
        .range(offset, offset + limit);

      const { data, error, count } = await query;

      if (error) throw handleDbError(error);

      return {
        data: (data || []) as T[],
        hasMore: (data?.length || 0) === limit + 1,
        total: count || 0,
      };
    } catch (error) {
      logger.error(`${this.tableName}.findMany failed`, error as Error, { options });
      throw error;
    }
  }

  /**
   * Create a new record
   */
  async create(data: Partial<T>): Promise<T> {
    try {
      const { data: result, error } = await db[this.tableName as keyof typeof db]()
        .insert(data as Record<string, unknown>)
        .select(this.defaultSelect)
        .single();

      if (error) throw handleDbError(error);
      if (!result) throw new Error('Failed to create record');

      return result as T;
    } catch (error) {
      logger.error(`${this.tableName}.create failed`, error as Error);
      throw error;
    }
  }

  /**
   * Update a record by ID
   */
  async update(id: string, data: Partial<T>): Promise<T> {
    try {
      const { data: result, error } = await db[this.tableName as keyof typeof db]()
        .update(data as Record<string, unknown>)
        .eq('id', id)
        .select(this.defaultSelect)
        .single();

      if (error) throw handleDbError(error);
      if (!result) throw new Error('Failed to update record');

      return result as T;
    } catch (error) {
      logger.error(`${this.tableName}.update failed`, error as Error, { id });
      throw error;
    }
  }

  /**
   * Delete a record by ID
   */
  async delete(id: string): Promise<void> {
    try {
      const { error } = await db[this.tableName as keyof typeof db]()
        .delete()
        .eq('id', id);

      if (error) throw handleDbError(error);
    } catch (error) {
      logger.error(`${this.tableName}.delete failed`, error as Error, { id });
      throw error;
    }
  }
}
```

---

#### 4.3.4 Story Repository

**File: `src/data/repositories/StoryRepository.ts`**

```typescript
import { BaseRepository } from './BaseRepository';
import { db, handleDbError, type PaginatedResult } from '../client';
import { logger } from '@/core/errors';
import type {
  Story,
  StoryFeedItem,
  StoryWithMetadata,
  NodeWithChoices,
} from '../types';

/**
 * Repository for story-related data operations
 */
export class StoryRepository extends BaseRepository<Story> {
  protected tableName = 'stories' as const;
  protected defaultSelect = '*';

  /**
   * Get stories for feed with all metadata in ONE query
   * Uses database function to avoid N+1 problem
   */
  async getStoriesFeed(
    limit: number = 20,
    offset: number = 0,
    options: {
      isPublic?: boolean;
      userId?: string;
      excludeIds?: string[];
    } = {}
  ): Promise<PaginatedResult<StoryFeedItem>> {
    const { isPublic = true, userId = null, excludeIds = [] } = options;

    try {
      const { data, error } = await db.rpc<StoryFeedItem[]>('get_stories_feed', {
        p_limit: limit + 1, // +1 to check hasMore
        p_offset: offset,
        p_is_public: isPublic,
        p_user_id: userId,
        p_exclude_ids: excludeIds.length > 0 ? excludeIds : null,
      });

      if (error) throw handleDbError(error);

      const items = data || [];
      const hasMore = items.length > limit;

      return {
        data: hasMore ? items.slice(0, -1) : items,
        hasMore,
        total: 0, // RPC doesn't return count efficiently
      };
    } catch (error) {
      logger.error('StoryRepository.getStoriesFeed failed', error as Error, {
        limit, offset, options,
      });
      throw error;
    }
  }

  /**
   * Get a single story with all metadata
   */
  async getStoryWithMetadata(storyId: string): Promise<StoryWithMetadata | null> {
    try {
      const { data, error } = await db.rpc<StoryWithMetadata[]>(
        'get_story_with_metadata',
        { p_story_id: storyId }
      );

      if (error) throw handleDbError(error);
      return data?.[0] || null;
    } catch (error) {
      logger.error('StoryRepository.getStoryWithMetadata failed', error as Error, {
        storyId,
      });
      throw error;
    }
  }

  /**
   * Get story node with its choices in one query
   */
  async getNodeWithChoices(
    storyId: string,
    nodeKey: string
  ): Promise<NodeWithChoices | null> {
    try {
      const { data, error } = await db.rpc<NodeWithChoices>(
        'get_node_with_choices',
        { p_story_id: storyId, p_node_key: nodeKey }
      );

      if (error) throw handleDbError(error);
      return data;
    } catch (error) {
      logger.error('StoryRepository.getNodeWithChoices failed', error as Error, {
        storyId, nodeKey,
      });
      throw error;
    }
  }

  /**
   * Get user's reaction to a story
   */
  async getUserReaction(
    userId: string,
    storyId: string
  ): Promise<'like' | 'dislike' | null> {
    try {
      const { data, error } = await db.storyReactions()
        .select('reaction_type')
        .eq('user_id', userId)
        .eq('story_id', storyId)
        .maybeSingle();

      if (error) throw handleDbError(error);
      return data?.reaction_type as 'like' | 'dislike' | null;
    } catch (error) {
      logger.error('StoryRepository.getUserReaction failed', error as Error, {
        userId, storyId,
      });
      throw error;
    }
  }

  /**
   * Batch get user reactions for multiple stories
   * Useful for feed where you need reactions for all visible items
   */
  async getUserReactionsBatch(
    userId: string,
    storyIds: string[]
  ): Promise<Map<string, 'like' | 'dislike'>> {
    if (storyIds.length === 0) return new Map();

    try {
      const { data, error } = await db.storyReactions()
        .select('story_id, reaction_type')
        .eq('user_id', userId)
        .in('story_id', storyIds);

      if (error) throw handleDbError(error);

      const reactionMap = new Map<string, 'like' | 'dislike'>();
      for (const item of data || []) {
        reactionMap.set(item.story_id, item.reaction_type as 'like' | 'dislike');
      }

      return reactionMap;
    } catch (error) {
      logger.error('StoryRepository.getUserReactionsBatch failed', error as Error, {
        userId, storyCount: storyIds.length,
      });
      throw error;
    }
  }

  /**
   * Add or update reaction
   */
  async setReaction(
    userId: string,
    storyId: string,
    reactionType: 'like' | 'dislike'
  ): Promise<void> {
    try {
      const { error } = await db.storyReactions()
        .upsert({
          user_id: userId,
          story_id: storyId,
          reaction_type: reactionType,
        }, {
          onConflict: 'user_id,story_id',
        });

      if (error) throw handleDbError(error);
    } catch (error) {
      logger.error('StoryRepository.setReaction failed', error as Error, {
        userId, storyId, reactionType,
      });
      throw error;
    }
  }

  /**
   * Remove reaction
   */
  async removeReaction(userId: string, storyId: string): Promise<void> {
    try {
      const { error } = await db.storyReactions()
        .delete()
        .eq('user_id', userId)
        .eq('story_id', storyId);

      if (error) throw handleDbError(error);
    } catch (error) {
      logger.error('StoryRepository.removeReaction failed', error as Error, {
        userId, storyId,
      });
      throw error;
    }
  }
}

// Singleton instance
export const storyRepository = new StoryRepository();
```

---

I'll continue with the remaining sections in a second file due to length. Let me create Part 2.
# Phase 1: Implementation Specification (Part 2)

---

## 4.3.5 Feed Repository

**File: `src/data/repositories/FeedRepository.ts`**

```typescript
import { db, handleDbError, type PaginatedResult } from '../client';
import { logger } from '@/core/errors';
import type { UnifiedFeedItem } from '../types';

export type FeedFilter = 'all' | 'story' | 'game' | 'tool' | 'quiz' | 'widget' | 'visualization' | 'music';

/**
 * Repository for unified feed operations
 */
export class FeedRepository {
  /**
   * Get unified feed with all content types
   * Uses optimized database function
   */
  async getUnifiedFeed(
    filter: FeedFilter = 'all',
    limit: number = 20,
    offset: number = 0,
    excludeIds: string[] = []
  ): Promise<PaginatedResult<UnifiedFeedItem>> {
    try {
      const { data, error } = await db.rpc<UnifiedFeedItem[]>('get_unified_feed', {
        p_limit: limit + 1,
        p_offset: offset,
        p_content_type: filter === 'all' ? null : filter,
        p_exclude_ids: excludeIds.length > 0 ? excludeIds : null,
      });

      if (error) throw handleDbError(error);

      const items = data || [];
      const hasMore = items.length > limit;

      return {
        data: hasMore ? items.slice(0, -1) : items,
        hasMore,
        total: 0,
      };
    } catch (error) {
      logger.error('FeedRepository.getUnifiedFeed failed', error as Error, {
        filter, limit, offset,
      });
      throw error;
    }
  }

  /**
   * Get trending content from last 7 days
   */
  async getTrendingFeed(limit: number = 20): Promise<UnifiedFeedItem[]> {
    try {
      const { data, error } = await db.rpc<UnifiedFeedItem[]>('get_trending_feed', {
        p_limit: limit,
        p_days: 7,
      });

      if (error) throw handleDbError(error);
      return data || [];
    } catch (error) {
      logger.error('FeedRepository.getTrendingFeed failed', error as Error, { limit });
      throw error;
    }
  }

  /**
   * Get feed from followed users
   */
  async getFollowingFeed(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<PaginatedResult<UnifiedFeedItem>> {
    try {
      const { data, error } = await db.rpc<UnifiedFeedItem[]>('get_following_feed', {
        p_user_id: userId,
        p_limit: limit + 1,
        p_offset: offset,
      });

      if (error) throw handleDbError(error);

      const items = data || [];
      const hasMore = items.length > limit;

      return {
        data: hasMore ? items.slice(0, -1) : items,
        hasMore,
        total: 0,
      };
    } catch (error) {
      logger.error('FeedRepository.getFollowingFeed failed', error as Error, {
        userId, limit, offset,
      });
      throw error;
    }
  }
}

// Singleton instance
export const feedRepository = new FeedRepository();
```

---

## 4.3.6 Repository Exports

**File: `src/data/repositories/index.ts`**

```typescript
export { BaseRepository } from './BaseRepository';
export { StoryRepository, storyRepository } from './StoryRepository';
export { FeedRepository, feedRepository } from './FeedRepository';
```

---

## 4.3.7 Data Layer Index

**File: `src/data/index.ts`**

```typescript
// Client
export { db, handleDbError, type PaginatedResult } from './client';

// Types
export type * from './types';

// Repositories
export {
  storyRepository,
  feedRepository,
  StoryRepository,
  FeedRepository,
  BaseRepository,
} from './repositories';

// Hooks
export * from './hooks';
```

---

## 4.4 Database Optimizations

### 4.4.1 Migration File

**File: `supabase/migrations/20260102000000_add_optimized_feed_functions.sql`**

```sql
-- ============================================
-- OPTIMIZED FEED FUNCTIONS
-- Eliminates N+1 queries by fetching all data in single calls
-- ============================================

-- ============================================
-- FUNCTION: get_stories_feed
-- Returns stories with all metadata in one query
-- ============================================
CREATE OR REPLACE FUNCTION get_stories_feed(
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0,
  p_is_public BOOLEAN DEFAULT TRUE,
  p_user_id UUID DEFAULT NULL,
  p_exclude_ids UUID[] DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  cover_image_url TEXT,
  cover_video_url TEXT,
  age_range TEXT,
  estimated_duration INT,
  likes_count INT,
  dislikes_count INT,
  comment_count BIGINT,
  completion_count INT,
  created_at TIMESTAMPTZ,
  created_by UUID,
  is_public BOOLEAN,
  generation_status TEXT,
  language TEXT,
  creator_id UUID,
  creator_name TEXT,
  creator_avatar TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  -- Input validation
  IF p_limit < 1 THEN p_limit := 20; END IF;
  IF p_limit > 100 THEN p_limit := 100; END IF;
  IF p_offset < 0 THEN p_offset := 0; END IF;

  RETURN QUERY
  SELECT
    s.id,
    s.title,
    s.description,
    -- Use cover image or fallback to start node image
    COALESCE(s.cover_image_url, start_node.image_url) as cover_image_url,
    s.cover_video_url,
    s.age_range,
    s.estimated_duration,
    COALESCE(s.likes_count, 0)::INT as likes_count,
    COALESCE(s.dislikes_count, 0)::INT as dislikes_count,
    COALESCE(comment_stats.cnt, 0) as comment_count,
    COALESCE(s.completion_count, 0)::INT as completion_count,
    s.created_at,
    s.created_by,
    s.is_public,
    s.generation_status,
    s.language,
    -- Creator info
    p.id as creator_id,
    p.display_name as creator_name,
    p.avatar_url as creator_avatar
  FROM stories s
  -- LEFT JOIN for creator profile
  LEFT JOIN user_profiles p ON s.created_by = p.id
  -- Subquery for comment count (more efficient than LATERAL for this case)
  LEFT JOIN LATERAL (
    SELECT COUNT(*)::BIGINT as cnt
    FROM story_comments sc
    WHERE sc.story_id = s.id
  ) comment_stats ON true
  -- Subquery for start node image (fallback cover)
  LEFT JOIN LATERAL (
    SELECT sn.image_url
    FROM story_nodes sn
    WHERE sn.story_id = s.id AND sn.node_key = 'start'
    LIMIT 1
  ) start_node ON true
  WHERE
    -- Filter by visibility
    (p_is_public IS NULL OR s.is_public = p_is_public)
    -- Filter by user if specified
    AND (p_user_id IS NULL OR s.created_by = p_user_id)
    -- Only show completed stories in public feed
    AND (NOT COALESCE(p_is_public, false) OR s.generation_status = 'complete')
    -- Exclude specific IDs
    AND (p_exclude_ids IS NULL OR NOT (s.id = ANY(p_exclude_ids)))
  ORDER BY s.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_stories_feed TO anon, authenticated;

-- ============================================
-- FUNCTION: get_story_with_metadata
-- Returns a single story with all related data
-- ============================================
CREATE OR REPLACE FUNCTION get_story_with_metadata(p_story_id UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  cover_image_url TEXT,
  cover_video_url TEXT,
  age_range TEXT,
  estimated_duration INT,
  story_context TEXT,
  likes_count INT,
  dislikes_count INT,
  comment_count BIGINT,
  completion_count INT,
  created_at TIMESTAMPTZ,
  created_by UUID,
  is_public BOOLEAN,
  generation_status TEXT,
  generation_progress INT,
  language TEXT,
  narrator_enabled BOOLEAN,
  video_enabled BOOLEAN,
  art_style TEXT,
  creator_name TEXT,
  creator_avatar TEXT,
  total_nodes BIGINT,
  total_choices BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.title,
    s.description,
    COALESCE(s.cover_image_url, start_node.image_url) as cover_image_url,
    s.cover_video_url,
    s.age_range,
    s.estimated_duration,
    s.story_context,
    COALESCE(s.likes_count, 0)::INT as likes_count,
    COALESCE(s.dislikes_count, 0)::INT as dislikes_count,
    COALESCE(comments.cnt, 0) as comment_count,
    COALESCE(s.completion_count, 0)::INT as completion_count,
    s.created_at,
    s.created_by,
    s.is_public,
    s.generation_status,
    s.generation_progress,
    s.language,
    s.narrator_enabled,
    s.video_enabled,
    s.art_style,
    -- Creator
    p.display_name as creator_name,
    p.avatar_url as creator_avatar,
    -- Stats
    COALESCE(nodes.cnt, 0) as total_nodes,
    COALESCE(choices.cnt, 0) as total_choices
  FROM stories s
  LEFT JOIN user_profiles p ON s.created_by = p.id
  LEFT JOIN LATERAL (
    SELECT COUNT(*)::BIGINT as cnt FROM story_comments WHERE story_id = s.id
  ) comments ON true
  LEFT JOIN LATERAL (
    SELECT COUNT(*)::BIGINT as cnt FROM story_nodes WHERE story_id = s.id
  ) nodes ON true
  LEFT JOIN LATERAL (
    SELECT COUNT(*)::BIGINT as cnt
    FROM story_choices sc
    INNER JOIN story_nodes sn ON sc.from_node_id = sn.id
    WHERE sn.story_id = s.id
  ) choices ON true
  LEFT JOIN LATERAL (
    SELECT image_url FROM story_nodes WHERE story_id = s.id AND node_key = 'start' LIMIT 1
  ) start_node ON true
  WHERE s.id = p_story_id;
END;
$$;

GRANT EXECUTE ON FUNCTION get_story_with_metadata TO anon, authenticated;

-- ============================================
-- FUNCTION: get_node_with_choices
-- Returns a story node with all its choices as JSON
-- ============================================
CREATE OR REPLACE FUNCTION get_node_with_choices(
  p_story_id UUID,
  p_node_key TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  result JSON;
  v_node RECORD;
BEGIN
  -- Get the node
  SELECT * INTO v_node
  FROM story_nodes
  WHERE story_id = p_story_id AND node_key = p_node_key;

  IF v_node IS NULL THEN
    RETURN NULL;
  END IF;

  -- Build result with node and choices
  SELECT json_build_object(
    'node', json_build_object(
      'id', v_node.id,
      'story_id', v_node.story_id,
      'node_key', v_node.node_key,
      'content', v_node.content,
      'is_ending', v_node.is_ending,
      'ending_type', v_node.ending_type,
      'order_index', v_node.order_index,
      'image_url', v_node.image_url,
      'image_prompt', v_node.image_prompt,
      'audio_url', v_node.audio_url,
      'video_url', v_node.video_url,
      'created_at', v_node.created_at
    ),
    'choices', COALESCE(
      (
        SELECT json_agg(
          json_build_object(
            'id', sc.id,
            'from_node_id', sc.from_node_id,
            'to_node_id', sc.to_node_id,
            'choice_text', sc.choice_text,
            'consequence_hint', sc.consequence_hint,
            'choice_order', sc.choice_order,
            'to_node', CASE
              WHEN tn.id IS NOT NULL THEN json_build_object(
                'id', tn.id,
                'node_key', tn.node_key,
                'content', tn.content,
                'is_ending', tn.is_ending
              )
              ELSE NULL
            END
          )
          ORDER BY sc.choice_order
        )
        FROM story_choices sc
        LEFT JOIN story_nodes tn ON sc.to_node_id = tn.id
        WHERE sc.from_node_id = v_node.id
      ),
      '[]'::json
    )
  ) INTO result;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_node_with_choices TO anon, authenticated;

-- ============================================
-- FUNCTION: get_unified_feed
-- Returns mixed content feed (stories + interactive + music)
-- ============================================
CREATE OR REPLACE FUNCTION get_unified_feed(
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0,
  p_content_type TEXT DEFAULT NULL,
  p_exclude_ids UUID[] DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  feed_type TEXT,
  thumbnail_url TEXT,
  preview_url TEXT,
  likes_count INT,
  dislikes_count INT,
  view_count INT,
  comment_count BIGINT,
  created_at TIMESTAMPTZ,
  created_by UUID,
  estimated_duration INT,
  creator_name TEXT,
  creator_avatar TEXT,
  extra_data JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  -- Input validation
  IF p_limit < 1 THEN p_limit := 20; END IF;
  IF p_limit > 100 THEN p_limit := 100; END IF;
  IF p_offset < 0 THEN p_offset := 0; END IF;

  RETURN QUERY
  WITH unified AS (
    -- Stories
    SELECT
      s.id,
      s.title,
      s.description,
      'story'::TEXT as feed_type,
      COALESCE(s.cover_image_url, sn.image_url) as thumbnail_url,
      s.cover_video_url as preview_url,
      COALESCE(s.likes_count, 0)::INT as likes_count,
      COALESCE(s.dislikes_count, 0)::INT as dislikes_count,
      COALESCE(s.completion_count, 0)::INT as view_count,
      COALESCE(cc.cnt, 0)::BIGINT as comment_count,
      s.created_at,
      s.created_by,
      s.estimated_duration,
      p.display_name as creator_name,
      p.avatar_url as creator_avatar,
      NULL::JSONB as extra_data
    FROM stories s
    LEFT JOIN user_profiles p ON s.created_by = p.id
    LEFT JOIN LATERAL (
      SELECT COUNT(*)::BIGINT as cnt FROM story_comments WHERE story_id = s.id
    ) cc ON true
    LEFT JOIN LATERAL (
      SELECT image_url FROM story_nodes WHERE story_id = s.id AND node_key = 'start' LIMIT 1
    ) sn ON true
    WHERE
      s.is_public = true
      AND s.generation_status = 'complete'
      AND (p_content_type IS NULL OR p_content_type = 'story')
      AND (p_exclude_ids IS NULL OR NOT (s.id = ANY(p_exclude_ids)))

    UNION ALL

    -- Interactive content
    SELECT
      ic.id,
      ic.title,
      ic.description,
      ic.content_type::TEXT as feed_type,
      ic.thumbnail_url,
      ic.preview_gif_url as preview_url,
      COALESCE(ic.likes_count, 0)::INT as likes_count,
      COALESCE(ic.dislikes_count, 0)::INT as dislikes_count,
      COALESCE(ic.view_count, 0)::INT as view_count,
      COALESCE(ic.comment_count, 0)::BIGINT as comment_count,
      ic.created_at,
      ic.created_by,
      ic.estimated_interaction_time as estimated_duration,
      p.display_name as creator_name,
      p.avatar_url as creator_avatar,
      jsonb_build_object('tags', ic.tags) as extra_data
    FROM interactive_content ic
    LEFT JOIN user_profiles p ON ic.created_by = p.id
    WHERE
      ic.is_public = true
      AND (p_content_type IS NULL OR ic.content_type = p_content_type)
      AND (p_exclude_ids IS NULL OR NOT (ic.id = ANY(p_exclude_ids)))

    UNION ALL

    -- Music
    SELECT
      mc.id,
      mc.title,
      mc.description,
      'music'::TEXT as feed_type,
      NULL as thumbnail_url,
      NULL as preview_url,
      COALESCE(mc.likes_count, 0)::INT as likes_count,
      COALESCE(mc.dislikes_count, 0)::INT as dislikes_count,
      COALESCE(mc.play_count, 0)::INT as view_count,
      0::BIGINT as comment_count,
      mc.created_at,
      mc.created_by,
      mc.duration as estimated_duration,
      p.display_name as creator_name,
      p.avatar_url as creator_avatar,
      jsonb_build_object(
        'audio_url', mc.audio_url,
        'lyrics', mc.lyrics,
        'genre', mc.genre,
        'mood', mc.mood
      ) as extra_data
    FROM music_content mc
    LEFT JOIN user_profiles p ON mc.created_by = p.id
    WHERE
      mc.is_public = true
      AND (p_content_type IS NULL OR p_content_type = 'music')
      AND (p_exclude_ids IS NULL OR NOT (mc.id = ANY(p_exclude_ids)))
  )
  SELECT * FROM unified
  ORDER BY created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION get_unified_feed TO anon, authenticated;

-- ============================================
-- FUNCTION: get_trending_feed
-- Returns trending content from recent days
-- ============================================
CREATE OR REPLACE FUNCTION get_trending_feed(
  p_limit INT DEFAULT 20,
  p_days INT DEFAULT 7
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  feed_type TEXT,
  thumbnail_url TEXT,
  preview_url TEXT,
  likes_count INT,
  dislikes_count INT,
  view_count INT,
  comment_count BIGINT,
  created_at TIMESTAMPTZ,
  created_by UUID,
  estimated_duration INT,
  creator_name TEXT,
  creator_avatar TEXT,
  extra_data JSONB,
  engagement_score BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  cutoff_date TIMESTAMPTZ;
BEGIN
  cutoff_date := NOW() - (p_days || ' days')::INTERVAL;

  RETURN QUERY
  WITH scored AS (
    SELECT
      u.*,
      (COALESCE(u.likes_count, 0) * 2 + COALESCE(u.view_count, 0))::BIGINT as engagement_score
    FROM get_unified_feed(1000, 0, NULL, NULL) u
    WHERE u.created_at >= cutoff_date
  )
  SELECT *
  FROM scored
  ORDER BY engagement_score DESC, created_at DESC
  LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION get_trending_feed TO anon, authenticated;

-- ============================================
-- FUNCTION: get_following_feed
-- Returns content from followed users
-- ============================================
CREATE OR REPLACE FUNCTION get_following_feed(
  p_user_id UUID,
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  feed_type TEXT,
  thumbnail_url TEXT,
  preview_url TEXT,
  likes_count INT,
  dislikes_count INT,
  view_count INT,
  comment_count BIGINT,
  created_at TIMESTAMPTZ,
  created_by UUID,
  estimated_duration INT,
  creator_name TEXT,
  creator_avatar TEXT,
  extra_data JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN QUERY
  WITH following_ids AS (
    SELECT following_id FROM user_follows WHERE follower_id = p_user_id
  )
  SELECT u.*
  FROM get_unified_feed(p_limit, p_offset, NULL, NULL) u
  WHERE u.created_by IN (SELECT following_id FROM following_ids)
  ORDER BY u.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION get_following_feed TO anon, authenticated;

-- ============================================
-- PERFORMANCE INDEXES
-- ============================================

-- Composite indexes for feed queries
CREATE INDEX IF NOT EXISTS idx_stories_public_feed
  ON stories (created_at DESC)
  WHERE is_public = true AND generation_status = 'complete';

CREATE INDEX IF NOT EXISTS idx_stories_user_feed
  ON stories (created_by, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_interactive_public_feed
  ON interactive_content (created_at DESC)
  WHERE is_public = true;

CREATE INDEX IF NOT EXISTS idx_music_public_feed
  ON music_content (created_at DESC)
  WHERE is_public = true;

-- Index for faster comment counts
CREATE INDEX IF NOT EXISTS idx_story_comments_story_id
  ON story_comments (story_id);

-- Index for story nodes lookup
CREATE INDEX IF NOT EXISTS idx_story_nodes_story_nodekey
  ON story_nodes (story_id, node_key);

-- Index for choices lookup
CREATE INDEX IF NOT EXISTS idx_story_choices_from_node
  ON story_choices (from_node_id);

-- Index for user follows
CREATE INDEX IF NOT EXISTS idx_user_follows_follower
  ON user_follows (follower_id);

CREATE INDEX IF NOT EXISTS idx_user_follows_following
  ON user_follows (following_id);

-- Index for reactions
CREATE INDEX IF NOT EXISTS idx_story_reactions_user_story
  ON story_reactions (user_id, story_id);
```

---

## 4.5 React Query Integration

### 4.5.1 Story Hooks

**File: `src/data/hooks/useStories.ts`**

```typescript
import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from '@tanstack/react-query';
import { storyRepository } from '../repositories';
import { queryKeys } from '@/lib/queryClient';
import { featureFlags } from '@/core/config/featureFlags';
import type { StoryFeedItem, StoryWithMetadata, NodeWithChoices } from '../types';

/**
 * Hook to fetch paginated stories for feed
 */
export function useStoriesFeed(
  limit: number = 20,
  options: { isPublic?: boolean; userId?: string } = {}
) {
  return useInfiniteQuery({
    queryKey: queryKeys.stories.list({ limit, ...options }),
    queryFn: ({ pageParam = 0 }) =>
      storyRepository.getStoriesFeed(limit, pageParam, options),
    getNextPageParam: (lastPage, allPages) =>
      lastPage.hasMore ? allPages.length * limit : undefined,
    enabled: featureFlags.isEnabled('USE_REPOSITORY_PATTERN'),
    staleTime: 60_000, // 1 minute
    gcTime: 300_000, // 5 minutes
  });
}

/**
 * Hook to fetch a single story with metadata
 */
export function useStory(storyId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.stories.detail(storyId || ''),
    queryFn: () => storyRepository.getStoryWithMetadata(storyId!),
    enabled: !!storyId && featureFlags.isEnabled('USE_REPOSITORY_PATTERN'),
    staleTime: 300_000, // 5 minutes
    gcTime: 600_000, // 10 minutes
  });
}

/**
 * Hook to fetch a story node with choices
 */
export function useStoryNode(storyId: string | undefined, nodeKey: string) {
  return useQuery({
    queryKey: queryKeys.storyNodes.node(storyId || '', nodeKey),
    queryFn: () => storyRepository.getNodeWithChoices(storyId!, nodeKey),
    enabled: !!storyId && featureFlags.isEnabled('USE_REPOSITORY_PATTERN'),
    staleTime: 300_000,
  });
}

/**
 * Hook to manage story reactions
 */
export function useStoryReaction(storyId: string, userId: string | undefined) {
  const queryClient = useQueryClient();
  const queryKey = queryKeys.reactions.userReaction(userId || '', storyId);

  const { data: reaction, isLoading } = useQuery({
    queryKey,
    queryFn: () => storyRepository.getUserReaction(userId!, storyId),
    enabled: !!userId && featureFlags.isEnabled('USE_REPOSITORY_PATTERN'),
    staleTime: 60_000,
  });

  const setReactionMutation = useMutation({
    mutationFn: (reactionType: 'like' | 'dislike') =>
      storyRepository.setReaction(userId!, storyId, reactionType),
    onMutate: async (newReaction) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, newReaction);

      // Also update story likes/dislikes count
      const storyKey = queryKeys.stories.detail(storyId);
      const previousStory = queryClient.getQueryData<StoryWithMetadata>(storyKey);
      if (previousStory) {
        queryClient.setQueryData(storyKey, {
          ...previousStory,
          likes_count: previousStory.likes_count + (newReaction === 'like' ? 1 : 0),
          dislikes_count: previousStory.dislikes_count + (newReaction === 'dislike' ? 1 : 0),
        });
      }

      return { previous, previousStory };
    },
    onError: (err, newReaction, context) => {
      // Rollback on error
      if (context?.previous !== undefined) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      if (context?.previousStory) {
        queryClient.setQueryData(queryKeys.stories.detail(storyId), context.previousStory);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: queryKeys.stories.detail(storyId) });
    },
  });

  const removeReactionMutation = useMutation({
    mutationFn: () => storyRepository.removeReaction(userId!, storyId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, null);
      return { previous };
    },
    onError: (err, vars, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: queryKeys.stories.detail(storyId) });
    },
  });

  return {
    reaction,
    isLoading,
    setReaction: setReactionMutation.mutate,
    removeReaction: removeReactionMutation.mutate,
    isUpdating: setReactionMutation.isPending || removeReactionMutation.isPending,
  };
}

/**
 * Hook to batch fetch reactions for multiple stories
 */
export function useStoryReactionsBatch(
  storyIds: string[],
  userId: string | undefined
) {
  return useQuery({
    queryKey: ['reactions', 'batch', userId, storyIds.sort().join(',')],
    queryFn: () => storyRepository.getUserReactionsBatch(userId!, storyIds),
    enabled: !!userId && storyIds.length > 0 && featureFlags.isEnabled('USE_REPOSITORY_PATTERN'),
    staleTime: 60_000,
  });
}
```

---

### 4.5.2 Feed Hooks

**File: `src/data/hooks/useFeed.ts`**

```typescript
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { feedRepository, type FeedFilter } from '../repositories/FeedRepository';
import { featureFlags } from '@/core/config/featureFlags';

/**
 * Hook for unified feed with infinite scroll
 */
export function useUnifiedFeed(
  filter: FeedFilter = 'all',
  options: { excludeIds?: string[] } = {}
) {
  return useInfiniteQuery({
    queryKey: ['feed', 'unified', filter, options.excludeIds?.join(',')],
    queryFn: ({ pageParam = 0 }) =>
      feedRepository.getUnifiedFeed(filter, 20, pageParam, options.excludeIds || []),
    getNextPageParam: (lastPage, allPages) =>
      lastPage.hasMore ? allPages.length * 20 : undefined,
    enabled: featureFlags.isEnabled('USE_REPOSITORY_PATTERN'),
    staleTime: 60_000,
    gcTime: 300_000,
  });
}

/**
 * Hook for trending content
 */
export function useTrendingFeed(limit: number = 20) {
  return useQuery({
    queryKey: ['feed', 'trending', limit],
    queryFn: () => feedRepository.getTrendingFeed(limit),
    enabled: featureFlags.isEnabled('USE_REPOSITORY_PATTERN'),
    staleTime: 300_000, // 5 minutes - trending changes slowly
    gcTime: 600_000,
  });
}

/**
 * Hook for following feed
 */
export function useFollowingFeed(userId: string | undefined) {
  return useInfiniteQuery({
    queryKey: ['feed', 'following', userId],
    queryFn: ({ pageParam = 0 }) =>
      feedRepository.getFollowingFeed(userId!, 20, pageParam),
    getNextPageParam: (lastPage, allPages) =>
      lastPage.hasMore ? allPages.length * 20 : undefined,
    enabled: !!userId && featureFlags.isEnabled('USE_REPOSITORY_PATTERN'),
    staleTime: 60_000,
    gcTime: 300_000,
  });
}
```

---

### 4.5.3 Hooks Index

**File: `src/data/hooks/index.ts`**

```typescript
export {
  useStoriesFeed,
  useStory,
  useStoryNode,
  useStoryReaction,
  useStoryReactionsBatch,
} from './useStories';

export {
  useUnifiedFeed,
  useTrendingFeed,
  useFollowingFeed,
} from './useFeed';
```

---

## 4.6 Service Layer Refactoring

### 4.6.1 Updated Story Service

**File: `src/lib/storyService.ts` (REFACTORED)**

```typescript
// This file now acts as a facade that delegates to repositories
// Old N+1 code is preserved behind feature flag for safe rollback

import { featureFlags } from '@/core/config/featureFlags';
import { storyRepository } from '@/data/repositories/StoryRepository';
import { supabase } from './supabase';
import type { Story, StoryNode, StoryChoice, StoryReaction } from './types';

export interface PaginatedResult<T> {
  data: T[];
  hasMore: boolean;
  total: number;
}

/**
 * Get paginated stories for feed
 */
export async function getStoriesPaginated(
  limit: number = 10,
  offset: number = 0
): Promise<PaginatedResult<Story>> {
  // NEW: Use optimized repository
  if (featureFlags.isEnabled('USE_REPOSITORY_PATTERN')) {
    const result = await storyRepository.getStoriesFeed(limit, offset);

    // Transform to match old interface
    const stories: Story[] = result.data.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      cover_image_url: item.cover_image_url,
      cover_video_url: item.cover_video_url,
      likes_count: item.likes_count,
      dislikes_count: item.dislikes_count,
      comment_count: item.comment_count,
      created_at: item.created_at,
      created_by: item.creator_id,
      is_public: true,
      generation_status: item.generation_status,
      estimated_duration: item.estimated_duration,
      language: item.language,
      creator: item.creator_name
        ? { display_name: item.creator_name, avatar_url: item.creator_avatar }
        : null,
    }));

    return {
      data: stories,
      hasMore: result.hasMore,
      total: result.total,
    };
  }

  // LEGACY: Old N+1 implementation (will be removed after migration)
  return getStoriesPaginatedLegacy(limit, offset);
}

/**
 * Legacy implementation - DO NOT USE DIRECTLY
 * @deprecated Use getStoriesPaginated with USE_REPOSITORY_PATTERN flag
 */
async function getStoriesPaginatedLegacy(
  limit: number,
  offset: number
): Promise<PaginatedResult<Story>> {
  // First get total count
  const { count: total } = await supabase
    .from('stories')
    .select('*', { count: 'exact', head: true });

  const { data: stories, error } = await supabase
    .from('stories')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  if (!stories) return { data: [], hasMore: false, total: 0 };

  // N+1 queries (to be removed)
  const storiesWithCreators = await Promise.all(
    stories.map(async (story) => {
      const { data: creator } = story.created_by
        ? await supabase
            .from('user_profiles')
            .select('display_name, avatar_url')
            .eq('id', story.created_by)
            .maybeSingle()
        : { data: null };

      const { count: commentCount } = await supabase
        .from('story_comments')
        .select('*', { count: 'exact', head: true })
        .eq('story_id', story.id);

      let coverImage = story.cover_image_url;
      if (!coverImage) {
        const { data: startNode } = await supabase
          .from('story_nodes')
          .select('image_url')
          .eq('story_id', story.id)
          .eq('node_key', 'start')
          .maybeSingle();

        if (startNode?.image_url) {
          coverImage = startNode.image_url;
        }
      }

      return {
        ...story,
        cover_image_url: coverImage,
        creator,
        comment_count: commentCount || 0,
      };
    })
  );

  return {
    data: storiesWithCreators,
    hasMore: offset + limit < (total || 0),
    total: total || 0,
  };
}

/**
 * Get a single story with metadata
 */
export async function getStory(storyId: string): Promise<Story | null> {
  if (featureFlags.isEnabled('USE_REPOSITORY_PATTERN')) {
    const result = await storyRepository.getStoryWithMetadata(storyId);
    if (!result) return null;

    return {
      id: result.id,
      title: result.title,
      description: result.description,
      cover_image_url: result.cover_image_url,
      cover_video_url: result.cover_video_url,
      age_range: result.age_range,
      estimated_duration: result.estimated_duration,
      story_context: result.story_context,
      likes_count: result.likes_count,
      dislikes_count: result.dislikes_count,
      comment_count: result.comment_count,
      completion_count: result.completion_count,
      created_at: result.created_at,
      created_by: result.created_by,
      is_public: result.is_public,
      generation_status: result.generation_status,
      generation_progress: result.generation_progress,
      language: result.language,
      narrator_enabled: result.narrator_enabled,
      video_enabled: result.video_enabled,
      art_style: result.art_style,
      creator: result.creator_name
        ? { display_name: result.creator_name, avatar_url: result.creator_avatar }
        : null,
    };
  }

  // Legacy implementation
  return getStoryLegacy(storyId);
}

async function getStoryLegacy(storyId: string): Promise<Story | null> {
  const { data: story, error } = await supabase
    .from('stories')
    .select('*')
    .eq('id', storyId)
    .maybeSingle();

  if (error) throw error;
  if (!story) return null;

  const { data: creator } = story.created_by
    ? await supabase
        .from('user_profiles')
        .select('display_name, avatar_url')
        .eq('id', story.created_by)
        .maybeSingle()
    : { data: null };

  let coverImage = story.cover_image_url;
  if (!coverImage) {
    const { data: startNode } = await supabase
      .from('story_nodes')
      .select('image_url')
      .eq('story_id', story.id)
      .eq('node_key', 'start')
      .maybeSingle();

    if (startNode?.image_url) {
      coverImage = startNode.image_url;
    }
  }

  return { ...story, cover_image_url: coverImage, creator } as Story;
}

// ... rest of service functions follow same pattern
// Each function checks featureFlags and delegates to repository
```

---

## 5. Testing Strategy

### 5.1 Test Coverage Targets

| Category | Current | Target | Priority |
|----------|---------|--------|----------|
| Unit Tests | 3% | 60% | P1 |
| Integration Tests | 0% | 30% | P2 |
| E2E Tests | 0% | 10% | P3 |

### 5.2 Test File Structure

```
src/
├── core/
│   ├── config/__tests__/
│   │   └── featureFlags.test.ts
│   └── errors/__tests__/
│       ├── ErrorBoundary.test.tsx
│       ├── QueryErrorBoundary.test.tsx
│       └── logger.test.ts
│
├── data/
│   ├── repositories/__tests__/
│   │   ├── StoryRepository.test.ts
│   │   ├── FeedRepository.test.ts
│   │   └── BaseRepository.test.ts
│   └── hooks/__tests__/
│       ├── useStories.test.tsx
│       └── useFeed.test.tsx
│
└── __tests__/
    └── integration/
        ├── storyFlow.test.tsx
        └── feedFlow.test.tsx
```

### 5.3 Repository Test Example

**File: `src/data/repositories/__tests__/StoryRepository.test.ts`**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StoryRepository } from '../StoryRepository';
import { db } from '../../client';

// Mock the database client
vi.mock('../../client', () => ({
  db: {
    rpc: vi.fn(),
    storyReactions: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
    })),
  },
  handleDbError: (err: unknown) => err instanceof Error ? err : new Error(String(err)),
}));

describe('StoryRepository', () => {
  let repository: StoryRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new StoryRepository();
  });

  describe('getStoriesFeed', () => {
    it('calls get_stories_feed RPC with correct params', async () => {
      const mockData = [
        { id: '1', title: 'Story 1', likes_count: 10 },
        { id: '2', title: 'Story 2', likes_count: 5 },
      ];

      (db.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: mockData,
        error: null,
      });

      const result = await repository.getStoriesFeed(10, 0);

      expect(db.rpc).toHaveBeenCalledWith('get_stories_feed', {
        p_limit: 11, // +1 for hasMore check
        p_offset: 0,
        p_is_public: true,
        p_user_id: null,
        p_exclude_ids: null,
      });
      expect(result.data).toEqual(mockData);
      expect(result.hasMore).toBe(false);
    });

    it('correctly determines hasMore when at limit', async () => {
      const mockData = Array(11).fill({ id: '1', title: 'Story' });

      (db.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: mockData,
        error: null,
      });

      const result = await repository.getStoriesFeed(10, 0);

      expect(result.data.length).toBe(10);
      expect(result.hasMore).toBe(true);
    });

    it('applies excludeIds filter', async () => {
      (db.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [],
        error: null,
      });

      await repository.getStoriesFeed(10, 0, {
        excludeIds: ['id-1', 'id-2'],
      });

      expect(db.rpc).toHaveBeenCalledWith('get_stories_feed',
        expect.objectContaining({
          p_exclude_ids: ['id-1', 'id-2'],
        })
      );
    });

    it('throws error when RPC fails', async () => {
      (db.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: null,
        error: new Error('Database error'),
      });

      await expect(repository.getStoriesFeed(10, 0)).rejects.toThrow('Database error');
    });
  });

  describe('getStoryWithMetadata', () => {
    it('returns null when story not found', async () => {
      (db.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await repository.getStoryWithMetadata('non-existent');

      expect(result).toBeNull();
    });

    it('returns story with metadata', async () => {
      const mockStory = {
        id: '1',
        title: 'Test Story',
        creator_name: 'John',
        total_nodes: 5,
      };

      (db.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [mockStory],
        error: null,
      });

      const result = await repository.getStoryWithMetadata('1');

      expect(result).toEqual(mockStory);
    });
  });

  describe('getUserReactionsBatch', () => {
    it('returns empty map for empty storyIds', async () => {
      const result = await repository.getUserReactionsBatch('user-1', []);

      expect(result).toEqual(new Map());
      expect(db.storyReactions).not.toHaveBeenCalled();
    });

    it('returns map of reactions', async () => {
      const mockReactions = [
        { story_id: 's1', reaction_type: 'like' },
        { story_id: 's2', reaction_type: 'dislike' },
      ];

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({ data: mockReactions, error: null }),
      };
      (db.storyReactions as ReturnType<typeof vi.fn>).mockReturnValue(mockQuery);

      const result = await repository.getUserReactionsBatch('user-1', ['s1', 's2']);

      expect(result.get('s1')).toBe('like');
      expect(result.get('s2')).toBe('dislike');
    });
  });
});
```

---

## 6. Migration Plan

### 6.1 Week-by-Week Rollout

```
Week 1: Foundation (No Breaking Changes)
├── Day 1-2: Create core/config and core/errors directories
├── Day 2-3: Implement feature flags and error logger
├── Day 3-4: Implement ErrorBoundary components
├── Day 5: Integrate error boundaries into App.tsx
└── Day 5: Test error handling manually

Week 2: Data Layer (Parallel Implementation)
├── Day 1: Create database migration with functions
├── Day 1-2: Test SQL functions locally
├── Day 2-3: Implement data client and repositories
├── Day 4-5: Implement React Query hooks
└── Day 5: Push database migration to staging

Week 3: Integration (Gradual Migration)
├── Day 1-2: Refactor storyService with feature flag
├── Day 2-3: Refactor feedService with feature flag
├── Day 3-4: Write unit tests for repositories
├── Day 4-5: Enable for 10% of users via percentage rollout
└── Day 5: Monitor errors and performance

Week 4: Validation & Cleanup
├── Day 1-2: Analyze metrics, fix issues
├── Day 2-3: Increase rollout to 50%, then 100%
├── Day 3-4: Remove legacy code paths
├── Day 4-5: Documentation and cleanup
└── Day 5: Final review and sign-off
```

### 6.2 Feature Flag Rollout Strategy

```bash
# .env.staging
VITE_FF_ERROR_BOUNDARIES=true         # Always on from Week 1
VITE_FF_REPOSITORY_PATTERN=false      # Controlled rollout
VITE_FF_REPOSITORY_PATTERN_PCT=0      # Start at 0%

# Week 3, Day 4: Enable for 10%
VITE_FF_REPOSITORY_PATTERN_PCT=10

# Week 4, Day 2: Enable for 50%
VITE_FF_REPOSITORY_PATTERN_PCT=50

# Week 4, Day 3: Enable for all
VITE_FF_REPOSITORY_PATTERN=true
VITE_FF_REPOSITORY_PATTERN_PCT=100
```

### 6.3 Rollback Procedure

If issues are detected:

```bash
# Immediate rollback - disable new code path
VITE_FF_REPOSITORY_PATTERN=false
VITE_FF_REPOSITORY_PATTERN_PCT=0

# Redeploy - old code path is still intact
```

---

## 7. Verification Checklist

### 7.1 Pre-Deployment

- [ ] All unit tests passing
- [ ] Type checking passing (`pnpm typecheck`)
- [ ] Linting passing (`pnpm lint`)
- [ ] SQL migration tested locally (`supabase db reset`)
- [ ] Error boundaries tested with intentional errors
- [ ] Feature flags tested in dev environment

### 7.2 Staging Verification

- [ ] SQL functions deployed and working
- [ ] New data layer functional with flag enabled
- [ ] Error boundaries catching and logging errors
- [ ] Performance metrics showing improvement
- [ ] No increase in error rates

### 7.3 Production Verification

- [ ] Percentage rollout working correctly
- [ ] Monitoring showing query reduction
- [ ] Error rates stable or improved
- [ ] User experience unchanged or improved
- [ ] Rollback procedure tested

### 7.4 Post-Migration Cleanup

- [ ] Legacy code removed
- [ ] Feature flags removed (or set to always-on)
- [ ] Documentation updated
- [ ] Team briefed on new patterns

---

## Appendix: File Creation Order

Execute in this order to avoid import errors:

```bash
# Phase 1: Core Infrastructure
1. src/core/config/featureFlags.ts
2. src/core/errors/types.ts
3. src/core/errors/logger.ts
4. src/core/errors/ErrorBoundary.tsx
5. src/core/errors/QueryErrorBoundary.tsx
6. src/core/errors/RouteErrorBoundary.tsx
7. src/core/errors/withErrorBoundary.tsx
8. src/core/errors/index.ts

# Phase 2: Data Layer
9. src/data/client.ts
10. src/data/types.ts
11. src/data/repositories/BaseRepository.ts
12. src/data/repositories/StoryRepository.ts
13. src/data/repositories/FeedRepository.ts
14. src/data/repositories/index.ts
15. src/data/hooks/useStories.ts
16. src/data/hooks/useFeed.ts
17. src/data/hooks/index.ts
18. src/data/index.ts

# Phase 3: Database
19. supabase/migrations/20260102000000_add_optimized_feed_functions.sql

# Phase 4: Integration
20. src/lib/storyService.ts (modify)
21. src/lib/feedService.ts (modify)
22. src/App.tsx (modify)

# Phase 5: Tests
23. src/core/config/__tests__/featureFlags.test.ts
24. src/core/errors/__tests__/ErrorBoundary.test.tsx
25. src/data/repositories/__tests__/StoryRepository.test.ts
26. src/data/repositories/__tests__/FeedRepository.test.ts
```

---

**End of Phase 1 Implementation Specification**

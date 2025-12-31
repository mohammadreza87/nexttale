/**
 * Datadog Observability Module for NextTale Edge Functions
 *
 * A modular, low-dependency implementation using Datadog's HTTP APIs.
 * Gracefully degrades if Datadog is not configured (no-op mode).
 *
 * Features:
 * - LLM observability (Gemini API calls)
 * - Custom metrics (latency, tokens, costs)
 * - Structured logging
 * - Error tracking
 * - Detection rule support via log attributes
 *
 * Usage:
 *   import { datadog, withLLMTrace } from '../_shared/datadog.ts';
 *
 *   // Wrap LLM calls
 *   const result = await withLLMTrace('gemini', 'story-generation', async () => {
 *     return await callGemini(prompt, apiKey);
 *   }, { prompt, model: 'gemini-2.5-flash' });
 *
 * Environment Variables:
 *   DD_API_KEY - Datadog API key (required for Datadog to work)
 *   DD_SITE - Datadog site (default: datadoghq.com)
 *   DD_ENV - Environment name (default: production)
 *   DD_SERVICE - Service name (default: nexttale-edge)
 */

// ============================================
// Configuration
// ============================================

interface DatadogConfig {
  apiKey: string | null;
  site: string;
  env: string;
  service: string;
  version: string;
  enabled: boolean;
}

function getConfig(): DatadogConfig {
  const apiKey = Deno.env.get('DD_API_KEY') || null;
  const site = Deno.env.get('DD_SITE') || 'datadoghq.com';
  const config = {
    apiKey,
    site,
    env: Deno.env.get('DD_ENV') || 'production',
    service: Deno.env.get('DD_SERVICE') || 'nexttale-edge',
    version: Deno.env.get('DD_VERSION') || '1.0.0',
    enabled: !!apiKey,
  };
  // Log config on first load (without API key for security)
  console.log(
    `[Datadog] Config: site=${site}, enabled=${config.enabled}, service=${config.service}`
  );
  return config;
}

// ============================================
// Types
// ============================================

export interface LLMMetrics {
  model: string;
  provider: 'gemini' | 'elevenlabs' | 'leonardo' | 'openai';
  operation: string;
  durationMs: number;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  estimatedCostUsd?: number;
  success: boolean;
  errorType?: string;
  errorMessage?: string;
}

export interface LLMTraceContext {
  prompt?: string;
  response?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  userId?: string;
  storyId?: string;
  nodeId?: string;
  metadata?: Record<string, unknown>;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  service?: string;
  tags?: string[];
  attributes?: Record<string, unknown>;
}

export interface MetricPoint {
  metric: string;
  type: 'gauge' | 'count' | 'rate';
  points: Array<{ timestamp: number; value: number }>;
  tags?: string[];
}

// ============================================
// Token Estimation (for Gemini)
// ============================================

/**
 * Rough token estimation for Gemini models
 * Based on ~4 characters per token average
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

/**
 * Estimate cost in USD for Gemini API calls
 * Prices as of 2024 (subject to change)
 */
export function estimateCostUsd(
  model: string,
  promptTokens: number,
  completionTokens: number
): number {
  // Gemini pricing per 1K tokens (approximate)
  const pricing: Record<string, { input: number; output: number }> = {
    'gemini-2.5-flash-lite': { input: 0.000075, output: 0.0003 },
    'gemini-2.5-flash': { input: 0.00015, output: 0.0006 },
    'gemini-3-pro-preview': { input: 0.00125, output: 0.005 },
    'gemini-pro': { input: 0.00025, output: 0.0005 },
  };

  const modelPricing = pricing[model] || pricing['gemini-2.5-flash'];
  const inputCost = (promptTokens / 1000) * modelPricing.input;
  const outputCost = (completionTokens / 1000) * modelPricing.output;

  return inputCost + outputCost;
}

// ============================================
// Datadog HTTP API Client
// ============================================

class DatadogClient {
  private config: DatadogConfig;

  constructor() {
    this.config = getConfig();
  }

  get isEnabled(): boolean {
    return this.config.enabled;
  }

  private getBaseUrl(endpoint: string): string {
    const { site } = this.config;
    const baseUrls: Record<string, string> = {
      logs: `https://http-intake.logs.${site}/v1/input`,
      metrics: `https://api.${site}/api/v2/series`,
      events: `https://api.${site}/api/v1/events`,
      llmobs: `https://api.${site}/api/intake/llm-obs/v1/trace/spans`,
    };
    return baseUrls[endpoint] || baseUrls.logs;
  }

  /**
   * Send LLM Observability spans to Datadog
   * Using the official LLM Obs agentless HTTP API format from dd-trace-py
   */
  async sendLLMObsSpan(span: {
    name: string;
    spanId: string;
    traceId: string;
    parentId?: string;
    startNs: bigint;
    durationNs: bigint;
    kind: 'llm' | 'workflow' | 'agent' | 'tool' | 'task';
    input?: string;
    output?: string;
    model?: string;
    provider?: string;
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
    error?: { message: string; type: string };
    tags?: string[];
  }): Promise<void> {
    if (!this.isEnabled) {
      console.log('[Datadog] LLM Obs disabled - no API key');
      return;
    }

    // Convert BigInt to number (safe for timestamps up to 2^53)
    const startNsNum = Number(span.startNs);
    const durationNum = Number(span.durationNs);

    // Build meta object
    const meta: Record<string, unknown> = {
      kind: span.kind,
      model_name: span.model || 'unknown',
      model_provider: span.provider || 'unknown',
    };

    // Add input/output in the format Datadog expects
    if (span.input) {
      meta['input'] = { value: span.input };
    }
    if (span.output) {
      meta['output'] = { value: span.output };
    }

    // Add error info if present
    if (span.error) {
      meta['error.message'] = span.error.message;
      meta['error.type'] = span.error.type;
    }

    // Build metrics object
    const metrics: Record<string, number> = {};
    if (span.inputTokens !== undefined) {
      metrics['input_tokens'] = span.inputTokens;
    }
    if (span.outputTokens !== undefined) {
      metrics['output_tokens'] = span.outputTokens;
    }
    if (span.totalTokens !== undefined) {
      metrics['total_tokens'] = span.totalTokens;
    }

    // Build the span object according to Datadog LLM Obs API spec (from dd-trace-py _writer.py)
    const spanData: Record<string, unknown> = {
      span_id: span.spanId,
      trace_id: span.traceId,
      name: span.name,
      start_ns: startNsNum,
      duration: durationNum,
      status: span.error ? 'error' : 'ok',
      meta,
      metrics,
      tags: [...this.getDefaultTags(), ...(span.tags || [])],
      service: this.config.service,
      session_id: span.traceId, // Use traceId as session for grouping
    };

    if (span.parentId) {
      spanData.parent_id = span.parentId;
    }

    // Payload format from dd-trace-py _writer.py - array of event objects
    const payload = [
      {
        '_dd.stage': 'raw',
        '_dd.tracer_version': '1.0.0',
        event_type: 'span',
        ml_app: this.config.service,
        spans: [spanData],
      },
    ];

    // Use llm-obs intake endpoint
    const url = `https://llmobs-intake.${this.config.site}/api/v2/llmobs`;
    console.log(`[Datadog] Sending LLM Obs span to: ${url}`);
    console.log(`[Datadog] Span: ${span.name}, traceId: ${span.traceId}, model: ${span.model}`);

    try {
      const bodyStr = JSON.stringify(payload);
      console.log(`[Datadog] Payload size: ${bodyStr.length} bytes`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'DD-API-KEY': this.config.apiKey!,
        },
        body: bodyStr,
      });

      const responseText = await response.text();
      if (!response.ok) {
        console.error(`[Datadog] LLM Obs span send failed: ${response.status}`);
        console.error(`[Datadog] Response: ${responseText}`);
      } else {
        console.log(`[Datadog] LLM Obs span sent successfully: ${response.status}`);
        if (responseText) {
          console.log(`[Datadog] Response: ${responseText}`);
        }
      }
    } catch (error) {
      console.error('[Datadog] Failed to send LLM Obs span:', error);
    }
  }

  private getDefaultTags(): string[] {
    return [
      `env:${this.config.env}`,
      `service:${this.config.service}`,
      `version:${this.config.version}`,
    ];
  }

  /**
   * Send logs to Datadog
   */
  async sendLogs(entries: LogEntry[]): Promise<void> {
    if (!this.isEnabled) {
      console.log('[Datadog] Disabled - no API key');
      return;
    }

    const logs = entries.map((entry) => ({
      ddsource: 'deno',
      ddtags: [...this.getDefaultTags(), ...(entry.tags || [])].join(','),
      hostname: 'supabase-edge',
      service: entry.service || this.config.service,
      status: entry.level,
      message: entry.message,
      ...entry.attributes,
    }));

    const url = this.getBaseUrl('logs');
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'DD-API-KEY': this.config.apiKey!,
        },
        body: JSON.stringify(logs),
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Datadog] Log send failed: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('[Datadog] Failed to send logs:', error);
    }
  }

  /**
   * Send metrics to Datadog
   */
  async sendMetrics(metrics: MetricPoint[]): Promise<void> {
    if (!this.isEnabled) return;

    const series = metrics.map((m) => ({
      metric: m.metric,
      type: m.type === 'count' ? 1 : m.type === 'rate' ? 2 : 3,
      points: m.points.map((p) => ({
        timestamp: Math.floor(p.timestamp / 1000),
        value: p.value,
      })),
      tags: [...this.getDefaultTags(), ...(m.tags || [])],
    }));

    try {
      await fetch(this.getBaseUrl('metrics'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'DD-API-KEY': this.config.apiKey!,
        },
        body: JSON.stringify({ series }),
      });
    } catch (error) {
      console.error('[Datadog] Failed to send metrics:', error);
    }
  }

  /**
   * Send an event to Datadog (for alerts, incidents)
   */
  async sendEvent(
    title: string,
    text: string,
    alertType: 'error' | 'warning' | 'info' | 'success' = 'info',
    tags?: string[]
  ): Promise<void> {
    if (!this.isEnabled) return;

    try {
      await fetch(this.getBaseUrl('events'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'DD-API-KEY': this.config.apiKey!,
        },
        body: JSON.stringify({
          title,
          text,
          alert_type: alertType,
          tags: [...this.getDefaultTags(), ...(tags || [])],
          source_type_name: 'nexttale',
        }),
      });
    } catch (error) {
      console.error('[Datadog] Failed to send event:', error);
    }
  }
}

// Singleton instance
const client = new DatadogClient();

// ============================================
// High-Level Observability API
// ============================================

export const datadog = {
  /**
   * Check if Datadog is enabled
   */
  get isEnabled(): boolean {
    return client.isEnabled;
  },

  /**
   * Log a message to Datadog
   */
  async log(
    level: LogLevel,
    message: string,
    attributes?: Record<string, unknown>,
    tags?: string[]
  ): Promise<void> {
    // Always log to console
    const logFn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
    logFn(`[${level.toUpperCase()}] ${message}`, attributes || '');

    // Send to Datadog if enabled
    await client.sendLogs([{ level, message, attributes, tags }]);
  },

  /**
   * Track an LLM API call with metrics
   */
  async trackLLM(metrics: LLMMetrics): Promise<void> {
    const timestamp = Date.now();
    const tags = [
      `provider:${metrics.provider}`,
      `model:${metrics.model}`,
      `operation:${metrics.operation}`,
      `success:${metrics.success}`,
    ];

    if (metrics.errorType) {
      tags.push(`error_type:${metrics.errorType}`);
    }

    // Send metrics
    await client.sendMetrics([
      {
        metric: 'nexttale.llm.request.duration',
        type: 'gauge',
        points: [{ timestamp, value: metrics.durationMs }],
        tags,
      },
      {
        metric: 'nexttale.llm.request.count',
        type: 'count',
        points: [{ timestamp, value: 1 }],
        tags,
      },
    ]);

    // Track token usage if available
    if (metrics.totalTokens) {
      await client.sendMetrics([
        {
          metric: 'nexttale.llm.tokens.total',
          type: 'count',
          points: [{ timestamp, value: metrics.totalTokens }],
          tags,
        },
      ]);
    }

    // Track cost if available
    if (metrics.estimatedCostUsd) {
      await client.sendMetrics([
        {
          metric: 'nexttale.llm.cost.usd',
          type: 'count',
          points: [{ timestamp, value: metrics.estimatedCostUsd * 1000000 }], // Store as micro-dollars
          tags,
        },
      ]);
    }

    // Log for tracing
    await client.sendLogs([
      {
        level: metrics.success ? 'info' : 'error',
        message: `LLM ${metrics.operation} ${metrics.success ? 'completed' : 'failed'}`,
        tags,
        attributes: {
          llm: {
            provider: metrics.provider,
            model: metrics.model,
            operation: metrics.operation,
            duration_ms: metrics.durationMs,
            prompt_tokens: metrics.promptTokens,
            completion_tokens: metrics.completionTokens,
            total_tokens: metrics.totalTokens,
            estimated_cost_usd: metrics.estimatedCostUsd,
          },
          error: metrics.errorMessage
            ? {
                type: metrics.errorType,
                message: metrics.errorMessage,
              }
            : undefined,
        },
      },
    ]);

    // Send error event for detection rules
    if (!metrics.success && metrics.errorMessage) {
      await client.sendEvent(
        `LLM Error: ${metrics.operation}`,
        `Provider: ${metrics.provider}\nModel: ${metrics.model}\nError: ${metrics.errorMessage}`,
        'error',
        tags
      );
    }
  },

  /**
   * Track a custom metric
   */
  async metric(
    name: string,
    value: number,
    type: 'gauge' | 'count' | 'rate' = 'gauge',
    tags?: string[]
  ): Promise<void> {
    await client.sendMetrics([
      {
        metric: `nexttale.${name}`,
        type,
        points: [{ timestamp: Date.now(), value }],
        tags,
      },
    ]);
  },

  /**
   * Send an alert event
   */
  async alert(
    title: string,
    message: string,
    severity: 'error' | 'warning' | 'info' = 'warning',
    tags?: string[]
  ): Promise<void> {
    await client.sendEvent(title, message, severity, tags);
  },

  /**
   * Track request timing for any operation
   */
  async trackRequest(
    operation: string,
    durationMs: number,
    success: boolean,
    tags?: string[]
  ): Promise<void> {
    const timestamp = Date.now();
    const allTags = [`operation:${operation}`, `success:${success}`, ...(tags || [])];

    await client.sendMetrics([
      {
        metric: 'nexttale.request.duration',
        type: 'gauge',
        points: [{ timestamp, value: durationMs }],
        tags: allTags,
      },
      {
        metric: 'nexttale.request.count',
        type: 'count',
        points: [{ timestamp, value: 1 }],
        tags: allTags,
      },
    ]);
  },
};

// ============================================
// Wrapper Functions for Easy Integration
// ============================================

/**
 * Wrap an LLM call with automatic tracing
 *
 * @example
 * const result = await withLLMTrace('gemini', 'story-generation', async () => {
 *   return await callGemini(prompt, apiKey);
 * }, { prompt, model: 'gemini-2.5-flash' });
 */
export async function withLLMTrace<T>(
  provider: LLMMetrics['provider'],
  operation: string,
  fn: () => Promise<T>,
  context?: LLMTraceContext
): Promise<T> {
  const startTime = Date.now();
  const startNs = BigInt(startTime) * BigInt(1_000_000); // Convert to nanoseconds
  const traceId = crypto.randomUUID().replace(/-/g, '');
  const spanId = crypto.randomUUID().replace(/-/g, '').slice(0, 16);
  let success = true;
  let errorType: string | undefined;
  let errorMessage: string | undefined;
  let result: T;

  try {
    result = await fn();
    return result;
  } catch (error) {
    success = false;
    errorType = error instanceof Error ? error.constructor.name : 'UnknownError';
    errorMessage = error instanceof Error ? error.message : String(error);
    throw error;
  } finally {
    const durationMs = Date.now() - startTime;
    const durationNs = BigInt(durationMs) * BigInt(1_000_000);
    const model = context?.model || 'unknown';

    // Estimate tokens from prompt and response
    const promptTokens = context?.prompt ? estimateTokens(context.prompt) : undefined;
    const completionTokens =
      success && typeof result === 'string' ? estimateTokens(result as string) : undefined;
    const totalTokens =
      promptTokens !== undefined || completionTokens !== undefined
        ? (promptTokens || 0) + (completionTokens || 0)
        : undefined;

    const estimatedCostUsd =
      promptTokens !== undefined && completionTokens !== undefined
        ? estimateCostUsd(model, promptTokens, completionTokens)
        : undefined;

    // Track the LLM call (legacy metrics/logs)
    await datadog.trackLLM({
      model,
      provider,
      operation,
      durationMs,
      promptTokens,
      completionTokens,
      totalTokens,
      estimatedCostUsd,
      success,
      errorType,
      errorMessage,
    });

    // Send to LLM Observability API
    await client.sendLLMObsSpan({
      name: `${provider}.${operation}`,
      spanId,
      traceId,
      startNs,
      durationNs,
      kind: 'llm',
      input: context?.prompt,
      output: success && typeof result === 'string' ? (result as string).slice(0, 5000) : undefined,
      model,
      provider,
      inputTokens: promptTokens,
      outputTokens: completionTokens,
      totalTokens,
      error: !success
        ? { message: errorMessage || 'Unknown error', type: errorType || 'Error' }
        : undefined,
      tags: [`operation:${operation}`, `provider:${provider}`],
    });

    // Log additional context if provided
    if (context?.storyId || context?.userId) {
      await datadog.log('info', `LLM trace context`, {
        story_id: context.storyId,
        user_id: context.userId,
        node_id: context.nodeId,
        temperature: context.temperature,
        max_tokens: context.maxTokens,
        ...context.metadata,
      });
    }
  }
}

/**
 * Wrap any async operation with timing
 *
 * @example
 * const result = await withTiming('image-upload', async () => {
 *   return await uploadImage(buffer);
 * });
 */
export async function withTiming<T>(
  operation: string,
  fn: () => Promise<T>,
  tags?: string[]
): Promise<T> {
  const startTime = Date.now();
  let success = true;

  try {
    return await fn();
  } catch (error) {
    success = false;
    throw error;
  } finally {
    const durationMs = Date.now() - startTime;
    await datadog.trackRequest(operation, durationMs, success, tags);
  }
}

/**
 * Create a scoped logger for a specific function/module
 *
 * @example
 * const log = createLogger('generate-story');
 * log.info('Starting generation', { storyId: '123' });
 */
export function createLogger(module: string) {
  const tags = [`module:${module}`];

  return {
    debug: (message: string, attributes?: Record<string, unknown>) =>
      datadog.log('debug', `[${module}] ${message}`, attributes, tags),
    info: (message: string, attributes?: Record<string, unknown>) =>
      datadog.log('info', `[${module}] ${message}`, attributes, tags),
    warn: (message: string, attributes?: Record<string, unknown>) =>
      datadog.log('warn', `[${module}] ${message}`, attributes, tags),
    error: (message: string, attributes?: Record<string, unknown>) =>
      datadog.log('error', `[${module}] ${message}`, attributes, tags),
  };
}

// ============================================
// Detection Rule Helpers
// ============================================

/**
 * Log attributes that can trigger Datadog detection rules
 */
export const DetectionSignals = {
  /**
   * Log when rate limit is approaching
   */
  async rateLimitWarning(
    service: string,
    currentUsage: number,
    limit: number,
    userId?: string
  ): Promise<void> {
    const percentUsed = (currentUsage / limit) * 100;
    await datadog.log(
      'warn',
      `Rate limit warning: ${service} at ${percentUsed.toFixed(1)}%`,
      {
        signal: 'rate_limit_warning',
        service,
        current_usage: currentUsage,
        limit,
        percent_used: percentUsed,
        user_id: userId,
      },
      ['signal:rate_limit']
    );

    if (percentUsed >= 90) {
      await datadog.alert(
        `Rate Limit Critical: ${service}`,
        `Usage at ${percentUsed.toFixed(1)}% (${currentUsage}/${limit})`,
        'error',
        [`service:${service}`, 'signal:rate_limit_critical']
      );
    }
  },

  /**
   * Log when cost threshold is exceeded
   */
  async costThresholdExceeded(
    currentCostUsd: number,
    thresholdUsd: number,
    period: string
  ): Promise<void> {
    await datadog.log(
      'error',
      `Cost threshold exceeded: $${currentCostUsd.toFixed(2)} > $${thresholdUsd.toFixed(2)}`,
      {
        signal: 'cost_threshold_exceeded',
        current_cost_usd: currentCostUsd,
        threshold_usd: thresholdUsd,
        period,
      },
      ['signal:cost_alert']
    );

    await datadog.alert(
      `Cost Alert: Threshold Exceeded`,
      `Current spend: $${currentCostUsd.toFixed(2)}\nThreshold: $${thresholdUsd.toFixed(2)}\nPeriod: ${period}`,
      'error',
      ['signal:cost_alert', `period:${period}`]
    );
  },

  /**
   * Log potential abuse pattern
   */
  async abuseDetected(
    pattern: string,
    userId: string,
    details: Record<string, unknown>
  ): Promise<void> {
    await datadog.log(
      'error',
      `Potential abuse detected: ${pattern}`,
      {
        signal: 'abuse_detected',
        pattern,
        user_id: userId,
        ...details,
      },
      ['signal:security', 'signal:abuse']
    );

    await datadog.alert(
      `Security: Abuse Pattern Detected`,
      `Pattern: ${pattern}\nUser: ${userId}\nDetails: ${JSON.stringify(details)}`,
      'error',
      ['signal:security', 'signal:abuse', `user:${userId}`]
    );
  },

  /**
   * Log LLM content safety issue
   */
  async contentSafetyIssue(
    contentType: string,
    severity: 'low' | 'medium' | 'high',
    userId?: string,
    storyId?: string
  ): Promise<void> {
    await datadog.log(
      severity === 'high' ? 'error' : 'warn',
      `Content safety issue: ${contentType}`,
      {
        signal: 'content_safety',
        content_type: contentType,
        severity,
        user_id: userId,
        story_id: storyId,
      },
      ['signal:content_safety', `severity:${severity}`]
    );
  },

  /**
   * Log service degradation
   */
  async serviceDegraded(service: string, errorRate: number, avgLatencyMs: number): Promise<void> {
    await datadog.log(
      'error',
      `Service degradation: ${service}`,
      {
        signal: 'service_degraded',
        service,
        error_rate: errorRate,
        avg_latency_ms: avgLatencyMs,
      },
      ['signal:availability', `service:${service}`]
    );

    await datadog.alert(
      `Service Degraded: ${service}`,
      `Error rate: ${(errorRate * 100).toFixed(1)}%\nAvg latency: ${avgLatencyMs}ms`,
      'error',
      ['signal:availability', `service:${service}`]
    );
  },
};

export default datadog;

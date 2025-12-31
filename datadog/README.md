# Datadog LLM Observability for NextTale

End-to-end observability monitoring for NextTale's AI-powered story generation platform.

## Overview

This integration provides comprehensive monitoring for:
- **LLM Calls**: Gemini API request/response tracking
- **Performance Metrics**: Latency, throughput, error rates
- **Cost Tracking**: Estimated AI API costs
- **Security Signals**: Abuse detection, rate limiting, content safety
- **Detection Rules**: Automated alerting and incident creation

## Quick Start

### 1. Environment Variables

Add these to your Supabase Edge Functions secrets:

```bash
# Required
DD_API_KEY=your-datadog-api-key

# Optional (with defaults)
DD_SITE=datadoghq.com        # or datadoghq.eu, us3.datadoghq.com, etc.
DD_ENV=production            # environment name
DD_SERVICE=nexttale-edge     # service name
DD_VERSION=1.0.0             # app version
```

Set secrets via Supabase CLI:
```bash
supabase secrets set DD_API_KEY=your-api-key
supabase secrets set DD_ENV=production
```

### 2. Integration Points

The observability module is already integrated into:
- `generate-story` - Full story and chapter generation
- Ready for integration in other functions

### 3. Import the Dashboard

1. Go to Datadog > Dashboards > New Dashboard
2. Click the gear icon > Import dashboard JSON
3. Paste contents of `dashboard.json`

### 4. Set Up Detection Rules

Use the `detection-rules.json` as reference to create monitors in Datadog:
1. Go to Monitors > New Monitor
2. Configure based on the rule definitions

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Edge Function                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  withLLMTrace('gemini', 'operation', async () => {  │   │
│  │    return await callGemini(prompt);                 │   │
│  │  })                                                 │   │
│  └──────────────────────┬──────────────────────────────┘   │
│                         │                                   │
│  ┌──────────────────────▼──────────────────────────────┐   │
│  │              datadog.ts (shared module)             │   │
│  │  - Logs to DD Logs API                              │   │
│  │  - Metrics to DD Metrics API                        │   │
│  │  - Events for alerts                                │   │
│  └──────────────────────┬──────────────────────────────┘   │
└─────────────────────────┼───────────────────────────────────┘
                          │ HTTPS
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                      Datadog                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │    Logs     │  │   Metrics   │  │   Events/Monitors   │ │
│  │             │  │             │  │                     │ │
│  │ LLM traces  │  │ Latency     │  │ Detection rules     │ │
│  │ Errors      │  │ Tokens      │  │ Incidents           │ │
│  │ Context     │  │ Costs       │  │ Alerts              │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
│                          │                                  │
│  ┌───────────────────────▼─────────────────────────────┐   │
│  │                   Dashboard                          │   │
│  │  - LLM Request Overview                             │   │
│  │  - Latency by Operation                             │   │
│  │  - Cost Analysis                                    │   │
│  │  - Error Logs                                       │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Usage Examples

### Basic LLM Tracing

```typescript
import { withLLMTrace } from '../_shared/datadog.ts';

const result = await withLLMTrace(
  'gemini',           // provider
  'story-generation', // operation name
  async () => {
    return await callGemini(prompt, apiKey);
  },
  {
    prompt,
    model: 'gemini-2.5-flash',
    storyId: '123',
    userId: 'user-456',
  }
);
```

### Custom Logging

```typescript
import { createLogger } from '../_shared/datadog.ts';

const log = createLogger('my-function');

log.info('Processing request', { userId: '123' });
log.error('Failed to generate', { error: err.message });
```

### Metrics

```typescript
import { datadog } from '../_shared/datadog.ts';

// Track custom metric
await datadog.metric('stories.completed', 1, 'count', ['tier:pro']);

// Track request timing
await datadog.trackRequest('image-generation', 2500, true, ['model:leonardo']);
```

### Detection Signals

```typescript
import { DetectionSignals } from '../_shared/datadog.ts';

// Rate limit warning
await DetectionSignals.rateLimitWarning('gemini', 80, 100, userId);

// Cost threshold exceeded
await DetectionSignals.costThresholdExceeded(150, 100, 'daily');

// Abuse detection
await DetectionSignals.abuseDetected('high-volume', userId, {
  stories_per_hour: 50,
  ip_address: '1.2.3.4',
});
```

## Metrics Reference

| Metric | Type | Description |
|--------|------|-------------|
| `nexttale.llm.request.duration` | gauge | LLM request latency in ms |
| `nexttale.llm.request.count` | count | Number of LLM requests |
| `nexttale.llm.tokens.total` | count | Total tokens used |
| `nexttale.llm.cost.usd` | count | Cost in micro-dollars |
| `nexttale.request.duration` | gauge | General request latency |
| `nexttale.request.count` | count | General request count |

### Common Tags

| Tag | Values | Description |
|-----|--------|-------------|
| `provider` | gemini, elevenlabs, leonardo | AI service provider |
| `model` | gemini-2.5-flash, etc. | Specific model used |
| `operation` | story-generation, etc. | Operation type |
| `success` | true, false | Request success status |
| `env` | production, staging | Environment |

## Detection Rules

The following detection rules are defined in `detection-rules.json`:

| Rule | Severity | Trigger |
|------|----------|---------|
| LLM High Error Rate | High | Error rate > 5% over 5 min |
| LLM Latency Spike | Medium | P95 latency > 30s |
| AI Cost Anomaly | High | Spend 150% above baseline |
| Rate Limit Warning | Medium | Usage > 80% |
| Rate Limit Critical | High | Usage > 90% |
| Abuse Pattern Detected | Critical | Any abuse signal |
| Content Safety Issue | High | High severity violation |
| Service Degradation | High | Any degradation signal |
| Story Generation Failure | High | Failure rate > 10% |
| Daily Cost Threshold | Critical | Budget exceeded |

## Graceful Degradation

The integration is designed to work without Datadog:

- If `DD_API_KEY` is not set, all Datadog calls become no-ops
- Logs still go to console for local debugging
- No errors thrown if Datadog is unreachable
- Zero impact on application performance

## Files

```
datadog/
├── README.md              # This file
├── dashboard.json         # Importable dashboard config
└── detection-rules.json   # Detection rule definitions

supabase/functions/_shared/
└── datadog.ts             # Core observability module
```

## Best Practices

1. **Always use operation names** that are descriptive and consistent
2. **Include context** (storyId, userId) for debugging
3. **Don't log PII** - avoid logging user prompts in production
4. **Use detection signals** for security-relevant events
5. **Monitor costs** - set up daily budget alerts

## Troubleshooting

### Logs not appearing in Datadog

1. Verify `DD_API_KEY` is set correctly
2. Check `DD_SITE` matches your Datadog region
3. Look for errors in Edge Function logs

### Metrics missing

1. Metrics may take 1-2 minutes to appear
2. Verify metric names match the expected format
3. Check for API rate limiting

### High latency from observability

The module uses fire-and-forget HTTP calls to minimize impact. If latency is a concern:
1. Metrics/logs are sent asynchronously
2. Consider batching in high-volume scenarios

## Contributing

When adding new Edge Functions:

1. Import the datadog module
2. Create a logger: `const log = createLogger('function-name');`
3. Wrap LLM calls with `withLLMTrace`
4. Track request timing at the handler level
5. Add relevant detection signals for security events

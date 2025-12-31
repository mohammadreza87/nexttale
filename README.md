# Next Tale - AI-Powered Interactive Storytelling with LLM Observability

**Create, share, and experience personalized interactive stories brought to life with AI-generated illustrations, video clips, and voice narration.**

Next Tale transforms storytelling into an immersive, voice-driven interactive experience. Users create their own branching narratives or explore community stories, with each choice leading to unique paths and outcomes.

---

## Google Cloud x Datadog Hackathon Submission

This project is submitted for the **Datadog Challenge** in the AI Accelerate Hackathon.

### Datadog Organization

**Organization Name:** `nexttale`

### Challenge Requirements Met

| Requirement                  | Status | Implementation                              |
| ---------------------------- | ------ | ------------------------------------------- |
| Vertex AI / Gemini Model     | ✅     | Gemini 3 Pro, 2.5 Flash, 2.0 Flash          |
| Telemetry to Datadog         | ✅     | LLM Observability API + Logs + Metrics      |
| Application Health Dashboard | ✅     | `/datadog/dashboard.json`                   |
| Detection Rules (min 3)      | ✅     | 10 rules in `/datadog/detection-rules.json` |
| Actionable Records           | ✅     | Incidents created on rule triggers          |

---

## Datadog Observability Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Next Tale Application                        │
├─────────────────────────────────────────────────────────────────────┤
│  Supabase Edge Functions (Deno Runtime)                             │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │  generate-story  │  │ generate-music   │  │generate-interactive│ │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘  │
│           │                     │                     │             │
│           └─────────────────────┼─────────────────────┘             │
│                                 ▼                                   │
│                    ┌────────────────────────┐                       │
│                    │   withLLMTrace()       │                       │
│                    │   Observability Wrapper│                       │
│                    └───────────┬────────────┘                       │
└────────────────────────────────┼────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Datadog Platform                            │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────┐  │
│  │ LLM Obs API │  │  Logs API   │  │ Metrics API │  │Events API │  │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └─────┬─────┘  │
│         │                │                │               │         │
│         └────────────────┼────────────────┼───────────────┘         │
│                          ▼                ▼                         │
│         ┌────────────────────────────────────────────┐              │
│         │           Detection Rules (10)             │              │
│         │  • LLM High Error Rate    • Cost Anomaly   │              │
│         │  • Latency Spike          • Abuse Pattern  │              │
│         │  • Rate Limit Warning     • Service Degrade│              │
│         └───────────────────┬────────────────────────┘              │
│                             ▼                                       │
│         ┌────────────────────────────────────────────┐              │
│         │         Incident Management                │              │
│         │   Actionable items with context            │              │
│         └────────────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Detection Rules

We've implemented **10 detection rules** covering cost, reliability, and security:

| Rule                     | Type              | Trigger Condition       | Severity |
| ------------------------ | ----------------- | ----------------------- | -------- |
| LLM High Error Rate      | Log Detection     | >5% errors in 5 minutes | High     |
| LLM Latency Spike        | Metric Alert      | P95 latency >30 seconds | Medium   |
| AI Cost Anomaly          | Anomaly Detection | 150% above baseline     | High     |
| Rate Limit Warning       | Log Detection     | Usage >80% of limit     | Medium   |
| Rate Limit Critical      | Log Detection     | Usage >90% of limit     | High     |
| Abuse Pattern Detected   | Log Detection     | Abuse signal detected   | Critical |
| Content Safety Issue     | Log Detection     | High severity violation | High     |
| Service Degradation      | Log Detection     | Degradation signal      | High     |
| Story Generation Failure | Metric Alert      | >10% failure rate       | High     |
| Daily Cost Threshold     | Log Detection     | Budget exceeded         | Critical |

### Detection Signals Code

```typescript
// Example: Cost anomaly detection
DetectionSignals.costThresholdExceeded(currentCostUsd, thresholdUsd, period);

// Example: Abuse pattern detection
DetectionSignals.abuseDetected('rapid_generation', userId, {
  requests_per_minute: 50,
});

// Example: Rate limit warning
DetectionSignals.rateLimitWarning('gemini', currentUsage, limit, userId);
```

---

## Datadog Configuration Files

All Datadog configurations are exportable and included in this repository:

```
datadog/
├── dashboard.json          # Application health dashboard
├── detection-rules.json    # All 10 detection rules
└── README.md              # Datadog setup instructions
```

### Importing Dashboard

1. Go to Datadog Dashboards
2. Click "New Dashboard" → "Import Dashboard JSON"
3. Paste contents of `/datadog/dashboard.json`

### Creating Detection Rules

1. Go to Monitors → New Monitor
2. Use the configurations from `/datadog/detection-rules.json`
3. Configure notification channels for incidents

---

## Traffic Generator

To demonstrate detection rules triggering, use the traffic generator script:

```bash
# Install dependencies
pnpm install

# Run volume spike scenario (triggers cost anomaly)
npx ts-node scripts/traffic-generator.ts --scenario=volume --token=YOUR_AUTH_TOKEN

# Run error rate scenario (triggers high error rate)
npx ts-node scripts/traffic-generator.ts --scenario=errors --token=YOUR_AUTH_TOKEN

# Run rate limit scenario
npx ts-node scripts/traffic-generator.ts --scenario=ratelimit --token=YOUR_AUTH_TOKEN

# Run all scenarios
npx ts-node scripts/traffic-generator.ts --scenario=all --token=YOUR_AUTH_TOKEN
```

---

## Observability Implementation

### Core Module: `_shared/datadog.ts`

```typescript
// Wrap any LLM call with automatic tracing
const result = await withLLMTrace(
  'gemini',
  'story-generation',
  async () => {
    return await callGemini(prompt, apiKey);
  },
  {
    prompt,
    model: 'gemini-3-pro-preview',
    userId: user.id,
  }
);
```

### What Gets Tracked

- **LLM Spans**: Every Gemini/ElevenLabs API call
- **Token Usage**: Input/output/total tokens (estimated)
- **Cost**: Per-request cost estimation by model
- **Latency**: Request duration in milliseconds
- **Errors**: Full error context with type and message
- **User Context**: User ID, story ID, operation type

### Graceful Degradation

If Datadog is not configured, the module operates in no-op mode:

```typescript
if (!this.isEnabled) {
  console.log('[Datadog] Disabled - no API key');
  return;
}
```

---

## Tech Stack

### Frontend

- **React 18** with TypeScript
- **Vite** for development and builds
- **Tailwind CSS** for styling
- **Web Speech API** for voice input

### Backend

- **Supabase** - Database, authentication, storage
- **PostgreSQL** with Row Level Security
- **Edge Functions** (Deno runtime) for serverless APIs

### AI Services

- **Google Gemini** - Story generation (gemini-3-pro-preview, gemini-2.5-flash)
- **ElevenLabs** - Voice narration and music generation
- **Leonardo AI** - Image and video generation

### Observability

- **Datadog LLM Observability** - LLM span tracing
- **Datadog Logs** - Structured application logs
- **Datadog Metrics** - Custom metrics (latency, tokens, cost)
- **Datadog Events** - Alert events

---

## Deployment Instructions

### Prerequisites

- Node.js 18+
- pnpm 9.x
- Supabase CLI
- Datadog account (EU or US)

### 1. Clone and Install

```bash
git clone https://github.com/mohammadreza87/nexttale.git
cd nexttale
pnpm install
```

### 2. Configure Environment Variables

Create `.env` file:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Configure Supabase Secrets

```bash
# AI Services
supabase secrets set GEMINI_API_KEY=your_gemini_key
supabase secrets set ELEVENLABS_API_KEY=your_elevenlabs_key
supabase secrets set ELEVENLABS_VOICE_ID=your_voice_id

# Datadog (Required for observability)
supabase secrets set DD_API_KEY=your_datadog_api_key
supabase secrets set DD_SITE=datadoghq.eu  # or datadoghq.com for US

# Optional
supabase secrets set LEONARDO_API_KEY=your_leonardo_key
supabase secrets set STRIPE_SECRET_KEY=your_stripe_key
```

### 4. Deploy Database Migrations

```bash
supabase db push
```

### 5. Deploy Edge Functions

```bash
supabase functions deploy generate-story
supabase functions deploy generate-music
supabase functions deploy generate-interactive
supabase functions deploy text-to-speech
```

### 6. Start Development Server

```bash
pnpm dev
```

### 7. Build for Production

```bash
pnpm build
```

---

## Live Demo

- **App URL**: https://nexttale.vercel.app
- **Demo Video**: [YouTube Link - Coming Soon]

---

## Project Structure

```
nexttale/
├── src/
│   ├── components/           # React components
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Services and utilities
│   └── App.tsx              # Main application
├── supabase/
│   └── functions/           # Edge Functions
│       ├── _shared/
│       │   └── datadog.ts   # Datadog observability module
│       ├── generate-story/  # Gemini story generation
│       ├── generate-music/  # ElevenLabs music
│       └── text-to-speech/  # ElevenLabs TTS
├── datadog/
│   ├── dashboard.json       # Importable dashboard
│   └── detection-rules.json # Detection rule configs
├── scripts/
│   └── traffic-generator.ts # Detection rules demo script
└── LICENSE                  # MIT License
```

---

## Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm preview      # Preview production build
pnpm lint         # Run ESLint
pnpm test:run     # Run tests
pnpm typecheck    # TypeScript check
```

---

## Evidence Documentation

### Dashboard Screenshots

[Include screenshots of your Datadog dashboard showing:

- Request volume over time
- Error rate trends
- Latency percentiles
- Cost tracking]

### Detection Rule Triggers

[Include evidence of detection rules triggering:

- Screenshot of triggered monitor
- Incident created with context
- Timeline of symptoms → detection → incident]

---

## License

MIT License - See [LICENSE](./LICENSE) for details.

---

## Acknowledgments

- **Google Cloud / Gemini** - For powerful AI story generation
- **Datadog** - For comprehensive LLM observability platform
- **ElevenLabs** - For natural, expressive voice synthesis
- **Supabase** - For the excellent backend infrastructure

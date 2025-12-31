/**
 * Traffic Generator for Datadog Detection Rules Demo
 *
 * This script generates traffic to trigger various Datadog detection rules:
 * 1. High error rate (>5% errors)
 * 2. Cost anomaly (spike in requests)
 * 3. Rate limit warnings
 * 4. Latency spikes
 *
 * Usage:
 *   npx ts-node scripts/traffic-generator.ts --scenario=errors
 *   npx ts-node scripts/traffic-generator.ts --scenario=volume
 *   npx ts-node scripts/traffic-generator.ts --scenario=all
 *
 * Prerequisites:
 *   - Set SUPABASE_URL and SUPABASE_ANON_KEY environment variables
 *   - Have a valid user auth token
 */

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://yzifogzrytwpxnaylnga.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

interface ScenarioConfig {
  name: string;
  description: string;
  requests: number;
  delayMs: number;
  errorRate?: number;
  invalidPrompts?: boolean;
}

const scenarios: Record<string, ScenarioConfig> = {
  // Trigger high error rate detection rule
  errors: {
    name: 'High Error Rate',
    description: 'Generates requests with invalid data to trigger error rate alerts',
    requests: 20,
    delayMs: 500,
    errorRate: 0.6, // 60% will be invalid
    invalidPrompts: true,
  },

  // Trigger volume/cost anomaly detection
  volume: {
    name: 'Volume Spike',
    description: 'Generates burst of valid requests to trigger cost anomaly detection',
    requests: 50,
    delayMs: 200,
  },

  // Trigger rate limit warnings
  ratelimit: {
    name: 'Rate Limit Test',
    description: 'Rapid requests to trigger rate limit detection',
    requests: 30,
    delayMs: 100,
  },

  // Combined scenario
  all: {
    name: 'Full Demo',
    description: 'Runs all scenarios sequentially',
    requests: 0,
    delayMs: 0,
  },
};

const storyPrompts = [
  'A brave knight discovers a hidden dragon egg',
  'A young wizard learns their first spell goes wrong',
  'A detective in a cyberpunk city solves impossible crimes',
  'A chef discovers their recipes have magical effects',
  'An astronaut finds a message from the future',
];

const invalidPrompts = [
  '', // Empty prompt
  'x'.repeat(50000), // Extremely long prompt
  null, // Null value
  { invalid: 'object' }, // Wrong type
];

async function callGenerateStory(
  prompt: string | null | object,
  authToken: string
): Promise<{ success: boolean; error?: string; latencyMs: number }> {
  const startTime = Date.now();

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-story`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        prompt,
        genre: 'fantasy',
        tone: 'adventurous',
        length: 'short',
      }),
    });

    const latencyMs = Date.now() - startTime;
    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || response.statusText, latencyMs };
    }

    return { success: true, latencyMs };
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      latencyMs,
    };
  }
}

async function runScenario(scenario: ScenarioConfig, authToken: string): Promise<void> {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Running Scenario: ${scenario.name}`);
  console.log(`Description: ${scenario.description}`);
  console.log(`Requests: ${scenario.requests}, Delay: ${scenario.delayMs}ms`);
  console.log('='.repeat(60));

  let successCount = 0;
  let errorCount = 0;
  let totalLatency = 0;

  for (let i = 0; i < scenario.requests; i++) {
    // Determine if this request should be invalid
    const shouldError = scenario.errorRate && Math.random() < scenario.errorRate;
    const prompt = shouldError
      ? invalidPrompts[Math.floor(Math.random() * invalidPrompts.length)]
      : storyPrompts[Math.floor(Math.random() * storyPrompts.length)];

    process.stdout.write(`Request ${i + 1}/${scenario.requests}... `);

    const result = await callGenerateStory(prompt, authToken);
    totalLatency += result.latencyMs;

    if (result.success) {
      successCount++;
      console.log(`✓ Success (${result.latencyMs}ms)`);
    } else {
      errorCount++;
      console.log(`✗ Error: ${result.error} (${result.latencyMs}ms)`);
    }

    // Delay between requests
    if (i < scenario.requests - 1 && scenario.delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, scenario.delayMs));
    }
  }

  console.log(`\nResults for ${scenario.name}:`);
  console.log(
    `  Success: ${successCount}/${scenario.requests} (${((successCount / scenario.requests) * 100).toFixed(1)}%)`
  );
  console.log(
    `  Errors: ${errorCount}/${scenario.requests} (${((errorCount / scenario.requests) * 100).toFixed(1)}%)`
  );
  console.log(`  Avg Latency: ${(totalLatency / scenario.requests).toFixed(0)}ms`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const scenarioArg = args.find((arg) => arg.startsWith('--scenario='));
  const scenarioName = scenarioArg?.split('=')[1] || 'volume';

  const authTokenArg = args.find((arg) => arg.startsWith('--token='));
  const authToken = authTokenArg?.split('=')[1] || process.env.SUPABASE_AUTH_TOKEN || '';

  if (!authToken) {
    console.error('Error: Auth token required. Use --token=<token> or set SUPABASE_AUTH_TOKEN');
    console.error('\nTo get a token:');
    console.error('1. Log into the app');
    console.error('2. Open browser DevTools > Application > Local Storage');
    console.error('3. Find the Supabase auth token');
    process.exit(1);
  }

  console.log('Datadog Detection Rules Traffic Generator');
  console.log('=========================================');
  console.log(`Target: ${SUPABASE_URL}`);
  console.log(`Scenario: ${scenarioName}`);

  if (scenarioName === 'all') {
    // Run all scenarios
    for (const [name, config] of Object.entries(scenarios)) {
      if (name !== 'all') {
        await runScenario(config, authToken);
        // Wait between scenarios
        console.log('\nWaiting 5 seconds before next scenario...');
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
  } else if (scenarios[scenarioName]) {
    await runScenario(scenarios[scenarioName], authToken);
  } else {
    console.error(`Unknown scenario: ${scenarioName}`);
    console.error(`Available scenarios: ${Object.keys(scenarios).join(', ')}`);
    process.exit(1);
  }

  console.log('\n✅ Traffic generation complete!');
  console.log('Check Datadog for triggered detection rules:');
  console.log('  - Monitors: https://app.datadoghq.eu/monitors/manage');
  console.log('  - LLM Traces: https://app.datadoghq.eu/llm/traces');
  console.log('  - Dashboard: https://app.datadoghq.eu/dashboard');
}

main().catch(console.error);

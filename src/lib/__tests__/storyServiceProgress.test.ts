import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { saveProgress, startStoryGeneration } from '../storyService';

type MockCall = { table: string; action: string; payload?: any; filters?: Record<string, unknown> };

let calls: MockCall[] = [];

function makeChain(result: any) {
  return {
    eq: vi.fn(() => makeChain(result)),
    maybeSingle: vi.fn(async () => result),
    select: vi.fn(() => makeChain(result)),
    update: vi.fn((payload: any) => ({
      eq: vi.fn(() => {
        calls.push({ table: '', action: 'update', payload });
        return { error: null };
      }),
    })),
    insert: vi.fn((payload: any) => {
      calls.push({ table: '', action: 'insert', payload });
      return {
        select: vi.fn(() => ({
          single: vi.fn(async () => ({ data: null, error: null })),
        })),
        single: vi.fn(async () => ({ data: null, error: null })),
      };
    }),
    single: vi.fn(async () => ({ data: null, error: null })),
  };
}

const { fromMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
}));

vi.mock('../supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => fromMock(...(args as [string])),
  },
}));

// Initialize fromMock default implementation
fromMock.mockImplementation((table: string) => {
  calls.push({ table, action: 'from' });
  return makeChain(null);
});

let fetchMock: ReturnType<typeof vi.fn>;
const originalFetch = global.fetch;

describe('storyService.saveProgress', () => {
  beforeEach(() => {
    calls = [];
    fromMock.mockImplementation((table: string) => {
      calls.push({ table, action: 'from' });
      return makeChain(null);
    });
  });

  it('updates existing progress when record is found', async () => {
    // Mock select returning existing row
    fromMock.mockImplementationOnce((table: string) => {
      calls.push({ table, action: 'from' });
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: { id: 'progress-1' }, error: null }),
            }),
          }),
        }),
        update: (payload: any) => ({
          eq: () => {
            calls.push({ table, action: 'update', payload });
            return { error: null };
          },
        }),
      } as any;
    });

    await saveProgress('user-1', 'story-1', 'node-1', ['start', 'a'], false);

    const updateCall = calls.find((c) => c.action === 'update');
    expect(updateCall?.payload).toMatchObject({
      user_id: 'user-1',
      story_id: 'story-1',
      current_node_id: 'node-1',
      completed: false,
    });
  });

  it('inserts new progress when none exists', async () => {
    // First call to from() -> select -> maybeSingle returns null
    fromMock.mockImplementationOnce((table: string) => {
      calls.push({ table, action: 'from' });
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: null, error: null }),
            }),
          }),
        }),
        insert: (payload: any) => ({
          select: () => ({
            eq: () => {
              calls.push({ table, action: 'insert', payload });
              return { error: null };
            },
          }),
          single: async () => ({ data: null, error: null }),
        }),
      } as any;
    });

    await saveProgress('user-2', 'story-2', 'node-2', ['start', 'b'], true);

    const insertCall = calls.find((c) => c.action === 'insert');
    expect(insertCall?.payload).toMatchObject({
      user_id: 'user-2',
      story_id: 'story-2',
      current_node_id: 'node-2',
      completed: true,
    });
  });
});

describe('storyService.startStoryGeneration', () => {
  beforeEach(() => {
    calls = [];
    fetchMock = vi.fn();
    global.fetch = fetchMock;
    vi.stubEnv('VITE_SUPABASE_URL', 'https://api.example.com');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon-key');
    fromMock.mockImplementation((table: string) => {
      calls.push({ table, action: 'from' });
      return makeChain(null);
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.unstubAllEnvs();
  });

  it('enqueues generation and posts trigger', async () => {
    // Mock supabase.from for generation_queue insert
    fromMock.mockImplementation((table: string) => {
      calls.push({ table, action: 'from' });
      if (table === 'generation_queue') {
        return {
          insert: async (payload: any) => {
            calls.push({ table, action: 'insert', payload });
            return { error: null };
          },
        } as any;
      }
      return makeChain(null);
    });

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'queued' }),
    });

    await startStoryGeneration('story-123', 'user-123');

    const queueInsert = calls.find((c) => c.table === 'generation_queue' && c.action === 'insert');
    expect(queueInsert?.payload).toMatchObject({
      story_id: 'story-123',
      user_id: 'user-123',
      status: 'pending',
      priority: 0,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/functions/v1/process-story-queue',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer anon-key',
        }),
      })
    );
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createStoryChoice } from '../storyService';

var fromMock: ReturnType<typeof vi.fn>;

vi.mock('../supabase', () => {
  fromMock = vi.fn();
  return {
    supabase: {
      from: (...args: unknown[]) => fromMock(...args),
    },
  };
});

describe('storyService.createStoryChoice', () => {
  beforeEach(() => {
    fromMock?.mockReset();
  });

  it('retries without created_by when the column is missing', async () => {
    const insertCalls: Array<Record<string, unknown>> = [];

    fromMock.mockImplementation(() => ({
      insert: (data: Record<string, unknown>) => {
        insertCalls.push({ ...data });
        return {
          select: () => ({
            single: async () => {
              if (insertCalls.length === 1) {
                return { data: null, error: { code: 'PGRST204', message: 'created_by missing' } };
              }
              return { data: { id: 'choice-123', ...data }, error: null };
            },
          }),
        };
      },
    }));

    const result = await createStoryChoice('from-node', 'to-node', 'text', null, 0, 'creator-id');

    expect(result).toMatchObject({ id: 'choice-123', choice_text: 'text', choice_order: 0 });
    expect(fromMock).toHaveBeenCalledTimes(2);
    expect(insertCalls[0].created_by).toBe('creator-id');
    expect('created_by' in insertCalls[1]).toBe(false);
  });

  it('succeeds on first attempt when backend supports created_by', async () => {
    const insertCalls: Array<Record<string, unknown>> = [];

    fromMock.mockImplementation(() => ({
      insert: (data: Record<string, unknown>) => {
        insertCalls.push({ ...data });
        return {
          select: () => ({
            single: async () => ({ data: { id: 'choice-abc', ...data }, error: null }),
          }),
        };
      },
    }));

    const result = await createStoryChoice('from-node', 'to-node', 'pick me', 'hint', 1, 'creator-id');

    expect(result).toMatchObject({
      id: 'choice-abc',
      from_node_id: 'from-node',
      to_node_id: 'to-node',
      choice_text: 'pick me',
      consequence_hint: 'hint',
      choice_order: 1,
    });
    expect(fromMock).toHaveBeenCalledTimes(1);
    expect(insertCalls[0].created_by).toBe('creator-id');
  });
});

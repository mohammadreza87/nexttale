import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createStoryChoice } from '../storyService';

const { fromMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
}));

vi.mock('../supabase', () => ({
  supabase: {
    from: (table: string) => (fromMock as ReturnType<typeof vi.fn>)(table),
  },
}));

describe('storyService.createStoryChoice', () => {
  beforeEach(() => {
    fromMock?.mockReset();
  });

  it('creates a story choice successfully', async () => {
    const insertData = {
      from_node_id: 'from-node',
      to_node_id: 'to-node',
      choice_text: 'text',
      consequence_hint: null,
      choice_order: 0,
    };

    fromMock.mockImplementation(() => ({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'choice-123', ...insertData },
            error: null,
          }),
        }),
      }),
    }));

    const result = await createStoryChoice('from-node', 'to-node', 'text', null, 0);

    expect(result).toMatchObject({ id: 'choice-123', choice_text: 'text', choice_order: 0 });
    expect(fromMock).toHaveBeenCalledWith('story_choices');
  });

  it('creates a story choice with consequence hint', async () => {
    const insertData = {
      from_node_id: 'from-node',
      to_node_id: 'to-node',
      choice_text: 'pick me',
      consequence_hint: 'hint',
      choice_order: 1,
    };

    fromMock.mockImplementation(() => ({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'choice-abc', ...insertData },
            error: null,
          }),
        }),
      }),
    }));

    const result = await createStoryChoice('from-node', 'to-node', 'pick me', 'hint', 1);

    expect(result).toMatchObject({
      id: 'choice-abc',
      from_node_id: 'from-node',
      to_node_id: 'to-node',
      choice_text: 'pick me',
      consequence_hint: 'hint',
      choice_order: 1,
    });
  });

  it('throws error when insert fails', async () => {
    fromMock.mockImplementation(() => ({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: 'ERROR', message: 'Insert failed' },
          }),
        }),
      }),
    }));

    await expect(createStoryChoice('from-node', 'to-node', 'text', null, 0)).rejects.toThrow();
  });
});

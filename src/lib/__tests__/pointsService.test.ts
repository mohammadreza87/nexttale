import { describe, it, expect, vi } from 'vitest';
import { trackChapterRead } from '../pointsService';

var fromMock: ReturnType<typeof vi.fn>;

vi.mock('../supabase', () => {
  fromMock = vi.fn(() => ({
    upsert: vi.fn().mockResolvedValue({ error: null }),
    select: vi.fn().mockResolvedValue({ data: null }),
    update: vi.fn().mockResolvedValue({ error: null }),
  }));

  return {
    supabase: {
      from: (...args: unknown[]) => fromMock(...args),
    },
  };
});

describe('pointsService.trackChapterRead', () => {
  it('returns early and does not hit supabase when userId is empty', async () => {
    await trackChapterRead('', 'story-1', 'node-1', null);

    expect(fromMock).not.toHaveBeenCalled();
  });
});

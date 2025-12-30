import { describe, it, expect, vi } from 'vitest';
import { trackChapterRead } from '../pointsService';

const { fromMock } = vi.hoisted(() => ({
  fromMock: vi.fn(() => ({
    upsert: vi.fn().mockResolvedValue({ error: null }),
    select: vi.fn().mockResolvedValue({ data: null }),
    update: vi.fn().mockResolvedValue({ error: null }),
  })),
}));

vi.mock('../supabase', () => ({
  supabase: {
    from: (table: string) => (fromMock as ReturnType<typeof vi.fn>)(table),
  },
}));

describe('pointsService.trackChapterRead', () => {
  it('returns early and does not hit supabase when userId is empty', async () => {
    await trackChapterRead('', 'story-1', 'node-1', null);

    expect(fromMock).not.toHaveBeenCalled();
  });
});

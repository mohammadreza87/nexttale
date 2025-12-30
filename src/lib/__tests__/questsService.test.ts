import { describe, it, expect, vi, beforeEach } from 'vitest';
import { progressQuest } from '../questsService';

const { fromMock, getSessionMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
  getSessionMock: vi.fn(),
}));

vi.mock('../supabase', () => ({
  supabase: {
    from: (table: string) => (fromMock as ReturnType<typeof vi.fn>)(table),
    auth: {
      getSession: () => (getSessionMock as ReturnType<typeof vi.fn>)(),
    },
    rpc: vi.fn(),
  },
}));

describe('questsService.progressQuest', () => {
  beforeEach(() => {
    fromMock.mockReset();
    getSessionMock.mockReset();
  });

  it('returns early when no authenticated session', async () => {
    getSessionMock.mockResolvedValue({ data: { session: null } });

    await progressQuest('read_chapter');

    expect(fromMock).not.toHaveBeenCalled();
  });
});

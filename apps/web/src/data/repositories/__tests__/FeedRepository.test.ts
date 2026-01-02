import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FeedRepository } from '../FeedRepository';
import { db } from '../../client';

// Mock the database client
vi.mock('../../client', () => ({
  db: {
    rpc: vi.fn(),
  },
  handleDbError: (err: unknown) => (err instanceof Error ? err : new Error(String(err))),
}));

// Mock the logger
vi.mock('../../../core/errors', () => ({
  logger: {
    error: vi.fn(),
  },
}));

describe('FeedRepository', () => {
  let repository: FeedRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new FeedRepository();
  });

  describe('getUnifiedFeed', () => {
    it('calls get_unified_feed RPC with correct params for all content', async () => {
      const mockData = [
        { id: '1', title: 'Story', feed_type: 'story' },
        { id: '2', title: 'Game', feed_type: 'game' },
      ];

      (db.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: mockData,
        error: null,
      });

      const result = await repository.getUnifiedFeed('all', 20, 0);

      expect(db.rpc).toHaveBeenCalledWith('get_unified_feed', {
        p_limit: 21,
        p_offset: 0,
        p_content_type: null,
        p_exclude_ids: null,
      });
      expect(result.data).toEqual(mockData);
      expect(result.hasMore).toBe(false);
    });

    it('filters by content type when specified', async () => {
      (db.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [],
        error: null,
      });

      await repository.getUnifiedFeed('story', 20, 0);

      expect(db.rpc).toHaveBeenCalledWith(
        'get_unified_feed',
        expect.objectContaining({
          p_content_type: 'story',
        })
      );
    });

    it('applies excludeIds filter', async () => {
      (db.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [],
        error: null,
      });

      await repository.getUnifiedFeed('all', 20, 0, ['id-1', 'id-2']);

      expect(db.rpc).toHaveBeenCalledWith(
        'get_unified_feed',
        expect.objectContaining({
          p_exclude_ids: ['id-1', 'id-2'],
        })
      );
    });

    it('correctly determines hasMore when at limit', async () => {
      const mockData = Array(21)
        .fill(null)
        .map((_, i) => ({ id: String(i), title: `Item ${i}`, feed_type: 'story' }));

      (db.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: mockData,
        error: null,
      });

      const result = await repository.getUnifiedFeed('all', 20, 0);

      expect(result.data.length).toBe(20);
      expect(result.hasMore).toBe(true);
    });

    it('throws error when RPC fails', async () => {
      (db.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: null,
        error: new Error('Database error'),
      });

      await expect(repository.getUnifiedFeed('all', 20, 0)).rejects.toThrow('Database error');
    });
  });

  describe('getTrendingFeed', () => {
    it('calls get_trending_feed RPC with correct params', async () => {
      const mockData = [
        { id: '1', title: 'Trending 1', feed_type: 'story', engagement_score: 100 },
        { id: '2', title: 'Trending 2', feed_type: 'game', engagement_score: 50 },
      ];

      (db.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: mockData,
        error: null,
      });

      const result = await repository.getTrendingFeed(20);

      expect(db.rpc).toHaveBeenCalledWith('get_trending_feed', {
        p_limit: 20,
        p_days: 7,
      });
      expect(result).toEqual(mockData);
    });

    it('returns empty array when no trending content', async () => {
      (db.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await repository.getTrendingFeed(20);

      expect(result).toEqual([]);
    });
  });

  describe('getFollowingFeed', () => {
    it('calls get_following_feed RPC with correct params', async () => {
      const mockData = [
        { id: '1', title: 'From Followed 1', feed_type: 'story' },
        { id: '2', title: 'From Followed 2', feed_type: 'music' },
      ];

      (db.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: mockData,
        error: null,
      });

      const result = await repository.getFollowingFeed('user-123', 20, 0);

      expect(db.rpc).toHaveBeenCalledWith('get_following_feed', {
        p_user_id: 'user-123',
        p_limit: 21,
        p_offset: 0,
      });
      expect(result.data).toEqual(mockData);
    });

    it('correctly determines hasMore when at limit', async () => {
      const mockData = Array(21)
        .fill(null)
        .map((_, i) => ({ id: String(i), title: `Item ${i}`, feed_type: 'story' }));

      (db.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: mockData,
        error: null,
      });

      const result = await repository.getFollowingFeed('user-123', 20, 0);

      expect(result.data.length).toBe(20);
      expect(result.hasMore).toBe(true);
    });

    it('throws error when RPC fails', async () => {
      (db.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: null,
        error: new Error('Database error'),
      });

      await expect(repository.getFollowingFeed('user-123', 20, 0)).rejects.toThrow(
        'Database error'
      );
    });
  });
});

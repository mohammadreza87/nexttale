import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StoryRepository } from '../StoryRepository';
import { db } from '../../client';

// Mock the database client
vi.mock('../../client', () => ({
  db: {
    rpc: vi.fn(),
    storyReactions: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn().mockReturnThis(),
    })),
  },
  handleDbError: (err: unknown) => (err instanceof Error ? err : new Error(String(err))),
}));

// Mock the logger
vi.mock('../../../core/errors', () => ({
  logger: {
    error: vi.fn(),
  },
}));

describe('StoryRepository', () => {
  let repository: StoryRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new StoryRepository();
  });

  describe('getStoriesFeed', () => {
    it('calls get_stories_feed RPC with correct params', async () => {
      const mockData = [
        { id: '1', title: 'Story 1', likes_count: 10 },
        { id: '2', title: 'Story 2', likes_count: 5 },
      ];

      (db.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: mockData,
        error: null,
      });

      const result = await repository.getStoriesFeed(10, 0);

      expect(db.rpc).toHaveBeenCalledWith('get_stories_feed', {
        p_limit: 11, // +1 for hasMore check
        p_offset: 0,
        p_is_public: true,
        p_user_id: null,
        p_exclude_ids: null,
      });
      expect(result.data).toEqual(mockData);
      expect(result.hasMore).toBe(false);
    });

    it('correctly determines hasMore when at limit', async () => {
      const mockData = Array(11)
        .fill(null)
        .map((_, i) => ({ id: String(i), title: `Story ${i}` }));

      (db.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: mockData,
        error: null,
      });

      const result = await repository.getStoriesFeed(10, 0);

      expect(result.data.length).toBe(10);
      expect(result.hasMore).toBe(true);
    });

    it('applies excludeIds filter', async () => {
      (db.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [],
        error: null,
      });

      await repository.getStoriesFeed(10, 0, {
        excludeIds: ['id-1', 'id-2'],
      });

      expect(db.rpc).toHaveBeenCalledWith(
        'get_stories_feed',
        expect.objectContaining({
          p_exclude_ids: ['id-1', 'id-2'],
        })
      );
    });

    it('applies userId filter', async () => {
      (db.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [],
        error: null,
      });

      await repository.getStoriesFeed(10, 0, {
        userId: 'user-123',
      });

      expect(db.rpc).toHaveBeenCalledWith(
        'get_stories_feed',
        expect.objectContaining({
          p_user_id: 'user-123',
        })
      );
    });

    it('throws error when RPC fails', async () => {
      (db.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: null,
        error: new Error('Database error'),
      });

      await expect(repository.getStoriesFeed(10, 0)).rejects.toThrow('Database error');
    });
  });

  describe('getStoryWithMetadata', () => {
    it('returns null when story not found', async () => {
      (db.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await repository.getStoryWithMetadata('non-existent');

      expect(result).toBeNull();
    });

    it('returns story with metadata', async () => {
      const mockStory = {
        id: 'story-1',
        title: 'Test Story',
        description: 'A test story',
        likes_count: 100,
        creator_name: 'Test Creator',
      };

      (db.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [mockStory],
        error: null,
      });

      const result = await repository.getStoryWithMetadata('story-1');

      expect(result).toEqual(mockStory);
      expect(db.rpc).toHaveBeenCalledWith('get_story_with_metadata', {
        p_story_id: 'story-1',
      });
    });
  });

  describe('getNodeWithChoices', () => {
    it('calls RPC with correct params', async () => {
      const mockNode = {
        node: { id: 'node-1', content: 'Test content' },
        choices: [],
      };

      (db.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: mockNode,
        error: null,
      });

      const result = await repository.getNodeWithChoices('story-1', 'start');

      expect(db.rpc).toHaveBeenCalledWith('get_node_with_choices', {
        p_story_id: 'story-1',
        p_node_key: 'start',
      });
      expect(result).toEqual(mockNode);
    });
  });

  describe('getUserReaction', () => {
    it('returns reaction type when exists', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { reaction_type: 'like' },
          error: null,
        }),
      };

      (db.storyReactions as ReturnType<typeof vi.fn>).mockReturnValue(mockChain);

      const result = await repository.getUserReaction('user-1', 'story-1');

      expect(result).toBe('like');
    });

    it('returns null when no reaction exists', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      (db.storyReactions as ReturnType<typeof vi.fn>).mockReturnValue(mockChain);

      const result = await repository.getUserReaction('user-1', 'story-1');

      // When data is null, data?.reaction_type returns undefined
      expect(result).toBeFalsy();
    });
  });

  describe('getUserReactionsBatch', () => {
    it('returns empty map when no storyIds provided', async () => {
      const result = await repository.getUserReactionsBatch('user-1', []);

      expect(result.size).toBe(0);
      expect(db.storyReactions).not.toHaveBeenCalled();
    });

    it('returns map of story reactions', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({
          data: [
            { story_id: 'story-1', reaction_type: 'like' },
            { story_id: 'story-2', reaction_type: 'dislike' },
          ],
          error: null,
        }),
      };

      (db.storyReactions as ReturnType<typeof vi.fn>).mockReturnValue(mockChain);

      const result = await repository.getUserReactionsBatch('user-1', ['story-1', 'story-2']);

      expect(result.get('story-1')).toBe('like');
      expect(result.get('story-2')).toBe('dislike');
    });
  });
});

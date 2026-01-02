import { BaseRepository } from './BaseRepository';
import { db, handleDbError } from '../client';
import { logger } from '../../core/errors';
import type { PaginatedResult } from '../types';
import type {
  Story,
  StoryFeedItem,
  StoryWithMetadata,
  NodeWithChoices,
} from '../types';

/**
 * Repository for story-related data operations
 */
export class StoryRepository extends BaseRepository<Story> {
  protected tableName = 'stories' as const;
  protected defaultSelect = '*';

  /**
   * Get stories for feed with all metadata in ONE query
   * Uses database function to avoid N+1 problem
   */
  async getStoriesFeed(
    limit: number = 20,
    offset: number = 0,
    options: {
      isPublic?: boolean;
      userId?: string;
      excludeIds?: string[];
    } = {}
  ): Promise<PaginatedResult<StoryFeedItem>> {
    const { isPublic = true, userId = null, excludeIds = [] } = options;

    try {
      const { data, error } = await db.rpc<StoryFeedItem[]>('get_stories_feed', {
        p_limit: limit + 1, // +1 to check hasMore
        p_offset: offset,
        p_is_public: isPublic,
        p_user_id: userId,
        p_exclude_ids: excludeIds.length > 0 ? excludeIds : null,
      });

      if (error) throw handleDbError(error);

      const items = data || [];
      const hasMore = items.length > limit;

      return {
        data: hasMore ? items.slice(0, -1) : items,
        hasMore,
        total: 0, // RPC doesn't return count efficiently
      };
    } catch (error) {
      logger.error('StoryRepository.getStoriesFeed failed', error as Error, {
        limit,
        offset,
        options,
      });
      throw error;
    }
  }

  /**
   * Get a single story with all metadata
   */
  async getStoryWithMetadata(storyId: string): Promise<StoryWithMetadata | null> {
    try {
      const { data, error } = await db.rpc<StoryWithMetadata[]>(
        'get_story_with_metadata',
        { p_story_id: storyId }
      );

      if (error) throw handleDbError(error);
      return data?.[0] || null;
    } catch (error) {
      logger.error('StoryRepository.getStoryWithMetadata failed', error as Error, {
        storyId,
      });
      throw error;
    }
  }

  /**
   * Get story node with its choices in one query
   */
  async getNodeWithChoices(
    storyId: string,
    nodeKey: string
  ): Promise<NodeWithChoices | null> {
    try {
      const { data, error } = await db.rpc<NodeWithChoices>(
        'get_node_with_choices',
        { p_story_id: storyId, p_node_key: nodeKey }
      );

      if (error) throw handleDbError(error);
      return data;
    } catch (error) {
      logger.error('StoryRepository.getNodeWithChoices failed', error as Error, {
        storyId,
        nodeKey,
      });
      throw error;
    }
  }

  /**
   * Get user's reaction to a story
   */
  async getUserReaction(
    userId: string,
    storyId: string
  ): Promise<'like' | 'dislike' | null> {
    try {
      const { data, error } = await db
        .storyReactions()
        .select('reaction_type')
        .eq('user_id', userId)
        .eq('story_id', storyId)
        .maybeSingle();

      if (error) throw handleDbError(error);
      return data?.reaction_type as 'like' | 'dislike' | null;
    } catch (error) {
      logger.error('StoryRepository.getUserReaction failed', error as Error, {
        userId,
        storyId,
      });
      throw error;
    }
  }

  /**
   * Batch get user reactions for multiple stories
   * Useful for feed where you need reactions for all visible items
   */
  async getUserReactionsBatch(
    userId: string,
    storyIds: string[]
  ): Promise<Map<string, 'like' | 'dislike'>> {
    if (storyIds.length === 0) return new Map();

    try {
      const { data, error } = await db
        .storyReactions()
        .select('story_id, reaction_type')
        .eq('user_id', userId)
        .in('story_id', storyIds);

      if (error) throw handleDbError(error);

      const reactionMap = new Map<string, 'like' | 'dislike'>();
      for (const item of data || []) {
        reactionMap.set(item.story_id, item.reaction_type as 'like' | 'dislike');
      }

      return reactionMap;
    } catch (error) {
      logger.error('StoryRepository.getUserReactionsBatch failed', error as Error, {
        userId,
        storyCount: storyIds.length,
      });
      throw error;
    }
  }

  /**
   * Add or update reaction
   */
  async setReaction(
    userId: string,
    storyId: string,
    reactionType: 'like' | 'dislike'
  ): Promise<void> {
    try {
      const { error } = await db.storyReactions().upsert(
        {
          user_id: userId,
          story_id: storyId,
          reaction_type: reactionType,
        },
        {
          onConflict: 'user_id,story_id',
        }
      );

      if (error) throw handleDbError(error);
    } catch (error) {
      logger.error('StoryRepository.setReaction failed', error as Error, {
        userId,
        storyId,
        reactionType,
      });
      throw error;
    }
  }

  /**
   * Remove reaction
   */
  async removeReaction(userId: string, storyId: string): Promise<void> {
    try {
      const { error } = await db
        .storyReactions()
        .delete()
        .eq('user_id', userId)
        .eq('story_id', storyId);

      if (error) throw handleDbError(error);
    } catch (error) {
      logger.error('StoryRepository.removeReaction failed', error as Error, {
        userId,
        storyId,
      });
      throw error;
    }
  }
}

// Singleton instance
export const storyRepository = new StoryRepository();

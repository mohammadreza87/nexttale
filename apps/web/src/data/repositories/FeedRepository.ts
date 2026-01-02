import { db, handleDbError } from '../client';
import { logger } from '../../core/errors';
import type { PaginatedResult, UnifiedFeedItem, FeedFilter } from '../types';

/**
 * Repository for unified feed operations
 */
export class FeedRepository {
  /**
   * Get unified feed with all content types
   * Uses optimized database function
   */
  async getUnifiedFeed(
    filter: FeedFilter = 'all',
    limit: number = 20,
    offset: number = 0,
    excludeIds: string[] = []
  ): Promise<PaginatedResult<UnifiedFeedItem>> {
    try {
      const { data, error } = await db.rpc<UnifiedFeedItem[]>('get_unified_feed', {
        p_limit: limit + 1,
        p_offset: offset,
        p_content_type: filter === 'all' ? null : filter,
        p_exclude_ids: excludeIds.length > 0 ? excludeIds : null,
      });

      if (error) throw handleDbError(error);

      const items = data || [];
      const hasMore = items.length > limit;

      return {
        data: hasMore ? items.slice(0, -1) : items,
        hasMore,
        total: 0,
      };
    } catch (error) {
      logger.error('FeedRepository.getUnifiedFeed failed', error as Error, {
        filter,
        limit,
        offset,
      });
      throw error;
    }
  }

  /**
   * Get trending content from last 7 days
   */
  async getTrendingFeed(limit: number = 20): Promise<UnifiedFeedItem[]> {
    try {
      const { data, error } = await db.rpc<UnifiedFeedItem[]>('get_trending_feed', {
        p_limit: limit,
        p_days: 7,
      });

      if (error) throw handleDbError(error);
      return data || [];
    } catch (error) {
      logger.error('FeedRepository.getTrendingFeed failed', error as Error, {
        limit,
      });
      throw error;
    }
  }

  /**
   * Get feed from followed users
   */
  async getFollowingFeed(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<PaginatedResult<UnifiedFeedItem>> {
    try {
      const { data, error } = await db.rpc<UnifiedFeedItem[]>('get_following_feed', {
        p_user_id: userId,
        p_limit: limit + 1,
        p_offset: offset,
      });

      if (error) throw handleDbError(error);

      const items = data || [];
      const hasMore = items.length > limit;

      return {
        data: hasMore ? items.slice(0, -1) : items,
        hasMore,
        total: 0,
      };
    } catch (error) {
      logger.error('FeedRepository.getFollowingFeed failed', error as Error, {
        userId,
        limit,
        offset,
      });
      throw error;
    }
  }
}

// Singleton instance
export const feedRepository = new FeedRepository();

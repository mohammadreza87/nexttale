import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { feedRepository } from '../repositories/FeedRepository';
import { featureFlags } from '../../core/config/featureFlags';
import type { FeedFilter } from '../types';

/**
 * Hook for unified feed with infinite scroll
 */
export function useUnifiedFeed(
  filter: FeedFilter = 'all',
  options: { excludeIds?: string[] } = {}
) {
  return useInfiniteQuery({
    queryKey: ['feed', 'unified', filter, options.excludeIds?.join(',')],
    queryFn: ({ pageParam = 0 }) =>
      feedRepository.getUnifiedFeed(filter, 20, pageParam as number, options.excludeIds || []),
    getNextPageParam: (lastPage, allPages) =>
      lastPage.hasMore ? allPages.length * 20 : undefined,
    initialPageParam: 0,
    enabled: featureFlags.isEnabled('USE_REPOSITORY_PATTERN'),
    staleTime: 60_000,
    gcTime: 300_000,
  });
}

/**
 * Hook for trending content
 */
export function useTrendingFeed(limit: number = 20) {
  return useQuery({
    queryKey: ['feed', 'trending', limit],
    queryFn: () => feedRepository.getTrendingFeed(limit),
    enabled: featureFlags.isEnabled('USE_REPOSITORY_PATTERN'),
    staleTime: 300_000, // 5 minutes - trending changes slowly
    gcTime: 600_000,
  });
}

/**
 * Hook for following feed
 */
export function useFollowingFeed(userId: string | undefined) {
  return useInfiniteQuery({
    queryKey: ['feed', 'following', userId],
    queryFn: ({ pageParam = 0 }) =>
      feedRepository.getFollowingFeed(userId!, 20, pageParam as number),
    getNextPageParam: (lastPage, allPages) =>
      lastPage.hasMore ? allPages.length * 20 : undefined,
    initialPageParam: 0,
    enabled: !!userId && featureFlags.isEnabled('USE_REPOSITORY_PATTERN'),
    staleTime: 60_000,
    gcTime: 300_000,
  });
}

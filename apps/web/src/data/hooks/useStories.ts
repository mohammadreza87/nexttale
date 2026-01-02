import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from '@tanstack/react-query';
import { storyRepository } from '../repositories';
import { queryKeys } from '../../lib/queryClient';
import { featureFlags } from '../../core/config/featureFlags';
import type { StoryWithMetadata } from '../types';

/**
 * Hook to fetch paginated stories for feed
 */
export function useStoriesFeed(
  limit: number = 20,
  options: { isPublic?: boolean; userId?: string } = {}
) {
  return useInfiniteQuery({
    queryKey: queryKeys.stories.list({ limit, ...options }),
    queryFn: ({ pageParam = 0 }) =>
      storyRepository.getStoriesFeed(limit, pageParam as number, options),
    getNextPageParam: (lastPage, allPages) =>
      lastPage.hasMore ? allPages.length * limit : undefined,
    initialPageParam: 0,
    enabled: featureFlags.isEnabled('USE_REPOSITORY_PATTERN'),
    staleTime: 60_000, // 1 minute
    gcTime: 300_000, // 5 minutes
  });
}

/**
 * Hook to fetch a single story with metadata
 */
export function useStory(storyId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.stories.detail(storyId || ''),
    queryFn: () => storyRepository.getStoryWithMetadata(storyId!),
    enabled: !!storyId && featureFlags.isEnabled('USE_REPOSITORY_PATTERN'),
    staleTime: 300_000, // 5 minutes
    gcTime: 600_000, // 10 minutes
  });
}

/**
 * Hook to fetch a story node with choices
 */
export function useStoryNode(storyId: string | undefined, nodeKey: string) {
  return useQuery({
    queryKey: queryKeys.storyNodes.node(storyId || '', nodeKey),
    queryFn: () => storyRepository.getNodeWithChoices(storyId!, nodeKey),
    enabled: !!storyId && featureFlags.isEnabled('USE_REPOSITORY_PATTERN'),
    staleTime: 300_000,
  });
}

/**
 * Hook to manage story reactions
 */
export function useStoryReaction(storyId: string, userId: string | undefined) {
  const queryClient = useQueryClient();
  const queryKey = queryKeys.reactions.userReaction(userId || '', storyId);

  const { data: reaction, isLoading } = useQuery({
    queryKey,
    queryFn: () => storyRepository.getUserReaction(userId!, storyId),
    enabled: !!userId && featureFlags.isEnabled('USE_REPOSITORY_PATTERN'),
    staleTime: 60_000,
  });

  const setReactionMutation = useMutation({
    mutationFn: (reactionType: 'like' | 'dislike') =>
      storyRepository.setReaction(userId!, storyId, reactionType),
    onMutate: async (newReaction) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, newReaction);

      // Also update story likes/dislikes count
      const storyKey = queryKeys.stories.detail(storyId);
      const previousStory = queryClient.getQueryData<StoryWithMetadata>(storyKey);
      if (previousStory) {
        queryClient.setQueryData(storyKey, {
          ...previousStory,
          likes_count: previousStory.likes_count + (newReaction === 'like' ? 1 : 0),
          dislikes_count: previousStory.dislikes_count + (newReaction === 'dislike' ? 1 : 0),
        });
      }

      return { previous, previousStory };
    },
    onError: (_err, _newReaction, context) => {
      // Rollback on error
      if (context?.previous !== undefined) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      if (context?.previousStory) {
        queryClient.setQueryData(queryKeys.stories.detail(storyId), context.previousStory);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: queryKeys.stories.detail(storyId) });
    },
  });

  const removeReactionMutation = useMutation({
    mutationFn: () => storyRepository.removeReaction(userId!, storyId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, null);
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: queryKeys.stories.detail(storyId) });
    },
  });

  return {
    reaction,
    isLoading,
    setReaction: setReactionMutation.mutate,
    removeReaction: removeReactionMutation.mutate,
    isUpdating: setReactionMutation.isPending || removeReactionMutation.isPending,
  };
}

/**
 * Hook to batch fetch reactions for multiple stories
 */
export function useStoryReactionsBatch(
  storyIds: string[],
  userId: string | undefined
) {
  return useQuery({
    queryKey: ['reactions', 'batch', userId, storyIds.sort().join(',')],
    queryFn: () => storyRepository.getUserReactionsBatch(userId!, storyIds),
    enabled:
      !!userId && storyIds.length > 0 && featureFlags.isEnabled('USE_REPOSITORY_PATTERN'),
    staleTime: 60_000,
  });
}

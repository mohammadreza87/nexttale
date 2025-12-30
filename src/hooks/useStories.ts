import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryClient';
import {
  getStoriesPaginated,
  getStory,
  getUserReaction,
  addReaction,
  updateReaction,
  removeReaction,
} from '../lib/storyService';
import type { Story, StoryReaction } from '../lib/types';

const STORIES_PER_PAGE = 4;

/**
 * Hook for infinite scrolling story list
 */
export function useInfiniteStories() {
  return useInfiniteQuery({
    queryKey: queryKeys.stories.lists(),
    queryFn: async ({ pageParam = 0 }) => {
      const result = await getStoriesPaginated(STORIES_PER_PAGE, pageParam);
      return {
        data: result.data,
        hasMore: result.hasMore,
        nextOffset: pageParam + STORIES_PER_PAGE,
      };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextOffset : undefined),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Hook for fetching a single story
 */
export function useStory(storyId: string | null) {
  return useQuery({
    queryKey: queryKeys.stories.detail(storyId ?? ''),
    queryFn: () => getStory(storyId!),
    enabled: !!storyId,
  });
}

/**
 * Hook for user reaction to a story
 */
export function useUserReaction(userId: string | null, storyId: string | null) {
  return useQuery({
    queryKey: queryKeys.reactions.userReaction(userId ?? '', storyId ?? ''),
    queryFn: () => getUserReaction(userId!, storyId!),
    enabled: !!userId && !!storyId,
  });
}

/**
 * Hook for managing story reactions (like/dislike)
 */
export function useStoryReaction(userId: string, storyId: string) {
  const queryClient = useQueryClient();

  const addReactionMutation = useMutation({
    mutationFn: (reactionType: 'like' | 'dislike') => addReaction(userId, storyId, reactionType),
    onMutate: async (reactionType) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.reactions.userReaction(userId, storyId),
      });
      await queryClient.cancelQueries({ queryKey: queryKeys.stories.detail(storyId) });

      // Snapshot previous values
      const previousReaction = queryClient.getQueryData<StoryReaction | null>(
        queryKeys.reactions.userReaction(userId, storyId)
      );
      const previousStory = queryClient.getQueryData<Story>(queryKeys.stories.detail(storyId));

      // Optimistically update
      queryClient.setQueryData(queryKeys.reactions.userReaction(userId, storyId), {
        user_id: userId,
        story_id: storyId,
        reaction_type: reactionType,
        created_at: new Date().toISOString(),
      });

      if (previousStory) {
        queryClient.setQueryData(queryKeys.stories.detail(storyId), {
          ...previousStory,
          likes_count:
            reactionType === 'like'
              ? (previousStory.likes_count ?? 0) + 1
              : (previousStory.likes_count ?? 0),
          dislikes_count:
            reactionType === 'dislike'
              ? (previousStory.dislikes_count ?? 0) + 1
              : (previousStory.dislikes_count ?? 0),
        });
      }

      return { previousReaction, previousStory };
    },
    onError: (_err, _vars, context) => {
      // Rollback on error
      if (context?.previousReaction !== undefined) {
        queryClient.setQueryData(
          queryKeys.reactions.userReaction(userId, storyId),
          context.previousReaction
        );
      }
      if (context?.previousStory) {
        queryClient.setQueryData(queryKeys.stories.detail(storyId), context.previousStory);
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({
        queryKey: queryKeys.reactions.userReaction(userId, storyId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.stories.detail(storyId) });
    },
  });

  const updateReactionMutation = useMutation({
    mutationFn: (reactionType: 'like' | 'dislike') => updateReaction(userId, storyId, reactionType),
    onMutate: async (reactionType) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.reactions.userReaction(userId, storyId),
      });
      await queryClient.cancelQueries({ queryKey: queryKeys.stories.detail(storyId) });

      const previousReaction = queryClient.getQueryData<StoryReaction | null>(
        queryKeys.reactions.userReaction(userId, storyId)
      );
      const previousStory = queryClient.getQueryData<Story>(queryKeys.stories.detail(storyId));

      queryClient.setQueryData(queryKeys.reactions.userReaction(userId, storyId), {
        user_id: userId,
        story_id: storyId,
        reaction_type: reactionType,
        created_at: new Date().toISOString(),
      });

      if (previousStory && previousReaction) {
        const wasLike = previousReaction.reaction_type === 'like';
        queryClient.setQueryData(queryKeys.stories.detail(storyId), {
          ...previousStory,
          likes_count: wasLike
            ? (previousStory.likes_count ?? 0) - 1
            : (previousStory.likes_count ?? 0) + 1,
          dislikes_count: wasLike
            ? (previousStory.dislikes_count ?? 0) + 1
            : (previousStory.dislikes_count ?? 0) - 1,
        });
      }

      return { previousReaction, previousStory };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousReaction !== undefined) {
        queryClient.setQueryData(
          queryKeys.reactions.userReaction(userId, storyId),
          context.previousReaction
        );
      }
      if (context?.previousStory) {
        queryClient.setQueryData(queryKeys.stories.detail(storyId), context.previousStory);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.reactions.userReaction(userId, storyId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.stories.detail(storyId) });
    },
  });

  const removeReactionMutation = useMutation({
    mutationFn: () => removeReaction(userId, storyId),
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.reactions.userReaction(userId, storyId),
      });
      await queryClient.cancelQueries({ queryKey: queryKeys.stories.detail(storyId) });

      const previousReaction = queryClient.getQueryData<StoryReaction | null>(
        queryKeys.reactions.userReaction(userId, storyId)
      );
      const previousStory = queryClient.getQueryData<Story>(queryKeys.stories.detail(storyId));

      queryClient.setQueryData(queryKeys.reactions.userReaction(userId, storyId), null);

      if (previousStory && previousReaction) {
        const wasLike = previousReaction.reaction_type === 'like';
        queryClient.setQueryData(queryKeys.stories.detail(storyId), {
          ...previousStory,
          likes_count: wasLike
            ? (previousStory.likes_count ?? 0) - 1
            : (previousStory.likes_count ?? 0),
          dislikes_count: wasLike
            ? (previousStory.dislikes_count ?? 0)
            : (previousStory.dislikes_count ?? 0) - 1,
        });
      }

      return { previousReaction, previousStory };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousReaction !== undefined) {
        queryClient.setQueryData(
          queryKeys.reactions.userReaction(userId, storyId),
          context.previousReaction
        );
      }
      if (context?.previousStory) {
        queryClient.setQueryData(queryKeys.stories.detail(storyId), context.previousStory);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.reactions.userReaction(userId, storyId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.stories.detail(storyId) });
    },
  });

  return {
    addReaction: addReactionMutation.mutate,
    updateReaction: updateReactionMutation.mutate,
    removeReaction: removeReactionMutation.mutate,
    isLoading:
      addReactionMutation.isPending ||
      updateReactionMutation.isPending ||
      removeReactionMutation.isPending,
  };
}

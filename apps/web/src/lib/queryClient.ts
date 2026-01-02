import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Query keys factory for type safety and consistency
export const queryKeys = {
  // Stories
  stories: {
    all: ['stories'] as const,
    lists: () => [...queryKeys.stories.all, 'list'] as const,
    list: (filters: { page?: number; limit?: number } = {}) =>
      [...queryKeys.stories.lists(), filters] as const,
    details: () => [...queryKeys.stories.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.stories.details(), id] as const,
    byUser: (userId: string) => [...queryKeys.stories.all, 'user', userId] as const,
  },

  // Story nodes
  storyNodes: {
    all: ['storyNodes'] as const,
    byStory: (storyId: string) => [...queryKeys.storyNodes.all, 'story', storyId] as const,
    node: (storyId: string, nodeKey: string) =>
      [...queryKeys.storyNodes.byStory(storyId), nodeKey] as const,
    choices: (nodeId: string) => [...queryKeys.storyNodes.all, 'choices', nodeId] as const,
  },

  // Users
  users: {
    all: ['users'] as const,
    profile: (userId: string) => [...queryKeys.users.all, 'profile', userId] as const,
    subscription: (userId: string) => [...queryKeys.users.all, 'subscription', userId] as const,
    quests: (userId: string) => [...queryKeys.users.all, 'quests', userId] as const,
    stats: (userId: string) => [...queryKeys.users.all, 'stats', userId] as const,
  },

  // Reactions
  reactions: {
    all: ['reactions'] as const,
    story: (storyId: string) => [...queryKeys.reactions.all, 'story', storyId] as const,
    userReaction: (userId: string, storyId: string) =>
      [...queryKeys.reactions.all, 'user', userId, storyId] as const,
  },

  // Comments
  comments: {
    all: ['comments'] as const,
    byStory: (storyId: string) => [...queryKeys.comments.all, 'story', storyId] as const,
  },

  // Following
  following: {
    all: ['following'] as const,
    isFollowing: (followerId: string, followingId: string) =>
      [...queryKeys.following.all, followerId, followingId] as const,
    followers: (userId: string) => [...queryKeys.following.all, 'followers', userId] as const,
    following: (userId: string) => [...queryKeys.following.all, 'following', userId] as const,
  },
};

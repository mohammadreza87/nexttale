// Client
export { db, handleDbError } from './client';
export type { PaginatedResult } from './client';

// Types
export type {
  Story,
  StoryNode,
  StoryChoice,
  StoryReaction,
  UserProfile,
  StoryOutline,
  StoryMemory,
  StoryCharacter,
  ChapterOutline,
  StoryFeedItem,
  UnifiedFeedItem,
  StoryWithMetadata,
  NodeWithChoices,
  FeedFilter,
} from './types';

// Repositories
export {
  storyRepository,
  feedRepository,
  StoryRepository,
  FeedRepository,
  BaseRepository,
} from './repositories';
export type { QueryOptions } from './repositories';

// Hooks
export {
  useStoriesFeed,
  useStory,
  useStoryNode,
  useStoryReaction,
  useStoryReactionsBatch,
  useUnifiedFeed,
  useTrendingFeed,
  useFollowingFeed,
} from './hooks';

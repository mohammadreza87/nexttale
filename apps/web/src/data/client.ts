import { supabase } from '../lib/supabase';

/**
 * Typed database client wrapper
 * Provides type-safe access to Supabase tables and RPC functions
 */
export const db = {
  // Table accessors
  stories: () => supabase.from('stories'),
  storyNodes: () => supabase.from('story_nodes'),
  storyChoices: () => supabase.from('story_choices'),
  storyComments: () => supabase.from('story_comments'),
  storyReactions: () => supabase.from('story_reactions'),
  userProfiles: () => supabase.from('user_profiles'),
  userFollows: () => supabase.from('user_follows'),
  interactiveContent: () => supabase.from('interactive_content'),
  musicContent: () => supabase.from('music_content'),
  userStoryProgress: () => supabase.from('user_story_progress'),

  /**
   * RPC function caller
   */
  rpc: <T>(
    fn: string,
    params: Record<string, unknown> = {}
  ): Promise<{ data: T | null; error: Error | null }> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return supabase.rpc(fn as any, params) as unknown as Promise<{ data: T | null; error: Error | null }>;
  },

  // Auth helper
  auth: supabase.auth,

  // Storage helper
  storage: supabase.storage,

  // Raw supabase client for advanced queries
  raw: supabase,
};

/**
 * Helper to handle Supabase errors consistently
 */
export function handleDbError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return new Error(String((error as { message: unknown }).message));
  }
  return new Error('An unknown database error occurred');
}

/**
 * Type for paginated results
 */
export interface PaginatedResult<T> {
  data: T[];
  hasMore: boolean;
  total: number;
}

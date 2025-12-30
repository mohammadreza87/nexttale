import { supabase } from './supabase';
import type { FeedItem, ContentType, FeedFilter } from './interactiveTypes';

// ============================================
// UNIFIED FEED QUERIES
// ============================================

export async function getUnifiedFeed(
  filter: FeedFilter = 'all',
  limit: number = 20,
  offset: number = 0
): Promise<{ data: FeedItem[]; hasMore: boolean }> {
  if (filter === 'story') {
    return getStoriesFeed(limit, offset);
  }

  if (filter !== 'all') {
    return getInteractiveFeed(filter, limit, offset);
  }

  // Mixed feed - get both and interleave
  const halfLimit = Math.ceil(limit / 2);

  const [storiesResult, interactiveResult] = await Promise.all([
    getStoriesFeed(halfLimit, Math.floor(offset / 2)),
    getInteractiveFeed(undefined, halfLimit, Math.floor(offset / 2)),
  ]);

  // Combine and sort by created_at
  const combined = [...storiesResult.data, ...interactiveResult.data].sort(
    (a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
  );

  return {
    data: combined.slice(0, limit),
    hasMore: storiesResult.hasMore || interactiveResult.hasMore,
  };
}

async function getStoriesFeed(
  limit: number,
  offset: number
): Promise<{ data: FeedItem[]; hasMore: boolean }> {
  const { data, error } = await supabase
    .from('stories')
    .select(
      `
      id, title, description,
      cover_image_url, cover_video_url,
      created_by, is_public, likes_count, dislikes_count,
      completion_count, created_at, estimated_duration,
      creator:user_profiles(display_name, avatar_url)
    `
    )
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit);

  if (error) throw error;

  // Type assertion for the query result
  type StoryQueryResult = {
    id: string;
    title: string;
    description: string | null;
    cover_image_url: string | null;
    cover_video_url: string | null;
    created_by: string | null;
    is_public: boolean | null;
    likes_count: number | null;
    dislikes_count: number | null;
    completion_count: number | null;
    created_at: string | null;
    estimated_duration: number | null;
    creator: { display_name: string | null; avatar_url: string | null } | null;
  };

  const feedItems: FeedItem[] = ((data || []) as unknown as StoryQueryResult[]).map((story) => ({
    id: story.id,
    title: story.title,
    description: story.description,
    feed_type: 'story' as ContentType,
    thumbnail_url: story.cover_image_url,
    preview_url: story.cover_video_url || null,
    created_by: story.created_by || null,
    is_public: story.is_public || false,
    likes_count: story.likes_count || 0,
    dislikes_count: story.dislikes_count || 0,
    view_count: story.completion_count || 0,
    comment_count: 0, // Not available from stories table
    created_at: story.created_at || new Date().toISOString(),
    estimated_duration: story.estimated_duration,
    creator: story.creator,
  }));

  return {
    data: feedItems,
    hasMore: (data?.length || 0) === limit + 1,
  };
}

async function getInteractiveFeed(
  contentType: Exclude<ContentType, 'story'> | undefined,
  limit: number,
  offset: number
): Promise<{ data: FeedItem[]; hasMore: boolean }> {
  let query = supabase
    .from('interactive_content')
    .select(
      `
      id, title, description, content_type,
      thumbnail_url, preview_gif_url, html_content,
      created_by, is_public, likes_count, dislikes_count,
      view_count, comment_count, created_at, estimated_interaction_time, tags
    `
    )
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit);

  if (contentType) {
    query = query.eq('content_type', contentType);
  }

  const { data, error } = await query;

  if (error) throw error;

  const feedItems: FeedItem[] = (data || []).map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    feed_type: item.content_type as ContentType,
    thumbnail_url: item.thumbnail_url,
    preview_url: item.preview_gif_url,
    created_by: item.created_by,
    is_public: item.is_public,
    likes_count: item.likes_count || 0,
    dislikes_count: item.dislikes_count || 0,
    view_count: item.view_count || 0,
    comment_count: item.comment_count || 0,
    created_at: item.created_at,
    estimated_duration: item.estimated_interaction_time,
    creator: null,
    html_content: item.html_content,
    tags: item.tags,
  }));

  return {
    data: feedItems,
    hasMore: (data?.length || 0) === limit + 1,
  };
}

// ============================================
// TRENDING / POPULAR
// ============================================

export async function getTrendingFeed(limit: number = 20): Promise<FeedItem[]> {
  // Get popular content from last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Type assertion for story query result
  type StoryQueryResult = {
    id: string;
    title: string;
    description: string | null;
    cover_image_url: string | null;
    cover_video_url: string | null;
    created_by: string | null;
    is_public: boolean | null;
    likes_count: number | null;
    dislikes_count: number | null;
    completion_count: number | null;
    created_at: string | null;
    estimated_duration: number | null;
    creator: { display_name: string | null; avatar_url: string | null } | null;
  };

  const [{ data: stories }, { data: interactive }] = await Promise.all([
    supabase
      .from('stories')
      .select(
        `
        id, title, description,
        cover_image_url, cover_video_url,
        created_by, is_public, likes_count, dislikes_count,
        completion_count, created_at, estimated_duration,
        creator:user_profiles(display_name, avatar_url)
      `
      )
      .eq('is_public', true)
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('likes_count', { ascending: false })
      .limit(Math.ceil(limit / 2)),

    supabase
      .from('interactive_content')
      .select(
        `
        id, title, description, content_type,
        thumbnail_url, preview_gif_url, html_content,
        created_by, is_public, likes_count, dislikes_count,
        view_count, comment_count, created_at, estimated_interaction_time, tags
      `
      )
      .eq('is_public', true)
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('likes_count', { ascending: false })
      .limit(Math.ceil(limit / 2)),
  ]);

  const storyItems: FeedItem[] = ((stories || []) as unknown as StoryQueryResult[]).map(
    (story) => ({
      id: story.id,
      title: story.title,
      description: story.description,
      feed_type: 'story' as ContentType,
      thumbnail_url: story.cover_image_url,
      preview_url: story.cover_video_url,
      created_by: story.created_by,
      is_public: story.is_public,
      likes_count: story.likes_count || 0,
      dislikes_count: story.dislikes_count || 0,
      view_count: story.completion_count || 0,
      comment_count: 0, // Not available from stories table
      created_at: story.created_at,
      estimated_duration: story.estimated_duration,
      creator: story.creator,
    })
  );

  const interactiveItems: FeedItem[] = (interactive || []).map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    feed_type: item.content_type as ContentType,
    thumbnail_url: item.thumbnail_url,
    preview_url: item.preview_gif_url,
    created_by: item.created_by,
    is_public: item.is_public,
    likes_count: item.likes_count || 0,
    dislikes_count: item.dislikes_count || 0,
    view_count: item.view_count || 0,
    comment_count: item.comment_count || 0,
    created_at: item.created_at,
    estimated_duration: item.estimated_interaction_time,
    creator: null,
    html_content: item.html_content,
    tags: item.tags,
  }));

  // Sort by engagement score (likes + views)
  const combined = [...storyItems, ...interactiveItems].sort(
    (a, b) =>
      (b.likes_count ?? 0) + (b.view_count ?? 0) - ((a.likes_count ?? 0) + (a.view_count ?? 0))
  );

  return combined.slice(0, limit);
}

// ============================================
// FOLLOWING FEED
// ============================================

export async function getFollowingFeed(
  userId: string,
  limit: number = 20,
  offset: number = 0
): Promise<{ data: FeedItem[]; hasMore: boolean }> {
  // Get users that this user follows
  const { data: following } = await supabase
    .from('user_follows')
    .select('following_id')
    .eq('follower_id', userId);

  if (!following || following.length === 0) {
    return { data: [], hasMore: false };
  }

  const followingIds = following.map((f) => f.following_id);

  // Type assertion for story query result
  type StoryQueryResult = {
    id: string;
    title: string;
    description: string | null;
    cover_image_url: string | null;
    cover_video_url: string | null;
    created_by: string | null;
    is_public: boolean | null;
    likes_count: number | null;
    dislikes_count: number | null;
    completion_count: number | null;
    created_at: string | null;
    estimated_duration: number | null;
    creator: { display_name: string | null; avatar_url: string | null } | null;
  };

  // Get content from followed users
  const [{ data: stories }, { data: interactive }] = await Promise.all([
    supabase
      .from('stories')
      .select(
        `
        id, title, description,
        cover_image_url, cover_video_url,
        created_by, is_public, likes_count, dislikes_count,
        completion_count, created_at, estimated_duration,
        creator:user_profiles(display_name, avatar_url)
      `
      )
      .eq('is_public', true)
      .in('created_by', followingIds)
      .order('created_at', { ascending: false })
      .limit(Math.ceil(limit / 2)),

    supabase
      .from('interactive_content')
      .select(
        `
        id, title, description, content_type,
        thumbnail_url, preview_gif_url, html_content,
        created_by, is_public, likes_count, dislikes_count,
        view_count, comment_count, created_at, estimated_interaction_time, tags
      `
      )
      .eq('is_public', true)
      .in('created_by', followingIds)
      .order('created_at', { ascending: false })
      .limit(Math.ceil(limit / 2)),
  ]);

  const storyItems: FeedItem[] = ((stories || []) as unknown as StoryQueryResult[]).map(
    (story) => ({
      id: story.id,
      title: story.title,
      description: story.description,
      feed_type: 'story' as ContentType,
      thumbnail_url: story.cover_image_url,
      preview_url: story.cover_video_url,
      created_by: story.created_by,
      is_public: story.is_public,
      likes_count: story.likes_count || 0,
      dislikes_count: story.dislikes_count || 0,
      view_count: story.completion_count || 0,
      comment_count: 0, // Not available from stories table
      created_at: story.created_at,
      estimated_duration: story.estimated_duration,
      creator: story.creator,
    })
  );

  const interactiveItems: FeedItem[] = (interactive || []).map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    feed_type: item.content_type as ContentType,
    thumbnail_url: item.thumbnail_url,
    preview_url: item.preview_gif_url,
    created_by: item.created_by,
    is_public: item.is_public,
    likes_count: item.likes_count || 0,
    dislikes_count: item.dislikes_count || 0,
    view_count: item.view_count || 0,
    comment_count: item.comment_count || 0,
    created_at: item.created_at,
    estimated_duration: item.estimated_interaction_time,
    creator: null,
    html_content: item.html_content,
    tags: item.tags,
  }));

  const combined = [...storyItems, ...interactiveItems].sort(
    (a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
  );

  return {
    data: combined.slice(offset, offset + limit),
    hasMore: combined.length > offset + limit,
  };
}

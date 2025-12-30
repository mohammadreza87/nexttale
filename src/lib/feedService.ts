import { supabase } from './supabase';
import type { FeedItem, ContentType, FeedFilter, InteractiveContentType } from './interactiveTypes';

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Fisher-Yates shuffle algorithm for randomizing feed
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// ============================================
// UNIFIED FEED QUERIES
// ============================================

export async function getUnifiedFeed(
  filter: FeedFilter = 'all',
  limit: number = 20,
  offset: number = 0,
  excludeIds: string[] = []
): Promise<{ data: FeedItem[]; hasMore: boolean }> {
  const excludeSet = new Set(excludeIds);

  // Helper to filter out excluded IDs
  const filterExcluded = (items: FeedItem[]): FeedItem[] =>
    items.filter((item) => !excludeSet.has(item.id));

  if (filter === 'story') {
    const result = await getStoriesFeed(limit + excludeIds.length, offset, true);
    const filtered = filterExcluded(result.data);
    return { data: filtered.slice(0, limit), hasMore: result.hasMore || filtered.length > limit };
  }

  if (filter === 'music') {
    const result = await getMusicFeed(limit + excludeIds.length, offset, true);
    const filtered = filterExcluded(result.data);
    return { data: filtered.slice(0, limit), hasMore: result.hasMore || filtered.length > limit };
  }

  // Check if filter is an interactive content type
  const interactiveTypes: InteractiveContentType[] = [
    'game',
    'tool',
    'widget',
    'quiz',
    'visualization',
  ];
  if (interactiveTypes.includes(filter as InteractiveContentType)) {
    const result = await getInteractiveFeed(
      filter as InteractiveContentType,
      limit + excludeIds.length,
      offset,
      true
    );
    const filtered = filterExcluded(result.data);
    return { data: filtered.slice(0, limit), hasMore: result.hasMore || filtered.length > limit };
  }

  // Mixed feed - get more items to account for exclusions and shuffle for variety
  const fetchLimit = Math.ceil((limit + excludeIds.length) * 1.5);
  const thirdLimit = Math.ceil(fetchLimit / 3);

  const [storiesResult, interactiveResult, musicResult] = await Promise.all([
    getStoriesFeed(thirdLimit, Math.floor(offset / 3), false),
    getInteractiveFeed(undefined, thirdLimit, Math.floor(offset / 3), false),
    getMusicFeed(thirdLimit, Math.floor(offset / 3), false),
  ]);

  // Combine, filter excluded, and shuffle for random order
  const combined = shuffleArray(
    filterExcluded([...storiesResult.data, ...interactiveResult.data, ...musicResult.data])
  );

  return {
    data: combined.slice(0, limit),
    hasMore: storiesResult.hasMore || interactiveResult.hasMore || musicResult.hasMore,
  };
}

async function getStoriesFeed(
  limit: number,
  offset: number,
  shuffle: boolean = false
): Promise<{ data: FeedItem[]; hasMore: boolean }> {
  // First try with creator join, fallback to without if FK relationship fails
  let data;
  let error;

  try {
    const result = await supabase
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

    data = result.data;
    error = result.error;
  } catch (e) {
    // FK relationship might not exist, try without creator join
    console.warn('Stories query with creator join failed, trying without:', e);
  }

  // Fallback: query without creator join
  if (error || !data) {
    const fallbackResult = await supabase
      .from('stories')
      .select(
        `
        id, title, description,
        cover_image_url, cover_video_url,
        created_by, is_public, likes_count, dislikes_count,
        completion_count, created_at, estimated_duration
      `
      )
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit);

    if (fallbackResult.error) throw fallbackResult.error;
    data = fallbackResult.data;
  }

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
    creator?: { display_name: string | null; avatar_url: string | null } | null;
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
    creator: story.creator || null,
  }));

  return {
    data: shuffle ? shuffleArray(feedItems) : feedItems,
    hasMore: (data?.length || 0) === limit + 1,
  };
}

async function getInteractiveFeed(
  contentType: InteractiveContentType | undefined,
  limit: number,
  offset: number,
  shuffle: boolean = false
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
    data: shuffle ? shuffleArray(feedItems) : feedItems,
    hasMore: (data?.length || 0) === limit + 1,
  };
}

async function getMusicFeed(
  limit: number,
  offset: number,
  shuffle: boolean = false
): Promise<{ data: FeedItem[]; hasMore: boolean }> {
  // Query music_content without creator join (no FK relationship exists)
  const { data, error } = await supabase
    .from('music_content')
    .select(
      `
      id, title, description, audio_url, duration,
      genre, mood, lyrics, tags,
      created_by, is_public, likes_count, dislikes_count,
      play_count, created_at
    `
    )
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit);

  if (error) {
    console.error('Error fetching music feed:', error);
    return { data: [], hasMore: false };
  }

  type MusicQueryResult = {
    id: string;
    title: string;
    description: string | null;
    audio_url: string;
    duration: number | null;
    genre: string | null;
    mood: string | null;
    lyrics: string | null;
    tags: string[] | null;
    created_by: string | null;
    is_public: boolean | null;
    likes_count: number | null;
    dislikes_count: number | null;
    play_count: number | null;
    created_at: string | null;
  };

  // Fetch creator profiles separately if needed
  const musicData = (data || []) as unknown as MusicQueryResult[];
  const creatorIds = [...new Set(musicData.map((m) => m.created_by).filter(Boolean))] as string[];

  let creatorMap: Record<string, { display_name: string | null; avatar_url: string | null }> = {};

  if (creatorIds.length > 0) {
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, display_name, avatar_url')
      .in('id', creatorIds);

    if (profiles) {
      creatorMap = profiles.reduce(
        (acc, p) => {
          acc[p.id] = { display_name: p.display_name, avatar_url: p.avatar_url };
          return acc;
        },
        {} as Record<string, { display_name: string | null; avatar_url: string | null }>
      );
    }
  }

  const feedItems: FeedItem[] = musicData.map((music) => ({
    id: music.id,
    title: music.title,
    description: music.description,
    feed_type: 'music' as ContentType,
    thumbnail_url: null, // Music doesn't have thumbnails
    preview_url: null,
    created_by: music.created_by,
    is_public: music.is_public,
    likes_count: music.likes_count || 0,
    dislikes_count: music.dislikes_count || 0,
    view_count: music.play_count || 0,
    comment_count: 0,
    created_at: music.created_at,
    estimated_duration: music.duration,
    creator: music.created_by ? creatorMap[music.created_by] || null : null,
    audio_url: music.audio_url,
    lyrics: music.lyrics,
    genre: music.genre,
    mood: music.mood,
    play_count: music.play_count,
    tags: music.tags,
  }));

  return {
    data: shuffle ? shuffleArray(feedItems) : feedItems,
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

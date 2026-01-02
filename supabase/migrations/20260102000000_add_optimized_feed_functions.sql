-- ============================================
-- OPTIMIZED FEED FUNCTIONS
-- Eliminates N+1 queries by fetching all data in single calls
-- ============================================

-- ============================================
-- FUNCTION: get_stories_feed
-- Returns stories with all metadata in one query
-- ============================================
CREATE OR REPLACE FUNCTION get_stories_feed(
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0,
  p_is_public BOOLEAN DEFAULT TRUE,
  p_user_id UUID DEFAULT NULL,
  p_exclude_ids UUID[] DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  cover_image_url TEXT,
  cover_video_url TEXT,
  age_range TEXT,
  estimated_duration INT,
  likes_count INT,
  dislikes_count INT,
  comment_count BIGINT,
  completion_count INT,
  created_at TIMESTAMPTZ,
  created_by UUID,
  is_public BOOLEAN,
  generation_status TEXT,
  language TEXT,
  creator_id UUID,
  creator_name TEXT,
  creator_avatar TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  -- Input validation
  IF p_limit < 1 THEN p_limit := 20; END IF;
  IF p_limit > 100 THEN p_limit := 100; END IF;
  IF p_offset < 0 THEN p_offset := 0; END IF;

  RETURN QUERY
  SELECT
    s.id,
    s.title,
    s.description,
    -- Use cover image or fallback to start node image
    COALESCE(s.cover_image_url, start_node.image_url) as cover_image_url,
    s.cover_video_url,
    s.age_range,
    s.estimated_duration,
    COALESCE(s.likes_count, 0)::INT as likes_count,
    COALESCE(s.dislikes_count, 0)::INT as dislikes_count,
    COALESCE(comment_stats.cnt, 0) as comment_count,
    COALESCE(s.completion_count, 0)::INT as completion_count,
    s.created_at,
    s.created_by,
    s.is_public,
    s.generation_status,
    s.language,
    -- Creator info
    p.id as creator_id,
    p.display_name as creator_name,
    p.avatar_url as creator_avatar
  FROM stories s
  -- LEFT JOIN for creator profile
  LEFT JOIN user_profiles p ON s.created_by = p.id
  -- Subquery for comment count (more efficient than LATERAL for this case)
  LEFT JOIN LATERAL (
    SELECT COUNT(*)::BIGINT as cnt
    FROM story_comments sc
    WHERE sc.story_id = s.id
  ) comment_stats ON true
  -- Subquery for start node image (fallback cover)
  LEFT JOIN LATERAL (
    SELECT sn.image_url
    FROM story_nodes sn
    WHERE sn.story_id = s.id AND sn.node_key = 'start'
    LIMIT 1
  ) start_node ON true
  WHERE
    -- Filter by visibility
    (p_is_public IS NULL OR s.is_public = p_is_public)
    -- Filter by user if specified
    AND (p_user_id IS NULL OR s.created_by = p_user_id)
    -- Only show completed stories in public feed
    AND (NOT COALESCE(p_is_public, false) OR s.generation_status = 'complete')
    -- Exclude specific IDs
    AND (p_exclude_ids IS NULL OR NOT (s.id = ANY(p_exclude_ids)))
  ORDER BY s.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_stories_feed TO anon, authenticated;

-- ============================================
-- FUNCTION: get_story_with_metadata
-- Returns a single story with all related data
-- ============================================
CREATE OR REPLACE FUNCTION get_story_with_metadata(p_story_id UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  cover_image_url TEXT,
  cover_video_url TEXT,
  age_range TEXT,
  estimated_duration INT,
  story_context TEXT,
  likes_count INT,
  dislikes_count INT,
  comment_count BIGINT,
  completion_count INT,
  created_at TIMESTAMPTZ,
  created_by UUID,
  is_public BOOLEAN,
  generation_status TEXT,
  generation_progress INT,
  language TEXT,
  narrator_enabled BOOLEAN,
  video_enabled BOOLEAN,
  art_style TEXT,
  creator_name TEXT,
  creator_avatar TEXT,
  total_nodes BIGINT,
  total_choices BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.title,
    s.description,
    COALESCE(s.cover_image_url, start_node.image_url) as cover_image_url,
    s.cover_video_url,
    s.age_range,
    s.estimated_duration,
    s.story_context,
    COALESCE(s.likes_count, 0)::INT as likes_count,
    COALESCE(s.dislikes_count, 0)::INT as dislikes_count,
    COALESCE(comments.cnt, 0) as comment_count,
    COALESCE(s.completion_count, 0)::INT as completion_count,
    s.created_at,
    s.created_by,
    s.is_public,
    s.generation_status,
    s.generation_progress,
    s.language,
    s.narrator_enabled,
    s.video_enabled,
    s.art_style,
    -- Creator
    p.display_name as creator_name,
    p.avatar_url as creator_avatar,
    -- Stats
    COALESCE(nodes.cnt, 0) as total_nodes,
    COALESCE(choices.cnt, 0) as total_choices
  FROM stories s
  LEFT JOIN user_profiles p ON s.created_by = p.id
  LEFT JOIN LATERAL (
    SELECT COUNT(*)::BIGINT as cnt FROM story_comments WHERE story_id = s.id
  ) comments ON true
  LEFT JOIN LATERAL (
    SELECT COUNT(*)::BIGINT as cnt FROM story_nodes WHERE story_id = s.id
  ) nodes ON true
  LEFT JOIN LATERAL (
    SELECT COUNT(*)::BIGINT as cnt
    FROM story_choices sc
    INNER JOIN story_nodes sn ON sc.from_node_id = sn.id
    WHERE sn.story_id = s.id
  ) choices ON true
  LEFT JOIN LATERAL (
    SELECT image_url FROM story_nodes WHERE story_id = s.id AND node_key = 'start' LIMIT 1
  ) start_node ON true
  WHERE s.id = p_story_id;
END;
$$;

GRANT EXECUTE ON FUNCTION get_story_with_metadata TO anon, authenticated;

-- ============================================
-- FUNCTION: get_node_with_choices
-- Returns a story node with all its choices as JSON
-- ============================================
CREATE OR REPLACE FUNCTION get_node_with_choices(
  p_story_id UUID,
  p_node_key TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  result JSON;
  v_node RECORD;
BEGIN
  -- Get the node
  SELECT * INTO v_node
  FROM story_nodes
  WHERE story_id = p_story_id AND node_key = p_node_key;

  IF v_node IS NULL THEN
    RETURN NULL;
  END IF;

  -- Build result with node and choices
  SELECT json_build_object(
    'node', json_build_object(
      'id', v_node.id,
      'story_id', v_node.story_id,
      'node_key', v_node.node_key,
      'content', v_node.content,
      'is_ending', v_node.is_ending,
      'ending_type', v_node.ending_type,
      'order_index', v_node.order_index,
      'image_url', v_node.image_url,
      'image_prompt', v_node.image_prompt,
      'audio_url', v_node.audio_url,
      'video_url', v_node.video_url,
      'created_at', v_node.created_at
    ),
    'choices', COALESCE(
      (
        SELECT json_agg(
          json_build_object(
            'id', sc.id,
            'from_node_id', sc.from_node_id,
            'to_node_id', sc.to_node_id,
            'choice_text', sc.choice_text,
            'consequence_hint', sc.consequence_hint,
            'choice_order', sc.choice_order,
            'to_node', CASE
              WHEN tn.id IS NOT NULL THEN json_build_object(
                'id', tn.id,
                'node_key', tn.node_key,
                'content', tn.content,
                'is_ending', tn.is_ending
              )
              ELSE NULL
            END
          )
          ORDER BY sc.choice_order
        )
        FROM story_choices sc
        LEFT JOIN story_nodes tn ON sc.to_node_id = tn.id
        WHERE sc.from_node_id = v_node.id
      ),
      '[]'::json
    )
  ) INTO result;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_node_with_choices TO anon, authenticated;

-- ============================================
-- FUNCTION: get_unified_feed
-- Returns mixed content feed (stories + interactive + music)
-- ============================================
CREATE OR REPLACE FUNCTION get_unified_feed(
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0,
  p_content_type TEXT DEFAULT NULL,
  p_exclude_ids UUID[] DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  feed_type TEXT,
  thumbnail_url TEXT,
  preview_url TEXT,
  likes_count INT,
  dislikes_count INT,
  view_count INT,
  comment_count BIGINT,
  created_at TIMESTAMPTZ,
  created_by UUID,
  estimated_duration INT,
  creator_name TEXT,
  creator_avatar TEXT,
  extra_data JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  -- Input validation
  IF p_limit < 1 THEN p_limit := 20; END IF;
  IF p_limit > 100 THEN p_limit := 100; END IF;
  IF p_offset < 0 THEN p_offset := 0; END IF;

  RETURN QUERY
  WITH unified AS (
    -- Stories
    SELECT
      s.id,
      s.title,
      s.description,
      'story'::TEXT as feed_type,
      COALESCE(s.cover_image_url, sn.image_url) as thumbnail_url,
      s.cover_video_url as preview_url,
      COALESCE(s.likes_count, 0)::INT as likes_count,
      COALESCE(s.dislikes_count, 0)::INT as dislikes_count,
      COALESCE(s.completion_count, 0)::INT as view_count,
      COALESCE(cc.cnt, 0)::BIGINT as comment_count,
      s.created_at,
      s.created_by,
      s.estimated_duration,
      p.display_name as creator_name,
      p.avatar_url as creator_avatar,
      NULL::JSONB as extra_data
    FROM stories s
    LEFT JOIN user_profiles p ON s.created_by = p.id
    LEFT JOIN LATERAL (
      SELECT COUNT(*)::BIGINT as cnt FROM story_comments WHERE story_id = s.id
    ) cc ON true
    LEFT JOIN LATERAL (
      SELECT image_url FROM story_nodes WHERE story_id = s.id AND node_key = 'start' LIMIT 1
    ) sn ON true
    WHERE
      s.is_public = true
      AND s.generation_status = 'complete'
      AND (p_content_type IS NULL OR p_content_type = 'story')
      AND (p_exclude_ids IS NULL OR NOT (s.id = ANY(p_exclude_ids)))

    UNION ALL

    -- Interactive content
    SELECT
      ic.id,
      ic.title,
      ic.description,
      ic.content_type::TEXT as feed_type,
      ic.thumbnail_url,
      ic.preview_gif_url as preview_url,
      COALESCE(ic.likes_count, 0)::INT as likes_count,
      COALESCE(ic.dislikes_count, 0)::INT as dislikes_count,
      COALESCE(ic.view_count, 0)::INT as view_count,
      COALESCE(ic.comment_count, 0)::BIGINT as comment_count,
      ic.created_at,
      ic.created_by,
      ic.estimated_interaction_time as estimated_duration,
      p.display_name as creator_name,
      p.avatar_url as creator_avatar,
      jsonb_build_object('tags', ic.tags) as extra_data
    FROM interactive_content ic
    LEFT JOIN user_profiles p ON ic.created_by = p.id
    WHERE
      ic.is_public = true
      AND (p_content_type IS NULL OR ic.content_type = p_content_type)
      AND (p_exclude_ids IS NULL OR NOT (ic.id = ANY(p_exclude_ids)))

    UNION ALL

    -- Music
    SELECT
      mc.id,
      mc.title,
      mc.description,
      'music'::TEXT as feed_type,
      NULL as thumbnail_url,
      NULL as preview_url,
      COALESCE(mc.likes_count, 0)::INT as likes_count,
      COALESCE(mc.dislikes_count, 0)::INT as dislikes_count,
      COALESCE(mc.play_count, 0)::INT as view_count,
      0::BIGINT as comment_count,
      mc.created_at,
      mc.created_by,
      mc.duration as estimated_duration,
      p.display_name as creator_name,
      p.avatar_url as creator_avatar,
      jsonb_build_object(
        'audio_url', mc.audio_url,
        'lyrics', mc.lyrics,
        'genre', mc.genre,
        'mood', mc.mood
      ) as extra_data
    FROM music_content mc
    LEFT JOIN user_profiles p ON mc.created_by = p.id
    WHERE
      mc.is_public = true
      AND (p_content_type IS NULL OR p_content_type = 'music')
      AND (p_exclude_ids IS NULL OR NOT (mc.id = ANY(p_exclude_ids)))
  )
  SELECT * FROM unified
  ORDER BY created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION get_unified_feed TO anon, authenticated;

-- ============================================
-- FUNCTION: get_trending_feed
-- Returns trending content from recent days
-- ============================================
CREATE OR REPLACE FUNCTION get_trending_feed(
  p_limit INT DEFAULT 20,
  p_days INT DEFAULT 7
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  feed_type TEXT,
  thumbnail_url TEXT,
  preview_url TEXT,
  likes_count INT,
  dislikes_count INT,
  view_count INT,
  comment_count BIGINT,
  created_at TIMESTAMPTZ,
  created_by UUID,
  estimated_duration INT,
  creator_name TEXT,
  creator_avatar TEXT,
  extra_data JSONB,
  engagement_score BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  cutoff_date TIMESTAMPTZ;
BEGIN
  cutoff_date := NOW() - (p_days || ' days')::INTERVAL;

  RETURN QUERY
  WITH scored AS (
    SELECT
      u.*,
      (COALESCE(u.likes_count, 0) * 2 + COALESCE(u.view_count, 0))::BIGINT as engagement_score
    FROM get_unified_feed(1000, 0, NULL, NULL) u
    WHERE u.created_at >= cutoff_date
  )
  SELECT *
  FROM scored
  ORDER BY engagement_score DESC, created_at DESC
  LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION get_trending_feed TO anon, authenticated;

-- ============================================
-- FUNCTION: get_following_feed
-- Returns content from followed users
-- ============================================
CREATE OR REPLACE FUNCTION get_following_feed(
  p_user_id UUID,
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  feed_type TEXT,
  thumbnail_url TEXT,
  preview_url TEXT,
  likes_count INT,
  dislikes_count INT,
  view_count INT,
  comment_count BIGINT,
  created_at TIMESTAMPTZ,
  created_by UUID,
  estimated_duration INT,
  creator_name TEXT,
  creator_avatar TEXT,
  extra_data JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN QUERY
  WITH following_ids AS (
    SELECT following_id FROM user_follows WHERE follower_id = p_user_id
  )
  SELECT u.*
  FROM get_unified_feed(p_limit, p_offset, NULL, NULL) u
  WHERE u.created_by IN (SELECT following_id FROM following_ids)
  ORDER BY u.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION get_following_feed TO anon, authenticated;

-- ============================================
-- PERFORMANCE INDEXES
-- ============================================

-- Composite indexes for feed queries
CREATE INDEX IF NOT EXISTS idx_stories_public_feed
  ON stories (created_at DESC)
  WHERE is_public = true AND generation_status = 'complete';

CREATE INDEX IF NOT EXISTS idx_stories_user_feed
  ON stories (created_by, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_interactive_public_feed
  ON interactive_content (created_at DESC)
  WHERE is_public = true;

CREATE INDEX IF NOT EXISTS idx_music_public_feed
  ON music_content (created_at DESC)
  WHERE is_public = true;

-- Index for faster comment counts
CREATE INDEX IF NOT EXISTS idx_story_comments_story_id
  ON story_comments (story_id);

-- Index for story nodes lookup
CREATE INDEX IF NOT EXISTS idx_story_nodes_story_nodekey
  ON story_nodes (story_id, node_key);

-- Index for choices lookup
CREATE INDEX IF NOT EXISTS idx_story_choices_from_node
  ON story_choices (from_node_id);

-- Index for user follows
CREATE INDEX IF NOT EXISTS idx_user_follows_follower
  ON user_follows (follower_id);

CREATE INDEX IF NOT EXISTS idx_user_follows_following
  ON user_follows (following_id);

-- Index for reactions
CREATE INDEX IF NOT EXISTS idx_story_reactions_user_story
  ON story_reactions (user_id, story_id);

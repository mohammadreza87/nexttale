-- ============================================
-- INTERACTIVE CONTENT SYSTEM
-- Migration for adding HTML games, tools, widgets, quizzes, visualizations
-- ============================================

-- Content type enum for the platform
DO $$ BEGIN
  CREATE TYPE content_type AS ENUM ('story', 'game', 'tool', 'widget', 'quiz', 'visualization');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Main table for interactive content
CREATE TABLE IF NOT EXISTS interactive_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic metadata
  title text NOT NULL,
  description text NOT NULL,
  content_type content_type NOT NULL DEFAULT 'game',

  -- Cover/preview for the feed
  thumbnail_url text,
  preview_gif_url text,

  -- The generated HTML content
  html_content text NOT NULL,
  html_version integer DEFAULT 1,

  -- Generation metadata
  generation_prompt text NOT NULL,
  generation_model text DEFAULT 'claude-sonnet-4-20250514',
  generation_tokens_used integer,

  -- User/ownership
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  is_public boolean DEFAULT false,

  -- Social metrics
  likes_count integer DEFAULT 0,
  dislikes_count integer DEFAULT 0,
  view_count integer DEFAULT 0,
  share_count integer DEFAULT 0,
  comment_count integer DEFAULT 0,

  -- Categorization
  tags text[] DEFAULT '{}',
  category text,

  -- Timing
  estimated_interaction_time integer DEFAULT 5,

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE interactive_content ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Interactive content is publicly readable when public"
  ON interactive_content FOR SELECT
  USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Users can create their own interactive content"
  ON interactive_content FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own interactive content"
  ON interactive_content FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own interactive content"
  ON interactive_content FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Service role policy for edge functions
CREATE POLICY "Service role full access to interactive_content"
  ON interactive_content
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_interactive_content_created_by ON interactive_content(created_by);
CREATE INDEX IF NOT EXISTS idx_interactive_content_type ON interactive_content(content_type);
CREATE INDEX IF NOT EXISTS idx_interactive_content_public ON interactive_content(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_interactive_content_created_at ON interactive_content(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_interactive_content_likes ON interactive_content(likes_count DESC);

-- ============================================
-- REACTIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS interactive_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content_id uuid REFERENCES interactive_content(id) ON DELETE CASCADE NOT NULL,
  reaction_type text NOT NULL CHECK (reaction_type IN ('like', 'dislike')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, content_id)
);

ALTER TABLE interactive_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read all interactive reactions"
  ON interactive_reactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create their own interactive reactions"
  ON interactive_reactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own interactive reactions"
  ON interactive_reactions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own interactive reactions"
  ON interactive_reactions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Index for reactions
CREATE INDEX IF NOT EXISTS idx_interactive_reactions_content ON interactive_reactions(content_id);
CREATE INDEX IF NOT EXISTS idx_interactive_reactions_user ON interactive_reactions(user_id);

-- Trigger for reaction counts
CREATE OR REPLACE FUNCTION update_interactive_reaction_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    IF NEW.reaction_type = 'like' THEN
      UPDATE interactive_content SET likes_count = likes_count + 1 WHERE id = NEW.content_id;
    ELSIF NEW.reaction_type = 'dislike' THEN
      UPDATE interactive_content SET dislikes_count = dislikes_count + 1 WHERE id = NEW.content_id;
    END IF;
    RETURN NEW;
  END IF;

  IF (TG_OP = 'UPDATE') THEN
    IF OLD.reaction_type = 'like' THEN
      UPDATE interactive_content SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.content_id;
    ELSIF OLD.reaction_type = 'dislike' THEN
      UPDATE interactive_content SET dislikes_count = GREATEST(dislikes_count - 1, 0) WHERE id = OLD.content_id;
    END IF;
    IF NEW.reaction_type = 'like' THEN
      UPDATE interactive_content SET likes_count = likes_count + 1 WHERE id = NEW.content_id;
    ELSIF NEW.reaction_type = 'dislike' THEN
      UPDATE interactive_content SET dislikes_count = dislikes_count + 1 WHERE id = NEW.content_id;
    END IF;
    RETURN NEW;
  END IF;

  IF (TG_OP = 'DELETE') THEN
    IF OLD.reaction_type = 'like' THEN
      UPDATE interactive_content SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.content_id;
    ELSIF OLD.reaction_type = 'dislike' THEN
      UPDATE interactive_content SET dislikes_count = GREATEST(dislikes_count - 1, 0) WHERE id = OLD.content_id;
    END IF;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS interactive_reactions_count_trigger ON interactive_reactions;
CREATE TRIGGER interactive_reactions_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON interactive_reactions
  FOR EACH ROW
  EXECUTE FUNCTION update_interactive_reaction_counts();

-- ============================================
-- COMMENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS interactive_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid NOT NULL REFERENCES interactive_content(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE interactive_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read comments on public interactive content"
  ON interactive_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM interactive_content
      WHERE interactive_content.id = interactive_comments.content_id
      AND (interactive_content.is_public = true OR interactive_content.created_by = auth.uid())
    )
  );

CREATE POLICY "Authenticated users can create interactive comments"
  ON interactive_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own interactive comments"
  ON interactive_comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own interactive comments"
  ON interactive_comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes for comments
CREATE INDEX IF NOT EXISTS idx_interactive_comments_content ON interactive_comments(content_id);
CREATE INDEX IF NOT EXISTS idx_interactive_comments_user ON interactive_comments(user_id);

-- Trigger for comment counts
CREATE OR REPLACE FUNCTION update_interactive_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE interactive_content SET comment_count = comment_count + 1 WHERE id = NEW.content_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE interactive_content SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = OLD.content_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS interactive_comments_count_trigger ON interactive_comments;
CREATE TRIGGER interactive_comments_count_trigger
  AFTER INSERT OR DELETE ON interactive_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_interactive_comment_count();

-- ============================================
-- VIEW TRACKING TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS interactive_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid REFERENCES interactive_content(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id text,
  viewed_at timestamptz DEFAULT now(),
  duration_seconds integer DEFAULT 0
);

ALTER TABLE interactive_views ENABLE ROW LEVEL SECURITY;

-- Anyone can insert views (for anonymous tracking)
CREATE POLICY "Anyone can insert interactive views"
  ON interactive_views FOR INSERT
  WITH CHECK (true);

-- Only service role can read views
CREATE POLICY "Service role can read interactive views"
  ON interactive_views FOR SELECT
  TO service_role
  USING (true);

CREATE INDEX IF NOT EXISTS idx_interactive_views_content ON interactive_views(content_id);

-- Trigger for view counts
CREATE OR REPLACE FUNCTION increment_interactive_view_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE interactive_content
  SET view_count = view_count + 1
  WHERE id = NEW.content_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS interactive_view_trigger ON interactive_views;
CREATE TRIGGER interactive_view_trigger
  AFTER INSERT ON interactive_views
  FOR EACH ROW
  EXECUTE FUNCTION increment_interactive_view_count();

-- ============================================
-- USER PROFILE UPDATES
-- ============================================

-- Add interactive content generation tracking to user_profiles
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS interactive_generated_today integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_interactive_generated integer DEFAULT 0;

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION update_interactive_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS interactive_content_updated_at ON interactive_content;
CREATE TRIGGER interactive_content_updated_at
  BEFORE UPDATE ON interactive_content
  FOR EACH ROW
  EXECUTE FUNCTION update_interactive_updated_at();

DROP TRIGGER IF EXISTS interactive_comments_updated_at ON interactive_comments;
CREATE TRIGGER interactive_comments_updated_at
  BEFORE UPDATE ON interactive_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_interactive_updated_at();

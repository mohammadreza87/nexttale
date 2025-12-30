/*
  # Add Music Creation System

  New tables for voice cloning and AI-generated music

  1. voice_clones - Store user's cloned voices
  2. music_content - Store generated songs/music
  3. music_reactions - Likes/dislikes for music
*/

-- Voice Clones table
CREATE TABLE IF NOT EXISTS voice_clones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  voice_id TEXT NOT NULL, -- ElevenLabs voice ID
  description TEXT,
  sample_url TEXT, -- URL to the voice sample used
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Music Content table
CREATE TABLE IF NOT EXISTS music_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  lyrics TEXT,
  audio_url TEXT NOT NULL,
  duration INTEGER, -- Duration in seconds
  genre TEXT,
  mood TEXT,
  voice_clone_id UUID REFERENCES voice_clones(id) ON DELETE SET NULL,
  generation_prompt TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_public BOOLEAN DEFAULT true,
  likes_count INTEGER DEFAULT 0,
  dislikes_count INTEGER DEFAULT 0,
  play_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Music Reactions table
CREATE TABLE IF NOT EXISTS music_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  music_id UUID NOT NULL REFERENCES music_content(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'dislike')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, music_id)
);

-- Music Comments table
CREATE TABLE IF NOT EXISTS music_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  music_id UUID NOT NULL REFERENCES music_content(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE voice_clones ENABLE ROW LEVEL SECURITY;
ALTER TABLE music_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE music_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE music_comments ENABLE ROW LEVEL SECURITY;

-- Voice Clones policies
CREATE POLICY "Users can view their own voice clones"
  ON voice_clones FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own voice clones"
  ON voice_clones FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own voice clones"
  ON voice_clones FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own voice clones"
  ON voice_clones FOR DELETE
  USING (auth.uid() = user_id);

-- Music Content policies
CREATE POLICY "Anyone can view public music"
  ON music_content FOR SELECT
  USING (is_public = true OR auth.uid() = created_by);

CREATE POLICY "Authenticated users can create music"
  ON music_content FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own music"
  ON music_content FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own music"
  ON music_content FOR DELETE
  USING (auth.uid() = created_by);

-- Music Reactions policies
CREATE POLICY "Anyone can view reactions"
  ON music_reactions FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can add reactions"
  ON music_reactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reactions"
  ON music_reactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reactions"
  ON music_reactions FOR DELETE
  USING (auth.uid() = user_id);

-- Music Comments policies
CREATE POLICY "Anyone can view comments"
  ON music_comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can add comments"
  ON music_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
  ON music_comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON music_comments FOR DELETE
  USING (auth.uid() = user_id);

-- Triggers for reaction counts
CREATE OR REPLACE FUNCTION update_music_reaction_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.reaction_type = 'like' THEN
      UPDATE music_content SET likes_count = likes_count + 1 WHERE id = NEW.music_id;
    ELSE
      UPDATE music_content SET dislikes_count = dislikes_count + 1 WHERE id = NEW.music_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.reaction_type = 'like' THEN
      UPDATE music_content SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.music_id;
    ELSE
      UPDATE music_content SET dislikes_count = GREATEST(0, dislikes_count - 1) WHERE id = OLD.music_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.reaction_type = 'like' AND NEW.reaction_type = 'dislike' THEN
      UPDATE music_content SET likes_count = GREATEST(0, likes_count - 1), dislikes_count = dislikes_count + 1 WHERE id = NEW.music_id;
    ELSIF OLD.reaction_type = 'dislike' AND NEW.reaction_type = 'like' THEN
      UPDATE music_content SET dislikes_count = GREATEST(0, dislikes_count - 1), likes_count = likes_count + 1 WHERE id = NEW.music_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER music_reaction_counts_trigger
  AFTER INSERT OR UPDATE OR DELETE ON music_reactions
  FOR EACH ROW EXECUTE FUNCTION update_music_reaction_counts();

-- Add music_generated_today to user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS music_generated_today INTEGER DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS total_music_generated INTEGER DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS voice_clones_count INTEGER DEFAULT 0;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_music_content_created_by ON music_content(created_by);
CREATE INDEX IF NOT EXISTS idx_music_content_is_public ON music_content(is_public);
CREATE INDEX IF NOT EXISTS idx_music_content_created_at ON music_content(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_voice_clones_user_id ON voice_clones(user_id);

-- Add cover_video_url column to stories table
ALTER TABLE stories ADD COLUMN IF NOT EXISTS cover_video_url TEXT;

-- Add video_url column to story_nodes table (if not already added)
ALTER TABLE story_nodes ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Add video_enabled column to stories table (if not already added)
ALTER TABLE stories ADD COLUMN IF NOT EXISTS video_enabled BOOLEAN DEFAULT false;

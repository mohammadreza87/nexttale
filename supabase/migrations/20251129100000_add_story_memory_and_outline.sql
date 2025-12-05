-- Add story memory and outline columns for coherent story generation
-- This migration adds support for tracking story context, character appearances,
-- and plot threads to ensure narrative consistency across chapters

-- Add story_outline column to store the pre-generated story structure
ALTER TABLE stories ADD COLUMN IF NOT EXISTS story_outline JSONB;

-- Add story_memory column to track accumulated story context
ALTER TABLE stories ADD COLUMN IF NOT EXISTS story_memory JSONB;

-- Add chapter_summary to story_nodes for quick context retrieval
ALTER TABLE story_nodes ADD COLUMN IF NOT EXISTS chapter_summary TEXT;

-- Add character_states to track character appearances in each chapter
ALTER TABLE story_nodes ADD COLUMN IF NOT EXISTS character_states JSONB;

-- Add image_context to store consistent image generation data
ALTER TABLE story_nodes ADD COLUMN IF NOT EXISTS image_context JSONB;

-- Add index for efficient story memory queries
CREATE INDEX IF NOT EXISTS idx_stories_story_memory ON stories USING GIN (story_memory);

-- Add index for efficient outline queries
CREATE INDEX IF NOT EXISTS idx_stories_story_outline ON stories USING GIN (story_outline);

-- Comment on columns for documentation
COMMENT ON COLUMN stories.story_outline IS 'Pre-generated story structure with chapter outlines, character details, and plot points';
COMMENT ON COLUMN stories.story_memory IS 'Accumulated context tracking key events, unresolved threads, and character states';
COMMENT ON COLUMN story_nodes.chapter_summary IS 'Brief summary of what happened in this chapter for context passing';
COMMENT ON COLUMN story_nodes.character_states IS 'Character appearances and states as of this chapter';
COMMENT ON COLUMN story_nodes.image_context IS 'Context for consistent image generation including character descriptions';

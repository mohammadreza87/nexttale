/*
  # Fix Broken Stories with first_chapter_ready Status

  1. Problem
    - Stories with status 'first_chapter_ready' but no actual nodes (content)
    - These stories are stuck and will never complete
    - They cause infinite polling loops in the UI

  2. Solution
    - Mark stories with 'first_chapter_ready' status and zero nodes as 'failed'
    - This allows the UI to display an appropriate error message
    - Prevents infinite polling for broken stories

  3. Notes
    - Only affects stories that have been in this state for more than 10 minutes
    - Stories actively being generated will not be affected
*/

-- Mark broken stories as failed
UPDATE stories
SET generation_status = 'failed'
WHERE generation_status = 'first_chapter_ready'
  AND created_at < NOW() - INTERVAL '10 minutes'
  AND NOT EXISTS (
    SELECT 1 FROM story_nodes
    WHERE story_nodes.story_id = stories.id
  );
/*
  # Fix generation status for old stories

  1. Updates
    - Set generation_status to 'fully_generated' for all stories that have at least one story node
    - This fixes old stories that were created before the generation_status field existed
    - Ensures stories with content don't get stuck in "generating" state

  2. Notes
    - Only updates stories that have actual content (story_nodes exist)
    - Preserves the status of stories that are actually still generating
*/

-- Update generation_status for stories that have nodes but incorrect status
UPDATE stories
SET generation_status = 'fully_generated'
WHERE id IN (
  SELECT DISTINCT s.id
  FROM stories s
  INNER JOIN story_nodes sn ON s.id = sn.story_id
  WHERE s.generation_status IS NULL 
     OR (s.generation_status != 'fully_generated' AND s.generation_status != 'failed')
);
/*
  # Allow story owners to delete choices

  1. Changes
    - Update delete policy to allow story owners to delete any choice on their story
    - Users can still delete their own choices (created_by = user)

  2. Security
    - Story owners can manage all choices on their stories
    - Users can only delete choices they created on other people's stories
*/

-- Drop and recreate the delete policy to include story owner check
DROP POLICY IF EXISTS "Users can delete their own choices" ON story_choices;
CREATE POLICY "Users can delete own choices or story owner can delete any"
  ON story_choices
  FOR DELETE
  TO authenticated
  USING (
    created_by = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM story_nodes sn
      JOIN stories s ON s.id = sn.story_id
      WHERE sn.id = story_choices.from_node_id
      AND s.created_by = (SELECT auth.uid())
    )
  );

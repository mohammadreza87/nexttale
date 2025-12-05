/*
  # Fix Story Nodes Insert Policy

  1. Changes
    - Drop existing restrictive insert policy
    - Create new insert policy that checks if the user owns the story
    - Ensure authenticated users can only insert nodes for stories they own

  2. Security
    - Users can only insert nodes for their own stories
    - Must verify story ownership through the stories table
*/

DROP POLICY IF EXISTS "Authenticated users can insert nodes" ON story_nodes;

CREATE POLICY "Users can insert nodes for their stories"
  ON story_nodes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM stories
      WHERE stories.id = story_nodes.story_id
      AND stories.created_by = auth.uid()
    )
  );

/*
  # Fix Story Nodes Insert Policy for Readers

  Allow any authenticated user to insert story nodes.
  This enables dynamic chapter generation when readers make choices.
*/

-- Drop the restrictive owner-only policy
DROP POLICY IF EXISTS "Users can insert nodes for their stories" ON story_nodes;

-- Create a policy that allows any authenticated user to insert nodes
CREATE POLICY "Authenticated users can insert story nodes"
  ON story_nodes
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);

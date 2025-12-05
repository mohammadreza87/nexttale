/*
  # Add created_by to story_choices

  1. Changes
    - Add `created_by` column to `story_choices` table to track who created each choice
    - This allows users to delete only their own custom choices

  2. Security
    - Add delete policy allowing users to delete only choices they created
*/

-- Add created_by column to story_choices
ALTER TABLE story_choices
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_story_choices_created_by ON story_choices(created_by);

-- Add policy for users to delete their own choices
DROP POLICY IF EXISTS "Users can delete their own choices" ON story_choices;
CREATE POLICY "Users can delete their own choices"
  ON story_choices
  FOR DELETE
  TO authenticated
  USING (created_by = (SELECT auth.uid()));

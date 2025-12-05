/*
  # Add Story Comments System

  1. New Tables
    - `story_comments`
      - `id` (uuid, primary key)
      - `story_id` (uuid, foreign key to stories)
      - `user_id` (uuid, foreign key to auth.users)
      - `content` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `story_comments` table
    - Add policy for authenticated users to create comments
    - Add policy for anyone to read comments on public stories
    - Add policy for users to update/delete their own comments

  3. Indexes
    - Add indexes for better query performance on story_id, user_id, and created_at
*/

-- Create story_comments table
CREATE TABLE IF NOT EXISTS story_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE story_comments ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read comments on public stories
CREATE POLICY "Anyone can read comments on public stories"
  ON story_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stories
      WHERE stories.id = story_comments.story_id
      AND stories.is_public = true
    )
  );

-- Policy: Authenticated users can read comments on their own stories
CREATE POLICY "Users can read comments on own stories"
  ON story_comments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM stories
      WHERE stories.id = story_comments.story_id
      AND stories.created_by = auth.uid()
    )
  );

-- Policy: Authenticated users can create comments
CREATE POLICY "Authenticated users can create comments"
  ON story_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own comments
CREATE POLICY "Users can update own comments"
  ON story_comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own comments
CREATE POLICY "Users can delete own comments"
  ON story_comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_story_comments_story_id ON story_comments(story_id);
CREATE INDEX IF NOT EXISTS idx_story_comments_user_id ON story_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_story_comments_created_at ON story_comments(created_at DESC);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_story_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_story_comments_updated_at
  BEFORE UPDATE ON story_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_story_comments_updated_at();
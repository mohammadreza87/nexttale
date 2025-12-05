/*
  # Add is_public to story_choices

  1. Changes
    - Add `is_public` column to `story_choices` table (default true)
    - This allows users to hide/show their custom choices from other readers

  2. Notes
    - AI-generated choices (created_by = null) are always public
    - User-created choices can be toggled public/private
*/

-- Add is_public column to story_choices
ALTER TABLE story_choices
ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT true;

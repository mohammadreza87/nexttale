/*
  # Add art style to stories

  1. Changes
    - Add `art_style` column to `stories` table
      - Stores the chosen art style for image generation
      - Default value: 'fantasy' for consistent styling
      - Examples: 'fantasy', 'anime', 'realistic', 'cartoon', 'watercolor', 'pixel-art', 'comic-book', 'oil-painting'
  
  2. Purpose
    - Allows users to select a specific art style when creating stories
    - Ensures all images in a story maintain consistent visual style
    - Improves user experience by giving creative control over story aesthetics
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stories' AND column_name = 'art_style'
  ) THEN
    ALTER TABLE stories ADD COLUMN art_style text DEFAULT 'fantasy' NOT NULL;
  END IF;
END $$;
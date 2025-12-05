/*
  # Add narrator toggle to stories

  1. Changes
    - Add `narrator_enabled` column to `stories` table
      - Boolean field to control whether TTS narration is enabled
      - Defaults to true for backward compatibility
  
  2. Notes
    - Existing stories will have narrator enabled by default
    - New stories can toggle this setting during creation
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stories' AND column_name = 'narrator_enabled'
  ) THEN
    ALTER TABLE stories ADD COLUMN narrator_enabled boolean DEFAULT true;
  END IF;
END $$;

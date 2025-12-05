/*
  # Cleanup Unused Indexes and Fix Function Security

  1. Remove Unused Indexes
    - Drop indexes that are not being used to improve write performance
    - Reduces storage overhead and maintenance costs

  2. Fix Function Security
    - Fix search_path for update_story_comments_updated_at function
    - Set to SECURITY DEFINER with explicit search_path

  3. Notes
    - Indexes can always be recreated if needed in the future
    - Function security fix prevents search_path manipulation attacks
*/

-- =====================================================
-- 1. REMOVE UNUSED INDEXES
-- =====================================================

DROP INDEX IF EXISTS idx_generation_queue_user_id;
DROP INDEX IF EXISTS idx_story_reactions_story_id;
DROP INDEX IF EXISTS idx_user_story_progress_current_node_id;
DROP INDEX IF EXISTS idx_user_story_progress_story_id;
DROP INDEX IF EXISTS idx_reading_progress_node_id;
DROP INDEX IF EXISTS idx_user_profiles_stripe_customer;
DROP INDEX IF EXISTS idx_user_profiles_subscription_tier;
DROP INDEX IF EXISTS idx_reading_progress_user;
DROP INDEX IF EXISTS idx_reading_progress_user_story;
DROP INDEX IF EXISTS idx_story_completions_user;
DROP INDEX IF EXISTS idx_user_profiles_points;
DROP INDEX IF EXISTS idx_user_quests_status;
DROP INDEX IF EXISTS idx_user_streaks_updated;
DROP INDEX IF EXISTS idx_story_comments_user_id;
DROP INDEX IF EXISTS idx_story_comments_created_at;

-- =====================================================
-- 2. FIX FUNCTION SEARCH PATH
-- =====================================================

CREATE OR REPLACE FUNCTION update_story_comments_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
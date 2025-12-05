/*
  # Optimize RLS Policies for Performance

  1. RLS Performance Optimization
    - Replace auth.uid() with (select auth.uid()) in all remaining policies
    - This prevents re-evaluation for each row and improves query performance at scale

  2. Function Security
    - Set search_path for functions to prevent security vulnerabilities

  3. Index Cleanup
    - Drop unused indexes to improve write performance and reduce storage

  Note: story_comments policies were already optimized in a previous migration
*/

-- =====================================================
-- 1. Fix story_nodes RLS policies
-- =====================================================

DROP POLICY IF EXISTS "Users can insert nodes for their stories" ON story_nodes;
CREATE POLICY "Users can insert nodes for their stories"
  ON story_nodes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM stories
      WHERE stories.id = story_nodes.story_id
      AND stories.created_by = (select auth.uid())
    )
  );

-- =====================================================
-- 2. Fix user_quests RLS policies
-- =====================================================

DROP POLICY IF EXISTS "Users can view own quests" ON user_quests;
CREATE POLICY "Users can view own quests"
  ON user_quests FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own quests" ON user_quests;
CREATE POLICY "Users can insert own quests"
  ON user_quests FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own quests" ON user_quests;
CREATE POLICY "Users can update own quests"
  ON user_quests FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- =====================================================
-- 3. Fix user_streaks RLS policies
-- =====================================================

DROP POLICY IF EXISTS "Users can view own streaks" ON user_streaks;
CREATE POLICY "Users can view own streaks"
  ON user_streaks FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own streaks" ON user_streaks;
CREATE POLICY "Users can insert own streaks"
  ON user_streaks FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own streaks" ON user_streaks;
CREATE POLICY "Users can update own streaks"
  ON user_streaks FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- =====================================================
-- 4. Fix story_comments RLS policies (update existing)
-- =====================================================

DROP POLICY IF EXISTS "Authenticated users can create comments" ON story_comments;
CREATE POLICY "Authenticated users can create comments"
  ON story_comments FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own comments" ON story_comments;
CREATE POLICY "Users can update own comments"
  ON story_comments FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete own comments" ON story_comments;
CREATE POLICY "Users can delete own comments"
  ON story_comments FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Read comments on public stories or own stories" ON story_comments;
CREATE POLICY "Read comments on public stories or own stories"
  ON story_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stories
      WHERE stories.id = story_comments.story_id
      AND (stories.is_public = true OR stories.created_by = (select auth.uid()))
    )
  );

-- =====================================================
-- 5. Fix function search_path security
-- =====================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'update_story_comments_updated_at'
  ) THEN
    ALTER FUNCTION update_story_comments_updated_at() SET search_path = '';
  END IF;
END $$;

-- =====================================================
-- 6. Drop unused indexes to improve performance
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
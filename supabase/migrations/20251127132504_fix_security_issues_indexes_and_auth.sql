/*
  # Fix Security Issues - Indexes and Auth Configuration

  ## Changes Made
  
  1. Performance Indexes
     - Add indexes for all unindexed foreign keys to improve query performance
     - generation_queue.user_id
     - reading_progress.node_id
     - story_comments.user_id
     - story_reactions.story_id
     - user_story_progress.current_node_id
     - user_story_progress.story_id
  
  2. Function Security
     - Fix search_path mutability for auto_upgrade_pro_users function
     - Set explicit search_path to prevent potential security issues
*/

-- Add missing foreign key indexes for performance
CREATE INDEX IF NOT EXISTS idx_generation_queue_user_id ON generation_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_progress_node_id ON reading_progress(node_id);
CREATE INDEX IF NOT EXISTS idx_story_comments_user_id ON story_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_story_reactions_story_id ON story_reactions(story_id);
CREATE INDEX IF NOT EXISTS idx_user_story_progress_current_node_id ON user_story_progress(current_node_id);
CREATE INDEX IF NOT EXISTS idx_user_story_progress_story_id ON user_story_progress(story_id);

-- Fix function security by setting immutable search_path
CREATE OR REPLACE FUNCTION auto_upgrade_pro_users()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM auto_pro_emails WHERE email = NEW.email) THEN
    UPDATE user_profiles
    SET 
      subscription_tier = 'pro',
      subscription_status = 'active',
      is_grandfathered = true
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
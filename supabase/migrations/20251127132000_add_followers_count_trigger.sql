/*
  # Add Followers/Following Count Tracking

  1. Add columns to user_profiles if they don't exist
  2. Create trigger function to update counts on follow/unfollow
  3. Initialize counts from existing data
*/

-- Add columns if they don't exist
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS followers_count integer DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS following_count integer DEFAULT 0;

-- Create trigger function to update follower/following counts
CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment followers_count for the user being followed
    UPDATE user_profiles
    SET followers_count = COALESCE(followers_count, 0) + 1
    WHERE id = NEW.following_id;

    -- Increment following_count for the follower
    UPDATE user_profiles
    SET following_count = COALESCE(following_count, 0) + 1
    WHERE id = NEW.follower_id;

    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement followers_count for the user being unfollowed
    UPDATE user_profiles
    SET followers_count = GREATEST(COALESCE(followers_count, 0) - 1, 0)
    WHERE id = OLD.following_id;

    -- Decrement following_count for the unfollower
    UPDATE user_profiles
    SET following_count = GREATEST(COALESCE(following_count, 0) - 1, 0)
    WHERE id = OLD.follower_id;

    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_follow_change ON user_follows;

-- Create trigger
CREATE TRIGGER on_follow_change
  AFTER INSERT OR DELETE ON user_follows
  FOR EACH ROW
  EXECUTE FUNCTION update_follow_counts();

-- Initialize counts from existing data
UPDATE user_profiles up
SET followers_count = (
  SELECT COUNT(*) FROM user_follows WHERE following_id = up.id
);

UPDATE user_profiles up
SET following_count = (
  SELECT COUNT(*) FROM user_follows WHERE follower_id = up.id
);

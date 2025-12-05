/*
  # Add foreign key from story_comments to user_profiles

  This allows PostgREST to join story_comments with user_profiles
  to fetch commenter display names.
*/

-- Add foreign key constraint from story_comments.user_id to user_profiles.id
ALTER TABLE story_comments
ADD CONSTRAINT story_comments_user_id_fkey_profiles
FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

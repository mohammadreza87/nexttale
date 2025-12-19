-- Add subscription_plan column to differentiate Basic/Pro/Max tiers
-- This works alongside subscription_tier ('free'|'pro') for backward compatibility

-- Add the subscription_plan column
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT NULL;

-- Add check constraint to ensure valid values
ALTER TABLE user_profiles
ADD CONSTRAINT valid_subscription_plan
CHECK (subscription_plan IS NULL OR subscription_plan IN ('basic', 'pro', 'max'));

-- Add comment for documentation
COMMENT ON COLUMN user_profiles.subscription_plan IS 'Differentiates paid tiers: basic, pro, max. NULL for free users.';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_plan
ON user_profiles(subscription_plan)
WHERE subscription_plan IS NOT NULL;

-- Update existing pro users to 'pro' plan (they were on the old single pro tier)
UPDATE user_profiles
SET subscription_plan = 'pro'
WHERE subscription_tier = 'pro'
  AND subscription_plan IS NULL
  AND is_grandfathered = false;

-- Grandfathered users get 'max' plan (they're legacy VIP users)
UPDATE user_profiles
SET subscription_plan = 'max'
WHERE is_grandfathered = true
  AND subscription_plan IS NULL;

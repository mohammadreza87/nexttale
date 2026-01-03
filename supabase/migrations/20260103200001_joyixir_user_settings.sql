-- Joyixir User Settings Table
-- Stores user preferences and profile settings

CREATE TABLE IF NOT EXISTS joyixir_user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,

  -- Profile settings
  username TEXT,
  display_name TEXT,
  bio TEXT,
  location TEXT,
  website_url TEXT,
  hide_profile_picture BOOLEAN DEFAULT FALSE,

  -- Studio settings
  studio_name TEXT DEFAULT 'My Studio',
  studio_description TEXT,

  -- Preferences
  chat_suggestions BOOLEAN DEFAULT TRUE,
  generation_sound TEXT DEFAULT 'first' CHECK (generation_sound IN ('first', 'always', 'never')),

  -- Labs/experimental features
  labs_github_branch_switching BOOLEAN DEFAULT FALSE,

  -- Connected accounts (stored as JSON for flexibility)
  connected_accounts JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on user_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_joyixir_user_settings_user_id ON joyixir_user_settings(user_id);

-- Enable RLS
ALTER TABLE joyixir_user_settings ENABLE ROW LEVEL SECURITY;

-- Users can only see their own settings
DROP POLICY IF EXISTS "Users can view own settings" ON joyixir_user_settings;
CREATE POLICY "Users can view own settings"
  ON joyixir_user_settings FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own settings
DROP POLICY IF EXISTS "Users can insert own settings" ON joyixir_user_settings;
CREATE POLICY "Users can insert own settings"
  ON joyixir_user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own settings
DROP POLICY IF EXISTS "Users can update own settings" ON joyixir_user_settings;
CREATE POLICY "Users can update own settings"
  ON joyixir_user_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own settings
DROP POLICY IF EXISTS "Users can delete own settings" ON joyixir_user_settings;
CREATE POLICY "Users can delete own settings"
  ON joyixir_user_settings FOR DELETE
  USING (auth.uid() = user_id);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_joyixir_user_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on changes
DROP TRIGGER IF EXISTS trigger_update_joyixir_user_settings_updated_at ON joyixir_user_settings;
CREATE TRIGGER trigger_update_joyixir_user_settings_updated_at
  BEFORE UPDATE ON joyixir_user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_joyixir_user_settings_updated_at();

-- Function to auto-create settings for new users
CREATE OR REPLACE FUNCTION create_joyixir_user_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO joyixir_user_settings (user_id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create settings when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created_joyixir ON auth.users;
CREATE TRIGGER on_auth_user_created_joyixir
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_joyixir_user_settings();

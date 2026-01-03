-- Joyixir Projects table
-- Each user can have multiple game projects

CREATE TABLE IF NOT EXISTS joyixir_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Project info
  name TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,

  -- Project state
  has_three_js BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'building', 'ready', 'published')),

  -- Files stored as JSON (for persistence between sessions)
  -- Structure: { "/src/app/page.tsx": "content...", ... }
  files JSONB DEFAULT '{}',

  -- Conversation history for AI context
  conversation JSONB DEFAULT '[]',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_opened_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster user queries
CREATE INDEX IF NOT EXISTS idx_joyixir_projects_user_id ON joyixir_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_joyixir_projects_updated_at ON joyixir_projects(updated_at DESC);

-- RLS policies
ALTER TABLE joyixir_projects ENABLE ROW LEVEL SECURITY;

-- Users can only see their own projects
DROP POLICY IF EXISTS "Users can view own projects" ON joyixir_projects;
CREATE POLICY "Users can view own projects"
  ON joyixir_projects FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own projects
DROP POLICY IF EXISTS "Users can create own projects" ON joyixir_projects;
CREATE POLICY "Users can create own projects"
  ON joyixir_projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own projects
DROP POLICY IF EXISTS "Users can update own projects" ON joyixir_projects;
CREATE POLICY "Users can update own projects"
  ON joyixir_projects FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own projects
DROP POLICY IF EXISTS "Users can delete own projects" ON joyixir_projects;
CREATE POLICY "Users can delete own projects"
  ON joyixir_projects FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_joyixir_project_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_joyixir_project_updated_at ON joyixir_projects;
CREATE TRIGGER trigger_joyixir_project_updated_at
  BEFORE UPDATE ON joyixir_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_joyixir_project_updated_at();

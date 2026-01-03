-- Joyixir Chat Sessions table
-- Each project can have multiple chat sessions (conversation history)

CREATE TABLE IF NOT EXISTS joyixir_chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES joyixir_projects(id) ON DELETE CASCADE,

  -- Session info
  title TEXT NOT NULL,

  -- Messages stored as JSON array
  -- Structure: [{ "role": "user"|"assistant"|"system", "content": "..." }, ...]
  messages JSONB DEFAULT '[]',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster project queries
CREATE INDEX IF NOT EXISTS idx_joyixir_chat_sessions_project_id ON joyixir_chat_sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_joyixir_chat_sessions_updated_at ON joyixir_chat_sessions(updated_at DESC);

-- RLS policies
ALTER TABLE joyixir_chat_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only see chat sessions for their own projects
DROP POLICY IF EXISTS "Users can view own project chat sessions" ON joyixir_chat_sessions;
CREATE POLICY "Users can view own project chat sessions"
  ON joyixir_chat_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM joyixir_projects
      WHERE joyixir_projects.id = joyixir_chat_sessions.project_id
      AND joyixir_projects.user_id = auth.uid()
    )
  );

-- Users can create chat sessions for their own projects
DROP POLICY IF EXISTS "Users can create own project chat sessions" ON joyixir_chat_sessions;
CREATE POLICY "Users can create own project chat sessions"
  ON joyixir_chat_sessions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM joyixir_projects
      WHERE joyixir_projects.id = joyixir_chat_sessions.project_id
      AND joyixir_projects.user_id = auth.uid()
    )
  );

-- Users can update chat sessions for their own projects
DROP POLICY IF EXISTS "Users can update own project chat sessions" ON joyixir_chat_sessions;
CREATE POLICY "Users can update own project chat sessions"
  ON joyixir_chat_sessions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM joyixir_projects
      WHERE joyixir_projects.id = joyixir_chat_sessions.project_id
      AND joyixir_projects.user_id = auth.uid()
    )
  );

-- Users can delete chat sessions for their own projects
DROP POLICY IF EXISTS "Users can delete own project chat sessions" ON joyixir_chat_sessions;
CREATE POLICY "Users can delete own project chat sessions"
  ON joyixir_chat_sessions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM joyixir_projects
      WHERE joyixir_projects.id = joyixir_chat_sessions.project_id
      AND joyixir_projects.user_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_joyixir_chat_session_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_joyixir_chat_session_updated_at ON joyixir_chat_sessions;
CREATE TRIGGER trigger_joyixir_chat_session_updated_at
  BEFORE UPDATE ON joyixir_chat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_joyixir_chat_session_updated_at();

-- Add active_chat_session_id to joyixir_projects
ALTER TABLE joyixir_projects
ADD COLUMN IF NOT EXISTS active_chat_session_id UUID REFERENCES joyixir_chat_sessions(id) ON DELETE SET NULL;

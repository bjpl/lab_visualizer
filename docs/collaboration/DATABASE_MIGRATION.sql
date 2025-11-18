-- Collaboration System Database Migration
-- LAB Visualization Platform
-- Version: 1.0.0

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================================
-- TABLES
-- ================================================================

-- Collaboration sessions
CREATE TABLE IF NOT EXISTS collaboration_sessions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  structure_id TEXT,
  invite_code TEXT UNIQUE NOT NULL,
  settings JSONB DEFAULT '{
    "allowAnnotations": true,
    "allowCameraControl": true,
    "requireApproval": false,
    "maxUsers": 10,
    "cameraFollowMode": false
  }'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,

  CONSTRAINT valid_invite_code CHECK (char_length(invite_code) = 8),
  CONSTRAINT valid_expiration CHECK (expires_at > created_at)
);

-- Session users (tracks who's in which session)
CREATE TABLE IF NOT EXISTS session_users (
  session_id TEXT REFERENCES collaboration_sessions(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_email TEXT,
  role TEXT NOT NULL CHECK (role IN ('owner', 'presenter', 'viewer')),
  color TEXT NOT NULL DEFAULT '#FF6B6B',
  avatar TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'idle', 'offline')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  PRIMARY KEY (session_id, user_id)
);

-- Annotations (persistent storage for annotations)
CREATE TABLE IF NOT EXISTS annotations (
  id TEXT PRIMARY KEY,
  session_id TEXT REFERENCES collaboration_sessions(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  content TEXT NOT NULL,
  position JSONB NOT NULL, -- {x, y, z}
  target JSONB, -- {type, id, label}
  color TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_position CHECK (
    jsonb_typeof(position) = 'object' AND
    position ? 'x' AND
    position ? 'y' AND
    position ? 'z'
  )
);

-- Activity log (session events)
CREATE TABLE IF NOT EXISTS session_activities (
  id TEXT PRIMARY KEY,
  session_id TEXT REFERENCES collaboration_sessions(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'user-join',
    'user-leave',
    'structure-change',
    'annotation-add',
    'annotation-edit',
    'annotation-delete',
    'camera-move',
    'simulation-start',
    'simulation-stop',
    'role-change',
    'session-created'
  )),
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Camera states (for playback/history)
CREATE TABLE IF NOT EXISTS camera_states (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT REFERENCES collaboration_sessions(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  position JSONB NOT NULL, -- [x, y, z]
  target JSONB NOT NULL, -- [x, y, z]
  zoom NUMERIC NOT NULL,
  rotation JSONB NOT NULL, -- [x, y, z]
  fov NUMERIC,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- INDEXES
-- ================================================================

-- Sessions
CREATE INDEX IF NOT EXISTS idx_sessions_active ON collaboration_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_sessions_invite ON collaboration_sessions(invite_code);
CREATE INDEX IF NOT EXISTS idx_sessions_owner ON collaboration_sessions(owner_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON collaboration_sessions(expires_at);

-- Session users
CREATE INDEX IF NOT EXISTS idx_session_users_user ON session_users(user_id);
CREATE INDEX IF NOT EXISTS idx_session_users_status ON session_users(status);

-- Annotations
CREATE INDEX IF NOT EXISTS idx_annotations_session ON annotations(session_id);
CREATE INDEX IF NOT EXISTS idx_annotations_user ON annotations(user_id);
CREATE INDEX IF NOT EXISTS idx_annotations_pinned ON annotations(is_pinned);

-- Activities
CREATE INDEX IF NOT EXISTS idx_activities_session ON session_activities(session_id);
CREATE INDEX IF NOT EXISTS idx_activities_type ON session_activities(type);
CREATE INDEX IF NOT EXISTS idx_activities_timestamp ON session_activities(timestamp);

-- Camera states
CREATE INDEX IF NOT EXISTS idx_camera_session ON camera_states(session_id);
CREATE INDEX IF NOT EXISTS idx_camera_timestamp ON camera_states(timestamp);

-- ================================================================
-- FUNCTIONS
-- ================================================================

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  UPDATE collaboration_sessions
  SET is_active = false
  WHERE expires_at < NOW() AND is_active = true;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- TRIGGERS
-- ================================================================

-- Auto-update timestamps
CREATE TRIGGER update_sessions_timestamp
  BEFORE UPDATE ON collaboration_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_session_users_timestamp
  BEFORE UPDATE ON session_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_annotations_timestamp
  BEFORE UPDATE ON annotations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ================================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================================

-- Enable RLS
ALTER TABLE collaboration_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE camera_states ENABLE ROW LEVEL SECURITY;

-- Sessions: Users can read active sessions they're part of
CREATE POLICY sessions_read ON collaboration_sessions
  FOR SELECT
  USING (
    is_active = true AND (
      owner_id = auth.uid()::text OR
      id IN (SELECT session_id FROM session_users WHERE user_id = auth.uid()::text)
    )
  );

-- Sessions: Only owners can update
CREATE POLICY sessions_update ON collaboration_sessions
  FOR UPDATE
  USING (owner_id = auth.uid()::text);

-- Sessions: Only owners can delete
CREATE POLICY sessions_delete ON collaboration_sessions
  FOR DELETE
  USING (owner_id = auth.uid()::text);

-- Session users: Read if in session
CREATE POLICY session_users_read ON session_users
  FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM collaboration_sessions WHERE is_active = true
    ) AND (
      user_id = auth.uid()::text OR
      session_id IN (SELECT session_id FROM session_users WHERE user_id = auth.uid()::text)
    )
  );

-- Annotations: Read if in session
CREATE POLICY annotations_read ON annotations
  FOR SELECT
  USING (
    session_id IN (
      SELECT session_id FROM session_users WHERE user_id = auth.uid()::text
    )
  );

-- Annotations: Update/delete own only
CREATE POLICY annotations_update ON annotations
  FOR UPDATE
  USING (user_id = auth.uid()::text);

CREATE POLICY annotations_delete ON annotations
  FOR DELETE
  USING (user_id = auth.uid()::text);

-- Activities: Read if in session
CREATE POLICY activities_read ON session_activities
  FOR SELECT
  USING (
    session_id IN (
      SELECT session_id FROM session_users WHERE user_id = auth.uid()::text
    )
  );

-- Camera states: Read if in session
CREATE POLICY camera_read ON camera_states
  FOR SELECT
  USING (
    session_id IN (
      SELECT session_id FROM session_users WHERE user_id = auth.uid()::text
    )
  );

-- ================================================================
-- REALTIME PUBLICATION
-- ================================================================

-- Enable realtime for all collaboration tables
ALTER PUBLICATION supabase_realtime ADD TABLE collaboration_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE session_users;
ALTER PUBLICATION supabase_realtime ADD TABLE annotations;
ALTER PUBLICATION supabase_realtime ADD TABLE session_activities;
ALTER PUBLICATION supabase_realtime ADD TABLE camera_states;

-- ================================================================
-- SCHEDULED JOBS (requires pg_cron extension)
-- ================================================================

-- Clean up expired sessions every hour
-- SELECT cron.schedule(
--   'cleanup-expired-sessions',
--   '0 * * * *',
--   $$ SELECT cleanup_expired_sessions(); $$
-- );

-- ================================================================
-- INITIAL DATA / SEED
-- ================================================================

-- None required for production

-- ================================================================
-- ROLLBACK
-- ================================================================

-- To rollback this migration, run:
/*
DROP TABLE IF EXISTS camera_states CASCADE;
DROP TABLE IF EXISTS session_activities CASCADE;
DROP TABLE IF EXISTS annotations CASCADE;
DROP TABLE IF EXISTS session_users CASCADE;
DROP TABLE IF EXISTS collaboration_sessions CASCADE;
DROP FUNCTION IF EXISTS update_updated_at() CASCADE;
DROP FUNCTION IF EXISTS cleanup_expired_sessions() CASCADE;
*/

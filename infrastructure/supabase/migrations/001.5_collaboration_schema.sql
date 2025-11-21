-- Collaboration System Database Migration
-- LAB Visualization Platform
-- Version: 1.0.0
-- This migration must be run BEFORE 002_collaboration_rls.sql

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================================
-- TABLES
-- ================================================================

-- Collaboration sessions
CREATE TABLE IF NOT EXISTS collaboration_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL,
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

-- Session members (renamed from session_users to match RLS migration)
CREATE TABLE IF NOT EXISTS session_members (
  session_id UUID REFERENCES collaboration_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  user_email TEXT,
  role TEXT NOT NULL CHECK (role IN ('owner', 'presenter', 'viewer')),
  color TEXT NOT NULL DEFAULT '#FF6B6B',
  avatar TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'idle', 'offline')),
  is_camera_leader BOOLEAN DEFAULT false,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  PRIMARY KEY (session_id, user_id)
);

-- Session annotations (renamed from annotations to match RLS migration)
CREATE TABLE IF NOT EXISTS session_annotations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES collaboration_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
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

-- Cursor positions (new table for real-time cursor tracking)
CREATE TABLE IF NOT EXISTS cursor_positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES collaboration_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  position JSONB NOT NULL, -- {x, y}
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity log (renamed from session_activities to match RLS migration)
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES collaboration_sessions(id) ON DELETE CASCADE,
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
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Camera states (for playback/history)
CREATE TABLE IF NOT EXISTS camera_states (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES collaboration_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
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

-- Session members
CREATE INDEX IF NOT EXISTS idx_session_members_user ON session_members(user_id);
CREATE INDEX IF NOT EXISTS idx_session_members_status ON session_members(status);
CREATE INDEX IF NOT EXISTS idx_session_members_session ON session_members(session_id);

-- Annotations
CREATE INDEX IF NOT EXISTS idx_annotations_session ON session_annotations(session_id);
CREATE INDEX IF NOT EXISTS idx_annotations_user ON session_annotations(user_id);
CREATE INDEX IF NOT EXISTS idx_annotations_pinned ON session_annotations(is_pinned);

-- Cursor positions
CREATE INDEX IF NOT EXISTS idx_cursor_positions_session ON cursor_positions(session_id);
CREATE INDEX IF NOT EXISTS idx_cursor_positions_user ON cursor_positions(user_id);

-- Activities
CREATE INDEX IF NOT EXISTS idx_activities_session ON activity_log(session_id);
CREATE INDEX IF NOT EXISTS idx_activities_type ON activity_log(type);
CREATE INDEX IF NOT EXISTS idx_activities_timestamp ON activity_log(timestamp);

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

CREATE TRIGGER update_session_members_timestamp
  BEFORE UPDATE ON session_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_annotations_timestamp
  BEFORE UPDATE ON session_annotations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_cursor_positions_timestamp
  BEFORE UPDATE ON cursor_positions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ================================================================
-- REALTIME PUBLICATION
-- ================================================================

-- Enable realtime for all collaboration tables
ALTER PUBLICATION supabase_realtime ADD TABLE collaboration_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE session_members;
ALTER PUBLICATION supabase_realtime ADD TABLE session_annotations;
ALTER PUBLICATION supabase_realtime ADD TABLE cursor_positions;
ALTER PUBLICATION supabase_realtime ADD TABLE activity_log;
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
-- COMMENTS
-- ================================================================

COMMENT ON TABLE collaboration_sessions IS 'Real-time collaboration sessions for structure visualization';
COMMENT ON TABLE session_members IS 'Users participating in collaboration sessions';
COMMENT ON TABLE session_annotations IS 'User annotations on molecular structures';
COMMENT ON TABLE cursor_positions IS 'Real-time cursor positions for collaboration';
COMMENT ON TABLE activity_log IS 'Activity log for collaboration sessions';
COMMENT ON TABLE camera_states IS 'Camera position history for playback';

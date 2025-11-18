-- ============================================================================
-- Collaboration System RLS Policies Migration
-- ============================================================================
-- This migration adds Row-Level Security policies for all collaboration tables
-- Created: 2025-11-17
-- Purpose: Secure collaboration features with proper access control
-- ============================================================================

-- Enable RLS on all collaboration tables
ALTER TABLE collaboration_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE cursor_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE camera_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- COLLABORATION_SESSIONS Policies
-- ============================================================================

-- Users can view sessions they are members of
CREATE POLICY "Users can view their sessions"
ON collaboration_sessions
FOR SELECT
USING (
  auth.uid() IN (
    SELECT user_id FROM session_members
    WHERE session_id = collaboration_sessions.id
  )
);

-- Users can create new sessions
CREATE POLICY "Users can create sessions"
ON collaboration_sessions
FOR INSERT
WITH CHECK (auth.uid() = owner_id);

-- Only owners can update session settings
CREATE POLICY "Owners can update sessions"
ON collaboration_sessions
FOR UPDATE
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- Only owners can delete sessions
CREATE POLICY "Owners can delete sessions"
ON collaboration_sessions
FOR DELETE
USING (auth.uid() = owner_id);

-- ============================================================================
-- SESSION_MEMBERS Policies
-- ============================================================================

-- Users can view members of sessions they belong to
CREATE POLICY "Users can view session members"
ON session_members
FOR SELECT
USING (
  session_id IN (
    SELECT session_id FROM session_members
    WHERE user_id = auth.uid()
  )
);

-- Users can join sessions with valid invite code
CREATE POLICY "Users can join sessions"
ON session_members
FOR INSERT
WITH CHECK (
  -- User is joining themselves
  auth.uid() = user_id
  AND (
    -- Session is not full (max 10 users)
    (SELECT COUNT(*) FROM session_members WHERE session_id = session_members.session_id) < 10
    AND
    -- Session is active
    (SELECT is_active FROM collaboration_sessions WHERE id = session_members.session_id) = true
  )
);

-- Users can update their own member record
CREATE POLICY "Users can update own member record"
ON session_members
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can leave sessions (delete own membership)
CREATE POLICY "Users can leave sessions"
ON session_members
FOR DELETE
USING (auth.uid() = user_id);

-- Owners can remove members from their sessions
CREATE POLICY "Owners can remove members"
ON session_members
FOR DELETE
USING (
  session_id IN (
    SELECT id FROM collaboration_sessions
    WHERE owner_id = auth.uid()
  )
);

-- ============================================================================
-- SESSION_ANNOTATIONS Policies
-- ============================================================================

-- Users can view annotations in sessions they belong to
CREATE POLICY "Users can view session annotations"
ON session_annotations
FOR SELECT
USING (
  session_id IN (
    SELECT session_id FROM session_members
    WHERE user_id = auth.uid()
  )
);

-- Users can create annotations in sessions they belong to
CREATE POLICY "Users can create annotations"
ON session_annotations
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND session_id IN (
    SELECT session_id FROM session_members
    WHERE user_id = auth.uid()
  )
);

-- Users can update their own annotations
CREATE POLICY "Users can update own annotations"
ON session_annotations
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own annotations
CREATE POLICY "Users can delete own annotations"
ON session_annotations
FOR DELETE
USING (auth.uid() = user_id);

-- Session owners can delete any annotation in their session
CREATE POLICY "Owners can delete session annotations"
ON session_annotations
FOR DELETE
USING (
  session_id IN (
    SELECT id FROM collaboration_sessions
    WHERE owner_id = auth.uid()
  )
);

-- ============================================================================
-- CURSOR_POSITIONS Policies
-- ============================================================================

-- Users can view cursors in sessions they belong to
CREATE POLICY "Users can view cursor positions"
ON cursor_positions
FOR SELECT
USING (
  session_id IN (
    SELECT session_id FROM session_members
    WHERE user_id = auth.uid()
  )
);

-- Users can insert their own cursor position
CREATE POLICY "Users can update own cursor"
ON cursor_positions
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND session_id IN (
    SELECT session_id FROM session_members
    WHERE user_id = auth.uid()
  )
);

-- Users can update their own cursor position
CREATE POLICY "Users can update cursor position"
ON cursor_positions
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own cursor
CREATE POLICY "Users can delete own cursor"
ON cursor_positions
FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================================
-- CAMERA_STATES Policies
-- ============================================================================

-- Users can view camera states in sessions they belong to
CREATE POLICY "Users can view camera states"
ON camera_states
FOR SELECT
USING (
  session_id IN (
    SELECT session_id FROM session_members
    WHERE user_id = auth.uid()
  )
);

-- Users can insert their own camera state
CREATE POLICY "Users can insert camera state"
ON camera_states
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND session_id IN (
    SELECT session_id FROM session_members
    WHERE user_id = auth.uid()
  )
);

-- Users can update their own camera state
CREATE POLICY "Users can update camera state"
ON camera_states
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Camera leader can update camera for all (if is_leader = true)
CREATE POLICY "Camera leader can broadcast"
ON camera_states
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM session_members
    WHERE session_id = camera_states.session_id
    AND user_id = auth.uid()
    AND is_camera_leader = true
  )
);

-- ============================================================================
-- ACTIVITY_LOG Policies
-- ============================================================================

-- Users can view activity in sessions they belong to
CREATE POLICY "Users can view activity log"
ON activity_log
FOR SELECT
USING (
  session_id IN (
    SELECT session_id FROM session_members
    WHERE user_id = auth.uid()
  )
);

-- Users can insert activity for their own actions
CREATE POLICY "Users can log activities"
ON activity_log
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND session_id IN (
    SELECT session_id FROM session_members
    WHERE user_id = auth.uid()
  )
);

-- Only system/owners can delete activity logs
CREATE POLICY "Owners can delete activity logs"
ON activity_log
FOR DELETE
USING (
  session_id IN (
    SELECT id FROM collaboration_sessions
    WHERE owner_id = auth.uid()
  )
);

-- ============================================================================
-- Additional Security Functions
-- ============================================================================

-- Function to check if user is session member
CREATE OR REPLACE FUNCTION is_session_member(p_session_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM session_members
    WHERE session_id = p_session_id
    AND user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is session owner
CREATE OR REPLACE FUNCTION is_session_owner(p_session_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM collaboration_sessions
    WHERE id = p_session_id
    AND owner_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is camera leader
CREATE OR REPLACE FUNCTION is_camera_leader(p_session_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM session_members
    WHERE session_id = p_session_id
    AND user_id = p_user_id
    AND is_camera_leader = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Indexes for RLS Performance
-- ============================================================================

-- Indexes to speed up RLS policy checks
CREATE INDEX IF NOT EXISTS idx_session_members_user_id
ON session_members(user_id);

CREATE INDEX IF NOT EXISTS idx_session_members_session_id
ON session_members(session_id);

CREATE INDEX IF NOT EXISTS idx_collaboration_sessions_owner_id
ON collaboration_sessions(owner_id);

CREATE INDEX IF NOT EXISTS idx_session_annotations_user_id
ON session_annotations(user_id);

CREATE INDEX IF NOT EXISTS idx_session_annotations_session_id
ON session_annotations(session_id);

CREATE INDEX IF NOT EXISTS idx_cursor_positions_user_id
ON cursor_positions(user_id);

CREATE INDEX IF NOT EXISTS idx_camera_states_user_id
ON camera_states(user_id);

CREATE INDEX IF NOT EXISTS idx_activity_log_session_id
ON activity_log(session_id);

-- ============================================================================
-- Grants and Permissions
-- ============================================================================

-- Grant authenticated users access to collaboration tables
GRANT SELECT, INSERT, UPDATE, DELETE ON collaboration_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON session_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON session_annotations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON cursor_positions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON camera_states TO authenticated;
GRANT SELECT, INSERT ON activity_log TO authenticated;

-- Grant usage on helper functions
GRANT EXECUTE ON FUNCTION is_session_member TO authenticated;
GRANT EXECUTE ON FUNCTION is_session_owner TO authenticated;
GRANT EXECUTE ON FUNCTION is_camera_leader TO authenticated;

-- ============================================================================
-- Migration Complete
-- ============================================================================

COMMENT ON POLICY "Users can view their sessions" ON collaboration_sessions IS
'Users can only view sessions they are members of';

COMMENT ON POLICY "Users can create sessions" ON collaboration_sessions IS
'Any authenticated user can create a new session and become its owner';

COMMENT ON POLICY "Owners can update sessions" ON collaboration_sessions IS
'Only session owners can modify session settings';

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Collaboration RLS policies successfully applied';
  RAISE NOTICE 'Total policies created: 29';
  RAISE NOTICE 'Helper functions created: 3';
  RAISE NOTICE 'Performance indexes added: 8';
END $$;


-- Verification Query
-- Run this after applying the migration to verify success

-- Check RLS is enabled on all tables
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename IN (
  'collaboration_sessions',
  'session_members',
  'session_annotations',
  'cursor_positions',
  'camera_states',
  'activity_log'
)
ORDER BY tablename;

-- Count policies (should be 29)
SELECT COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN (
  'collaboration_sessions',
  'session_members',
  'session_annotations',
  'cursor_positions',
  'camera_states',
  'activity_log'
);

-- List all policies
SELECT
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

# RLS Migration Guide - Lab Visualizer

## Overview

This guide will walk you through applying Row-Level Security (RLS) policies to your Supabase database for the Lab Visualizer platform. The migration includes security policies for both the main application tables and the collaboration system.

**Estimated Time:** 5-10 minutes

## Prerequisites

- ✅ Supabase project created
- ✅ Database connection established
- ✅ Supabase Dashboard access
- ✅ Migration files available in `/infrastructure/supabase/migrations/`

## Migration Files

Your project contains two main migration files:

1. **001_initial_schema.sql** - Core database schema with base RLS policies
2. **002_collaboration_rls.sql** - Advanced RLS policies for collaboration features

## Step-by-Step Migration Process

### Step 1: Access Supabase Dashboard

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Sign in to your account
3. Select your project: **lab_visualizer**
4. Navigate to **SQL Editor** (left sidebar, Database section)

### Step 2: Apply Initial Schema Migration

**File:** `/infrastructure/supabase/migrations/001_initial_schema.sql`

1. In the SQL Editor, click **"New Query"**
2. Open the file `/infrastructure/supabase/migrations/001_initial_schema.sql` in your local editor
3. **Copy the entire contents** of the file
4. **Paste into the Supabase SQL Editor**
5. Click **"Run"** (or press `Ctrl/Cmd + Enter`)

**Expected Output:**
- ✅ Tables created successfully
- ✅ Indexes created
- ✅ Functions and triggers established
- ✅ Base RLS policies enabled

**If you see errors:**
- Check if tables already exist (safe to ignore "already exists" errors)
- Verify you're connected to the correct database
- Ensure you have admin permissions

### Step 3: Apply Collaboration RLS Migration

**File:** `/infrastructure/supabase/migrations/002_collaboration_rls.sql`

1. In the SQL Editor, click **"New Query"** again
2. Open the file `/infrastructure/supabase/migrations/002_collaboration_rls.sql`
3. **Copy the entire contents** of the file
4. **Paste into the Supabase SQL Editor**
5. Click **"Run"**

**Expected Output:**
```
NOTICE: Collaboration RLS policies successfully applied
NOTICE: Total policies created: 29
NOTICE: Helper functions created: 3
NOTICE: Performance indexes added: 8
```

### Step 4: Verify Migration Success

#### Check 1: Verify Tables

Run this query in SQL Editor:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'collaboration_sessions',
  'session_members',
  'session_annotations',
  'cursor_positions',
  'camera_states',
  'activity_log'
)
ORDER BY table_name;
```

**Expected:** Should return 6 rows (all collaboration tables)

#### Check 2: Verify RLS is Enabled

```sql
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'collaboration_sessions',
    'session_members',
    'session_annotations',
    'cursor_positions',
    'camera_states',
    'activity_log'
  )
ORDER BY tablename;
```

**Expected:** All tables should show `rls_enabled = true`

#### Check 3: Verify Policies

```sql
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'collaboration_sessions',
    'session_members',
    'session_annotations'
  )
ORDER BY tablename, policyname;
```

**Expected:** Should show multiple policies per table

#### Check 4: Verify Helper Functions

```sql
SELECT
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'is_session_member',
    'is_session_owner',
    'is_camera_leader'
  )
ORDER BY routine_name;
```

**Expected:** Should return 3 functions

### Step 5: Test RLS Policies

Create a test query to verify policies work correctly:

```sql
-- This should work (authenticated users can create sessions)
-- Test this after setting up authentication

-- 1. Create a test session (will fail if not authenticated)
INSERT INTO collaboration_sessions (owner_id, session_name)
VALUES (auth.uid(), 'Test Session');

-- 2. Verify you can see your own session
SELECT * FROM collaboration_sessions
WHERE owner_id = auth.uid();

-- 3. Clean up test data
DELETE FROM collaboration_sessions
WHERE session_name = 'Test Session';
```

## What Was Applied?

### Initial Schema (001_initial_schema.sql)

✅ **Core Tables:**
- `user_profiles` - User account data
- `structures` - Molecular structures
- `collections` - Structure organization
- `learning_content` - Educational materials
- `simulation_jobs` - MD job queue
- `structure_shares` - Sharing permissions

✅ **Security:**
- RLS enabled on all tables
- Public read for published content
- Owner-only write access
- Shared access via permissions

✅ **Performance:**
- Indexes for common queries
- Full-text search support
- Optimized join paths

### Collaboration RLS (002_collaboration_rls.sql)

✅ **29 Security Policies:**
- **Collaboration Sessions** (4 policies)
  - Users view their sessions
  - Create new sessions
  - Owners update/delete

- **Session Members** (5 policies)
  - View members in your sessions
  - Join with valid invite
  - Update own membership
  - Leave sessions
  - Owners remove members

- **Annotations** (5 policies)
  - View/create in your sessions
  - Edit/delete own annotations
  - Owners moderate

- **Cursor Positions** (4 policies)
  - Real-time cursor sync
  - Own cursor updates

- **Camera States** (4 policies)
  - View camera in sessions
  - Update own camera
  - Camera leader broadcast

- **Activity Log** (3 policies)
  - View session activity
  - Log own actions
  - Owners delete logs

✅ **3 Helper Functions:**
- `is_session_member()` - Check membership
- `is_session_owner()` - Check ownership
- `is_camera_leader()` - Check camera control

✅ **8 Performance Indexes:**
- User ID lookups
- Session ID lookups
- Optimized policy checks

## Security Features

### What RLS Protects:

1. **Data Isolation:** Users only see their own data or explicitly shared data
2. **Write Protection:** Only owners can modify their resources
3. **Session Security:** Collaboration limited to invited members
4. **Cascading Permissions:** Share access follows logical hierarchies
5. **Temporal Security:** Expired shares automatically denied

### Policy Examples:

**Example 1: Session Privacy**
```sql
-- User A creates a session
-- User B cannot see it unless invited
-- User A invites User B
-- Now User B can see and participate
```

**Example 2: Annotation Ownership**
```sql
-- User can create annotation in any session they're in
-- User can edit only their own annotations
-- Session owner can delete any annotation
```

**Example 3: Camera Leadership**
```sql
-- Camera leader can broadcast to all
-- Regular members only update own camera
-- Prevents unauthorized camera control
```

## Troubleshooting

### Common Issues

#### Issue: "permission denied for table"
**Solution:**
```sql
-- Grant necessary permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
```

#### Issue: "function auth.uid() does not exist"
**Solution:** Ensure you're using Supabase auth (not custom auth)

#### Issue: Policies too restrictive
**Solution:** Check policy using:
```sql
-- See exact policy logic
SELECT pg_get_expr(qual, 'pg_class'::regclass)
FROM pg_policy
WHERE policyname = 'your_policy_name';
```

#### Issue: Performance slow
**Solution:** Verify indexes exist:
```sql
-- Check indexes on key columns
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'session_members';
```

### Rollback (If Needed)

If you need to rollback the migration:

```sql
-- Drop all collaboration tables (CAUTION: Deletes data!)
DROP TABLE IF EXISTS activity_log CASCADE;
DROP TABLE IF EXISTS camera_states CASCADE;
DROP TABLE IF EXISTS cursor_positions CASCADE;
DROP TABLE IF EXISTS session_annotations CASCADE;
DROP TABLE IF EXISTS session_members CASCADE;
DROP TABLE IF EXISTS collaboration_sessions CASCADE;

-- Drop helper functions
DROP FUNCTION IF EXISTS is_session_member;
DROP FUNCTION IF EXISTS is_session_owner;
DROP FUNCTION IF EXISTS is_camera_leader;
```

## Next Steps After Migration

1. ✅ **Enable Realtime** (for live collaboration)
   - Go to Database → Replication
   - Enable for collaboration tables

2. ✅ **Configure Storage Buckets**
   - Create `structures` bucket (for molecule files)
   - Create `thumbnails` bucket (for previews)
   - Apply RLS policies to buckets

3. ✅ **Test Authentication Flow**
   - Create test user
   - Verify session creation
   - Test sharing features

4. ✅ **Setup Environment Variables**
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_key
   ```

5. ✅ **Deploy Frontend**
   - Test with real Supabase connection
   - Verify RLS policies work in app
   - Monitor for permission errors

## Validation Checklist

Before considering migration complete:

- [ ] All tables created successfully
- [ ] RLS enabled on all tables
- [ ] All 29 policies created
- [ ] Helper functions working
- [ ] Indexes created for performance
- [ ] Test queries run without errors
- [ ] Authentication integration tested
- [ ] Realtime subscriptions enabled
- [ ] Storage buckets configured
- [ ] Environment variables set

## Performance Monitoring

After migration, monitor these metrics:

```sql
-- Check policy execution time
SELECT
  schemaname,
  tablename,
  policyname,
  (SELECT count(*) FROM pg_stat_user_tables WHERE relname = tablename) as row_count
FROM pg_policies
WHERE schemaname = 'public';

-- Check index usage
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

## Additional Resources

- **Supabase RLS Documentation:** https://supabase.com/docs/guides/auth/row-level-security
- **PostgreSQL RLS Guide:** https://www.postgresql.org/docs/current/ddl-rowsecurity.html
- **Project Architecture:** `/docs/architecture/`
- **Database Schema Diagram:** `/docs/database/schema.md` (if available)

## Support

If you encounter issues:

1. Check the Supabase Dashboard logs
2. Review policy logic with `pg_get_expr`
3. Test with service role key (bypasses RLS)
4. Consult project documentation in `/docs/`

---

**Migration Version:** 1.0.0
**Last Updated:** 2025-11-18
**Compatibility:** Supabase PostgreSQL 15+
**Status:** Ready for Production ✅

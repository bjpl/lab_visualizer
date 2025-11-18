# RLS Migration Guide

## Overview

This guide explains how to apply the Row-Level Security (RLS) policies to your Supabase database for the LAB Visualizer project. The migration secures all collaboration features with proper access control.

## What This Migration Does

The RLS migration (`002_collaboration_rls.sql`) implements comprehensive security for the collaboration system:

### Tables Protected (6 total)
- `collaboration_sessions` - Collaboration session management
- `session_members` - User participation in sessions
- `session_annotations` - User annotations within sessions
- `cursor_positions` - Real-time cursor tracking
- `camera_states` - Camera synchronization states
- `activity_log` - Session activity logging

### Security Features

**29 RLS Policies** ensure:
- Users can only see sessions they're members of
- Only owners can modify or delete sessions
- Participants have appropriate read/write permissions based on their role
- Camera leaders can broadcast camera state to all participants
- Activity logs are protected and auditable

**3 Helper Functions**:
- `is_session_member(session_id, user_id)` - Check session membership
- `is_session_owner(session_id, user_id)` - Verify session ownership
- `is_camera_leader(session_id, user_id)` - Check camera leader status

**8 Performance Indexes** optimize RLS policy lookups

---

## Prerequisites

✅ **Environment Configuration Complete**
- `.env` file created with Supabase credentials
- `NEXT_PUBLIC_SUPABASE_URL` configured
- `SUPABASE_SERVICE_ROLE_KEY` configured

---

## Application Methods

### 🎯 OPTION 1: Supabase Dashboard SQL Editor (Recommended)

**Easiest method** - No CLI installation required

1. **Open SQL Editor**
   - Go to: https://supabase.com/dashboard/project/pafqzaekilaykzvovfyi
   - Click: **SQL Editor** in the left sidebar

2. **Create New Query**
   - Click: **+ New Query** button (top right)

3. **Copy Migration SQL**
   - Open: `infrastructure/supabase/migrations/002_collaboration_rls.sql`
   - Select all content (Ctrl+A / Cmd+A)
   - Copy (Ctrl+C / Cmd+C)

4. **Paste and Execute**
   - Paste into the SQL Editor
   - Click: **Run** button (or Ctrl+Enter / Cmd+Enter)
   - Wait for execution to complete (~5-10 seconds)

5. **Verify Success**
   - Look for green success message
   - Should see: "Collaboration RLS policies successfully applied"
   - Should see: "Total policies created: 29"

---

### 🛠️ OPTION 2: Supabase CLI (Advanced)

**For developers** with local CLI installed

#### Install Supabase CLI

**macOS/Linux:**
```bash
brew install supabase/tap/supabase
```

**Windows:**
```powershell
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

**npm (All platforms):**
```bash
npm install -g supabase
```

#### Link and Apply

```bash
# Navigate to project directory
cd /path/to/lab_visualizer

# Link to your Supabase project
supabase link --project-ref pafqzaekilaykzvovfyi

# Apply migration
supabase db push

# Verify migration
supabase db diff
```

---

### 🔧 OPTION 3: psql Command Line (Expert)

**For database administrators**

1. **Get Connection String**
   - Go to Supabase Dashboard > Project Settings > Database
   - Copy the "Connection string" (with password)

2. **Connect via psql**
   ```bash
   psql "postgresql://postgres:[YOUR-PASSWORD]@db.pafqzaekilaykzvovfyi.supabase.co:5432/postgres"
   ```

3. **Run Migration**
   ```sql
   \i infrastructure/supabase/migrations/002_collaboration_rls.sql
   ```

4. **Exit**
   ```sql
   \q
   ```

---

## Verification

### Quick Verification (SQL Editor)

Run the verification script in SQL Editor:

```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename IN (
  'collaboration_sessions', 'session_members', 'session_annotations',
  'cursor_positions', 'camera_states', 'activity_log'
);
-- All should show rowsecurity = true

-- Count policies (should be 29)
SELECT COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN (
  'collaboration_sessions', 'session_members', 'session_annotations',
  'cursor_positions', 'camera_states', 'activity_log'
);
-- Should return: 29
```

### Visual Verification (Dashboard)

1. **Check Tables**
   - Go to: **Database** > **Tables**
   - Look for green shield icon 🛡️ next to each collaboration table
   - Green shield = RLS enabled ✅

2. **View Policies**
   - Go to: **Database** > **Policies**
   - Filter by tables: `collaboration_sessions`, etc.
   - Count policies: should see 29 total

3. **Verify Functions**
   - Go to: **Database** > **Functions**
   - Search for: `is_session_member`, `is_session_owner`, `is_camera_leader`
   - All three should be listed ✅

---

## Automated Verification Script

A verification script has been created at:
`infrastructure/supabase/verify-rls.sql`

**To use:**
1. Open Supabase SQL Editor
2. Click: **+ New Query**
3. Copy contents of `verify-rls.sql`
4. Paste and run
5. Review results

**Expected Results:**
```
Row Security:
✅ collaboration_sessions    | true
✅ session_members           | true
✅ session_annotations       | true
✅ cursor_positions          | true
✅ camera_states             | true
✅ activity_log              | true

Policy Count: 29

Helper Functions: 3
```

---

## Troubleshooting

### ❌ Error: "relation does not exist"

**Cause:** Tables haven't been created yet

**Solution:**
1. Run the initial migration first (`001_initial_schema.sql`)
2. Then run RLS migration (`002_collaboration_rls.sql`)

### ❌ Error: "policy already exists"

**Cause:** Migration was already applied

**Solution:**
- This is OK! Policies are already in place
- Verify using the verification script above
- If you need to re-apply, drop policies first:
  ```sql
  DROP POLICY IF EXISTS "policy_name" ON table_name;
  ```

### ❌ Error: "permission denied"

**Cause:** Using anon key instead of service role key

**Solution:**
- Ensure you're using `SUPABASE_SERVICE_ROLE_KEY` (not anon key)
- Service role key is required for database migrations

### ⚠️ Warning: Some statements fail

**Cause:** Certain statements (COMMENT, RAISE NOTICE) may not execute via API

**Solution:**
- These are informational only and safe to ignore
- Core functionality (policies, functions, indexes) will still work
- Verify using the verification steps above

---

## Security Best Practices

After applying the migration:

1. **Test Authentication Flow**
   - Create a test user
   - Try creating a session
   - Verify user can only see their own sessions

2. **Test Access Controls**
   - Create session as User A
   - Try accessing as User B (should fail)
   - Invite User B to session
   - Verify User B can now access

3. **Monitor Policy Performance**
   - Check query performance in Dashboard > Logs
   - RLS adds overhead but indexes minimize impact
   - Expected: <50ms additional latency

4. **Regular Security Audits**
   - Review policies quarterly
   - Check for abandoned sessions
   - Audit activity logs for suspicious patterns

---

## Next Steps

After successful migration:

1. ✅ **Test in Development**
   - Run `npm run dev`
   - Test collaboration features
   - Verify authentication works

2. ✅ **Update Application**
   - Ensure all API calls use authenticated users
   - Test error handling for unauthorized access

3. ✅ **Deploy to Production**
   - Apply same migration to production database
   - Test thoroughly before announcing

4. ✅ **Monitor Performance**
   - Watch database metrics in Supabase Dashboard
   - Set up alerts for policy violations

---

## Additional Resources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [LAB Visualizer Security Architecture](./SECURITY_ENHANCEMENT_REPORT.md)

---

## Support

If you encounter issues:

1. Check this guide's troubleshooting section
2. Review verification script results
3. Check Supabase Dashboard > Logs for errors
4. Open an issue in the project repository

---

**Migration Status:** ✅ Ready to Apply
**Estimated Time:** 5-10 minutes
**Risk Level:** Low (read-only project, migration can be rolled back)
**Impact:** High (critical security improvement)

---

*Last Updated: 2025-11-18*
*Migration Version: 002*
*Documentation Version: 1.0*

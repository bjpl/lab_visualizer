#!/usr/bin/env node

/**
 * Apply RLS Migration - Direct API Approach
 *
 * Uses Supabase Management API to apply SQL migration
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Extract project ref from URL
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)[1];

console.log('🔧 Applying RLS Migration via Supabase API\n');
console.log(`📍 Project: ${projectRef}`);
console.log(`🔑 Using service role key\n`);

// Read migration SQL
const migrationPath = path.join(
  __dirname,
  '../infrastructure/supabase/migrations/002_collaboration_rls.sql'
);

const sqlContent = fs.readFileSync(migrationPath, 'utf8');
console.log(`✅ Migration file loaded (${sqlContent.length} bytes)\n`);

// Parse SQL into individual statements
const statements = sqlContent
  .split(';')
  .map(stmt => stmt.trim())
  .filter(stmt =>
    stmt.length > 0 &&
    !stmt.startsWith('--') &&
    !stmt.includes('RAISE NOTICE') &&
    !stmt.startsWith('COMMENT ON') &&
    !stmt.startsWith('DO $$')
  )
  .map(stmt => stmt + ';');

console.log(`📊 Found ${statements.length} SQL statements to execute\n`);

// Manual instructions since API execution is limited
console.log('╔═══════════════════════════════════════════════════════════════╗');
console.log('║       MANUAL MIGRATION INSTRUCTIONS                           ║');
console.log('╚═══════════════════════════════════════════════════════════════╝\n');

console.log('Due to API limitations, please apply the migration manually:\n');

console.log('📝 OPTION 1: Supabase Dashboard SQL Editor (Recommended)');
console.log('─────────────────────────────────────────────────────────────');
console.log('1. Go to: https://supabase.com/dashboard/project/' + projectRef);
console.log('2. Navigate to: SQL Editor');
console.log('3. Click: "+ New Query"');
console.log('4. Copy the contents of:');
console.log('   infrastructure/supabase/migrations/002_collaboration_rls.sql');
console.log('5. Paste into the editor');
console.log('6. Click: "Run" button\n');

console.log('📝 OPTION 2: Supabase CLI (If installed locally)');
console.log('─────────────────────────────────────────────────────────────');
console.log('1. Install Supabase CLI: https://github.com/supabase/cli');
console.log('2. Link project: supabase link --project-ref ' + projectRef);
console.log('3. Run migration: supabase db push\n');

console.log('📝 OPTION 3: psql Command Line');
console.log('─────────────────────────────────────────────────────────────');
console.log('1. Get connection string from Supabase Dashboard');
console.log('2. Run: psql "your-connection-string"');
console.log('3. Run: \\i infrastructure/supabase/migrations/002_collaboration_rls.sql\n');

console.log('✅ VERIFICATION STEPS:');
console.log('─────────────────────────────────────────────────────────────');
console.log('After running the migration, verify in Supabase Dashboard:');
console.log('1. Go to: Database > Tables');
console.log('2. Check each table has RLS enabled (green shield icon)');
console.log('3. Go to: Database > Policies');
console.log('4. Count policies - should see 29 total policies');
console.log('5. Verify helper functions in Database > Functions\n');

console.log('📋 MIGRATION SUMMARY:');
console.log('─────────────────────────────────────────────────────────────');
console.log('Tables protected: 6');
console.log('  - collaboration_sessions');
console.log('  - session_members');
console.log('  - session_annotations');
console.log('  - cursor_positions');
console.log('  - camera_states');
console.log('  - activity_log\n');
console.log('RLS Policies: 29 total');
console.log('Helper Functions: 3');
console.log('  - is_session_member()');
console.log('  - is_session_owner()');
console.log('  - is_camera_leader()\n');
console.log('Performance Indexes: 8\n');

console.log('═══════════════════════════════════════════════════════════════\n');

// Create a simplified verification script
const verifyScript = `
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
`;

const verifyPath = path.join(__dirname, '../infrastructure/supabase/verify-rls.sql');
fs.writeFileSync(verifyPath, verifyScript);
console.log(`✅ Verification script created: ${verifyPath}\n`);
console.log('Run this script in SQL Editor to verify the migration was successful.\n');

# LAB Visualization Platform Database Schema

## Overview

This document describes the complete database schema for the LAB Visualization Platform, built on Supabase (PostgreSQL).

## Architecture

### Core Principles
- **Row-Level Security (RLS)**: All tables use RLS for fine-grained access control
- **Soft Deletes**: Critical data uses soft deletes where appropriate
- **Audit Trail**: Timestamps and version tracking for key entities
- **Realtime**: Supabase realtime enabled for collaborative features
- **Full-Text Search**: PostgreSQL's tsvector for structure and content search

### Extensions Required
- `uuid-ossp`: UUID generation
- `pgcrypto`: Cryptographic functions
- `pg_trgm`: Trigram matching for fuzzy search

## Database Diagram

```
user_profiles
    ├── structures (owner)
    │   ├── structure_versions
    │   ├── structure_favorites
    │   ├── structure_shares
    │   └── structure_comments
    ├── collections (owner)
    │   └── collection_structures
    ├── learning_content (creator)
    │   ├── content_reviews
    │   └── user_progress
    ├── learning_pathways (creator)
    └── simulation_jobs (user)

collaboration_sessions (separate migration)
    ├── session_users
    ├── annotations
    ├── session_activities
    └── camera_states
```

## Tables

### Core User Tables

#### user_profiles
Extends Supabase auth.users with application-specific profile data.

```sql
user_profiles {
  id: UUID (PK, FK to auth.users)
  username: TEXT (unique)
  display_name: TEXT
  bio: TEXT
  avatar_url: TEXT
  role: user_role (student|educator|researcher|admin)
  institution: TEXT
  department: TEXT
  research_interests: TEXT[]
  preferences: JSONB
  notification_settings: JSONB
  total_structures: INTEGER
  total_annotations: INTEGER
  total_sessions: INTEGER
  created_at: TIMESTAMPTZ
  updated_at: TIMESTAMPTZ
  last_login: TIMESTAMPTZ
}
```

**Indexes:**
- `username` (unique)
- `role`
- `institution`

**RLS Policies:**
- Public read (all profiles viewable)
- Own profile update only

#### user_connections
Social graph for following/followers functionality.

```sql
user_connections {
  follower_id: UUID (PK)
  following_id: UUID (PK)
  created_at: TIMESTAMPTZ
}
```

**Constraints:**
- No self-following
- Composite primary key

### Molecular Structures

#### structures
Main table for molecular structure storage and metadata.

```sql
structures {
  id: UUID (PK)
  owner_id: UUID (FK)
  name: TEXT
  description: TEXT
  formula: TEXT
  structure_type: structure_type (molecule|protein|dna|rna|complex)
  file_format: file_format (pdb|xyz|mol2|sdf|cif|gro)
  file_path: TEXT
  file_size: BIGINT
  file_hash: TEXT
  properties: JSONB
  tags: TEXT[]
  source: TEXT
  thumbnail_url: TEXT
  preview_data: JSONB
  atom_count: INTEGER
  bond_count: INTEGER
  residue_count: INTEGER
  chain_count: INTEGER
  visibility: visibility (private|unlisted|public|institution)
  view_count: INTEGER
  favorite_count: INTEGER
  fork_count: INTEGER
  parent_id: UUID (self-reference for forks)
  created_at: TIMESTAMPTZ
  updated_at: TIMESTAMPTZ
  last_accessed: TIMESTAMPTZ
}
```

**Key Features:**
- File deduplication via `file_hash`
- Forking support via `parent_id`
- Full-text search on name, description, formula
- Visibility controls
- Cached preview data for performance

**Indexes:**
- `owner_id`
- `structure_type`
- `visibility`
- `tags` (GIN index)
- `file_hash`
- Full-text search (GIN index)

**RLS Policies:**
- Public read for public structures
- Owner full access
- Shared access via structure_shares

#### structure_versions
Version control for structures.

```sql
structure_versions {
  id: UUID (PK)
  structure_id: UUID (FK)
  version_number: INTEGER
  file_path: TEXT
  file_hash: TEXT
  changes: TEXT
  created_by: UUID (FK)
  created_at: TIMESTAMPTZ
}
```

**Unique Constraint:**
- (structure_id, version_number)

#### structure_favorites
User favorites/bookmarks.

```sql
structure_favorites {
  user_id: UUID (PK)
  structure_id: UUID (PK)
  created_at: TIMESTAMPTZ
}
```

#### collections
Folders/projects for organizing structures.

```sql
collections {
  id: UUID (PK)
  owner_id: UUID (FK)
  name: TEXT
  description: TEXT
  icon: TEXT
  color: TEXT
  visibility: visibility
  parent_id: UUID (self-reference for nesting)
  created_at: TIMESTAMPTZ
  updated_at: TIMESTAMPTZ
}
```

**Features:**
- Hierarchical organization (parent_id)
- Color-coded
- Same visibility model as structures

#### collection_structures
Many-to-many mapping with ordering.

```sql
collection_structures {
  collection_id: UUID (PK)
  structure_id: UUID (PK)
  position: INTEGER
  added_at: TIMESTAMPTZ
}
```

### Learning Content

#### learning_content
Educational materials (videos, guides, tutorials, quizzes).

```sql
learning_content {
  id: UUID (PK)
  creator_id: UUID (FK)
  title: TEXT
  description: TEXT
  content_type: content_type (video|guide|tutorial|quiz|pathway)
  content_data: JSONB
  thumbnail_url: TEXT
  duration: INTEGER
  related_structures: UUID[]
  difficulty: INTEGER (1-5)
  prerequisites: UUID[]
  learning_objectives: TEXT[]
  tags: TEXT[]
  visibility: visibility
  is_published: BOOLEAN
  view_count: INTEGER
  completion_count: INTEGER
  avg_rating: NUMERIC(3,2)
  rating_count: INTEGER
  created_at: TIMESTAMPTZ
  updated_at: TIMESTAMPTZ
  published_at: TIMESTAMPTZ
}
```

**Key Features:**
- Flexible content_data JSONB for different content types
- Prerequisite tracking
- Rating system
- Publication workflow

#### learning_pathways
Structured learning sequences (courses).

```sql
learning_pathways {
  id: UUID (PK)
  creator_id: UUID (FK)
  title: TEXT
  description: TEXT
  thumbnail_url: TEXT
  content_sequence: UUID[]
  estimated_duration: INTEGER
  difficulty: INTEGER (1-5)
  tags: TEXT[]
  visibility: visibility
  is_published: BOOLEAN
  enrollment_count: INTEGER
  completion_count: INTEGER
  avg_rating: NUMERIC(3,2)
  created_at: TIMESTAMPTZ
  updated_at: TIMESTAMPTZ
}
```

#### user_progress
Tracks individual learning progress.

```sql
user_progress {
  user_id: UUID (PK)
  content_id: UUID (PK)
  completed: BOOLEAN
  progress_percent: INTEGER (0-100)
  time_spent: INTEGER
  notes: TEXT
  bookmarks: JSONB
  quiz_scores: JSONB
  started_at: TIMESTAMPTZ
  completed_at: TIMESTAMPTZ
  last_accessed: TIMESTAMPTZ
}
```

#### content_reviews
User ratings and reviews.

```sql
content_reviews {
  id: UUID (PK)
  user_id: UUID (FK)
  content_id: UUID (FK)
  rating: INTEGER (1-5)
  review_text: TEXT
  created_at: TIMESTAMPTZ
  updated_at: TIMESTAMPTZ
}
```

**Unique Constraint:**
- One review per user per content

### Simulations

#### simulation_jobs
Job queue for molecular simulations.

```sql
simulation_jobs {
  id: UUID (PK)
  user_id: UUID (FK)
  structure_id: UUID (FK)
  simulation_type: simulation_type (md|mc|docking|optimization|visualization)
  parameters: JSONB
  status: simulation_status (pending|queued|running|completed|failed|cancelled)
  progress_percent: INTEGER (0-100)
  result_path: TEXT
  result_data: JSONB
  error_message: TEXT
  cpu_time: INTEGER
  memory_used: BIGINT
  estimated_cost: NUMERIC(10,2)
  created_at: TIMESTAMPTZ
  started_at: TIMESTAMPTZ
  completed_at: TIMESTAMPTZ
  expires_at: TIMESTAMPTZ
}
```

**Features:**
- Status tracking
- Resource monitoring
- Cost estimation
- Auto-cleanup via expires_at

#### simulation_cache
Results cache for expensive simulations.

```sql
simulation_cache {
  id: UUID (PK)
  structure_hash: TEXT
  simulation_type: simulation_type
  parameters_hash: TEXT
  result_path: TEXT
  result_data: JSONB
  hit_count: INTEGER
  created_at: TIMESTAMPTZ
  last_accessed: TIMESTAMPTZ
}
```

**Unique Constraint:**
- (structure_hash, simulation_type, parameters_hash)

### Sharing & Permissions

#### structure_shares
Granular sharing for structures.

```sql
structure_shares {
  id: UUID (PK)
  structure_id: UUID (FK)
  shared_by: UUID (FK)
  shared_with: UUID (FK, nullable)
  permission: share_permission (view|comment|edit|admin)
  share_token: TEXT (unique, for link sharing)
  expires_at: TIMESTAMPTZ
  max_views: INTEGER
  view_count: INTEGER
  require_password: BOOLEAN
  password_hash: TEXT
  created_at: TIMESTAMPTZ
  last_accessed: TIMESTAMPTZ
}
```

**Features:**
- User-specific or link-based sharing
- Permission levels
- Expiration and view limits
- Optional password protection

#### collection_shares
Similar sharing model for collections.

```sql
collection_shares {
  id: UUID (PK)
  collection_id: UUID (FK)
  shared_by: UUID (FK)
  shared_with: UUID (FK, nullable)
  permission: share_permission
  share_token: TEXT
  expires_at: TIMESTAMPTZ
  created_at: TIMESTAMPTZ
}
```

#### structure_comments
Threaded comments on structures.

```sql
structure_comments {
  id: UUID (PK)
  structure_id: UUID (FK)
  user_id: UUID (FK)
  content: TEXT
  parent_id: UUID (self-reference)
  position: JSONB {x, y, z}
  target_atoms: INTEGER[]
  like_count: INTEGER
  created_at: TIMESTAMPTZ
  updated_at: TIMESTAMPTZ
}
```

**Features:**
- Threading via parent_id
- Spatial annotations (position)
- Atom-specific comments
- Like system

#### comment_likes
Simple like tracking.

```sql
comment_likes {
  user_id: UUID (PK)
  comment_id: UUID (PK)
  created_at: TIMESTAMPTZ
}
```

## Functions

### Utility Functions

#### update_updated_at()
Auto-updates `updated_at` timestamp on row changes.

```sql
TRIGGER: BEFORE UPDATE
Used by: user_profiles, structures, collections, learning_content, structure_comments
```

#### increment_structure_views(structure_uuid UUID)
Safely increments view counter and updates last_accessed.

#### update_user_structure_count()
Maintains user_profiles.total_structures count.

```sql
TRIGGER: AFTER INSERT OR DELETE on structures
```

#### update_content_rating()
Recalculates avg_rating and rating_count for learning_content.

```sql
TRIGGER: AFTER INSERT OR UPDATE on content_reviews
```

#### update_comment_likes()
Maintains like_count on structure_comments.

```sql
TRIGGER: AFTER INSERT OR DELETE on comment_likes
```

### Search Functions

#### search_structures()
Full-text search with filters.

```sql
search_structures(
  search_query TEXT,
  filter_type structure_type,
  filter_visibility visibility,
  filter_tags TEXT[],
  search_user_id UUID,
  result_limit INTEGER,
  result_offset INTEGER
) RETURNS TABLE
```

**Features:**
- Full-text search on name, description, formula
- Multiple filter options
- Pagination
- Returns joined user data

### Cleanup Functions

#### cleanup_expired_simulations()
Removes old simulation results and cancels stuck jobs.

```sql
-- Should be run via cron or periodic job
-- Deletes: completed jobs past expires_at
-- Cancels: jobs running > 24 hours
```

#### cleanup_simulation_cache()
Removes stale cache entries.

```sql
-- Removes entries:
-- - Not accessed in 30 days
-- - Hit count < 5
```

## Row-Level Security (RLS)

All tables have RLS enabled. Key patterns:

### Public Read, Own Write
- user_profiles
- content_reviews

### Owner + Shared Access
- structures (via structure_shares)
- collections (via collection_shares)

### Owner Only
- simulation_jobs
- user_progress
- structure_favorites

### Authenticated Users
- structure_comments (read if can access structure)
- comment_likes

### Public If Published
- learning_content (published + public visibility)

## Realtime Subscriptions

Enabled for:
- user_profiles
- structures
- simulation_jobs
- structure_comments
- collection_structures

Plus collaboration tables (from separate migration):
- collaboration_sessions
- session_users
- annotations
- session_activities
- camera_states

## Storage Buckets

Required Supabase storage buckets (created separately):

| Bucket | Access | Purpose |
|--------|--------|---------|
| structures | RLS-controlled | Molecular structure files |
| thumbnails | Public read | Structure preview images |
| simulations | Private | Simulation result files |
| learning-content | Public read (published) | Videos, guides, etc. |
| user-avatars | Public read | Profile pictures |

## Performance Considerations

### Indexes
- All foreign keys indexed
- GIN indexes for array/JSONB columns
- Full-text search indexes
- Composite indexes for common queries

### Caching
- simulation_cache for expensive computations
- preview_data JSONB for quick structure loading
- Materialized views could be added for analytics

### Cleanup Jobs
Schedule these functions:
- `cleanup_expired_simulations()` - Hourly
- `cleanup_simulation_cache()` - Daily

## Migration Strategy

### Initial Setup
1. Run `001_initial_schema.sql`
2. Create storage buckets
3. Set up scheduled cleanup jobs
4. Run collaboration migration (already exists)

### Future Migrations
- Use numbered migrations: `002_add_feature.sql`
- Always include rollback script
- Test on staging first
- Consider data migration scripts separately

## Security Considerations

### Sensitive Data
- Passwords hashed via pgcrypto
- Share tokens are unique and random
- RLS prevents unauthorized access

### Rate Limiting
Should be implemented at application level for:
- Structure uploads
- Simulation job creation
- Comment posting

### Data Validation
- CHECK constraints on critical fields
- Triggers for derived data consistency
- Application-level validation recommended

## Example Queries

### Get user's structures with stats
```sql
SELECT
  s.*,
  COUNT(DISTINCT f.user_id) as favorite_count,
  COUNT(DISTINCT c.id) as comment_count
FROM structures s
LEFT JOIN structure_favorites f ON s.id = f.structure_id
LEFT JOIN structure_comments c ON s.id = c.structure_id
WHERE s.owner_id = '...'
GROUP BY s.id
ORDER BY s.created_at DESC;
```

### Search with filters
```sql
SELECT * FROM search_structures(
  'protein kinase',
  'protein',
  'public',
  ARRAY['enzyme', 'signaling'],
  NULL,
  20,
  0
);
```

### Get user learning progress
```sql
SELECT
  lc.title,
  lc.content_type,
  up.progress_percent,
  up.completed,
  up.time_spent
FROM user_progress up
JOIN learning_content lc ON up.content_id = lc.id
WHERE up.user_id = '...'
ORDER BY up.last_accessed DESC;
```

## Troubleshooting

### Common Issues

**RLS blocking legitimate access:**
- Check policy USING clauses
- Verify auth.uid() is set
- Test with `SET LOCAL ROLE authenticated;`

**Slow queries:**
- Check EXPLAIN ANALYZE
- Verify indexes exist
- Consider materialized views

**Trigger recursion:**
- Avoid calling functions that trigger same table update
- Use BEFORE vs AFTER carefully

## Future Enhancements

Potential additions:
- Materialized views for analytics
- Partitioning for large tables (simulations, activities)
- GraphQL schema generation
- Audit logging tables
- Advanced search (chemical similarity)
- Machine learning model results table

## References

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL RLS Guide](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [PDB File Format](https://www.wwpdb.org/documentation/file-format)

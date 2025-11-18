-- LAB Visualization Platform - Initial Database Schema
-- Version: 1.0.0
-- Description: Complete database schema for molecular visualization platform
-- Includes: User profiles, structures, learning content, simulations, sharing

-- ================================================================
-- EXTENSIONS
-- ================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For full-text search

-- ================================================================
-- ENUMS
-- ================================================================

CREATE TYPE user_role AS ENUM ('student', 'educator', 'researcher', 'admin');
CREATE TYPE structure_type AS ENUM ('molecule', 'protein', 'dna', 'rna', 'complex');
CREATE TYPE file_format AS ENUM ('pdb', 'xyz', 'mol2', 'sdf', 'cif', 'gro');
CREATE TYPE simulation_status AS ENUM ('pending', 'queued', 'running', 'completed', 'failed', 'cancelled');
CREATE TYPE simulation_type AS ENUM ('md', 'mc', 'docking', 'optimization', 'visualization');
CREATE TYPE content_type AS ENUM ('video', 'guide', 'tutorial', 'quiz', 'pathway');
CREATE TYPE visibility AS ENUM ('private', 'unlisted', 'public', 'institution');
CREATE TYPE share_permission AS ENUM ('view', 'comment', 'edit', 'admin');

-- ================================================================
-- CORE USER TABLES
-- ================================================================

-- User profiles (extends Supabase auth.users)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  role user_role DEFAULT 'student',
  institution TEXT,
  department TEXT,
  research_interests TEXT[],

  -- Settings
  preferences JSONB DEFAULT '{
    "theme": "dark",
    "colorScheme": "cpk",
    "defaultRepresentation": "ball-stick",
    "enableAnimations": true,
    "autoSave": true,
    "language": "en"
  }'::jsonb,

  -- Notifications
  notification_settings JSONB DEFAULT '{
    "email": true,
    "push": true,
    "sessionInvites": true,
    "comments": true,
    "systemUpdates": true
  }'::jsonb,

  -- Stats
  total_structures INTEGER DEFAULT 0,
  total_annotations INTEGER DEFAULT 0,
  total_sessions INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ,

  CONSTRAINT valid_username CHECK (username ~ '^[a-zA-Z0-9_-]{3,30}$'),
  CONSTRAINT valid_email CHECK (id IN (SELECT id FROM auth.users))
);

-- User connections (followers/following)
CREATE TABLE user_connections (
  follower_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  following_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  PRIMARY KEY (follower_id, following_id),
  CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

-- ================================================================
-- MOLECULAR STRUCTURES
-- ================================================================

-- Main structures table
CREATE TABLE structures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

  -- Basic info
  name TEXT NOT NULL,
  description TEXT,
  formula TEXT,
  structure_type structure_type NOT NULL,
  file_format file_format NOT NULL,

  -- File storage
  file_path TEXT NOT NULL, -- Supabase storage path
  file_size BIGINT NOT NULL,
  file_hash TEXT, -- For deduplication

  -- Metadata
  properties JSONB DEFAULT '{}'::jsonb, -- molecular weight, charge, etc.
  tags TEXT[],
  source TEXT, -- PDB ID, DOI, custom

  -- Visualization cache
  thumbnail_url TEXT,
  preview_data JSONB, -- Cached atom/bond data for quick preview

  -- Statistics
  atom_count INTEGER,
  bond_count INTEGER,
  residue_count INTEGER,
  chain_count INTEGER,

  -- Sharing
  visibility visibility DEFAULT 'private',
  view_count INTEGER DEFAULT 0,
  favorite_count INTEGER DEFAULT 0,
  fork_count INTEGER DEFAULT 0,
  parent_id UUID REFERENCES structures(id) ON DELETE SET NULL, -- For forks

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_file_size CHECK (file_size > 0 AND file_size < 1073741824) -- Max 1GB
);

-- Structure versions (for tracking changes)
CREATE TABLE structure_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  structure_id UUID NOT NULL REFERENCES structures(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  file_path TEXT NOT NULL,
  file_hash TEXT NOT NULL,
  changes TEXT,
  created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (structure_id, version_number)
);

-- Structure favorites
CREATE TABLE structure_favorites (
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  structure_id UUID REFERENCES structures(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  PRIMARY KEY (user_id, structure_id)
);

-- Structure collections (folders/projects)
CREATE TABLE collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT DEFAULT '#3B82F6',
  visibility visibility DEFAULT 'private',
  parent_id UUID REFERENCES collections(id) ON DELETE CASCADE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_color CHECK (color ~ '^#[0-9A-Fa-f]{6}$')
);

-- Structure to collection mapping
CREATE TABLE collection_structures (
  collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
  structure_id UUID REFERENCES structures(id) ON DELETE CASCADE,
  position INTEGER, -- For ordering
  added_at TIMESTAMPTZ DEFAULT NOW(),

  PRIMARY KEY (collection_id, structure_id)
);

-- ================================================================
-- LEARNING CONTENT
-- ================================================================

-- Educational content
CREATE TABLE learning_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

  -- Content info
  title TEXT NOT NULL,
  description TEXT,
  content_type content_type NOT NULL,

  -- Content storage
  content_data JSONB NOT NULL, -- Flexible structure for different content types
  thumbnail_url TEXT,
  duration INTEGER, -- For videos in seconds

  -- Associated structures
  related_structures UUID[], -- Array of structure IDs

  -- Educational metadata
  difficulty INTEGER CHECK (difficulty BETWEEN 1 AND 5),
  prerequisites UUID[], -- Other content IDs
  learning_objectives TEXT[],
  tags TEXT[],

  -- Visibility
  visibility visibility DEFAULT 'private',
  is_published BOOLEAN DEFAULT false,

  -- Stats
  view_count INTEGER DEFAULT 0,
  completion_count INTEGER DEFAULT 0,
  avg_rating NUMERIC(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

-- Learning pathways (structured course-like content)
CREATE TABLE learning_pathways (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,

  -- Pathway structure
  content_sequence UUID[], -- Ordered array of learning_content IDs
  estimated_duration INTEGER, -- Total minutes

  -- Metadata
  difficulty INTEGER CHECK (difficulty BETWEEN 1 AND 5),
  tags TEXT[],
  visibility visibility DEFAULT 'private',
  is_published BOOLEAN DEFAULT false,

  -- Stats
  enrollment_count INTEGER DEFAULT 0,
  completion_count INTEGER DEFAULT 0,
  avg_rating NUMERIC(3,2) DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User progress tracking
CREATE TABLE user_progress (
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  content_id UUID REFERENCES learning_content(id) ON DELETE CASCADE,

  -- Progress
  completed BOOLEAN DEFAULT false,
  progress_percent INTEGER DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
  time_spent INTEGER DEFAULT 0, -- seconds

  -- User data
  notes TEXT,
  bookmarks JSONB, -- Timestamp positions for videos, etc.
  quiz_scores JSONB, -- Historical scores

  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  last_accessed TIMESTAMPTZ DEFAULT NOW(),

  PRIMARY KEY (user_id, content_id)
);

-- Content ratings and reviews
CREATE TABLE content_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES learning_content(id) ON DELETE CASCADE,

  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (user_id, content_id)
);

-- ================================================================
-- SIMULATIONS AND JOBS
-- ================================================================

-- Simulation job queue
CREATE TABLE simulation_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  structure_id UUID NOT NULL REFERENCES structures(id) ON DELETE CASCADE,

  -- Job configuration
  simulation_type simulation_type NOT NULL,
  parameters JSONB NOT NULL,

  -- Status
  status simulation_status DEFAULT 'pending',
  progress_percent INTEGER DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),

  -- Results
  result_path TEXT, -- Storage path for results
  result_data JSONB, -- Summary statistics
  error_message TEXT,

  -- Resource usage
  cpu_time INTEGER, -- seconds
  memory_used BIGINT, -- bytes
  estimated_cost NUMERIC(10,2),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ -- When to delete results
);

-- Simulation result cache
CREATE TABLE simulation_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  structure_hash TEXT NOT NULL,
  simulation_type simulation_type NOT NULL,
  parameters_hash TEXT NOT NULL,

  result_path TEXT NOT NULL,
  result_data JSONB,

  hit_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (structure_hash, simulation_type, parameters_hash)
);

-- ================================================================
-- SHARING AND PERMISSIONS
-- ================================================================

-- Shared access to structures
CREATE TABLE structure_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  structure_id UUID NOT NULL REFERENCES structures(id) ON DELETE CASCADE,
  shared_by UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  shared_with UUID REFERENCES user_profiles(id) ON DELETE CASCADE, -- NULL for link sharing

  permission share_permission DEFAULT 'view',

  -- Link sharing
  share_token TEXT UNIQUE, -- For anonymous link sharing
  expires_at TIMESTAMPTZ,

  -- Restrictions
  max_views INTEGER,
  view_count INTEGER DEFAULT 0,
  require_password BOOLEAN DEFAULT false,
  password_hash TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed TIMESTAMPTZ,

  CONSTRAINT valid_share CHECK (
    (shared_with IS NOT NULL AND share_token IS NULL) OR
    (shared_with IS NULL AND share_token IS NOT NULL)
  )
);

-- Shared access to collections
CREATE TABLE collection_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  shared_by UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  shared_with UUID REFERENCES user_profiles(id) ON DELETE CASCADE,

  permission share_permission DEFAULT 'view',

  share_token TEXT UNIQUE,
  expires_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments on structures
CREATE TABLE structure_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  structure_id UUID NOT NULL REFERENCES structures(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

  content TEXT NOT NULL,
  parent_id UUID REFERENCES structure_comments(id) ON DELETE CASCADE, -- For threading

  -- Associated with specific position/atom
  position JSONB, -- {x, y, z}
  target_atoms INTEGER[], -- Atom indices

  -- Reactions
  like_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_content CHECK (char_length(content) > 0 AND char_length(content) <= 5000)
);

-- Comment likes
CREATE TABLE comment_likes (
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES structure_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  PRIMARY KEY (user_id, comment_id)
);

-- ================================================================
-- INDEXES
-- ================================================================

-- User profiles
CREATE INDEX idx_user_profiles_username ON user_profiles(username);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_institution ON user_profiles(institution);

-- User connections
CREATE INDEX idx_user_connections_follower ON user_connections(follower_id);
CREATE INDEX idx_user_connections_following ON user_connections(following_id);

-- Structures
CREATE INDEX idx_structures_owner ON structures(owner_id);
CREATE INDEX idx_structures_type ON structures(structure_type);
CREATE INDEX idx_structures_visibility ON structures(visibility);
CREATE INDEX idx_structures_tags ON structures USING GIN(tags);
CREATE INDEX idx_structures_created ON structures(created_at DESC);
CREATE INDEX idx_structures_file_hash ON structures(file_hash);
CREATE INDEX idx_structures_parent ON structures(parent_id);

-- Structure search (full-text)
CREATE INDEX idx_structures_search ON structures USING GIN(
  to_tsvector('english', name || ' ' || COALESCE(description, '') || ' ' || COALESCE(formula, ''))
);

-- Structure versions
CREATE INDEX idx_structure_versions_structure ON structure_versions(structure_id);

-- Collections
CREATE INDEX idx_collections_owner ON collections(owner_id);
CREATE INDEX idx_collections_parent ON collections(parent_id);
CREATE INDEX idx_collections_visibility ON collections(visibility);

-- Collection structures
CREATE INDEX idx_collection_structures_collection ON collection_structures(collection_id);
CREATE INDEX idx_collection_structures_structure ON collection_structures(structure_id);

-- Learning content
CREATE INDEX idx_learning_content_creator ON learning_content(creator_id);
CREATE INDEX idx_learning_content_type ON learning_content(content_type);
CREATE INDEX idx_learning_content_visibility ON learning_content(visibility);
CREATE INDEX idx_learning_content_tags ON learning_content USING GIN(tags);
CREATE INDEX idx_learning_content_published ON learning_content(is_published, created_at DESC);

-- User progress
CREATE INDEX idx_user_progress_user ON user_progress(user_id);
CREATE INDEX idx_user_progress_completed ON user_progress(completed);

-- Simulations
CREATE INDEX idx_simulation_jobs_user ON simulation_jobs(user_id);
CREATE INDEX idx_simulation_jobs_structure ON simulation_jobs(structure_id);
CREATE INDEX idx_simulation_jobs_status ON simulation_jobs(status);
CREATE INDEX idx_simulation_jobs_created ON simulation_jobs(created_at DESC);

-- Simulation cache
CREATE INDEX idx_simulation_cache_hash ON simulation_cache(structure_hash, simulation_type);

-- Shares
CREATE INDEX idx_structure_shares_structure ON structure_shares(structure_id);
CREATE INDEX idx_structure_shares_user ON structure_shares(shared_with);
CREATE INDEX idx_structure_shares_token ON structure_shares(share_token);

-- Comments
CREATE INDEX idx_structure_comments_structure ON structure_comments(structure_id);
CREATE INDEX idx_structure_comments_user ON structure_comments(user_id);
CREATE INDEX idx_structure_comments_parent ON structure_comments(parent_id);

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

-- Increment structure view count
CREATE OR REPLACE FUNCTION increment_structure_views(structure_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE structures
  SET view_count = view_count + 1,
      last_accessed = NOW()
  WHERE id = structure_uuid;
END;
$$ LANGUAGE plpgsql;

-- Update user stats on structure creation
CREATE OR REPLACE FUNCTION update_user_structure_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE user_profiles
    SET total_structures = total_structures + 1
    WHERE id = NEW.owner_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE user_profiles
    SET total_structures = GREATEST(total_structures - 1, 0)
    WHERE id = OLD.owner_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Update content rating average
CREATE OR REPLACE FUNCTION update_content_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE learning_content
  SET
    avg_rating = (SELECT AVG(rating) FROM content_reviews WHERE content_id = NEW.content_id),
    rating_count = (SELECT COUNT(*) FROM content_reviews WHERE content_id = NEW.content_id)
  WHERE id = NEW.content_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update comment like count
CREATE OR REPLACE FUNCTION update_comment_likes()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE structure_comments
    SET like_count = like_count + 1
    WHERE id = NEW.comment_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE structure_comments
    SET like_count = GREATEST(like_count - 1, 0)
    WHERE id = OLD.comment_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Search structures (full-text + filters)
CREATE OR REPLACE FUNCTION search_structures(
  search_query TEXT DEFAULT NULL,
  filter_type structure_type DEFAULT NULL,
  filter_visibility visibility DEFAULT NULL,
  filter_tags TEXT[] DEFAULT NULL,
  search_user_id UUID DEFAULT NULL,
  result_limit INTEGER DEFAULT 20,
  result_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  structure_type structure_type,
  thumbnail_url TEXT,
  owner_id UUID,
  owner_username TEXT,
  created_at TIMESTAMPTZ,
  view_count INTEGER,
  favorite_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.name,
    s.description,
    s.structure_type,
    s.thumbnail_url,
    s.owner_id,
    u.username AS owner_username,
    s.created_at,
    s.view_count,
    s.favorite_count
  FROM structures s
  JOIN user_profiles u ON s.owner_id = u.id
  WHERE
    (search_query IS NULL OR to_tsvector('english', s.name || ' ' || COALESCE(s.description, '') || ' ' || COALESCE(s.formula, '')) @@ plainto_tsquery('english', search_query))
    AND (filter_type IS NULL OR s.structure_type = filter_type)
    AND (filter_visibility IS NULL OR s.visibility = filter_visibility)
    AND (filter_tags IS NULL OR s.tags && filter_tags)
    AND (search_user_id IS NULL OR s.owner_id = search_user_id)
  ORDER BY s.created_at DESC
  LIMIT result_limit
  OFFSET result_offset;
END;
$$ LANGUAGE plpgsql;

-- Clean up expired simulations
CREATE OR REPLACE FUNCTION cleanup_expired_simulations()
RETURNS void AS $$
BEGIN
  -- Delete completed simulations past expiry
  DELETE FROM simulation_jobs
  WHERE status = 'completed'
    AND expires_at < NOW();

  -- Cancel stuck jobs (running for more than 24 hours)
  UPDATE simulation_jobs
  SET status = 'failed',
      error_message = 'Job timeout - exceeded maximum runtime'
  WHERE status IN ('running', 'queued')
    AND created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- Clean up old simulation cache
CREATE OR REPLACE FUNCTION cleanup_simulation_cache()
RETURNS void AS $$
BEGIN
  -- Delete cache entries not accessed in 30 days
  DELETE FROM simulation_cache
  WHERE last_accessed < NOW() - INTERVAL '30 days'
    AND hit_count < 5;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- TRIGGERS
-- ================================================================

-- Auto-update timestamps
CREATE TRIGGER update_user_profiles_timestamp
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_structures_timestamp
  BEFORE UPDATE ON structures
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_collections_timestamp
  BEFORE UPDATE ON collections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_learning_content_timestamp
  BEFORE UPDATE ON learning_content
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_structure_comments_timestamp
  BEFORE UPDATE ON structure_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Update user stats
CREATE TRIGGER update_user_structure_count_trigger
  AFTER INSERT OR DELETE ON structures
  FOR EACH ROW
  EXECUTE FUNCTION update_user_structure_count();

-- Update ratings
CREATE TRIGGER update_content_rating_trigger
  AFTER INSERT OR UPDATE ON content_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_content_rating();

-- Update comment likes
CREATE TRIGGER update_comment_likes_trigger
  AFTER INSERT OR DELETE ON comment_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_comment_likes();

-- ================================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE structure_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE structure_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_pathways ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulation_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE structure_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE structure_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

-- User profiles: Public read, own profile write
CREATE POLICY user_profiles_read ON user_profiles
  FOR SELECT
  USING (true); -- All profiles are viewable

CREATE POLICY user_profiles_update ON user_profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- User connections: Read own connections, create own
CREATE POLICY user_connections_read ON user_connections
  FOR SELECT
  USING (auth.uid() = follower_id OR auth.uid() = following_id);

CREATE POLICY user_connections_insert ON user_connections
  FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY user_connections_delete ON user_connections
  FOR DELETE
  USING (auth.uid() = follower_id);

-- Structures: Complex visibility rules
CREATE POLICY structures_read ON structures
  FOR SELECT
  USING (
    visibility = 'public' OR
    owner_id = auth.uid() OR
    id IN (
      SELECT structure_id FROM structure_shares
      WHERE shared_with = auth.uid()
        AND (expires_at IS NULL OR expires_at > NOW())
    )
  );

CREATE POLICY structures_insert ON structures
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY structures_update ON structures
  FOR UPDATE
  USING (
    owner_id = auth.uid() OR
    id IN (
      SELECT structure_id FROM structure_shares
      WHERE shared_with = auth.uid()
        AND permission IN ('edit', 'admin')
        AND (expires_at IS NULL OR expires_at > NOW())
    )
  );

CREATE POLICY structures_delete ON structures
  FOR DELETE
  USING (owner_id = auth.uid());

-- Structure versions: Read if can read structure
CREATE POLICY structure_versions_read ON structure_versions
  FOR SELECT
  USING (
    structure_id IN (SELECT id FROM structures) -- Inherits structure RLS
  );

-- Structure favorites: Own only
CREATE POLICY structure_favorites_all ON structure_favorites
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Collections: Similar to structures
CREATE POLICY collections_read ON collections
  FOR SELECT
  USING (
    visibility = 'public' OR
    owner_id = auth.uid() OR
    id IN (
      SELECT collection_id FROM collection_shares
      WHERE shared_with = auth.uid()
        AND (expires_at IS NULL OR expires_at > NOW())
    )
  );

CREATE POLICY collections_insert ON collections
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY collections_update ON collections
  FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY collections_delete ON collections
  FOR DELETE
  USING (owner_id = auth.uid());

-- Collection structures: If can access collection
CREATE POLICY collection_structures_read ON collection_structures
  FOR SELECT
  USING (collection_id IN (SELECT id FROM collections));

CREATE POLICY collection_structures_modify ON collection_structures
  FOR ALL
  USING (
    collection_id IN (
      SELECT id FROM collections WHERE owner_id = auth.uid()
    )
  );

-- Learning content: Public or own
CREATE POLICY learning_content_read ON learning_content
  FOR SELECT
  USING (
    (is_published = true AND visibility = 'public') OR
    creator_id = auth.uid()
  );

CREATE POLICY learning_content_insert ON learning_content
  FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY learning_content_update ON learning_content
  FOR UPDATE
  USING (creator_id = auth.uid());

CREATE POLICY learning_content_delete ON learning_content
  FOR DELETE
  USING (creator_id = auth.uid());

-- User progress: Own only
CREATE POLICY user_progress_all ON user_progress
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Content reviews: Read all, write own
CREATE POLICY content_reviews_read ON content_reviews
  FOR SELECT
  USING (true);

CREATE POLICY content_reviews_insert ON content_reviews
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY content_reviews_update ON content_reviews
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY content_reviews_delete ON content_reviews
  FOR DELETE
  USING (auth.uid() = user_id);

-- Simulation jobs: Own only
CREATE POLICY simulation_jobs_all ON simulation_jobs
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Simulation cache: Read all (shared cache)
CREATE POLICY simulation_cache_read ON simulation_cache
  FOR SELECT
  USING (true);

-- Shares: Own or shared with you
CREATE POLICY structure_shares_read ON structure_shares
  FOR SELECT
  USING (
    auth.uid() = shared_by OR
    auth.uid() = shared_with OR
    share_token IS NOT NULL -- Link shares viewable if you have the token
  );

CREATE POLICY structure_shares_insert ON structure_shares
  FOR INSERT
  WITH CHECK (auth.uid() = shared_by);

CREATE POLICY structure_shares_delete ON structure_shares
  FOR DELETE
  USING (auth.uid() = shared_by);

-- Comments: Read if can access structure, write if authenticated
CREATE POLICY structure_comments_read ON structure_comments
  FOR SELECT
  USING (
    structure_id IN (SELECT id FROM structures)
  );

CREATE POLICY structure_comments_insert ON structure_comments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY structure_comments_update ON structure_comments
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY structure_comments_delete ON structure_comments
  FOR DELETE
  USING (auth.uid() = user_id);

-- Comment likes: Own only
CREATE POLICY comment_likes_all ON comment_likes
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ================================================================
-- REALTIME PUBLICATION
-- ================================================================

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE user_profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE structures;
ALTER PUBLICATION supabase_realtime ADD TABLE simulation_jobs;
ALTER PUBLICATION supabase_realtime ADD TABLE structure_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE collection_structures;

-- ================================================================
-- INITIAL SEED DATA (Optional)
-- ================================================================

-- Insert default admin user (update with actual admin UUID after first signup)
-- INSERT INTO user_profiles (id, username, display_name, role)
-- VALUES ('00000000-0000-0000-0000-000000000000', 'admin', 'Admin User', 'admin');

-- ================================================================
-- NOTES
-- ================================================================

-- Storage buckets should be created separately:
-- - structures: For molecular structure files
-- - thumbnails: For structure preview images
-- - simulations: For simulation results
-- - learning-content: For videos, guides, etc.
-- - user-avatars: For profile pictures

-- Recommended storage bucket policies:
-- structures: Authenticated users can upload, RLS on download
-- thumbnails: Public read, authenticated write
-- simulations: Private, user-specific access
-- learning-content: Public read for published, private otherwise
-- user-avatars: Public read, own profile write

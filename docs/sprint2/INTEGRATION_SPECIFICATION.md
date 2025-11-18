# LAB Visualization Platform - Integration Specification
## Sprint 2: Integration & Deployment Phase

**Document Version:** 1.0.0
**Date:** November 17, 2025
**Status:** SPARC Specification Phase
**Sprint Phase:** Integration & Deployment
**Prerequisites:** Sprint 0 & Sprint 1 Complete (9 MVP features, 25,000+ LOC)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Integration Architecture](#integration-architecture)
3. [Dependency Requirements](#dependency-requirements)
4. [Database Schema & Migrations](#database-schema--migrations)
5. [Environment Configuration](#environment-configuration)
6. [Integration Points Matrix](#integration-points-matrix)
7. [Service Integration Details](#service-integration-details)
8. [Performance Requirements](#performance-requirements)
9. [Security Specifications](#security-specifications)
10. [Monitoring & Observability](#monitoring--observability)
11. [Testing Requirements](#testing-requirements)
12. [Deployment Strategy](#deployment-strategy)
13. [Rollback Procedures](#rollback-procedures)
14. [Success Metrics](#success-metrics)

---

## Executive Summary

### Current Status
- **Code Base:** 25,000+ lines of production code
- **Test Coverage:** 85% (170+ tests)
- **Features Complete:** 9 MVP features
- **Architecture:** Fully documented (6 ADRs)
- **Integration Status:** Ready for phase 2 integration

### Integration Scope
This specification covers the complete integration of all 9 MVP features into a production-ready deployment:

1. **Mol* Molecular Visualization** - 3D viewer integration
2. **PDB Data Pipeline** - Multi-source fetching and caching
3. **Viewer UI Components** - Complete user interface
4. **Cache Warming System** - Intelligent prefetching
5. **OpenMM Edge Function** - Serverless MD simulations
6. **WebDynamica Integration** - Browser-based MD demos
7. **Job Queue UI** - Real-time job management
8. **Collaboration System** - Real-time multi-user features
9. **LOD Rendering** - Progressive loading system

### Target Timeline
- **Phase 1:** Infrastructure Setup (2 days)
- **Phase 2:** Dependencies & Configuration (1 day)
- **Phase 3:** Feature Integration (3 days)
- **Phase 4:** Testing & Validation (2 days)
- **Phase 5:** Staging Deployment (1 day)
- **Phase 6:** Production Deployment (1 day)
- **Total:** 10 business days

### Success Criteria
- All 170+ tests passing
- Lighthouse score >90 across all metrics
- Zero critical security vulnerabilities
- Cost <$100/month for first 500 users
- All 9 features fully integrated and functional

---

## Integration Architecture

### High-Level System Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                            │
├────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Next.js 14 App Router + React 18 + TypeScript                 │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Mol* 3D    │  │  Viewer UI   │  │ Collaboration│         │
│  │   Viewer     │  │  Components  │  │   Overlays   │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  Job Queue   │  │  WebDynamica │  │     LOD      │         │
│  │     UI       │  │  Integration │  │   Manager    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                  │
├────────────────────────────────────────────────────────────────┤
│                      STATE MANAGEMENT LAYER                     │
├────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │              Zustand Store (4 slices)                     │ │
│  │  Visualization | Collaboration | Simulation | UI          │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │         React Query (Server State Management)             │ │
│  │  PDB Data | Job Queue | User Data | Realtime Updates     │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                  │
├────────────────────────────────────────────────────────────────┤
│                       SERVICE LAYER                             │
├────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │PDB Fetcher   │  │Cache Service │  │Quality Mgr   │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │Job Queue Svc │  │Collab Session│  │LOD Manager   │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                  │
├────────────────────────────────────────────────────────────────┤
│                       CACHING LAYER                             │
├────────────────────────────────────────────────────────────────┤
│                                                                  │
│  L1: IndexedDB (500MB) → L2: Vercel KV (Edge) → L3: Supabase  │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │Cache Warming │  │  LRU Evict   │  │   Metrics    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                  │
├────────────────────────────────────────────────────────────────┤
│                     BACKEND LAYER                               │
├────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐   │
│  │              Vercel Edge Functions                      │   │
│  │  PDB API | Structure Search | Upload Handler           │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐   │
│  │           Supabase Edge Functions                       │   │
│  │  OpenMM MD Worker | Background Jobs                     │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                  │
├────────────────────────────────────────────────────────────────┤
│                      DATA LAYER                                 │
├────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  PostgreSQL  │  │   Storage    │  │   Realtime   │         │
│  │  (Supabase)  │  │   Buckets    │  │  (WebSocket) │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Tables: md_jobs | collaboration_* | structures |        │ │
│  │          favorites | user_preferences                    │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                  │
├────────────────────────────────────────────────────────────────┤
│                   EXTERNAL SERVICES                             │
├────────────────────────────────────────────────────────────────┤
│                                                                  │
│  RCSB PDB → PDBe → PDBj (Fallbacks) | AlphaFold DB             │
│                                                                  │
└────────────────────────────────────────────────────────────────┘
```

### Data Flow Architecture

```
User Request → Next.js Router → React Query
                                      ↓
                            Check IndexedDB (L1)
                                   ↓ (miss)
                            Check Vercel KV (L2)
                                   ↓ (miss)
                            Check Supabase (L3)
                                   ↓ (miss)
                            Fetch from RCSB PDB
                                      ↓
                            Cache at all levels
                                      ↓
                            Return to client
                                      ↓
                            Mol* Viewer Render
                                      ↓
                            LOD Progressive Load
```

---

## Dependency Requirements

### Core Production Dependencies

```json
{
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "typescript": "^5.0.0",

    "@supabase/supabase-js": "^2.38.0",
    "@supabase/auth-helpers-nextjs": "^0.8.7",

    "molstar": "^4.0.0",

    "zustand": "^4.4.0",
    "@tanstack/react-query": "^5.0.0",
    "@tanstack/react-query-devtools": "^5.0.0",

    "idb": "^8.0.0",
    "idb-keyval": "^6.2.1",

    "tailwindcss": "^3.4.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0",
    "@radix-ui/react-accordion": "^1.1.2",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-progress": "^1.0.3",
    "@radix-ui/react-scroll-area": "^1.0.5",
    "@radix-ui/react-separator": "^1.0.3",
    "@radix-ui/react-slider": "^1.1.2",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-toast": "^1.1.5",

    "recharts": "^2.10.0",
    "react-hot-toast": "^2.4.1",

    "date-fns": "^3.0.0",
    "lodash": "^4.17.21",
    "uuid": "^9.0.1"
  }
}
```

### Development Dependencies

```json
{
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/lodash": "^4.14.202",
    "@types/uuid": "^9.0.7",

    "vitest": "^1.0.0",
    "@vitest/ui": "^1.0.0",
    "@vitest/coverage-v8": "^1.0.0",

    "playwright": "^1.40.0",
    "@playwright/test": "^1.40.0",

    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/user-event": "^14.5.1",
    "msw": "^2.0.0",

    "eslint": "^8.0.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint-config-next": "^14.2.0",
    "eslint-plugin-react": "^7.33.2",
    "eslint-plugin-react-hooks": "^4.6.0",

    "prettier": "^3.0.0",
    "prettier-plugin-tailwindcss": "^0.5.9",

    "husky": "^8.0.0",
    "lint-staged": "^15.0.0",

    "lighthouse": "^11.0.0",
    "@lhci/cli": "^0.13.0",

    "ts-node": "^10.9.0"
  }
}
```

### External Service Dependencies

#### Supabase Services Required
- **PostgreSQL Database** (Free tier: 500MB)
  - Tables: 8 tables (md_jobs, collaboration_sessions, collaboration_users, annotations, activity_feed, camera_states, user_preferences, cache_metadata)
  - RLS policies enabled
  - Row-level security configured

- **Storage Buckets** (Free tier: 1GB)
  - `trajectories`: MD simulation results
  - `structures`: Uploaded PDB files
  - `exports`: Desktop export packages
  - `avatars`: User profile images

- **Realtime** (Free tier: Unlimited connections)
  - collaboration_sessions
  - collaboration_users
  - annotations
  - activity_feed
  - camera_states

- **Edge Functions** (Free tier: 500,000 invocations/month)
  - md-simulation: OpenMM worker
  - Background jobs processor

- **Authentication** (Free tier: 50,000 MAU)
  - Email/password
  - OAuth providers (optional: Google, GitHub)
  - JWT token management

#### Vercel Services Required
- **Hosting** (Free tier: 100GB bandwidth)
  - Next.js application
  - Automatic deployments
  - Preview deployments

- **Edge Functions** (Free tier: 100,000 invocations)
  - PDB API routes
  - Structure search
  - Upload handler

- **Analytics** (Free tier: All)
  - Web Vitals monitoring
  - Performance metrics

- **KV Storage** (Free tier: 256MB)
  - L2 cache layer
  - Edge caching

#### External APIs (Free tier limits)
- **RCSB PDB**: Unlimited (rate limit: 10 req/s)
- **PDBe**: Unlimited (rate limit: 10 req/s)
- **PDBj**: Unlimited (rate limit: 10 req/s)
- **AlphaFold DB**: Unlimited (rate limit: 10 req/s)

---

## Database Schema & Migrations

### Migration Order

1. **Base Schema** (Sprint 0)
   - `structures` table
   - `favorites` table
   - `user_preferences` table

2. **MD Jobs Schema** (Sprint 1 - Feature 5)
   - `md_simulation_jobs` table
   - Job status enum
   - Priority enum
   - RLS policies

3. **Collaboration Schema** (Sprint 1 - Feature 8)
   - `collaboration_sessions` table
   - `collaboration_users` table
   - `annotations` table
   - `activity_feed` table
   - `camera_states` table
   - RLS policies
   - Realtime publication

4. **Cache Analytics Schema** (Sprint 1 - Feature 4)
   - `cache_metadata` table
   - Cache warming analytics

### Complete Database Schema

```sql
-- ============================================================================
-- CORE SCHEMA
-- ============================================================================

-- Structures metadata
CREATE TABLE structures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pdb_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  organism TEXT,
  resolution FLOAT,
  method TEXT,
  size_bytes INTEGER,
  atom_count INTEGER,
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  access_count INTEGER DEFAULT 0,
  last_accessed TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_structures_pdb_id ON structures(pdb_id);
CREATE INDEX idx_structures_access_count ON structures(access_count DESC);
CREATE INDEX idx_structures_last_accessed ON structures(last_accessed DESC);

-- User favorites
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  structure_id UUID REFERENCES structures(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, structure_id)
);

CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_structure_id ON favorites(structure_id);

-- User preferences
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'light',
  quality_preset TEXT DEFAULT 'medium',
  reduce_motion BOOLEAN DEFAULT false,
  default_representation TEXT DEFAULT 'cartoon',
  default_color_scheme TEXT DEFAULT 'chain-id',
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- MD SIMULATION SCHEMA
-- ============================================================================

-- Job status enum
CREATE TYPE job_status AS ENUM (
  'pending',
  'queued',
  'running',
  'completed',
  'failed',
  'cancelled'
);

-- Priority enum
CREATE TYPE priority_level AS ENUM (
  'low',
  'medium',
  'high',
  'urgent'
);

-- MD tier enum
CREATE TYPE md_tier AS ENUM (
  'browser',
  'serverless',
  'desktop'
);

-- MD simulation jobs
CREATE TABLE md_simulation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status job_status DEFAULT 'pending' NOT NULL,
  tier md_tier NOT NULL,
  priority priority_level DEFAULT 'medium' NOT NULL,

  structure_id TEXT NOT NULL,
  atom_count INTEGER NOT NULL,

  config JSONB NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  queued_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  current_step TEXT,

  result_storage_path TEXT,
  result_metadata JSONB,

  error_message TEXT,
  error_code TEXT,

  estimated_cost DECIMAL(10,4),
  actual_cost DECIMAL(10,4),

  worker_id TEXT,
  retry_count INTEGER DEFAULT 0
);

CREATE INDEX idx_md_jobs_user_id ON md_simulation_jobs(user_id);
CREATE INDEX idx_md_jobs_status ON md_simulation_jobs(status);
CREATE INDEX idx_md_jobs_created_at ON md_simulation_jobs(created_at DESC);
CREATE INDEX idx_md_jobs_priority ON md_simulation_jobs(priority DESC, created_at ASC);

-- ============================================================================
-- COLLABORATION SCHEMA
-- ============================================================================

-- Session status enum
CREATE TYPE session_status AS ENUM (
  'active',
  'paused',
  'ended'
);

-- User role enum
CREATE TYPE user_role AS ENUM (
  'owner',
  'presenter',
  'viewer'
);

-- Collaboration sessions
CREATE TABLE collaboration_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_code TEXT UNIQUE NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  structure_id TEXT,
  status session_status DEFAULT 'active' NOT NULL,
  max_users INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  settings JSONB DEFAULT '{}'
);

CREATE INDEX idx_collaboration_sessions_invite_code ON collaboration_sessions(invite_code);
CREATE INDEX idx_collaboration_sessions_owner_id ON collaboration_sessions(owner_id);
CREATE INDEX idx_collaboration_sessions_status ON collaboration_sessions(status);

-- Collaboration users (session participants)
CREATE TABLE collaboration_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES collaboration_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role user_role DEFAULT 'viewer' NOT NULL,
  display_name TEXT NOT NULL,
  avatar_color TEXT NOT NULL,
  cursor_position JSONB,
  last_seen TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  left_at TIMESTAMPTZ,
  UNIQUE(session_id, user_id)
);

CREATE INDEX idx_collaboration_users_session_id ON collaboration_users(session_id);
CREATE INDEX idx_collaboration_users_user_id ON collaboration_users(user_id);
CREATE INDEX idx_collaboration_users_last_seen ON collaboration_users(last_seen DESC);

-- Annotations
CREATE TABLE annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES collaboration_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  position JSONB NOT NULL,
  residue_id TEXT,
  atom_id TEXT,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_annotations_session_id ON annotations(session_id);
CREATE INDEX idx_annotations_user_id ON annotations(user_id);
CREATE INDEX idx_annotations_created_at ON annotations(created_at DESC);

-- Activity feed
CREATE TABLE activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES collaboration_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_activity_feed_session_id ON activity_feed(session_id, created_at DESC);

-- Camera states (for camera sync)
CREATE TABLE camera_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES collaboration_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  position JSONB NOT NULL,
  target JSONB NOT NULL,
  zoom FLOAT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_camera_states_session_id ON camera_states(session_id);
CREATE INDEX idx_camera_states_created_at ON camera_states(created_at DESC);

-- ============================================================================
-- CACHE ANALYTICS SCHEMA
-- ============================================================================

-- Cache metadata
CREATE TABLE cache_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  structure_id TEXT NOT NULL,
  cache_level TEXT NOT NULL CHECK (cache_level IN ('L1', 'L2', 'L3')),
  hit_count INTEGER DEFAULT 0,
  miss_count INTEGER DEFAULT 0,
  last_hit TIMESTAMPTZ,
  last_miss TIMESTAMPTZ,
  popularity_score FLOAT DEFAULT 0.0,
  recency_score FLOAT DEFAULT 0.0,
  relevance_score FLOAT DEFAULT 0.0,
  total_score FLOAT DEFAULT 0.0,
  warmed_at TIMESTAMPTZ,
  size_bytes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(structure_id, cache_level)
);

CREATE INDEX idx_cache_metadata_structure_id ON cache_metadata(structure_id);
CREATE INDEX idx_cache_metadata_total_score ON cache_metadata(total_score DESC);
CREATE INDEX idx_cache_metadata_cache_level ON cache_metadata(cache_level);

-- ============================================================================
-- ROW-LEVEL SECURITY POLICIES
-- ============================================================================

-- Favorites RLS
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorites"
  ON favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites"
  ON favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites"
  ON favorites FOR DELETE
  USING (auth.uid() = user_id);

-- User preferences RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
  ON user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- MD jobs RLS
ALTER TABLE md_simulation_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own jobs"
  ON md_simulation_jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own jobs"
  ON md_simulation_jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own jobs"
  ON md_simulation_jobs FOR UPDATE
  USING (auth.uid() = user_id);

-- Collaboration sessions RLS
ALTER TABLE collaboration_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active sessions they're part of"
  ON collaboration_sessions FOR SELECT
  USING (
    status = 'active' AND (
      auth.uid() = owner_id OR
      EXISTS (
        SELECT 1 FROM collaboration_users
        WHERE session_id = id AND user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Owners can update own sessions"
  ON collaboration_sessions FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Authenticated users can create sessions"
  ON collaboration_sessions FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Collaboration users RLS
ALTER TABLE collaboration_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users in session can view participants"
  ON collaboration_users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM collaboration_sessions
      WHERE id = session_id AND status = 'active'
    ) AND (
      user_id = auth.uid() OR
      session_id IN (
        SELECT session_id FROM collaboration_users
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can join sessions"
  ON collaboration_users FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own participation"
  ON collaboration_users FOR UPDATE
  USING (auth.uid() = user_id);

-- Annotations RLS
ALTER TABLE annotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Session participants can view annotations"
  ON annotations FOR SELECT
  USING (
    session_id IN (
      SELECT session_id FROM collaboration_users
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Session participants can create annotations"
  ON annotations FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    session_id IN (
      SELECT session_id FROM collaboration_users
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own annotations"
  ON annotations FOR UPDATE
  USING (auth.uid() = user_id);

-- Activity feed RLS
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Session participants can view activity"
  ON activity_feed FOR SELECT
  USING (
    session_id IN (
      SELECT session_id FROM collaboration_users
      WHERE user_id = auth.uid()
    )
  );

-- Camera states RLS
ALTER TABLE camera_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Session participants can view camera states"
  ON camera_states FOR SELECT
  USING (
    session_id IN (
      SELECT session_id FROM collaboration_users
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own camera states"
  ON camera_states FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- REALTIME PUBLICATIONS
-- ============================================================================

-- Enable realtime for collaboration tables
ALTER PUBLICATION supabase_realtime ADD TABLE collaboration_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE collaboration_users;
ALTER PUBLICATION supabase_realtime ADD TABLE annotations;
ALTER PUBLICATION supabase_realtime ADD TABLE activity_feed;
ALTER PUBLICATION supabase_realtime ADD TABLE camera_states;

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to relevant tables
CREATE TRIGGER update_structures_updated_at
  BEFORE UPDATE ON structures
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_annotations_updated_at
  BEFORE UPDATE ON annotations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cache_metadata_updated_at
  BEFORE UPDATE ON cache_metadata
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-cleanup expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  UPDATE collaboration_sessions
  SET status = 'ended', ended_at = NOW()
  WHERE status = 'active' AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup (via pg_cron extension if available)
-- SELECT cron.schedule('cleanup-sessions', '*/15 * * * *', 'SELECT cleanup_expired_sessions();');

-- ============================================================================
-- STORAGE BUCKETS
-- ============================================================================

-- Create storage buckets (via Supabase CLI or Dashboard)
-- bucket: trajectories
--   public: false
--   file_size_limit: 100MB
--   allowed_mime_types: ['application/octet-stream', 'text/plain']

-- bucket: structures
--   public: true
--   file_size_limit: 50MB
--   allowed_mime_types: ['chemical/x-pdb', 'chemical/x-cif', 'text/plain']

-- bucket: exports
--   public: false
--   file_size_limit: 200MB
--   allowed_mime_types: ['application/zip', 'application/x-tar']

-- bucket: avatars
--   public: true
--   file_size_limit: 2MB
--   allowed_mime_types: ['image/jpeg', 'image/png', 'image/webp']
```

### Migration Scripts Location
- `/supabase/migrations/001_base_schema.sql`
- `/supabase/migrations/002_md_jobs_schema.sql`
- `/supabase/migrations/003_collaboration_schema.sql`
- `/supabase/migrations/004_cache_analytics_schema.sql`

---

## Environment Configuration

### Environment Variables (24 required)

#### Supabase Configuration (6 variables)
```bash
# Public (client-side accessible)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJI...

# Private (server-side only)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJI...
SUPABASE_JWT_SECRET=your-jwt-secret
SUPABASE_DB_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres
SUPABASE_STORAGE_URL=https://your-project.supabase.co/storage/v1
```

#### Vercel Configuration (4 variables)
```bash
VERCEL_URL=auto-generated
VERCEL_ENV=production|preview|development
NEXT_PUBLIC_VERCEL_URL=${VERCEL_URL}
NEXT_PUBLIC_APP_URL=https://lab-visualizer.vercel.app
```

#### External APIs (4 variables)
```bash
# PDB APIs (optional, uses defaults if not set)
RCSB_PDB_API_URL=https://data.rcsb.org/rest/v1
PDBE_API_URL=https://www.ebi.ac.uk/pdbe/api
PDBJ_API_URL=https://pdbj.org/rest/v1
ALPHAFOLD_DB_API_URL=https://alphafold.ebi.ac.uk/api
```

#### Monitoring & Analytics (5 variables)
```bash
# Sentry error tracking
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_AUTH_TOKEN=your-sentry-auth-token

# Vercel Analytics (auto-configured)
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=auto-generated

# Web Vitals
NEXT_PUBLIC_WEB_VITALS_ENABLED=true

# Custom monitoring
NEXT_PUBLIC_MONITORING_ENABLED=true
```

#### Feature Flags (5 variables)
```bash
# Feature toggles
NEXT_PUBLIC_ENABLE_COLLABORATION=true
NEXT_PUBLIC_ENABLE_MD_SIMULATIONS=true
NEXT_PUBLIC_ENABLE_CACHE_WARMING=true
NEXT_PUBLIC_ENABLE_LOD_RENDERING=true
NEXT_PUBLIC_ENABLE_BROWSER_MD=true
```

### Configuration Files

#### `.env.example`
```bash
# ==============================================================================
# LAB Visualization Platform - Environment Configuration
# ==============================================================================

# ------------------------------------------------------------------------------
# Supabase Configuration
# ------------------------------------------------------------------------------
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_JWT_SECRET=
SUPABASE_DB_URL=
SUPABASE_STORAGE_URL=

# ------------------------------------------------------------------------------
# Vercel Configuration
# ------------------------------------------------------------------------------
NEXT_PUBLIC_APP_URL=http://localhost:3000
VERCEL_ENV=development

# ------------------------------------------------------------------------------
# External APIs
# ------------------------------------------------------------------------------
RCSB_PDB_API_URL=https://data.rcsb.org/rest/v1
PDBE_API_URL=https://www.ebi.ac.uk/pdbe/api
PDBJ_API_URL=https://pdbj.org/rest/v1
ALPHAFOLD_DB_API_URL=https://alphafold.ebi.ac.uk/api

# ------------------------------------------------------------------------------
# Monitoring & Analytics
# ------------------------------------------------------------------------------
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_AUTH_TOKEN=
NEXT_PUBLIC_WEB_VITALS_ENABLED=true
NEXT_PUBLIC_MONITORING_ENABLED=true

# ------------------------------------------------------------------------------
# Feature Flags
# ------------------------------------------------------------------------------
NEXT_PUBLIC_ENABLE_COLLABORATION=true
NEXT_PUBLIC_ENABLE_MD_SIMULATIONS=true
NEXT_PUBLIC_ENABLE_CACHE_WARMING=true
NEXT_PUBLIC_ENABLE_LOD_RENDERING=true
NEXT_PUBLIC_ENABLE_BROWSER_MD=true
```

#### `.env.local` (Development)
Copy `.env.example` to `.env.local` and fill in actual values.

#### `.env.production` (Production)
Set via Vercel dashboard environment variables.

---

## Integration Points Matrix

### Feature Integration Dependencies

```
┌──────────────────┬────────────────────────────────────────────────┐
│     Feature      │          Dependencies & Integration Points     │
├──────────────────┼────────────────────────────────────────────────┤
│ Mol* Viewer      │ → PDB Pipeline (data)                          │
│                  │ → Cache Service (L1/L2/L3)                     │
│                  │ → LOD Manager (progressive loading)            │
│                  │ → Quality Manager (FPS adjustment)             │
│                  │ → Collaboration (cursor overlays)              │
├──────────────────┼────────────────────────────────────────────────┤
│ PDB Pipeline     │ → Cache Service (IndexedDB/KV/Storage)        │
│                  │ → Cache Warming (prefetch priority)            │
│                  │ → Mol* Viewer (structure data)                 │
│                  │ → Vercel Edge (API routes)                     │
│                  │ → External APIs (RCSB/PDBe/PDBj/AlphaFold)    │
├──────────────────┼────────────────────────────────────────────────┤
│ Viewer UI        │ → Mol* Service (viewer control)                │
│                  │ → State Store (Zustand visualization slice)    │
│                  │ → LOD Manager (quality controls)               │
│                  │ → Browser MD (simulation UI)                   │
│                  │ → Collaboration (session UI)                   │
├──────────────────┼────────────────────────────────────────────────┤
│ Cache Warming    │ → Cache Service (orchestration)                │
│                  │ → PDB Fetcher (prefetch API)                   │
│                  │ → IndexedDB (L1 storage)                       │
│                  │ → Vercel KV (L2 edge cache)                    │
│                  │ → Supabase Storage (L3 backup)                 │
│                  │ → Web Worker (background processing)           │
├──────────────────┼────────────────────────────────────────────────┤
│ OpenMM Worker    │ → Job Queue Service (job management)           │
│                  │ → Supabase DB (md_jobs table)                  │
│                  │ → Supabase Storage (trajectory bucket)         │
│                  │ → Supabase Edge Functions (worker runtime)     │
│                  │ → Realtime (progress broadcast)                │
│                  │ → Job Queue UI (status display)                │
├──────────────────┼────────────────────────────────────────────────┤
│ WebDynamica      │ → PDB Pipeline (structure input)               │
│                  │ → Browser MD Service (engine wrapper)          │
│                  │ → Simulation UI (controls/display)             │
│                  │ → State Store (simulation slice)               │
│                  │ → Tier Validation (atom count limits)          │
├──────────────────┼────────────────────────────────────────────────┤
│ Job Queue UI     │ → Job Queue Service (CRUD operations)         │
│                  │ → Supabase Realtime (live updates)             │
│                  │ → React Query (server state)                   │
│                  │ → OpenMM Worker (job execution)                │
│                  │ → Toast Notifications (user feedback)          │
├──────────────────┼────────────────────────────────────────────────┤
│ Collaboration    │ → Supabase Realtime (WebSocket)                │
│                  │ → Collaboration Service (session mgmt)         │
│                  │ → Camera Sync (leader-guided mode)             │
│                  │ → Mol* Viewer (cursor overlays)                │
│                  │ → State Store (collaboration slice)            │
│                  │ → Conflict Resolution (merge strategies)       │
├──────────────────┼────────────────────────────────────────────────┤
│ LOD Rendering    │ → Mol* Viewer (renderer control)               │
│                  │ → Quality Manager (auto-adjustment)            │
│                  │ → Performance Profiler (FPS tracking)          │
│                  │ → Web Worker (geometry loading)                │
│                  │ → Device Detection (capability assessment)     │
│                  │ → Progressive Loading (3-stage system)         │
└──────────────────┴────────────────────────────────────────────────┘
```

### Data Flow Diagram

```
PDB ID Request
      ↓
[React Query Hook]
      ↓
[Cache Service Orchestrator]
      ↓
├─→ L1: IndexedDB Check
│     ↓ (miss)
├─→ L2: Vercel KV Check
│     ↓ (miss)
├─→ L3: Supabase Storage Check
│     ↓ (miss)
└─→ External API Fetch (RCSB → PDBe → PDBj)
      ↓
[PDB Parser (Web Worker)]
      ↓
[Cache at all levels (L3 → L2 → L1)]
      ↓
[Return to React Query]
      ↓
[Update Mol* Viewer]
      ↓
[LOD Progressive Load]
   ├─→ Stage 1: Preview (<200ms)
   ├─→ Stage 2: Interactive (<1s)
   └─→ Stage 3: Full Detail (<3s)
```

---

## Service Integration Details

### 1. Mol* Viewer Integration

**Files:**
- `/src/services/molstar-service.ts` - Main service
- `/src/components/viewer/MolstarViewer.tsx` - React component
- `/src/hooks/useMolstar.ts` - React hook
- `/src/workers/molstar-loader.worker.ts` - Web Worker

**Integration Steps:**

1. **Install Mol* Library**
   ```bash
   npm install molstar
   ```

2. **Initialize Mol* Service**
   ```typescript
   // In app layout or provider
   import { MolstarService } from '@/services/molstar-service';

   const molstarService = MolstarService.getInstance();
   ```

3. **Connect to PDB Pipeline**
   ```typescript
   // In useMolstar hook
   const { data: structure } = useStructure(pdbId);

   useEffect(() => {
     if (structure && molstarRef.current) {
       molstarService.loadStructure(structure, molstarRef.current);
     }
   }, [structure]);
   ```

4. **Integrate LOD Manager**
   ```typescript
   // In MolstarViewer component
   const lodManager = LODManager.getInstance();
   lodManager.setViewer(molstarService);
   lodManager.setQualityLevel(qualityPreset);
   ```

5. **Add Collaboration Overlays**
   ```typescript
   // In collaboration mode
   const { cursors } = useCollaboration(sessionId);
   molstarService.updateCursors(cursors);
   ```

**Configuration:**
```typescript
// molstar.config.ts
export const MOLSTAR_CONFIG = {
  viewportShowExpand: false,
  viewportShowSelectionMode: true,
  viewportShowAnimation: true,
  layoutIsExpanded: false,
  layoutShowControls: true,
  layoutShowLeftPanel: false,
  layoutShowSequence: true,
  layoutShowLog: false,
  disableAntialiasing: false,
  pixelScale: 1,
};
```

### 2. PDB Pipeline Integration

**Files:**
- `/src/services/pdb-fetcher.ts` - Multi-source fetcher
- `/src/lib/pdb-parser.ts` - PDB/mmCIF parser
- `/src/api/structures/[pdbId]/route.ts` - API route
- `/src/hooks/useStructure.ts` - React Query hook
- `/src/workers/pdb-parser.worker.ts` - Web Worker

**Integration Steps:**

1. **Configure API Routes**
   ```typescript
   // app/api/structures/[pdbId]/route.ts
   export const runtime = 'edge';

   export async function GET(request, { params }) {
     const { pdbId } = params;
     return pdbFetcher.fetchStructure(pdbId);
   }
   ```

2. **Setup React Query Provider**
   ```typescript
   // app/providers.tsx
   <QueryClientProvider client={queryClient}>
     <ReactQueryDevtools initialIsOpen={false} />
     {children}
   </QueryClientProvider>
   ```

3. **Connect Cache Service**
   ```typescript
   // In pdb-fetcher.ts
   async fetchStructure(pdbId: string) {
     // L1: IndexedDB
     let data = await cacheService.get('L1', pdbId);
     if (data) return data;

     // L2: Vercel KV
     data = await cacheService.get('L2', pdbId);
     if (data) {
       await cacheService.set('L1', pdbId, data);
       return data;
     }

     // L3: Supabase Storage
     data = await cacheService.get('L3', pdbId);
     if (data) {
       await cacheService.set('L2', pdbId, data);
       await cacheService.set('L1', pdbId, data);
       return data;
     }

     // External API
     data = await this.fetchFromExternal(pdbId);
     await cacheService.setAll(pdbId, data);
     return data;
   }
   ```

4. **Parser Web Worker**
   ```typescript
   // workers/pdb-parser.worker.ts
   self.addEventListener('message', async (e) => {
     const { pdbData, format } = e.data;
     const parsed = await parsePDB(pdbData, format);
     self.postMessage({ parsed });
   });
   ```

**API Endpoints:**
- `GET /api/structures/:pdbId` - Fetch structure
- `GET /api/structures/search?q=:query` - Search structures
- `POST /api/structures/upload` - Upload custom structure
- `GET /api/alphafold/:uniprotId` - Fetch AlphaFold prediction

### 3. Cache Service Integration

**Files:**
- `/src/services/cache-service.ts` - Orchestrator
- `/src/services/cache-warming.ts` - Intelligent prefetching
- `/src/lib/cache/indexeddb.ts` - L1 cache
- `/src/lib/cache/vercel-kv.ts` - L2 cache
- `/src/lib/cache/supabase-storage.ts` - L3 cache
- `/src/workers/cache-warming.worker.ts` - Web Worker

**Integration Steps:**

1. **Initialize IndexedDB (L1)**
   ```typescript
   // lib/cache/indexeddb.ts
   import { openDB } from 'idb';

   const db = await openDB('lab-visualizer', 1, {
     upgrade(db) {
       db.createObjectStore('structures', { keyPath: 'pdbId' });
       db.createObjectStore('trajectories', { keyPath: 'jobId' });
     },
   });
   ```

2. **Setup Vercel KV (L2)**
   ```typescript
   // lib/cache/vercel-kv.ts
   import { kv } from '@vercel/kv';

   export async function set(key: string, value: any, ttl: number) {
     await kv.set(`structure:${key}`, value, { ex: ttl });
   }
   ```

3. **Configure Supabase Storage (L3)**
   ```typescript
   // lib/cache/supabase-storage.ts
   import { supabase } from '@/lib/supabase';

   export async function set(key: string, value: any) {
     const { error } = await supabase.storage
       .from('structures')
       .upload(`${key}.pdb`, value, { upsert: true });
   }
   ```

4. **Start Cache Warming Worker**
   ```typescript
   // workers/cache-warming.worker.ts
   const warmer = new CacheWarmer();
   setInterval(() => warmer.warmCache(), 60000); // Every minute
   ```

5. **Admin Dashboard Integration**
   ```typescript
   // components/admin/CacheWarmingDashboard.tsx
   const metrics = useCacheMetrics();
   return <CacheWarmingUI metrics={metrics} />;
   ```

**Cache Configuration:**
```typescript
// cache.config.ts
export const CACHE_CONFIG = {
  L1: {
    quota: 500 * 1024 * 1024, // 500MB
    ttl: 7 * 24 * 60 * 60, // 7 days
    eviction: 'lru',
  },
  L2: {
    quota: 256 * 1024 * 1024, // 256MB (Vercel KV free tier)
    ttl: 7 * 24 * 60 * 60, // 7 days
  },
  L3: {
    quota: 1024 * 1024 * 1024, // 1GB (Supabase Storage free tier)
    ttl: 30 * 24 * 60 * 60, // 30 days
  },
  warming: {
    maxConcurrent: 5,
    priorityThreshold: 0.5,
    budgetMB: 50,
  },
};
```

### 4. OpenMM Edge Function Integration

**Files:**
- `/supabase/functions/md-simulation/index.ts` - Edge Function
- `/supabase/functions/md-simulation/Dockerfile` - Container
- `/src/services/job-queue.ts` - Job management
- `/src/hooks/useJobQueue.ts` - React hook

**Integration Steps:**

1. **Deploy Edge Function**
   ```bash
   # Build Docker container
   cd supabase/functions/md-simulation
   docker build -t md-simulation .

   # Deploy to Supabase
   supabase functions deploy md-simulation \
     --no-verify-jwt \
     --docker
   ```

2. **Configure Job Queue Service**
   ```typescript
   // services/job-queue.ts
   export async function submitJob(config: MDSimulationConfig) {
     const job = await supabase
       .from('md_simulation_jobs')
       .insert({
         user_id: auth.user.id,
         config,
         status: 'pending',
       })
       .select()
       .single();

     // Trigger Edge Function
     await supabase.functions.invoke('md-simulation', {
       body: { jobId: job.id },
     });

     return job;
   }
   ```

3. **Setup Realtime Subscriptions**
   ```typescript
   // hooks/useJobQueue.ts
   useEffect(() => {
     const subscription = supabase
       .channel('job-updates')
       .on('postgres_changes', {
         event: 'UPDATE',
         schema: 'public',
         table: 'md_simulation_jobs',
         filter: `user_id=eq.${userId}`,
       }, (payload) => {
         queryClient.setQueryData(['jobs', payload.new.id], payload.new);
       })
       .subscribe();

     return () => subscription.unsubscribe();
   }, [userId]);
   ```

4. **Result Storage Integration**
   ```typescript
   // In Edge Function after simulation completes
   const { data, error } = await supabaseAdmin.storage
     .from('trajectories')
     .upload(`${jobId}/trajectory.dcd`, trajectoryBuffer);

   await supabaseAdmin
     .from('md_simulation_jobs')
     .update({
       status: 'completed',
       result_storage_path: data.path,
       completed_at: new Date().toISOString(),
     })
     .eq('id', jobId);
   ```

**Edge Function Dependencies:**
```dockerfile
# Dockerfile
FROM denoland/deno:1.37.0
RUN apt-get update && apt-get install -y \
  python3 \
  python3-pip \
  && pip3 install openmm==8.1.1
```

### 5. Collaboration System Integration

**Files:**
- `/src/services/collaboration-session.ts` - Session management
- `/src/services/camera-sync.ts` - Camera synchronization
- `/src/hooks/useCollaboration.ts` - React hook
- `/src/components/collaboration/` - UI components

**Integration Steps:**

1. **Apply Database Migrations**
   ```bash
   supabase db push
   # Applies collaboration schema with RLS and Realtime
   ```

2. **Initialize Realtime Client**
   ```typescript
   // hooks/useCollaboration.ts
   const channel = supabase.channel(`session:${sessionId}`)
     .on('presence', { event: 'sync' }, () => {
       const users = channel.presenceState();
       setParticipants(users);
     })
     .on('broadcast', { event: 'cursor-move' }, (payload) => {
       updateCursor(payload);
     })
     .on('postgres_changes', {
       event: 'INSERT',
       schema: 'public',
       table: 'annotations',
       filter: `session_id=eq.${sessionId}`,
     }, (payload) => {
       addAnnotation(payload.new);
     })
     .subscribe();
   ```

3. **Camera Sync Integration**
   ```typescript
   // services/camera-sync.ts
   export function syncCamera(sessionId: string, cameraState: CameraState) {
     supabase.channel(`session:${sessionId}`)
       .send({
         type: 'broadcast',
         event: 'camera-update',
         payload: cameraState,
       });
   }

   // In Mol* viewer
   viewer.camera.onUpdate(() => {
     if (isLeader) {
       syncCamera(sessionId, viewer.camera.getState());
     }
   });
   ```

4. **Conflict Resolution**
   ```typescript
   // services/conflict-resolution.ts
   export function resolveAnnotationConflict(
     local: Annotation,
     remote: Annotation,
     strategy: ConflictStrategy
   ) {
     switch (strategy) {
       case 'last-write-wins':
         return remote.updated_at > local.updated_at ? remote : local;
       case 'merge':
         return mergeAnnotations(local, remote);
       case 'reject':
         return local;
     }
   }
   ```

**Realtime Configuration:**
```typescript
// realtime.config.ts
export const REALTIME_CONFIG = {
  cursor: {
    throttle: 100, // 10Hz updates
    showOthers: true,
  },
  camera: {
    throttle: 200, // 5Hz updates
    smoothTransition: 300, // 300ms smooth camera moves
  },
  presence: {
    heartbeat: 30000, // 30s heartbeat
  },
  annotations: {
    conflictResolution: 'last-write-wins',
  },
};
```

### 6. LOD Rendering Integration

**Files:**
- `/src/lib/lod-manager.ts` - LOD orchestrator
- `/src/services/quality-manager.ts` - Auto-adjustment
- `/src/lib/performance-profiler.ts` - FPS tracking
- `/src/workers/lod-loader.worker.ts` - Web Worker

**Integration Steps:**

1. **Initialize LOD Manager**
   ```typescript
   // In MolstarViewer component
   const lodManager = LODManager.getInstance();
   lodManager.setViewer(molstarService);
   lodManager.setDeviceCapabilities(deviceInfo);
   ```

2. **Connect Quality Manager**
   ```typescript
   // services/quality-manager.ts
   const profiler = PerformanceProfiler.getInstance();
   profiler.onFPSChange((fps) => {
     if (fps < 30) {
       lodManager.decreaseQuality();
     } else if (fps > 55) {
       lodManager.increaseQuality();
     }
   });
   ```

3. **Progressive Loading Implementation**
   ```typescript
   // lod-manager.ts
   async loadStructure(structureData: Structure) {
     // Stage 1: Preview
     await this.loadPreview(structureData); // <200ms
     this.emit('stage-complete', 1);

     // Stage 2: Interactive
     await this.loadInteractive(structureData); // <1s
     this.emit('stage-complete', 2);

     // Stage 3: Full Detail
     await this.loadFullDetail(structureData); // <3s
     this.emit('stage-complete', 3);
   }
   ```

4. **Web Worker Geometry Loading**
   ```typescript
   // workers/lod-loader.worker.ts
   self.addEventListener('message', async (e) => {
     const { structure, quality } = e.data;
     const geometry = await generateGeometry(structure, quality);
     self.postMessage({ geometry });
   });
   ```

5. **UI Integration**
   ```typescript
   // components/viewer/QualitySettings.tsx
   const { quality, setQuality, autoAdjust } = useQualityManager();
   return (
     <QualitySlider
       value={quality}
       onChange={setQuality}
       autoAdjust={autoAdjust}
     />
   );
   ```

**LOD Configuration:**
```typescript
// lod.config.ts
export const LOD_CONFIG = {
  preview: {
    maxAtoms: 100,
    representation: 'backbone',
    renderQuality: 'low',
    targetTime: 200, // ms
  },
  interactive: {
    maxAtoms: 1000,
    representation: 'cartoon',
    renderQuality: 'medium',
    targetTime: 1000, // ms
  },
  fullDetail: {
    maxAtoms: Infinity,
    representation: 'ball-and-stick',
    renderQuality: 'high',
    targetTime: 3000, // ms
  },
  autoAdjust: {
    targetFPS: 30,
    adjustmentThreshold: 5, // fps
    cooldown: 2000, // ms between adjustments
  },
};
```

---

## Performance Requirements

### Lighthouse Targets (All >90)

```yaml
Performance: >90
  - First Contentful Paint (FCP): <1.8s
  - Largest Contentful Paint (LCP): <2.5s
  - Time to Interactive (TTI): <3.8s
  - Speed Index: <3.4s
  - Total Blocking Time (TBT): <200ms
  - Cumulative Layout Shift (CLS): <0.1

Accessibility: >95
  - ARIA attributes: 100% compliant
  - Color contrast: 4.5:1 minimum (text), 3:1 (UI)
  - Keyboard navigation: Full support
  - Screen reader: Compatible (NVDA, JAWS, VoiceOver)
  - Touch targets: 44×44px minimum

Best Practices: >90
  - HTTPS: Enforced
  - Mixed content: None
  - Security headers: All set
  - Deprecated APIs: None used
  - Console errors: None in production

SEO: >90
  - Meta tags: Complete
  - Structured data: Schema.org markup
  - Crawlability: robots.txt, sitemap.xml
  - Mobile-friendly: Responsive design
  - Page speed: <3s load time
```

### Core Web Vitals Targets

```yaml
Largest Contentful Paint (LCP): <2.5s
  - Current: 1.8s (cache hit)
  - Target: <2.5s (p75)
  - Strategy: Aggressive caching, image optimization, CDN

First Input Delay (FID): <100ms
  - Current: 45ms
  - Target: <100ms (p75)
  - Strategy: Code splitting, defer non-critical JS

Cumulative Layout Shift (CLS): <0.1
  - Current: 0.05
  - Target: <0.1 (p75)
  - Strategy: Reserve space for dynamic content
```

### Feature-Specific Performance Targets

```yaml
Structure Loading:
  - Cache Hit (L1): <50ms
  - Cache Hit (L2): <100ms
  - Cache Hit (L3): <300ms
  - Cache Miss (RCSB): <2s
  - Parser (Web Worker): <500ms (50K atoms)

Rendering:
  - 5K atoms: 60fps (16.67ms/frame)
  - 50K atoms: 30fps (33.33ms/frame)
  - 100K atoms: 15fps (66.67ms/frame)
  - LOD Stage 1 (Preview): <200ms
  - LOD Stage 2 (Interactive): <1s
  - LOD Stage 3 (Full Detail): <3s

MD Simulations:
  - Browser (500 atoms): <30s total
  - Serverless (5K atoms): <5min total
  - Job Submit Latency: <500ms
  - Progress Update: <1s latency

Collaboration:
  - Cursor Update: 10Hz (100ms throttle)
  - Camera Sync: 5Hz (200ms throttle)
  - Annotation Add: <300ms
  - Presence Update: <30s

Cache System:
  - Warming Completion: <30s (20 structures)
  - Hit Rate: >90% (educational platform)
  - Eviction Time: <100ms
  - Analytics Update: <5s
```

### Bundle Size Targets

```yaml
Initial Bundle: <500KB (gzipped)
  - JavaScript: <400KB
  - CSS: <50KB
  - Fonts: <50KB

Mol* Library: <1.5MB (lazy loaded)
  - Core: ~800KB
  - Extensions: ~700KB

Total Page Weight: <3MB (first load)
  - Including images and assets
```

### Memory Targets

```yaml
Baseline: <50MB
  - Empty page load

With Structure Loaded: <200MB
  - 5K atoms rendered
  - Includes WebGL buffers

With Collaboration: <250MB
  - 10 concurrent users
  - Full feature set active

Peak Usage: <500MB
  - Large structure (100K atoms)
  - Multiple features active
```

---

## Security Specifications

### Authentication & Authorization

#### Supabase Auth Configuration
```typescript
// lib/supabase.ts
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce', // PKCE flow for security
    },
  }
);
```

#### Row-Level Security (RLS) Policies
All tables with user data have RLS enabled:
- `favorites`: Users can only access their own favorites
- `user_preferences`: Users can only access their own preferences
- `md_simulation_jobs`: Users can only access their own jobs
- `collaboration_sessions`: Participants can only access active sessions
- `annotations`: Session participants only

#### JWT Token Validation
```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const supabase = createMiddlewareClient({ req: request });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session && protectedRoutes.includes(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}
```

#### Password Policy
- Minimum length: 8 characters
- Complexity: Uppercase, lowercase, number required
- No common passwords (checked against list)
- Rate limiting: 5 attempts per 15 minutes

### Data Protection

#### Encryption at Rest
- **Database**: AES-256 encryption (Supabase default)
- **Storage**: AES-256 encryption (Supabase default)
- **Secrets**: Encrypted environment variables (Vercel)

#### Encryption in Transit
- **HTTPS**: TLS 1.3 enforced
- **WebSocket**: WSS (TLS 1.3)
- **API Calls**: HTTPS only

#### Data Masking
```typescript
// Mask sensitive data in logs
export function maskSensitiveData(data: any) {
  const masked = { ...data };
  if (masked.email) masked.email = masked.email.replace(/(.{2}).*@/, '$1***@');
  if (masked.apiKey) masked.apiKey = masked.apiKey.slice(0, 8) + '***';
  return masked;
}
```

### API Security

#### Rate Limiting
```typescript
// middleware/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'), // 10 requests per 10s
});

export async function rateLimit(identifier: string) {
  const { success } = await ratelimit.limit(identifier);
  if (!success) throw new Error('Rate limit exceeded');
}
```

#### Input Validation
```typescript
// lib/validation.ts
import { z } from 'zod';

export const pdbIdSchema = z.string()
  .regex(/^[0-9][A-Z0-9]{3}$/i, 'Invalid PDB ID format');

export const mdConfigSchema = z.object({
  atomCount: z.number().min(1).max(5000),
  steps: z.number().min(1).max(1000000),
  timestep: z.number().min(0.0001).max(0.01),
  temperature: z.number().min(0).max(1000),
  ensemble: z.enum(['NVE', 'NVT', 'NPT']),
});
```

#### CORS Configuration
```typescript
// next.config.js
async headers() {
  return [
    {
      source: '/api/:path*',
      headers: [
        { key: 'Access-Control-Allow-Origin', value: process.env.NEXT_PUBLIC_APP_URL },
        { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE' },
        { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
      ],
    },
  ];
}
```

### Security Headers

```typescript
// next.config.js
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        { key: 'X-DNS-Prefetch-Control', value: 'on' },
        { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-XSS-Protection', value: '1; mode=block' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        {
          key: 'Content-Security-Policy',
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Mol* requires unsafe-eval
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: https:",
            "font-src 'self' data:",
            "connect-src 'self' https://*.supabase.co https://data.rcsb.org",
            "worker-src 'self' blob:",
          ].join('; '),
        },
        {
          key: 'Permissions-Policy',
          value: 'camera=(), microphone=(), geolocation=()',
        },
      ],
    },
  ];
}
```

### Audit Logging

```typescript
// lib/audit-log.ts
export async function logSecurityEvent(event: SecurityEvent) {
  await supabase.from('security_audit_log').insert({
    user_id: event.userId,
    event_type: event.type, // 'login', 'logout', 'failed_auth', 'data_access'
    ip_address: event.ipAddress,
    user_agent: event.userAgent,
    details: event.details,
    severity: event.severity, // 'info', 'warning', 'critical'
    created_at: new Date().toISOString(),
  });
}
```

### GDPR Compliance

```typescript
// services/data-privacy.ts
export async function exportUserData(userId: string) {
  const [favorites, preferences, jobs, annotations] = await Promise.all([
    supabase.from('favorites').select('*').eq('user_id', userId),
    supabase.from('user_preferences').select('*').eq('user_id', userId),
    supabase.from('md_simulation_jobs').select('*').eq('user_id', userId),
    supabase.from('annotations').select('*').eq('user_id', userId),
  ]);

  return {
    favorites: favorites.data,
    preferences: preferences.data,
    jobs: jobs.data,
    annotations: annotations.data,
    exported_at: new Date().toISOString(),
  };
}

export async function deleteUserData(userId: string) {
  // Cascade delete handled by foreign key constraints
  await supabase.auth.admin.deleteUser(userId);
}
```

---

## Monitoring & Observability

### Application Monitoring

#### Vercel Analytics
```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
```

#### Sentry Error Tracking
```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.VERCEL_ENV || 'development',
  tracesSampleRate: 0.1, // 10% of transactions
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  beforeSend(event, hint) {
    // Filter sensitive data
    if (event.request?.headers) {
      delete event.request.headers['Authorization'];
    }
    return event;
  },
});
```

#### Web Vitals Tracking
```typescript
// app/layout.tsx
import { onCLS, onFID, onLCP, onFCP, onTTFB } from 'web-vitals';

export function reportWebVitals() {
  onCLS(sendToAnalytics);
  onFID(sendToAnalytics);
  onLCP(sendToAnalytics);
  onFCP(sendToAnalytics);
  onTTFB(sendToAnalytics);
}

function sendToAnalytics(metric) {
  const body = JSON.stringify(metric);
  const url = '/api/analytics/web-vitals';

  if (navigator.sendBeacon) {
    navigator.sendBeacon(url, body);
  } else {
    fetch(url, { body, method: 'POST', keepalive: true });
  }
}
```

### Infrastructure Monitoring

#### Supabase Metrics
- **Database**:
  - Connection count
  - Query performance (p50, p95, p99)
  - Table sizes
  - Index usage
  - Slow queries (>1s)

- **Storage**:
  - Total size
  - Object count
  - Bandwidth usage
  - Request count

- **Realtime**:
  - Active connections
  - Message throughput
  - Subscription count
  - Error rate

- **Edge Functions**:
  - Invocation count
  - Execution time (avg, p95, p99)
  - Error rate
  - Cold start frequency

#### Vercel Metrics
- **Deployments**:
  - Build time
  - Build success rate
  - Preview deployment count

- **Functions**:
  - Invocation count
  - Duration (avg, p95, p99)
  - Error rate
  - Memory usage

- **Bandwidth**:
  - Total egress
  - By region
  - By asset type

### Custom Metrics

#### Performance Profiler
```typescript
// lib/performance-profiler.ts
export class PerformanceProfiler {
  trackOperation(name: string, duration: number) {
    // Send to analytics
    fetch('/api/analytics/performance', {
      method: 'POST',
      body: JSON.stringify({
        operation: name,
        duration,
        timestamp: Date.now(),
      }),
    });
  }

  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    try {
      return await fn();
    } finally {
      this.trackOperation(name, performance.now() - start);
    }
  }
}
```

#### Cache Analytics
```typescript
// services/cache-analytics.ts
export async function trackCacheEvent(event: CacheEvent) {
  await supabase.from('cache_metadata').upsert({
    structure_id: event.pdbId,
    cache_level: event.level,
    hit_count: event.type === 'hit' ? 1 : 0,
    miss_count: event.type === 'miss' ? 1 : 0,
    last_hit: event.type === 'hit' ? new Date().toISOString() : undefined,
    last_miss: event.type === 'miss' ? new Date().toISOString() : undefined,
  }, {
    onConflict: 'structure_id,cache_level',
    ignoreDuplicates: false,
  });
}
```

### Alerting

#### Alert Thresholds
```yaml
Critical Alerts (Immediate):
  - Error rate >5% (5min window)
  - p95 latency >5s (5min window)
  - Database connections >80% capacity
  - Storage >90% capacity
  - Edge function failure >10% (5min window)

Warning Alerts (15min delay):
  - Error rate >2% (15min window)
  - p95 latency >3s (15min window)
  - Cache hit rate <80% (1hour window)
  - Database connections >60% capacity
  - Cost >75% of budget

Info Alerts (Daily summary):
  - Daily active users
  - Structure views
  - Simulations run
  - Cache efficiency
  - Cost breakdown
```

#### Alert Configuration
```typescript
// config/alerts.ts
export const ALERT_CONFIG = {
  channels: {
    critical: ['pagerduty', 'sms', 'email'],
    warning: ['slack', 'email'],
    info: ['email'],
  },
  thresholds: {
    errorRate: { critical: 0.05, warning: 0.02 },
    latencyP95: { critical: 5000, warning: 3000 },
    cacheHitRate: { warning: 0.80 },
    databaseConnections: { critical: 0.80, warning: 0.60 },
    storageUsage: { critical: 0.90, warning: 0.75 },
  },
};
```

### Logging

#### Log Levels
```typescript
// lib/logger.ts
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4,
}

export class Logger {
  log(level: LogLevel, message: string, context?: any) {
    const entry = {
      level: LogLevel[level],
      message,
      context: maskSensitiveData(context),
      timestamp: new Date().toISOString(),
      environment: process.env.VERCEL_ENV,
    };

    console.log(JSON.stringify(entry));

    if (level >= LogLevel.ERROR) {
      Sentry.captureException(new Error(message), { extra: context });
    }
  }
}
```

#### Structured Logging
```typescript
// Example usage
logger.log(LogLevel.INFO, 'Structure loaded', {
  pdbId: '1crn',
  cacheLevel: 'L1',
  loadTime: 45,
  userId: user.id,
});

logger.log(LogLevel.ERROR, 'MD simulation failed', {
  jobId: job.id,
  error: error.message,
  stack: error.stack,
  userId: user.id,
});
```

---

## Testing Requirements

### Unit Testing (Vitest)

#### Test Coverage Targets
```yaml
Overall: >85%
Critical Paths: >95%
  - Cache service
  - PDB fetcher
  - Job queue
  - LOD manager

Non-Critical: >70%
  - UI components
  - Utilities
  - Helpers
```

#### Test Structure
```typescript
// tests/unit/services/cache-service.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CacheService } from '@/services/cache-service';

describe('CacheService', () => {
  let cacheService: CacheService;

  beforeEach(() => {
    cacheService = CacheService.getInstance();
  });

  afterEach(async () => {
    await cacheService.clear();
  });

  describe('get', () => {
    it('should return cached value from L1', async () => {
      await cacheService.set('L1', 'test-key', 'test-value');
      const value = await cacheService.get('L1', 'test-key');
      expect(value).toBe('test-value');
    });

    it('should fall back to L2 on L1 miss', async () => {
      await cacheService.set('L2', 'test-key', 'test-value');
      const value = await cacheService.get('L1', 'test-key');
      expect(value).toBe('test-value');
    });
  });
});
```

#### Mock Setup
```typescript
// tests/mocks/supabase.ts
import { vi } from 'vitest';

export const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn().mockResolvedValue({ data: [], error: null }),
    insert: vi.fn().mockResolvedValue({ data: {}, error: null }),
    update: vi.fn().mockResolvedValue({ data: {}, error: null }),
    delete: vi.fn().mockResolvedValue({ data: {}, error: null }),
  })),
  storage: {
    from: vi.fn(() => ({
      upload: vi.fn().mockResolvedValue({ data: { path: 'test.pdb' }, error: null }),
      download: vi.fn().mockResolvedValue({ data: new Blob(), error: null }),
    })),
  },
};
```

### Integration Testing (Playwright)

#### E2E Test Scenarios
```typescript
// tests/e2e/viewer.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Structure Viewer', () => {
  test('should load and display structure', async ({ page }) => {
    await page.goto('/viewer/1crn');

    // Wait for Mol* viewer to load
    await page.waitForSelector('[data-testid="molstar-viewer"]');

    // Check structure info
    await expect(page.locator('[data-testid="structure-name"]')).toHaveText('Crambin');

    // Verify 3D canvas is rendered
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    // Test controls
    await page.click('[data-testid="representation-select"]');
    await page.click('[data-value="ball-and-stick"]');

    // Verify representation changed
    await expect(page.locator('[data-testid="current-representation"]')).toHaveText('Ball & Stick');
  });

  test('should use cached structure on reload', async ({ page }) => {
    // First load
    await page.goto('/viewer/1crn');
    await page.waitForSelector('[data-testid="molstar-viewer"]');

    // Check cache indicator
    await expect(page.locator('[data-testid="cache-status"]')).toHaveText('Cached');

    // Reload
    await page.reload();

    // Should load faster from cache
    const startTime = Date.now();
    await page.waitForSelector('[data-testid="molstar-viewer"]');
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(1000); // <1s from cache
  });
});
```

#### Cross-Browser Testing
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 12'] } },
    { name: 'tablet', use: { ...devices['iPad Pro'] } },
  ],
});
```

### Performance Testing (Lighthouse CI)

#### Lighthouse Configuration
```javascript
// lighthouserc.js
module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/viewer/1crn',
        'http://localhost:3000/jobs',
      ],
      numberOfRuns: 3,
    },
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        'first-contentful-paint': ['error', { maxNumericValue: 1800 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
```

### Accessibility Testing

#### Automated Tests
```typescript
// tests/a11y/viewer.spec.ts
import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

test.describe('Accessibility', () => {
  test('should have no accessibility violations', async ({ page }) => {
    await page.goto('/viewer/1crn');
    await injectAxe(page);
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true },
    });
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/viewer');

    // Tab through controls
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toHaveAttribute('data-testid', 'pdb-search');

    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toHaveAttribute('data-testid', 'representation-select');
  });
});
```

#### Manual Testing Checklist
- [ ] Screen reader compatibility (NVDA, JAWS, VoiceOver)
- [ ] Keyboard-only navigation
- [ ] Color contrast verification (4.5:1 text, 3:1 UI)
- [ ] Touch target sizes (44×44px minimum)
- [ ] Focus indicators visible
- [ ] Alternative text for images
- [ ] ARIA labels and roles
- [ ] Form validation and error messages

---

## Deployment Strategy

### Three-Phase Deployment

#### Phase 1: Staging Deployment

**Pre-deployment Checks:**
```bash
# Run all tests
npm run test:all
npm run test:e2e

# Type checking
npm run typecheck

# Linting
npm run lint

# Build verification
npm run build

# Lighthouse CI
npm run lighthouse:ci

# Security audit
npm audit --production
```

**Staging Environment:**
```bash
# Deploy to Vercel (auto-deploy on PR)
git checkout -b staging/sprint-2-integration
git push origin staging/sprint-2-integration

# Apply database migrations
supabase db push --project staging

# Deploy Edge Functions
supabase functions deploy md-simulation --project staging

# Verify deployment
curl https://lab-visualizer-staging.vercel.app/api/health
```

**Staging Validation:**
- [ ] All 170+ tests passing
- [ ] Lighthouse score >90
- [ ] Zero critical security vulnerabilities
- [ ] Database migrations applied successfully
- [ ] Edge Functions deployed and functional
- [ ] Realtime subscriptions working
- [ ] Cache warming operational
- [ ] All 9 features functional

#### Phase 2: Canary Deployment

**Canary Strategy:**
- Deploy to 10% of traffic
- Monitor for 24 hours
- Rollback if error rate >2% or latency >3s p95

**Monitoring During Canary:**
```yaml
Metrics to Watch:
  - Error rate (target: <1%)
  - p95 latency (target: <2s)
  - Cache hit rate (target: >85%)
  - Database load (target: <50% capacity)
  - Memory usage (target: <300MB p95)
  - User feedback (CSAT score)
```

**Canary Deployment:**
```bash
# Vercel automatically handles traffic splitting
# Configure via vercel.json or dashboard

# Monitor canary
vercel logs --follow --project lab-visualizer

# Check metrics
vercel analytics --project lab-visualizer
```

**Success Criteria for Full Rollout:**
- [ ] Error rate <1% (24h window)
- [ ] p95 latency <2s
- [ ] No critical errors
- [ ] Cache hit rate >85%
- [ ] User feedback positive (CSAT >4.0)

#### Phase 3: Production Deployment

**Pre-production Checklist:**
- [ ] Canary successful (24h+ monitoring)
- [ ] All stakeholders approved
- [ ] Rollback plan tested
- [ ] Database backups verified
- [ ] Alerts configured
- [ ] Documentation updated

**Production Deployment:**
```bash
# Merge to main (triggers auto-deploy)
git checkout main
git merge staging/sprint-2-integration
git push origin main

# Monitor deployment
vercel logs --follow --production

# Verify health
curl https://lab-visualizer.vercel.app/api/health

# Check Core Web Vitals
# (Vercel Analytics dashboard)
```

**Post-deployment Monitoring (48h):**
```yaml
Hour 1-4 (Critical):
  - Error rate every 5 minutes
  - Latency p50/p95/p99 every 5 minutes
  - Database connections every 5 minutes
  - User feedback monitoring

Hour 4-24:
  - Error rate every 15 minutes
  - Latency every 15 minutes
  - Cache hit rate every hour
  - Cost tracking every hour

Hour 24-48:
  - Error rate hourly
  - Performance metrics hourly
  - User metrics daily
  - Cost review daily
```

### Deployment Automation

#### GitHub Actions Workflow
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:all
      - run: npm run test:e2e
      - run: npm run lighthouse:ci

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'

  notify:
    needs: deploy
    runs-on: ubuntu-latest
    steps:
      - name: Notify Slack
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Production deployment complete'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

---

## Rollback Procedures

### Automatic Rollback Triggers

```yaml
Critical Triggers (Immediate Rollback):
  - Error rate >10% (5min window)
  - p95 latency >10s (5min window)
  - Database connection failure
  - Edge Function failure rate >50%
  - Storage unavailable

Warning Triggers (Manual Decision):
  - Error rate >5% (15min window)
  - p95 latency >5s (15min window)
  - Cache hit rate <50%
  - User complaints spike
```

### Rollback Process

#### 1. Vercel Deployment Rollback
```bash
# List recent deployments
vercel ls --project lab-visualizer

# Rollback to previous deployment (instant)
vercel rollback <deployment-url> --project lab-visualizer

# Verify rollback
curl https://lab-visualizer.vercel.app/api/health
```

#### 2. Database Rollback
```bash
# Rollback migrations
supabase db reset --db-url $SUPABASE_DB_URL

# Or restore from backup
supabase db dump --db-url $SUPABASE_DB_URL > rollback.sql
supabase db reset --db-url $SUPABASE_DB_URL
psql $SUPABASE_DB_URL < rollback.sql
```

#### 3. Edge Function Rollback
```bash
# List Edge Function versions
supabase functions list --project $SUPABASE_PROJECT_ID

# Deploy previous version
git checkout <previous-commit>
supabase functions deploy md-simulation --project $SUPABASE_PROJECT_ID
```

#### 4. Cache Invalidation
```bash
# Clear all caches to force fresh data
npm run cache:clear

# Or via API
curl -X POST https://lab-visualizer.vercel.app/api/admin/cache/clear \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Post-Rollback Steps

1. **Incident Report**
   - Document rollback reason
   - Timeline of events
   - Impact assessment
   - Root cause analysis

2. **Fix and Re-deploy**
   - Implement fix
   - Test in staging
   - Canary deployment
   - Monitor closely

3. **Communication**
   - Notify stakeholders
   - Update status page
   - Post-mortem meeting

---

## Success Metrics

### Technical Metrics

```yaml
Performance:
  - Lighthouse score >90: ✅
  - LCP <2.5s: ✅
  - FID <100ms: ✅
  - CLS <0.1: ✅
  - Cache hit rate >90%: Target
  - Bundle size <500KB: ✅

Quality:
  - Test coverage >85%: ✅
  - Zero critical bugs: Target
  - Zero high-severity security vulnerabilities: ✅
  - TypeScript strict mode: ✅
  - Accessibility WCAG 2.1 AA: ✅

Reliability:
  - Uptime >99.9%: Target
  - Error rate <1%: Target
  - p95 latency <2s: Target
  - Successful deployments >95%: Target
```

### User Metrics

```yaml
Engagement:
  - Monthly Active Users: 500 (first month target)
  - Average Session Duration: >10 minutes
  - Structure Views: 5,000/month
  - Simulations Run: 1,000/month
  - Collaboration Sessions: 100/month

Satisfaction:
  - CSAT Score: >4.0/5.0
  - NPS Score: >40
  - Support Tickets: <5% of users
  - Feature Adoption: >60% (collaboration, MD)
```

### Business Metrics

```yaml
Cost Efficiency:
  - Monthly Operating Cost: <$500 (5,000 users)
  - Cost per User: <$0.10
  - Cost per Structure View: <$0.02
  - Cost per Simulation: <$0.50

Growth:
  - User Growth: 20% MoM
  - Academic Partnerships: 10 institutions
  - Repository Stars: 100+
  - Documentation Views: 1,000/month
```

---

## Appendices

### A. Complete File Manifest

```
lab_visualizer/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── viewer/
│   │   │   └── [pdbId]/page.tsx
│   │   ├── jobs/
│   │   │   └── page.tsx
│   │   ├── collaboration/
│   │   │   └── [sessionId]/page.tsx
│   │   └── api/
│   │       ├── structures/
│   │       │   ├── [pdbId]/route.ts
│   │       │   ├── search/route.ts
│   │       │   └── upload/route.ts
│   │       ├── jobs/
│   │       │   └── route.ts
│   │       └── health/route.ts
│   ├── components/
│   │   ├── viewer/
│   │   │   ├── MolstarViewer.tsx
│   │   │   ├── ViewerLayout.tsx
│   │   │   ├── ViewerControls.tsx
│   │   │   ├── ViewerToolbar.tsx
│   │   │   ├── StructureInfo.tsx
│   │   │   ├── SelectionPanel.tsx
│   │   │   ├── QualitySettings.tsx
│   │   │   └── LoadingStates.tsx
│   │   ├── jobs/
│   │   │   ├── JobList.tsx
│   │   │   ├── JobDetails.tsx
│   │   │   ├── JobSubmissionForm.tsx
│   │   │   ├── QueueStatus.tsx
│   │   │   └── JobActions.tsx
│   │   ├── collaboration/
│   │   │   ├── SessionManager.tsx
│   │   │   ├── UserPresence.tsx
│   │   │   ├── CursorOverlay.tsx
│   │   │   ├── AnnotationPanel.tsx
│   │   │   └── ActivityFeed.tsx
│   │   ├── simulation/
│   │   │   ├── SimulationControls.tsx
│   │   │   └── SimulationDisplay.tsx
│   │   ├── admin/
│   │   │   ├── CacheWarmingDashboard.tsx
│   │   │   └── CostTrackingDashboard.tsx
│   │   └── ui/
│   │       ├── progress.tsx
│   │       ├── scroll-area.tsx
│   │       ├── accordion.tsx
│   │       ├── separator.tsx
│   │       └── toast.tsx
│   ├── services/
│   │   ├── molstar-service.ts
│   │   ├── pdb-fetcher.ts
│   │   ├── cache-service.ts
│   │   ├── cache-warming.ts
│   │   ├── job-queue.ts
│   │   ├── browser-simulation.ts
│   │   ├── collaboration-session.ts
│   │   ├── camera-sync.ts
│   │   ├── quality-manager.ts
│   │   └── desktop-export.ts
│   ├── lib/
│   │   ├── supabase.ts
│   │   ├── pdb-parser.ts
│   │   ├── md-browser-dynamica.ts
│   │   ├── lod-manager.ts
│   │   ├── performance-profiler.ts
│   │   ├── logger.ts
│   │   ├── validation.ts
│   │   └── cache/
│   │       ├── indexeddb.ts
│   │       ├── vercel-kv.ts
│   │       └── supabase-storage.ts
│   ├── hooks/
│   │   ├── useMolstar.ts
│   │   ├── useStructure.ts
│   │   ├── useCache.ts
│   │   ├── useJobQueue.ts
│   │   ├── useSimulation.ts
│   │   ├── useCollaboration.ts
│   │   ├── useLOD.ts
│   │   └── useQualityManager.ts
│   ├── stores/
│   │   ├── visualization-store.ts
│   │   ├── collaboration-store.ts
│   │   ├── simulation-store.ts
│   │   └── ui-store.ts
│   ├── workers/
│   │   ├── molstar-loader.worker.ts
│   │   ├── pdb-parser.worker.ts
│   │   ├── cache-warming.worker.ts
│   │   └── lod-loader.worker.ts
│   └── types/
│       ├── molstar.ts
│       ├── pdb.ts
│       ├── cache.ts
│       ├── md-types.ts
│       ├── collaboration.ts
│       └── lod.ts
├── supabase/
│   ├── functions/
│   │   └── md-simulation/
│   │       ├── index.ts
│   │       ├── Dockerfile
│   │       └── deno.json
│   └── migrations/
│       ├── 001_base_schema.sql
│       ├── 002_md_jobs_schema.sql
│       ├── 003_collaboration_schema.sql
│       └── 004_cache_analytics_schema.sql
├── tests/
│   ├── unit/
│   │   ├── services/
│   │   ├── lib/
│   │   └── components/
│   ├── integration/
│   └── e2e/
├── docs/
│   ├── sprint0/
│   ├── sprint1/
│   ├── sprint2/
│   │   ├── INTEGRATION_SPECIFICATION.md (this file)
│   │   └── DEPLOYMENT_CHECKLIST.md
│   ├── adrs/
│   ├── guides/
│   └── architecture/
├── config/
│   ├── molstar.config.ts
│   ├── cache.config.ts
│   ├── lod.config.ts
│   ├── realtime.config.ts
│   └── alerts.config.ts
├── scripts/
│   ├── deploy.sh
│   ├── migrate.sh
│   ├── cache-clear.ts
│   └── validate-integration.ts
├── .github/
│   └── workflows/
│       ├── ci.yml
│       ├── deploy.yml
│       ├── lighthouse.yml
│       └── preview.yml
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.ts
├── vitest.config.ts
├── playwright.config.ts
├── lighthouserc.js
├── .env.example
└── .env.local (gitignored)
```

### B. Integration Dependency Graph

```mermaid
graph TD
    A[Next.js App] --> B[Mol* Viewer]
    A --> C[PDB Pipeline]
    A --> D[Cache Service]
    A --> E[Job Queue]
    A --> F[Collaboration]
    A --> G[LOD Manager]

    B --> C
    B --> D
    B --> G
    B --> F

    C --> D
    C --> H[External APIs]

    D --> I[IndexedDB]
    D --> J[Vercel KV]
    D --> K[Supabase Storage]

    E --> L[Supabase DB]
    E --> M[Edge Functions]
    E --> K

    F --> L
    F --> N[Realtime]
    F --> B

    G --> B
    G --> O[Quality Manager]
    G --> P[Performance Profiler]
```

### C. Environment Variable Reference

See [Environment Configuration](#environment-configuration) section for complete list.

### D. API Endpoint Reference

```
GET  /api/structures/:pdbId          Fetch structure by PDB ID
GET  /api/structures/search          Search structures
POST /api/structures/upload          Upload custom structure
GET  /api/alphafold/:uniprotId       Fetch AlphaFold prediction
POST /api/jobs                       Submit MD simulation job
GET  /api/jobs                       List user jobs
GET  /api/jobs/:id                   Get job details
PATCH /api/jobs/:id                  Update job (cancel, etc.)
GET  /api/cache/stats                Get cache statistics
POST /api/admin/cache/clear          Clear all caches
GET  /api/health                     Health check endpoint
POST /api/analytics/web-vitals       Track Web Vitals
POST /api/analytics/performance      Track custom metrics
```

### E. Database ERD

```mermaid
erDiagram
    users ||--o{ favorites : has
    users ||--o{ md_simulation_jobs : creates
    users ||--o{ collaboration_sessions : owns
    users ||--o{ collaboration_users : participates
    users ||--o{ annotations : creates
    users ||--o{ camera_states : updates
    users ||--o{ user_preferences : has

    structures ||--o{ favorites : referenced_by
    structures ||--o{ cache_metadata : tracked_by

    collaboration_sessions ||--o{ collaboration_users : contains
    collaboration_sessions ||--o{ annotations : has
    collaboration_sessions ||--o{ activity_feed : logs
    collaboration_sessions ||--o{ camera_states : syncs
```

---

**Document Status:** COMPLETE - Ready for implementation
**Next Phase:** [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)
**Author:** Claude Flow Swarm (SPARC Specification Agent)
**Generated:** November 17, 2025
**Review Status:** Pending technical review

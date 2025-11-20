# API & Infrastructure Audit Report
**Lab Visualizer Platform**
**Date:** 2025-11-20
**Audit Type:** API Endpoints, External Dependencies, Data Flows, Infrastructure

---

## Executive Summary

This comprehensive audit reveals a **well-architected Next.js 14 application** with sophisticated multi-tier caching, real-time collaboration, and molecular visualization capabilities. The platform leverages **Supabase** for database and auth, **Vercel** for hosting, **Redis** for rate limiting, and integrates with multiple external molecular data sources.

**Key Findings:**
- ✅ **11 API endpoints** with proper validation and caching
- ✅ **3-tier caching strategy** (L1: IndexedDB, L2: Vercel KV, L3: Supabase Storage)
- ✅ **5 major external dependencies** (Supabase, Redis, PDB APIs, AlphaFold, Unsplash)
- ⚠️ **Rate limiting implemented** but Redis fallback to in-memory could cause issues at scale
- ⚠️ **No monitoring/alerting** infrastructure detected (Sentry configured but not installed)
- ⚠️ **Missing CDN configuration** for static assets

---

## 1. API Endpoint Inventory

### REST API Endpoints (11 Total)

#### 1.1 PDB Structure Endpoints (5)

**GET `/api/pdb/[id]`**
- **Purpose:** Fetch PDB structure by ID with multi-tier caching
- **Runtime:** Edge (Vercel Edge Functions)
- **Authentication:** None (public)
- **Rate Limiting:** 100 requests/minute per IP (in-memory)
- **Caching Strategy:**
  - L1: IndexedDB (client-side, 1 hour TTL)
  - L2: Vercel KV (edge, 24 hours TTL, 70% target hit rate)
  - L3: Supabase Storage (7 days TTL)
- **Features:**
  - Request deduplication (prevents concurrent duplicate fetches)
  - Server-Sent Events (SSE) streaming with `?progress=true`
  - Automatic cache warming (L3 → L2)
- **External Dependencies:** RCSB PDB, PDB Europe, PDB Japan
- **Performance Target:** < 500ms (L2), < 2s (L3)

**GET `/api/pdb/search`**
- **Purpose:** Search PDB database by query
- **Runtime:** Edge
- **Authentication:** None
- **Caching:** 5 minutes (L2 only)
- **Query Parameters:**
  - `q` (required): Search query
  - `limit`: Max results (default: 20)
  - `offset`: Pagination offset
- **External API:** RCSB Search API

**POST `/api/pdb/upload`**
- **Purpose:** Upload custom PDB/CIF files
- **Runtime:** Edge
- **Authentication:** Required
- **Validation:**
  - Max file size: 50 MB
  - Allowed MIME types: `chemical/x-pdb`, `chemical/x-mmcif`, `text/plain`
  - Security checks: XSS pattern detection, null byte validation
  - Format validation: PDB must have ATOM/HETATM records
- **Security Features:**
  - Filename sanitization (path traversal prevention)
  - Content malware scanning (basic patterns)
  - Minimum file size: 100 bytes

**GET `/api/pdb/alphafold/[uniprot]`**
- **Purpose:** Fetch AlphaFold predictions by UniProt ID
- **Runtime:** Edge
- **Caching:** 30 days (L2), 90 days (L3)
- **External API:** AlphaFold DB (https://alphafold.ebi.ac.uk)
- **Validation:** UniProt ID format (6-10 alphanumeric characters)

#### 1.2 Learning Content Endpoints (3)

**GET `/api/learning/modules`**
- **Purpose:** List educational modules with filters
- **Runtime:** Dynamic (SSR)
- **Authentication:** Optional (affects visibility filters)
- **Query Parameters:**
  - `contentType`: Filter by type (video, guide, tutorial, quiz, pathway)
  - `difficulty`: 1-5 difficulty level
  - `tags`: Comma-separated tags
  - `structureId`: Related structure filter
  - `creatorId`: Filter by creator
  - `isPublished`: Published status
  - `limit`, `offset`: Pagination
  - `sortBy`: created, updated, popular, rating
  - `sortOrder`: asc, desc
- **Database Table:** `learning_content`

**POST `/api/learning/modules`**
- **Purpose:** Create new learning module
- **Authentication:** Required
- **Validation:**
  - Required: `title`, `contentType`, `contentData`
  - Difficulty: 1-5 range validation
- **Response:** 201 Created with module data

**GET `/api/learning/modules/[id]`**
- **Purpose:** Get single module details
- **Side Effects:** Increments view count
- **Caching:** None (dynamic content)

**GET `/api/learning/progress`**
- **Purpose:** Get user progress for modules
- **Authentication:** Required
- **Database Table:** `user_progress`

**GET `/api/learning/pathways`**
- **Purpose:** List learning pathways
- **Database Table:** `learning_pathways`

#### 1.3 Export Endpoints (3)

**POST `/api/export/pdf`**
- **Purpose:** Generate PDF reports (client-side delegation)
- **Status:** Stub implementation (delegates to jsPDF on client)
- **Future Enhancement:** Server-side PDF generation with pdf-lib/PDFKit

**POST `/api/export/model`**
- **Purpose:** Export 3D models (not implemented)
- **Planned Formats:** PDB, CIF, OBJ, STL, glTF

**POST `/api/export/image`**
- **Purpose:** Export molecular visualizations as images
- **Library:** html2canvas (client-side)

---

## 2. External Service Dependencies

### 2.1 Database & Authentication

**Supabase PostgreSQL**
- **URL:** `process.env.NEXT_PUBLIC_SUPABASE_URL`
- **Authentication:** Anon key + Service role key
- **Purpose:**
  - Primary database (all application data)
  - Authentication (auth.users)
  - Realtime subscriptions
  - Storage (L3 cache, file uploads)
- **Tables (16 total):**
  - Core: `user_profiles`, `structures`, `learning_content`, `simulation_jobs`
  - Collaboration: `collaboration_sessions`, `structure_comments`, `session_users`
  - Sharing: `structure_shares`, `collection_shares`
  - Progress: `user_progress`, `content_reviews`
  - Admin: `simulation_cache`, `structure_versions`
- **Row-Level Security (RLS):** Enabled on all tables
- **Extensions:** uuid-ossp, pgcrypto, pg_trgm (full-text search)
- **Functions:** 8 custom PL/pgSQL functions
- **Triggers:** 7 triggers for auto-updates
- **Realtime:** Enabled for 5 tables (user_profiles, structures, simulation_jobs, structure_comments, collection_structures)

**Supabase Storage Buckets (Planned):**
- `structures`: Molecular structure files
- `thumbnails`: Preview images
- `simulations`: Simulation results
- `learning-content`: Educational media
- `user-avatars`: Profile pictures

### 2.2 Caching & Rate Limiting

**Redis (ioredis)**
- **Host:** `process.env.REDIS_HOST` (default: localhost)
- **Port:** 6379
- **Purpose:**
  - Rate limiting storage
  - Session management (optional)
- **Configuration:**
  - Max retries: 3
  - Connect timeout: 10s
  - Offline queue: Disabled
  - Key prefix: `rl:`
- **Fallback:** In-memory rate limiting (Map-based)
- **Connection Status:** Optional (graceful degradation)

**Vercel KV (optional)**
- **Purpose:** L2 cache (edge cache)
- **Package:** `@vercel/kv`
- **Status:** Optional dependency
- **TTL Configuration:**
  - PDB structures: 24 hours
  - Search results: 5 minutes
  - AlphaFold predictions: 30 days
- **Performance Target:** 70% cache hit rate

### 2.3 Molecular Data Sources

**RCSB Protein Data Bank**
- **Endpoints:**
  - Download: `https://files.rcsb.org/download/{id}.pdb`
  - Search: `https://search.rcsb.org/rcsbsearch/v2/query`
  - Metadata: `https://data.rcsb.org/rest/v1/core/entry/{id}`
- **Rate Limiting:** 5 concurrent, 200ms minimum interval
- **Retry Strategy:** Exponential backoff (3 retries, max 5s delay)
- **Timeout:** 10 seconds per request

**PDB Europe (EBI)**
- **Endpoint:** `https://www.ebi.ac.uk/pdbe/entry-files/download/{id}.pdb`
- **Purpose:** Fallback source #1
- **Same rate limiting as RCSB**

**PDB Japan**
- **Endpoint:** `https://pdbj.org/rest/downloadPDBfile?id={id}&format=pdb`
- **Purpose:** Fallback source #2

**AlphaFold Database**
- **Endpoint:** `https://alphafold.ebi.ac.uk/files/AF-{uniprotId}-F1-model_v4.pdb`
- **Purpose:** Predicted protein structures
- **ID Format:** UniProt accession (6-10 chars)
- **Caching:** Long TTL (90 days L3)

### 2.4 Third-Party APIs

**Unsplash API**
- **Package:** `unsplash-js`
- **API Key:** `import.meta.env.VITE_UNSPLASH_ACCESS_KEY`
- **Purpose:** Demo images for UI (anatomy/medical photos)
- **Fallback:** Hardcoded Unsplash URLs
- **Status:** Optional (demo mode)

### 2.5 Monitoring & Error Tracking (Planned)

**Sentry**
- **Package:** `@sentry/react` (not installed)
- **DSN:** `import.meta.env.VITE_SENTRY_DSN`
- **Configuration:**
  - Browser tracing enabled
  - Session replay enabled
  - Sample rates: 10% (prod), 100% (dev)
  - Error filtering: ResizeObserver loops excluded
- **Status:** ⚠️ Configured but not installed

**Web Vitals Analytics**
- **Package:** `web-vitals`
- **Metrics:** CLS, FID, FCP, LCP, TTFB
- **Endpoint:** `/api/analytics` (beacon)
- **Status:** Optional (env flag `VITE_ENABLE_WEB_VITALS`)

---

## 3. Data Flow Analysis

### 3.1 PDB Structure Fetching Flow

```
[Client Request] → [Next.js Edge Function]
    ↓
[Rate Limit Check] (100/min per IP)
    ↓
[Request Deduplication] (concurrent request check)
    ↓
[L1 Cache] IndexedDB (client-side, skipped on server)
    ↓ (miss)
[L2 Cache] Vercel KV (edge, 24h TTL)
    ↓ (miss)
[L3 Cache] Supabase Storage (7d TTL)
    ↓ (miss)
[External PDB API] (RCSB → PDB Europe → PDB Japan)
    ↓
[PDB Parser] (parse atomic data, bonds, metadata)
    ↓
[Cache Warmup] (L2 ← L3, parallel writes)
    ↓
[Response] (JSON with structure data)
```

**Key Optimizations:**
- **Request deduplication:** Prevents thundering herd (concurrent duplicate requests)
- **Cache warming:** L3 hits warm L2 for future requests
- **Streaming:** SSE support for large structures (progress updates)
- **Parallel fallbacks:** Tries multiple PDB sources with rate limiting

### 3.2 Authentication Flow

```
[Client] → [Supabase Auth SDK]
    ↓
[Sign In/Up] → [Supabase Auth Server]
    ↓
[JWT Token] ← [Session Storage]
    ↓
[API Requests] + Authorization: Bearer {token}
    ↓
[Supabase Middleware] → [RLS Policies]
    ↓
[Database Access] (filtered by auth.uid())
```

**Supported Auth Methods:**
- Email/Password
- Magic Link (OTP)
- OAuth (Google, GitHub)
- Session auto-refresh
- Profile creation on signup

### 3.3 Real-Time Collaboration Flow

```
[User A] → [Create Session] → [Supabase DB]
    ↓
[Generate Invite Code] → [Share with Users]
    ↓
[User B, C] → [Join Session] → [Supabase Realtime Channel]
    ↓
[Presence Tracking] ← [30s Heartbeat]
    ↓
[Events] → [Broadcast to All Users]
    - cursor-move
    - annotation-add/edit/delete
    - camera-update
    - user-join/leave
    ↓
[Conflict Resolution] (CRDT-based, not fully implemented)
```

**Realtime Features:**
- **Presence:** User online/offline status
- **Broadcast:** Low-latency event distribution
- **Session expiration:** 24 hours
- **Max users:** Configurable (default: 10)

### 3.4 Learning Content Flow

```
[Educator] → [Create Module] → [POST /api/learning/modules]
    ↓
[Validation] (title, contentType, difficulty)
    ↓
[Store in DB] → [learning_content table]
    ↓
[Publish] → [is_published = true]
    ↓
[Students] → [Browse/Search] → [GET /api/learning/modules]
    ↓
[View Module] → [Increment view_count]
    ↓
[Track Progress] → [user_progress table]
    - progress_percent
    - time_spent
    - bookmarks
    - quiz_scores
    ↓
[Complete] → [Update completion_count]
    ↓
[Review] → [content_reviews table]
```

### 3.5 Simulation Job Queue Flow

```
[User] → [Submit Simulation] → [simulation_jobs table]
    ↓
[Status: pending] → [Queue Processing]
    ↓
[Worker Pickup] → [Status: running]
    ↓
[Web Worker] (md-simulation.worker.ts)
    - MD (Molecular Dynamics)
    - MC (Monte Carlo)
    - Docking
    - Optimization
    ↓
[Progress Updates] → [Realtime broadcast]
    ↓
[Results] → [Supabase Storage]
    ↓
[Status: completed] → [Expiration timer]
    ↓
[Cleanup Job] → [Delete after expires_at]
```

**Optimization:**
- **Simulation cache:** Deduplication by structure_hash + parameters_hash
- **Resource tracking:** CPU time, memory, estimated cost
- **Auto-cleanup:** Expired jobs deleted, stuck jobs failed after 24h

---

## 4. Infrastructure Assessment

### 4.1 Hosting & Deployment

**Platform:** Vercel (Next.js hosting)
- **Runtime:** Node.js 18+
- **Edge Functions:** Enabled for PDB APIs
- **ISR (Incremental Static Regeneration):** Not used
- **SSR (Server-Side Rendering):** Used for learning content
- **Build System:** Next.js Turbopack (optional)

**Environment Variables Required:**
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # Server-side only

# Redis
REDIS_HOST=
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Rate Limiting
RATE_LIMIT_KEY_PREFIX=rl:
NODE_ENV=development|production

# Optional
VITE_SENTRY_DSN=
VITE_UNSPLASH_ACCESS_KEY=
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_DEBUG=false
```

### 4.2 Database Infrastructure

**Supabase PostgreSQL**
- **Version:** PostgreSQL 14+
- **Connection Pooling:** Supabase PgBouncer
- **Concurrent Connections:** Configurable by plan
- **Backup Strategy:** Supabase automated backups
- **Migrations:** SQL files in `infrastructure/supabase/migrations/`
- **Schema Version:** 1.0.0 (001_initial_schema.sql, 002_collaboration_rls.sql)

**Performance Features:**
- 15 indexes on core tables
- Full-text search (pg_trgm extension)
- Materialized views: None
- Query optimization: RLS policies optimized with indexes

### 4.3 Static Assets & CDN

**Current Setup:**
- Static files in `/public`
- Served by Next.js static file handler
- **Missing:** Dedicated CDN configuration

**Recommendations:**
- ⚠️ Configure Vercel CDN for `/public` assets
- ⚠️ Add image optimization (Next.js Image component)
- ⚠️ Implement asset versioning/cache-busting
- ⚠️ Consider Cloudflare Images for thumbnails

### 4.4 Security

**Implemented:**
- ✅ HTTPS enforced (Vercel)
- ✅ Content Security Policy (CSP) headers
- ✅ CORS configuration
- ✅ XSS protection in file uploads
- ✅ SQL injection prevention (Supabase RLS)
- ✅ Rate limiting (IP-based)
- ✅ Input validation (Zod schemas)
- ✅ Secrets management (environment variables)

**Missing/Planned:**
- ⚠️ DDoS protection (Vercel built-in, but not explicitly configured)
- ⚠️ WAF (Web Application Firewall)
- ⚠️ API key rotation strategy
- ⚠️ Audit logging for admin actions

### 4.5 Monitoring & Observability

**Status:** ⚠️ **Mostly Unimplemented**

**Configured but Not Active:**
- Sentry error tracking (package not installed)
- Web Vitals analytics (optional, no backend)
- Custom performance tracking (PerformanceTracker class exists)

**Missing:**
- ❌ APM (Application Performance Monitoring)
- ❌ Uptime monitoring
- ❌ Database query performance tracking
- ❌ Alert management (PagerDuty, OpsGenie)
- ❌ Log aggregation (Datadog, LogRocket)
- ❌ Real-user monitoring (RUM)

**Recommendations:**
1. **Install Sentry:** Complete error tracking setup
2. **Add Vercel Analytics:** Built-in Next.js analytics
3. **Implement health checks:** `/api/health` endpoint
4. **Database monitoring:** Supabase dashboard alerts
5. **Custom dashboards:** Grafana + Prometheus

### 4.6 Scalability Analysis

**Current Bottlenecks:**

1. **Rate Limiting (Redis Dependency):**
   - Fallback to in-memory limits loses state across instances
   - **Impact:** Inconsistent rate limiting in multi-region deploys
   - **Solution:** Redis cluster or Upstash Redis (edge-compatible)

2. **Database Connection Pooling:**
   - Supabase connection limits depend on plan
   - **Impact:** Could hit connection limits at high concurrency
   - **Solution:** Connection pooling middleware, upgrade Supabase plan

3. **PDB API Rate Limiting:**
   - 5 concurrent requests, 200ms intervals
   - **Impact:** Slow bulk operations (e.g., 100 structures = 20 seconds minimum)
   - **Solution:** Batch processing, job queue (BullMQ)

4. **Real-time Collaboration:**
   - Supabase Realtime has connection limits
   - **Impact:** Max ~200 concurrent users per channel (plan-dependent)
   - **Solution:** Shard sessions, upgrade plan, or custom WebSocket server

5. **File Upload Limits:**
   - 50 MB max file size (edge function limit)
   - **Impact:** Cannot handle very large PDB files
   - **Solution:** Direct-to-storage uploads (Supabase signed URLs)

**Horizontal Scaling Readiness:**
- ✅ Stateless API design (except in-memory rate limiting)
- ✅ Database handles concurrency
- ⚠️ Session state in Redis (requires clustering)
- ⚠️ No distributed locking (potential race conditions)

---

## 5. Data Flow Patterns

### 5.1 State Management

**Client-Side:**
- **Zustand:** Global state management
  - `app-store.ts`: Application state
  - `collaboration-slice.ts`: Real-time session state
- **React Query (Not Detected):** Could improve data fetching
- **Local State:** React hooks (`useState`, `useReducer`)

**Server-Side:**
- **Supabase Realtime:** Server-pushed updates
- **SSR Props:** Next.js `getServerSideProps` (not used)
- **Edge Functions:** Stateless request/response

### 5.2 Caching Strategy

**Multi-Tier Hierarchy:**

| Tier | Storage | TTL | Hit Rate Target | Latency |
|------|---------|-----|-----------------|---------|
| L1 | IndexedDB | 1 hour | 30% | < 100ms |
| L2 | Vercel KV | 24 hours | 70% | < 500ms |
| L3 | Supabase Storage | 7-30 days | 90% | < 2s |

**Cache Invalidation:**
- **TTL-based:** Automatic expiration
- **Manual invalidation:** Not implemented
- **Cache warming:** L3 → L2 on cache hits

**Compression:**
- L2: Enabled (saves edge storage)
- L3: Enabled (molecular data compression)
- Thresholds: 10KB (molecular), 50KB (PDB), 100KB (simulation)

### 5.3 API Communication Patterns

**REST API:**
- Standard HTTP methods (GET, POST, PUT, DELETE)
- JSON payloads
- Error responses: Structured with `{ error, message, code }`
- Pagination: `limit` + `offset` parameters

**Real-Time (Supabase):**
- Broadcast events (cursor, annotations, camera)
- Presence tracking (user online/offline)
- Database changes (live queries, not used)

**Server-Sent Events (SSE):**
- PDB fetching progress: `data: {...}\n\n`
- Used for large structure downloads

---

## 6. Bottlenecks & Optimization Opportunities

### 6.1 Critical Issues (High Priority)

**1. Rate Limiting Fallback**
- **Issue:** In-memory rate limiting loses state in serverless
- **Impact:** Potential abuse, inconsistent limits
- **Solution:**
  - Deploy Redis cluster (AWS ElastiCache, Upstash)
  - Implement distributed rate limiting (Vercel KV as fallback)
- **Effort:** Medium (1-2 days)

**2. Missing Monitoring**
- **Issue:** No error tracking, no performance monitoring
- **Impact:** Blind to production issues, slow MTTR
- **Solution:**
  - Install Sentry (`npm install @sentry/react`)
  - Enable Vercel Analytics
  - Add `/api/health` endpoint
- **Effort:** Low (4 hours)

**3. No CDN for Static Assets**
- **Issue:** Thumbnails, images served through Next.js
- **Impact:** Slower load times, higher bandwidth costs
- **Solution:**
  - Configure Vercel CDN headers
  - Use Next.js Image component
  - Implement image optimization (WebP, AVIF)
- **Effort:** Medium (1 day)

### 6.2 Performance Optimizations (Medium Priority)

**4. Database Query Optimization**
- **Opportunity:** Missing indexes on `learning_content.related_structures`
- **Impact:** Slow queries when filtering by structure ID
- **Solution:** Add GIN index on array column
- **Effort:** Low (1 hour)

**5. PDB Fetching Parallelization**
- **Opportunity:** Serial source fallback (RCSB → PDB Europe → PDB Japan)
- **Impact:** Slow fetching on RCSB downtime
- **Solution:** Try sources in parallel, return first success
- **Effort:** Medium (4 hours)

**6. Real-Time Session Scalability**
- **Opportunity:** Session state stored in memory (limited scalability)
- **Impact:** Max ~10 users per session (configured limit, could be higher)
- **Solution:**
  - Store session state in Redis
  - Implement session sharding
  - Consider Ably or Pusher for managed real-time
- **Effort:** High (3-5 days)

### 6.3 Cost Optimizations (Low Priority)

**7. Vercel Bandwidth Costs**
- **Opportunity:** Large PDB files served through edge functions
- **Impact:** High bandwidth costs for popular structures
- **Solution:**
  - Implement client-side caching (Service Workers)
  - Use signed URLs for direct Supabase Storage access
  - Add ETag/If-None-Match support for 304 responses
- **Effort:** Medium (2 days)

**8. Supabase Storage Costs**
- **Opportunity:** Simulation results stored indefinitely
- **Impact:** Growing storage costs
- **Solution:**
  - Implement lifecycle policies (delete after expiry)
  - Add `cleanup_expired_simulations()` cron job
  - Compress results more aggressively
- **Effort:** Low (4 hours)

### 6.4 Developer Experience Improvements

**9. API Documentation**
- **Opportunity:** No OpenAPI/Swagger spec
- **Impact:** Harder for frontend developers to integrate
- **Solution:** Add Swagger UI (`next-swagger-doc`)
- **Effort:** Medium (1 day)

**10. Type Safety Improvements**
- **Opportunity:** Some `any` types in database mappers
- **Impact:** Runtime errors, harder debugging
- **Solution:** Generate types from Supabase schema (`supabase gen types`)
- **Effort:** Low (2 hours)

---

## 7. Recommendations Summary

### Immediate Actions (This Week)
1. ✅ **Install Sentry** for error tracking
2. ✅ **Deploy Redis** for rate limiting (Upstash free tier)
3. ✅ **Add health check** endpoint (`/api/health`)
4. ✅ **Configure Vercel Analytics**

### Short-Term (Next Sprint)
5. ⚡ **Optimize PDB fetching** (parallel sources)
6. ⚡ **Add CDN configuration** for static assets
7. ⚡ **Database indexing** review (GIN index on arrays)
8. ⚡ **Implement cleanup jobs** for expired simulations

### Long-Term (Next Quarter)
9. 🚀 **Scale real-time collaboration** (Redis-backed sessions)
10. 🚀 **Add API documentation** (Swagger)
11. 🚀 **Implement distributed tracing** (Datadog, Honeycomb)
12. 🚀 **Optimize bandwidth costs** (Service Workers, signed URLs)

---

## Appendix A: API Endpoint Reference

| Method | Endpoint | Auth | Rate Limit | Caching |
|--------|----------|------|------------|---------|
| GET | `/api/pdb/[id]` | No | 100/min | L1+L2+L3 |
| GET | `/api/pdb/search` | No | 100/min | L2 (5m) |
| POST | `/api/pdb/upload` | Yes | 20/15m | None |
| GET | `/api/pdb/alphafold/[uniprot]` | No | 100/min | L2+L3 (30d) |
| GET | `/api/learning/modules` | Optional | Default | None |
| POST | `/api/learning/modules` | Yes | Default | None |
| GET | `/api/learning/modules/[id]` | Optional | Default | None |
| GET | `/api/learning/progress` | Yes | Default | None |
| GET | `/api/learning/pathways` | No | Default | None |
| POST | `/api/export/pdf` | Yes | 10/5m | None |
| POST | `/api/export/model` | Yes | 10/5m | None |
| POST | `/api/export/image` | Yes | 10/5m | None |

## Appendix B: External API Endpoints

| Service | Endpoint | Rate Limit | Timeout |
|---------|----------|------------|---------|
| RCSB PDB | `https://files.rcsb.org/download/{id}.pdb` | 5 concurrent, 200ms interval | 10s |
| PDB Europe | `https://www.ebi.ac.uk/pdbe/entry-files/download/{id}.pdb` | 5 concurrent | 10s |
| PDB Japan | `https://pdbj.org/rest/downloadPDBfile?id={id}&format=pdb` | 5 concurrent | 10s |
| AlphaFold | `https://alphafold.ebi.ac.uk/files/AF-{id}-F1-model_v4.pdb` | Same as above | 10s |
| RCSB Search | `https://search.rcsb.org/rcsbsearch/v2/query` | Same as above | 10s |
| RCSB Metadata | `https://data.rcsb.org/rest/v1/core/entry/{id}` | Same as above | 10s |
| Unsplash | `https://api.unsplash.com/*` | SDK-managed | 10s |

## Appendix C: Database Tables

**Core Tables (16):**
- `user_profiles` (extends auth.users)
- `user_connections` (followers/following)
- `structures` (molecular structures)
- `structure_versions` (version history)
- `structure_favorites` (user favorites)
- `collections` (structure folders)
- `collection_structures` (many-to-many)
- `learning_content` (educational modules)
- `learning_pathways` (course sequences)
- `user_progress` (learning progress)
- `content_reviews` (ratings & reviews)
- `simulation_jobs` (MD/MC/docking jobs)
- `simulation_cache` (result deduplication)
- `structure_shares` (sharing permissions)
- `collection_shares` (collection sharing)
- `structure_comments` (annotations)
- `comment_likes` (comment reactions)

---

**End of Report**

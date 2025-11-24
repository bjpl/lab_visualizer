# Lab Visualizer - System Architecture Diagram

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │   React UI   │  │  Web Workers │  │ IndexedDB L1 │              │
│  │  (Next.js)   │  │  (MD/Parse)  │  │   (Cache)    │              │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
│         │                  │                  │                       │
│         └──────────────────┴──────────────────┘                       │
│                            │                                          │
└────────────────────────────┼──────────────────────────────────────────┘
                             │
                             │ HTTPS
                             │
┌────────────────────────────┼──────────────────────────────────────────┐
│                    NEXT.JS API LAYER (Vercel Edge)                   │
├────────────────────────────┼──────────────────────────────────────────┤
│                            │                                          │
│  ┌─────────────────────────┴─────────────────────────┐               │
│  │          API Endpoints (11 Routes)                │               │
│  ├───────────────────────────────────────────────────┤               │
│  │  /api/pdb/[id]           │ Multi-tier Cache      │               │
│  │  /api/pdb/search         │ L2 Cache (5m)         │               │
│  │  /api/pdb/upload         │ Validation + Security │               │
│  │  /api/pdb/alphafold/*    │ L2+L3 Cache (30d)     │               │
│  │  /api/learning/*         │ Database CRUD         │               │
│  │  /api/export/*           │ PDF/Image/Model       │               │
│  └─────────┬─────────────────────────────┬───────────┘               │
│            │                             │                           │
│     ┌──────┴────────┐           ┌────────┴────────┐                 │
│     │ Rate Limiter  │           │  Cache Service  │                 │
│     │   (Redis)     │           │   (Multi-Tier)  │                 │
│     └──────┬────────┘           └────────┬────────┘                 │
│            │                             │                           │
└────────────┼─────────────────────────────┼───────────────────────────┘
             │                             │
             │                             │
┌────────────┼─────────────────────────────┼───────────────────────────┐
│        EXTERNAL SERVICES & STORAGE       │                           │
├──────────────────────────────────────────┼───────────────────────────┤
│                                          │                           │
│  ┌─────────────┐  ┌──────────────┐     │                           │
│  │   Redis     │  │  Vercel KV   │←────┘ (L2 Cache)                │
│  │ Rate Limit  │  │  Edge Cache  │                                  │
│  └─────────────┘  └──────────────┘                                  │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    SUPABASE                                  │  │
│  ├──────────────────────────────────────────────────────────────┤  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │  │
│  │  │ PostgreSQL   │  │ Realtime     │  │  Storage     │      │  │
│  │  │   (16 Tables)│  │  (WebSocket) │  │  (L3 Cache)  │      │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘      │  │
│  │  ┌──────────────┐                                           │  │
│  │  │  Auth        │  Row-Level Security Enabled              │  │
│  │  │  (JWT)       │  Full-Text Search (pg_trgm)              │  │
│  │  └──────────────┘                                           │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              MOLECULAR DATA SOURCES                          │  │
│  ├──────────────────────────────────────────────────────────────┤  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │  │
│  │  │  RCSB PDB    │  │  PDB Europe  │  │  PDB Japan   │      │  │
│  │  │  (Primary)   │  │  (Fallback)  │  │  (Fallback)  │      │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘      │  │
│  │  ┌──────────────┐                                           │  │
│  │  │ AlphaFold DB │  Predicted Structures                     │  │
│  │  └──────────────┘                                           │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              MONITORING (Planned)                            │  │
│  ├──────────────────────────────────────────────────────────────┤  │
│  │  Sentry (Error Tracking) - NOT INSTALLED                    │  │
│  │  Vercel Analytics (Web Vitals) - Optional                   │  │
│  │  Unsplash API (Demo Images) - Optional                      │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

## Data Flow: PDB Structure Fetch

```
┌──────────┐
│  Client  │
└────┬─────┘
     │ 1. GET /api/pdb/1ABC
     ▼
┌─────────────────┐
│ Rate Limiter    │ 100 req/min per IP
│ (Redis/Memory)  │
└────┬────────────┘
     │ 2. Check limit
     ▼
┌──────────────────┐
│ Deduplication    │ Prevent concurrent duplicates
│ (In-memory Map)  │
└────┬─────────────┘
     │ 3. Check pending
     ▼
┌──────────────────┐
│ L2 Cache         │ Vercel KV (24h TTL)
│ (Edge)           │ Target: 70% hit rate
└────┬─────────────┘
     │ 4. Cache miss
     ▼
┌──────────────────┐
│ L3 Cache         │ Supabase Storage (7d TTL)
│ (Supabase)       │ Target: 90% combined hit
└────┬─────────────┘
     │ 5. Cache miss
     ▼
┌──────────────────┐     ┌──────────────┐     ┌──────────────┐
│   RCSB PDB API   │────▶│ PDB Europe   │────▶│  PDB Japan   │
│   (Primary)      │     │  (Fallback)  │     │  (Fallback)  │
└────┬─────────────┘     └──────────────┘     └──────────────┘
     │ 6. Fetch PDB file
     ▼
┌──────────────────┐
│  PDB Parser      │ Parse atoms, bonds, metadata
│  (pdb-parser.ts) │
└────┬─────────────┘
     │ 7. Structure data
     ▼
┌──────────────────┐
│ Cache Warmup     │ Parallel writes to L2 & L3
│ (Promise.all)    │
└────┬─────────────┘
     │ 8. Return
     ▼
┌──────────┐
│  Client  │ JSON response with structure
└──────────┘
```

## Database Schema (Simplified)

```
┌─────────────────────────────────────────────────────────────────────┐
│                        SUPABASE POSTGRESQL                          │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────┐           ┌──────────────────┐
│  auth.users      │           │ user_profiles    │
│  (Supabase)      │──────────▶│ id (FK)          │
│                  │ 1:1       │ username         │
│  id (PK)         │           │ display_name     │
│  email           │           │ role             │
│  created_at      │           │ preferences      │
└──────────────────┘           │ institution      │
                               └────────┬─────────┘
                                        │
                    ┌───────────────────┼───────────────────┐
                    │                   │                   │
                    ▼                   ▼                   ▼
         ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
         │   structures     │ │ learning_content │ │ simulation_jobs  │
         ├──────────────────┤ ├──────────────────┤ ├──────────────────┤
         │ id (PK)          │ │ id (PK)          │ │ id (PK)          │
         │ owner_id (FK)    │ │ creator_id (FK)  │ │ user_id (FK)     │
         │ name             │ │ title            │ │ structure_id (FK)│
         │ structure_type   │ │ content_type     │ │ simulation_type  │
         │ file_path        │ │ content_data     │ │ status           │
         │ visibility       │ │ difficulty       │ │ result_path      │
         │ tags[]           │ │ tags[]           │ │ progress_percent │
         └────────┬─────────┘ └────────┬─────────┘ └──────────────────┘
                  │                    │
        ┌─────────┼────────┐          │
        │         │        │          │
        ▼         ▼        ▼          ▼
  ┌───────┐ ┌──────┐ ┌────────┐ ┌──────────┐
  │favs   │ │shares│ │versions│ │progress  │
  └───────┘ └──────┘ └────────┘ └──────────┘

┌──────────────────────────────────────────────────────────────────┐
│ REALTIME SUBSCRIPTIONS (5 tables)                                │
├──────────────────────────────────────────────────────────────────┤
│ • user_profiles         • structures                             │
│ • simulation_jobs       • structure_comments                     │
│ • collection_structures                                          │
└──────────────────────────────────────────────────────────────────┘
```

## Authentication & Authorization Flow

```
┌─────────┐
│ Client  │
└────┬────┘
     │ 1. Sign Up/In
     ▼
┌──────────────────────┐
│  Supabase Auth SDK   │
│  (Client-side)       │
└────┬─────────────────┘
     │ 2. POST /auth/v1/signup
     ▼
┌──────────────────────┐
│  Supabase Auth       │  JWT Generation
│  (Server)            │  Session Management
└────┬─────────────────┘
     │ 3. JWT + Refresh Token
     ▼
┌──────────────────────┐
│  Client Storage      │  localStorage (default)
│  (Session)           │  Auto-refresh enabled
└────┬─────────────────┘
     │ 4. Authenticated requests
     ▼
┌──────────────────────┐
│  API Middleware      │  Authorization: Bearer {jwt}
│  (Next.js)           │
└────┬─────────────────┘
     │ 5. Verify token
     ▼
┌──────────────────────┐
│  Supabase Client     │  Decode JWT
│  (Server-side)       │  Extract user.id
└────┬─────────────────┘
     │ 6. Database query with RLS
     ▼
┌──────────────────────┐
│  Row-Level Security  │  WHERE auth.uid() = owner_id
│  (PostgreSQL)        │  Automatic filtering
└────┬─────────────────┘
     │ 7. Filtered data
     ▼
┌─────────┐
│ Client  │ JSON response (only authorized data)
└─────────┘
```

## Real-Time Collaboration Flow

```
┌─────────┐                              ┌─────────┐
│ User A  │                              │ User B  │
└────┬────┘                              └────┬────┘
     │ 1. Create session                     │
     ▼                                       │
┌──────────────────────┐                    │
│ collaboration_sessions│                    │
│ (Supabase DB)        │                    │
└────┬─────────────────┘                    │
     │ 2. Generate invite code              │
     │                                       │
     │ 3. Share: /collaborate/join/ABC123   │
     │──────────────────────────────────────▶│
     │                                       │ 4. Join session
     │                                       ▼
     │                          ┌──────────────────────┐
     │                          │ Supabase Realtime    │
     │◀─────────────────────────│ Channel              │
     │                          │ channel:session-id   │
     │                          └──────────┬───────────┘
     │                                     │
     │ 5. Presence tracking (30s heartbeat)│
     │◀────────────────────────────────────┤
     │                                     │
     │ 6. Broadcast events                 │
     │◀────────────────────────────────────┤
     │  • cursor-move                      │
     │  • annotation-add                   │
     │  • camera-update                    │
     │  • user-join/leave                  │
     │                                     │
     │ 7. Two-way sync                     │
     │─────────────────────────────────────▶│
     │◀─────────────────────────────────────│
     │                                     │
```

## Caching Strategy (Multi-Tier)

```
┌────────────────────────────────────────────────────────────────┐
│                    CACHE HIERARCHY                             │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  L1: IndexedDB (Client)                                        │
│  ├─ Location: Browser storage                                 │
│  ├─ TTL: 1 hour                                               │
│  ├─ Size Limit: 100 MB                                        │
│  ├─ Hit Rate Target: 30%                                      │
│  ├─ Latency: < 100ms                                          │
│  └─ Compression: No                                           │
│                                                                │
│  L2: Vercel KV (Edge)                                          │
│  ├─ Location: Vercel edge network                             │
│  ├─ TTL: 24 hours (PDB), 5 min (search)                       │
│  ├─ Size Limit: 500 MB per key                                │
│  ├─ Hit Rate Target: 70%                                      │
│  ├─ Latency: < 500ms                                          │
│  └─ Compression: Yes (level 6)                                │
│                                                                │
│  L3: Supabase Storage                                          │
│  ├─ Location: Cloud storage (S3-compatible)                   │
│  ├─ TTL: 7 days (PDB), 30 days (AlphaFold)                    │
│  ├─ Size Limit: Unlimited                                     │
│  ├─ Hit Rate Target: 90% (combined L1+L2+L3)                  │
│  ├─ Latency: < 2s                                             │
│  └─ Compression: Yes (level 9)                                │
│                                                                │
│  Cache Warming: L3 → L2 on hit                                │
│  Invalidation: TTL-based (no manual invalidation)             │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

## Security Layers

```
┌────────────────────────────────────────────────────────────────┐
│                    SECURITY ARCHITECTURE                       │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Layer 1: Network                                              │
│  ├─ HTTPS (TLS 1.3)                         ✅ Vercel         │
│  ├─ CORS headers                            ✅ Configured     │
│  ├─ CSP headers                             ✅ Configured     │
│  └─ DDoS protection                         ✅ Vercel built-in│
│                                                                │
│  Layer 2: Application                                          │
│  ├─ Rate limiting (IP-based)                ✅ Redis          │
│  ├─ Input validation                        ✅ Zod schemas    │
│  ├─ XSS protection (uploads)                ✅ Pattern scan   │
│  ├─ File sanitization                       ✅ Path traversal │
│  └─ SQL injection prevention                ✅ RLS policies   │
│                                                                │
│  Layer 3: Authentication                                       │
│  ├─ JWT tokens (Supabase)                   ✅ Auto-refresh   │
│  ├─ OAuth (Google, GitHub)                  ✅ Configured     │
│  ├─ Magic links (OTP)                       ✅ Configured     │
│  └─ Session management                      ✅ Auto-expire    │
│                                                                │
│  Layer 4: Authorization                                        │
│  ├─ Row-Level Security (RLS)                ✅ All tables     │
│  ├─ Role-based access (RBAC)                ✅ 4 roles        │
│  ├─ Share permissions                       ✅ view/edit/admin│
│  └─ Ownership checks                        ✅ FK constraints │
│                                                                │
│  Layer 5: Data                                                 │
│  ├─ Encryption at rest                      ✅ Supabase       │
│  ├─ Encryption in transit                   ✅ TLS            │
│  ├─ Secrets management                      ✅ Env vars       │
│  └─ Audit logging                           ⚠️  Not impl.     │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

## Performance Metrics & Budgets

```
┌────────────────────────────────────────────────────────────────┐
│                  PERFORMANCE BUDGETS                           │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Web Vitals (Target)                                           │
│  ├─ LCP (Largest Contentful Paint)      < 2.5s               │
│  ├─ FID (First Input Delay)             < 100ms              │
│  ├─ CLS (Cumulative Layout Shift)       < 0.1                │
│  ├─ FCP (First Contentful Paint)        < 1.8s               │
│  └─ TTFB (Time to First Byte)           < 600ms              │
│                                                                │
│  API Response Times (Target)                                   │
│  ├─ L1 Cache Hit                         < 100ms              │
│  ├─ L2 Cache Hit                         < 500ms              │
│  ├─ L3 Cache Hit                         < 2s                 │
│  ├─ External API (PDB fetch)             < 10s                │
│  └─ Database Query                       < 300ms              │
│                                                                │
│  Cache Hit Rates (Target)                                      │
│  ├─ L1 (IndexedDB)                       30%                  │
│  ├─ L2 (Vercel KV)                       70%                  │
│  └─ L3 (Supabase Storage)                90% (combined)       │
│                                                                │
│  Concurrent Users (Capacity)                                   │
│  ├─ Database connections                 100-500 (plan-dep)   │
│  ├─ Realtime connections/channel         ~200 (plan-dep)      │
│  ├─ Rate limit (API)                     100 req/min/IP       │
│  └─ External API (PDB)                   5 concurrent         │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```


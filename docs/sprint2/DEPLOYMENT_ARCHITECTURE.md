# Production Deployment Architecture - Lab Visualizer

**Version:** 1.0.0
**Last Updated:** 2025-11-17
**Status:** Architecture Phase Complete
**SPARC Phase:** Architecture

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Infrastructure Architecture](#infrastructure-architecture)
3. [Data Flow Architecture](#data-flow-architecture)
4. [Security Architecture](#security-architecture)
5. [Monitoring & Observability](#monitoring--observability)
6. [Scalability & Performance](#scalability--performance)
7. [Cost Architecture](#cost-architecture)
8. [Deployment Zones](#deployment-zones)
9. [Technology Stack](#technology-stack)
10. [Architecture Decision Records](#architecture-decision-records)

---

## Executive Summary

### Architecture Goals

The Lab Visualizer production deployment architecture is designed with the following core principles:

1. **Performance First**: Sub-3s initial load, <100ms interactions
2. **Global Accessibility**: CDN-backed delivery with <200ms latency worldwide
3. **Cost Efficiency**: Target <$100/month for 10,000 MAU
4. **Security by Design**: Defense-in-depth with multiple security layers
5. **Developer Experience**: Fast CI/CD, instant previews, automated quality gates
6. **Reliability**: 99.9% uptime SLA with automated failover

### Key Architectural Decisions

| Decision | Rationale | Trade-offs |
|----------|-----------|------------|
| **Next.js on Vercel** | Serverless edge deployment, automatic CDN, zero-config SSL | Vendor lock-in, cold start latency |
| **Supabase Backend** | Managed PostgreSQL, Realtime, Auth, Storage in one platform | Limited customization vs self-hosted |
| **Client-Side Heavy** | Offload compute to browser for 3D rendering, reduce server costs | Requires modern browsers, higher initial payload |
| **Multi-Tier Caching** | IndexedDB → Vercel KV → Supabase Storage → External API | Cache invalidation complexity |
| **CloudFlare WAF** | DDoS protection, global CDN, free tier available | Additional DNS hop, debugging complexity |

### System Constraints

- **Browser Requirements**: WebGL 2.0, IndexedDB, ES2020+
- **Network Requirements**: 5+ Mbps for smooth 3D streaming
- **Storage Limits**: 500MB IndexedDB, 10MB LocalStorage per domain
- **Concurrent Users**: 1,000 simultaneous WebSocket connections (Supabase limit)
- **Simulation Time**: Max 60 minutes per job (Edge Function timeout)

---

## Infrastructure Architecture

### Layer 1: Global Edge Network

```
┌─────────────────────────────────────────────────────────────────────┐
│                     CLOUDFLARE GLOBAL NETWORK                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐│
│  │   Americas  │  │    EMEA     │  │     APAC    │  │   Oceania   ││
│  │  (30 POPs)  │  │  (40 POPs)  │  │  (25 POPs)  │  │  (5 POPs)   ││
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘│
│         │                │                │                │         │
│         └────────────────┴────────────────┴────────────────┘         │
│                              │                                       │
│                   ┌──────────▼──────────┐                           │
│                   │   CloudFlare WAF    │                           │
│                   │  • DDoS Protection  │                           │
│                   │  • Rate Limiting    │                           │
│                   │  • Bot Detection    │                           │
│                   │  • SSL/TLS          │                           │
│                   └──────────┬──────────┘                           │
└──────────────────────────────┼────────────────────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │   DNS Resolution    │
                    │  lab-viz.vercel.app │
                    └──────────┬──────────┘
                               │
┌──────────────────────────────▼────────────────────────────────────┐
│                        VERCEL EDGE NETWORK                         │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │              Edge Cache Layer (18 Regions)                 │   │
│  │                                                             │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐     │   │
│  │  │ US-East │  │ EU-West │  │  Asia   │  │  Other  │     │   │
│  │  │  (IAD)  │  │  (LHR)  │  │  (SIN)  │  │ Regions │     │   │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘     │   │
│  │                                                             │   │
│  │  Cache Strategy:                                           │   │
│  │  • Static Assets: 1 year TTL                              │   │
│  │  • HTML Pages: 1 hour TTL with stale-while-revalidate     │   │
│  │  • API Routes: No cache (dynamic)                         │   │
│  │  • ISR Pages: Incremental regeneration every 5 minutes    │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │            Next.js Application Runtime                     │   │
│  │                                                             │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐     │   │
│  │  │  SSR Pages   │  │  SSG Pages   │  │  ISR Pages  │     │   │
│  │  │              │  │              │  │             │     │   │
│  │  │  • Viewer    │  │  • Home      │  │  • Docs     │     │   │
│  │  │  • Player    │  │  • About     │  │  • Gallery  │     │   │
│  │  │  • Queue     │  │  • Login     │  │             │     │   │
│  │  └──────────────┘  └──────────────┘  └─────────────┘     │   │
│  │                                                             │   │
│  │  ┌──────────────────────────────────────────────────┐     │   │
│  │  │           API Routes (Serverless)                │     │   │
│  │  │                                                   │     │   │
│  │  │  • /api/pdb/fetch - PDB fetcher with caching    │     │   │
│  │  │  • /api/simulation/submit - Job queue           │     │   │
│  │  │  • /api/collaboration/create - Session mgmt     │     │   │
│  │  │  • /api/share/generate - Share link creation    │     │   │
│  │  │  • /api/analytics/track - Usage tracking        │     │   │
│  │  └──────────────────────────────────────────────────┘     │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │            Edge Functions (Compute@Edge)                   │   │
│  │                                                             │   │
│  │  • Middleware: Auth, CORS, rate limiting                  │   │
│  │  • Image optimization: Sharp/WebP conversion              │   │
│  │  • A/B testing: Feature flags                             │   │
│  │  • Geo-routing: Regional redirects                        │   │
│  └───────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Layer 2: Application Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     BROWSER CLIENT RUNTIME                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                   React Application                            │ │
│  │                                                                 │ │
│  │  ┌─────────────────────────────────────────────────────────┐  │ │
│  │  │  Component Tree                                          │  │ │
│  │  │                                                           │  │ │
│  │  │  App.tsx (Root)                                          │  │ │
│  │  │    ├─ Layout (Persistent)                                │  │ │
│  │  │    │   ├─ Header (Navigation)                            │  │ │
│  │  │    │   ├─ Sidebar (Controls)                             │  │ │
│  │  │    │   └─ Footer (Status)                                │  │ │
│  │  │    │                                                      │  │ │
│  │  │    ├─ Pages (Routed)                                     │  │ │
│  │  │    │   ├─ Viewer (/viewer/[pdbId])                       │  │ │
│  │  │    │   │   └─ MolStarViewer (WebGL)                      │  │ │
│  │  │    │   │       ├─ Canvas3D                               │  │ │
│  │  │    │   │       ├─ ControlPanel                           │  │ │
│  │  │    │   │       └─ SequenceViewer                         │  │ │
│  │  │    │   │                                                  │  │ │
│  │  │    │   ├─ Player (/player/[sessionId])                   │  │ │
│  │  │    │   │   ├─ TrajectoryPlayer                           │  │ │
│  │  │    │   │   ├─ TimelineControls                           │  │ │
│  │  │    │   │   └─ AnalysisPanel                              │  │ │
│  │  │    │   │                                                  │  │ │
│  │  │    │   ├─ Queue (/queue)                                 │  │ │
│  │  │    │   │   ├─ JobList (Realtime updates)                 │  │ │
│  │  │    │   │   ├─ JobSubmit (Form)                           │  │ │
│  │  │    │   │   └─ JobDetails (Metrics)                       │  │ │
│  │  │    │   │                                                  │  │ │
│  │  │    │   └─ Share (/share/[shareId])                       │  │ │
│  │  │    │       ├─ CollaborationSession                       │  │ │
│  │  │    │       ├─ CursorSync                                 │  │ │
│  │  │    │       └─ ChatPanel                                  │  │ │
│  │  │    │                                                      │  │ │
│  │  │    └─ Providers (Context)                                │  │ │
│  │  │        ├─ AuthProvider (Supabase)                        │  │ │
│  │  │        ├─ ThemeProvider (Dark/Light)                     │  │ │
│  │  │        ├─ ToastProvider (Notifications)                  │  │ │
│  │  │        └─ AnalyticsProvider (Tracking)                   │  │ │
│  │  └─────────────────────────────────────────────────────────┘  │ │
│  │                                                                 │ │
│  │  ┌─────────────────────────────────────────────────────────┐  │ │
│  │  │  State Management (Zustand)                              │  │ │
│  │  │                                                           │  │ │
│  │  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │  │ │
│  │  │  │ viewerStore  │  │  authStore   │  │  queueStore  │  │  │ │
│  │  │  │              │  │              │  │              │  │  │ │
│  │  │  │ • structure  │  │ • user       │  │ • jobs[]     │  │  │ │
│  │  │  │ • camera     │  │ • session    │  │ • filters    │  │  │ │
│  │  │  │ • selection  │  │ • loading    │  │ • realtime   │  │  │ │
│  │  │  │ • settings   │  │ • error      │  │              │  │  │ │
│  │  │  └──────────────┘  └──────────────┘  └──────────────┘  │  │ │
│  │  │                                                           │  │ │
│  │  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │  │ │
│  │  │  │  shareStore  │  │ playerStore  │  │  uiStore     │  │  │ │
│  │  │  │              │  │              │  │              │  │  │ │
│  │  │  │ • session    │  │ • trajectory │  │ • sidebar    │  │  │ │
│  │  │  │ • cursors[]  │  │ • frame      │  │ • theme      │  │  │ │
│  │  │  │ • chat[]     │  │ • playing    │  │ • toast[]    │  │  │ │
│  │  │  │ • role       │  │ • speed      │  │              │  │  │ │
│  │  │  └──────────────┘  └──────────────┘  └──────────────┘  │  │ │
│  │  └─────────────────────────────────────────────────────────┘  │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                 Mol* Molecular Viewer                          │ │
│  │                                                                 │ │
│  │  ┌─────────────────────────────────────────────────────────┐  │ │
│  │  │  WebGL Rendering Pipeline                                │  │
│  │  │                                                           │  │
│  │  │  Data → Parse → Build → Render → Canvas                 │  │
│  │  │                                                           │  │
│  │  │  1. Data Preparation:                                    │  │
│  │  │     • PDB/mmCIF parsing                                  │  │
│  │  │     • Structure validation                               │  │
│  │  │     • Topology analysis                                  │  │
│  │  │                                                           │  │
│  │  │  2. Geometry Building:                                   │  │
│  │  │     • Atom positions → Vertices                          │  │
│  │  │     • Bonds → Lines/Cylinders                            │  │
│  │  │     • Ribbons → Bezier curves                            │  │
│  │  │     • Surfaces → Marching cubes                          │  │
│  │  │                                                           │  │
│  │  │  3. Rendering:                                           │  │
│  │  │     • Shader compilation                                 │  │
│  │  │     • Buffer management                                  │  │
│  │  │     • Draw calls optimization                            │  │
│  │  │     • Anti-aliasing (FXAA)                               │  │
│  │  │                                                           │  │
│  │  │  4. Interaction:                                         │  │
│  │  │     • Camera controls (OrbitControls)                    │  │
│  │  │     • Picking (GPU-based)                                │  │
│  │  │     • Selection highlighting                             │  │
│  │  │     • Animation (trajectory playback)                    │  │
│  │  └─────────────────────────────────────────────────────────┘  │ │
│  │                                                                 │ │
│  │  ┌─────────────────────────────────────────────────────────┐  │ │
│  │  │  Level-of-Detail (LOD) Manager                           │  │
│  │  │                                                           │  │
│  │  │  Atom Count → Representation Strategy                    │  │
│  │  │                                                           │  │
│  │  │  < 1,000:      Full detail (ball-and-stick)             │  │
│  │  │  1,000-10,000: Medium detail (cartoon + CA trace)       │  │
│  │  │  10,000-50,000: Low detail (cartoon only)               │  │
│  │  │  > 50,000:     Minimal (backbone trace)                 │  │
│  │  │                                                           │  │
│  │  │  Progressive Loading:                                    │  │
│  │  │  1. Backbone (1st frame)                                │  │
│  │  │  2. Cartoon (within 500ms)                              │  │
│  │  │  3. Side chains (within 2s)                             │  │
│  │  │  4. Full detail (within 5s)                             │  │
│  │  └─────────────────────────────────────────────────────────┘  │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │              Browser Storage Layer                             │ │
│  │                                                                 │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │ │
│  │  │  IndexedDB   │  │LocalStorage  │  │ Cache API    │        │ │
│  │  │  (500MB)     │  │  (10MB)      │  │ (Unlimited)  │        │ │
│  │  ├──────────────┤  ├──────────────┤  ├──────────────┤        │ │
│  │  │              │  │              │  │              │        │ │
│  │  │ Structures:  │  │ Settings:    │  │ Assets:      │        │ │
│  │  │ • PDB files  │  │ • theme      │  │ • JS chunks  │        │ │
│  │  │ • Trajectories│  │ • camera     │  │ • CSS        │        │ │
│  │  │ • Surfaces   │  │ • prefs      │  │ • Images     │        │ │
│  │  │              │  │              │  │ • Fonts      │        │ │
│  │  │ Sessions:    │  │ Auth:        │  │              │        │ │
│  │  │ • shareData  │  │ • jwt        │  │ Workbox SW:  │        │ │
│  │  │ • cursors    │  │ • refresh    │  │ • Precache   │        │ │
│  │  │ • chat       │  │              │  │ • Runtime    │        │ │
│  │  │              │  │              │  │ • Stale-while│        │ │
│  │  │              │  │              │  │   -revalidate│        │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘        │ │
│  │                                                                 │ │
│  │  Eviction Policy:                                              │ │
│  │  • LRU (Least Recently Used)                                   │ │
│  │  • Max age: 30 days                                            │ │
│  │  • Priority: User structures > Gallery > Cached                │ │
│  └───────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

### Layer 3: Backend Services

```
┌─────────────────────────────────────────────────────────────────────┐
│                      SUPABASE BACKEND PLATFORM                       │
│                     (us-east-1 primary region)                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │              PostgreSQL Database (RDS Aurora)                  │ │
│  │                                                                 │ │
│  │  ┌─────────────────────────────────────────────────────────┐  │ │
│  │  │  Database Schema                                         │  │ │
│  │  │                                                           │  │ │
│  │  │  Tables:                                                  │  │ │
│  │  │                                                           │  │ │
│  │  │  auth.users (Supabase managed)                           │  │ │
│  │  │    • id: uuid (PK)                                       │  │ │
│  │  │    • email: varchar                                      │  │ │
│  │  │    • encrypted_password: varchar                         │  │ │
│  │  │    • created_at: timestamptz                             │  │ │
│  │  │                                                           │  │ │
│  │  │  public.structures                                       │  │ │
│  │  │    • id: uuid (PK)                                       │  │ │
│  │  │    • pdb_id: varchar(4) UNIQUE                           │  │ │
│  │  │    • title: text                                         │  │ │
│  │  │    • organism: text                                      │  │ │
│  │  │    • method: varchar                                     │  │ │
│  │  │    • resolution: float                                   │  │ │
│  │  │    • atom_count: int                                     │  │ │
│  │  │    • file_url: text (Storage bucket)                     │  │ │
│  │  │    • cached_at: timestamptz                              │  │ │
│  │  │    • metadata: jsonb                                     │  │ │
│  │  │    INDEX idx_pdb_id (pdb_id)                             │  │ │
│  │  │    INDEX idx_cached_at (cached_at DESC)                  │  │ │
│  │  │                                                           │  │ │
│  │  │  public.simulation_jobs                                  │  │ │
│  │  │    • id: uuid (PK)                                       │  │ │
│  │  │    • user_id: uuid (FK → auth.users)                     │  │ │
│  │  │    • structure_id: uuid (FK → structures)                │  │ │
│  │  │    • status: job_status_enum                             │  │ │
│  │  │      (pending|running|completed|failed|cancelled)        │  │ │
│  │  │    • parameters: jsonb                                   │  │ │
│  │  │      {forcefield, steps, temp, ensemble, ...}            │  │ │
│  │  │    • progress: float (0-100)                             │  │ │
│  │  │    • started_at: timestamptz                             │  │ │
│  │  │    • completed_at: timestamptz                           │  │ │
│  │  │    • result_url: text (Storage bucket)                   │  │ │
│  │  │    • error_message: text                                 │  │ │
│  │  │    • created_at: timestamptz                             │  │ │
│  │  │    INDEX idx_user_status (user_id, status)               │  │ │
│  │  │    INDEX idx_created_at (created_at DESC)                │  │ │
│  │  │                                                           │  │ │
│  │  │  public.collaboration_sessions                           │  │ │
│  │  │    • id: uuid (PK)                                       │  │ │
│  │  │    • share_id: varchar(12) UNIQUE                        │  │ │
│  │  │    • owner_id: uuid (FK → auth.users)                    │  │ │
│  │  │    • structure_id: uuid (FK → structures)                │  │ │
│  │  │    • state: jsonb (camera, selection, settings)          │  │ │
│  │  │    • permissions: jsonb                                  │  │ │
│  │  │      {owner: [...], presenter: [...], viewer: [...]}     │  │ │
│  │  │    • expires_at: timestamptz                             │  │ │
│  │  │    • created_at: timestamptz                             │  │ │
│  │  │    INDEX idx_share_id (share_id)                         │  │ │
│  │  │    INDEX idx_owner (owner_id)                            │  │ │
│  │  │                                                           │  │ │
│  │  │  public.session_participants                             │  │ │
│  │  │    • id: uuid (PK)                                       │  │ │
│  │  │    • session_id: uuid (FK → collaboration_sessions)      │  │ │
│  │  │    • user_id: uuid (FK → auth.users, nullable)           │  │ │
│  │  │    • role: session_role_enum (owner|presenter|viewer)    │  │ │
│  │  │    • cursor_position: point                              │  │ │
│  │  │    • last_seen: timestamptz                              │  │ │
│  │  │    • joined_at: timestamptz                              │  │ │
│  │  │    INDEX idx_session (session_id)                        │  │ │
│  │  │                                                           │  │ │
│  │  │  public.chat_messages                                    │  │ │
│  │  │    • id: uuid (PK)                                       │  │ │
│  │  │    • session_id: uuid (FK → collaboration_sessions)      │  │ │
│  │  │    • user_id: uuid (FK → auth.users, nullable)           │  │ │
│  │  │    • message: text                                       │  │ │
│  │  │    • created_at: timestamptz                             │  │ │
│  │  │    INDEX idx_session_time (session_id, created_at)       │  │ │
│  │  │                                                           │  │ │
│  │  │  public.usage_analytics                                  │  │ │
│  │  │    • id: uuid (PK)                                       │  │ │
│  │  │    • user_id: uuid (FK → auth.users, nullable)           │  │ │
│  │  │    • event_type: varchar                                 │  │ │
│  │  │    • event_data: jsonb                                   │  │ │
│  │  │    • session_id: uuid                                    │  │ │
│  │  │    • created_at: timestamptz                             │  │ │
│  │  │    PARTITION BY RANGE (created_at)                       │  │ │
│  │  └─────────────────────────────────────────────────────────┘  │ │
│  │                                                                 │ │
│  │  ┌─────────────────────────────────────────────────────────┐  │ │
│  │  │  Row Level Security (RLS) Policies                       │  │ │
│  │  │                                                           │  │ │
│  │  │  structures:                                              │  │ │
│  │  │    SELECT: Public read access                            │  │ │
│  │  │    INSERT: Authenticated users only                      │  │ │
│  │  │    UPDATE: Owner or admin                                │  │ │
│  │  │    DELETE: Admin only                                    │  │ │
│  │  │                                                           │  │ │
│  │  │  simulation_jobs:                                        │  │ │
│  │  │    SELECT: auth.uid() = user_id                          │  │ │
│  │  │    INSERT: auth.uid() = user_id                          │  │ │
│  │  │    UPDATE: auth.uid() = user_id                          │  │ │
│  │  │    DELETE: auth.uid() = user_id                          │  │ │
│  │  │                                                           │  │ │
│  │  │  collaboration_sessions:                                 │  │ │
│  │  │    SELECT: Public (if share_id known)                    │  │ │
│  │  │    INSERT: Authenticated users                           │  │ │
│  │  │    UPDATE: auth.uid() = owner_id                         │  │ │
│  │  │    DELETE: auth.uid() = owner_id                         │  │ │
│  │  │                                                           │  │ │
│  │  │  session_participants:                                   │  │ │
│  │  │    SELECT: session_id IN (user's sessions)               │  │ │
│  │  │    INSERT: Authenticated users                           │  │ │
│  │  │    UPDATE: auth.uid() = user_id                          │  │ │
│  │  │    DELETE: auth.uid() = user_id OR session owner         │  │ │
│  │  │                                                           │  │ │
│  │  │  chat_messages:                                          │  │ │
│  │  │    SELECT: session_id IN (user's sessions)               │  │ │
│  │  │    INSERT: Authenticated + in session                    │  │ │
│  │  │    UPDATE: Never                                         │  │ │
│  │  │    DELETE: auth.uid() = user_id OR session owner         │  │ │
│  │  └─────────────────────────────────────────────────────────┘  │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                  Realtime (WebSocket Server)                   │ │
│  │                                                                 │ │
│  │  ┌─────────────────────────────────────────────────────────┐  │ │
│  │  │  Channels & Subscriptions                                │  │ │
│  │  │                                                           │  │ │
│  │  │  Channel: simulation_jobs                                │  │ │
│  │  │    Event: INSERT                                         │  │ │
│  │  │    Event: UPDATE (status, progress)                      │  │ │
│  │  │    Filter: user_id = auth.uid()                          │  │ │
│  │  │    Broadcast: Job status to owner                        │  │ │
│  │  │                                                           │  │ │
│  │  │  Channel: collaboration_sessions:{session_id}            │  │ │
│  │  │    Event: session_participants:*                         │  │ │
│  │  │      • cursor_position updates (throttled 30Hz)          │  │ │
│  │  │      • user join/leave                                   │  │ │
│  │  │    Event: chat_messages:INSERT                           │  │ │
│  │  │      • new messages                                      │  │ │
│  │  │    Event: state:UPDATE                                   │  │ │
│  │  │      • camera sync (presenter only)                      │  │ │
│  │  │      • selection sync                                    │  │ │
│  │  │    Filter: session_id = channel param                    │  │ │
│  │  │    Authorization: RLS policies                           │  │ │
│  │  │                                                           │  │ │
│  │  │  Presence:                                                │  │ │
│  │  │    • Track online users per session                      │  │ │
│  │  │    • Heartbeat: 10s interval                             │  │ │
│  │  │    • Timeout: 30s                                        │  │ │
│  │  │    • Payload: {userId, role, cursor, color}              │  │ │
│  │  └─────────────────────────────────────────────────────────┘  │ │
│  │                                                                 │ │
│  │  Connection Limits:                                            │ │
│  │    • Max concurrent connections: 1,000 (Pro tier)              │ │
│  │    • Max channels per connection: 100                          │ │
│  │    • Message rate: 100/sec per channel                         │ │
│  │    • Max message size: 256KB                                   │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                  Storage (S3-compatible)                       │ │
│  │                                                                 │ │
│  │  Buckets:                                                      │ │
│  │                                                                 │ │
│  │  ┌──────────────────────────────────────────────────┐         │ │
│  │  │  structures (Public)                              │         │ │
│  │  │                                                   │         │ │
│  │  │  Path: /pdb/{pdbId}.{cif|pdb}                    │         │ │
│  │  │  Policy: Public read, authenticated write        │         │ │
│  │  │  Max file size: 50MB                              │         │ │
│  │  │  Allowed types: .pdb, .cif, .mmcif                │         │ │
│  │  │  TTL: 30 days (LRU eviction)                      │         │ │
│  │  └──────────────────────────────────────────────────┘         │ │
│  │                                                                 │ │
│  │  ┌──────────────────────────────────────────────────┐         │ │
│  │  │  trajectories (Private)                           │         │ │
│  │  │                                                   │         │ │
│  │  │  Path: /user/{userId}/sim/{jobId}.dcd            │         │ │
│  │  │  Policy: Owner read/write only (RLS)             │         │ │
│  │  │  Max file size: 500MB                             │         │ │
│  │  │  Allowed types: .dcd, .xtc, .trr                  │         │ │
│  │  │  TTL: 7 days                                      │         │ │
│  │  └──────────────────────────────────────────────────┘         │ │
│  │                                                                 │ │
│  │  ┌──────────────────────────────────────────────────┐         │ │
│  │  │  exports (Private)                                │         │ │
│  │  │                                                   │         │ │
│  │  │  Path: /user/{userId}/export/{exportId}.zip      │         │ │
│  │  │  Policy: Owner read only                         │         │ │
│  │  │  Max file size: 100MB                             │         │ │
│  │  │  Allowed types: .zip, .tar.gz                     │         │ │
│  │  │  TTL: 24 hours                                    │         │ │
│  │  │  Auto-delete: After first download               │         │ │
│  │  └──────────────────────────────────────────────────┘         │ │
│  │                                                                 │ │
│  │  CDN Integration:                                              │ │
│  │    • Automatic CloudFront distribution                         │ │
│  │    • Edge caching (1 hour TTL)                                 │ │
│  │    • Compression (gzip, br)                                    │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                  Authentication (JWT)                          │ │
│  │                                                                 │ │
│  │  Providers:                                                    │ │
│  │    • Email/Password (default)                                  │ │
│  │    • Magic Link (passwordless)                                 │ │
│  │    • Google OAuth                                              │ │
│  │    • GitHub OAuth                                              │ │
│  │                                                                 │ │
│  │  Token Configuration:                                          │ │
│  │    • Access Token: 1 hour expiry                               │ │
│  │    • Refresh Token: 7 days expiry                              │ │
│  │    • Algorithm: HS256                                          │ │
│  │    • Secret: Managed by Supabase                               │ │
│  │                                                                 │ │
│  │  Session Management:                                           │ │
│  │    • Persistent: localStorage                                  │ │
│  │    • Auto-refresh: 50 minutes (before expiry)                  │ │
│  │    • Multi-tab sync: BroadcastChannel                          │ │
│  │    • Logout: Token blacklist (Redis)                           │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │               Edge Functions (Deno Runtime)                    │ │
│  │                                                                 │ │
│  │  Function: openmm-worker                                       │ │
│  │    Trigger: HTTP POST /openmm-worker                           │ │
│  │    Timeout: 60 minutes                                         │ │
│  │    Memory: 2GB                                                 │ │
│  │    Concurrency: 10                                             │ │
│  │                                                                 │ │
│  │    Workflow:                                                   │ │
│  │    1. Validate job parameters                                  │ │
│  │    2. Fetch structure from storage                             │ │
│  │    3. Initialize OpenMM simulation                             │ │
│  │    4. Run MD steps with progress updates (Realtime)            │ │
│  │    5. Save trajectory to storage                               │ │
│  │    6. Update job status to 'completed'                         │ │
│  │    7. Notify user via Realtime                                 │ │
│  │                                                                 │ │
│  │    Error Handling:                                             │ │
│  │    • Retry: 3 attempts with exponential backoff                │ │
│  │    • Timeout: Mark as 'failed' after 60min                     │ │
│  │    • Logging: Structured JSON to Supabase Logs                 │ │
│  │                                                                 │ │
│  │  Function: pdb-sync                                            │ │
│  │    Trigger: Cron (daily at 2 AM UTC)                           │ │
│  │    Purpose: Sync latest structures from RCSB                   │ │
│  │    Workflow:                                                   │ │
│  │    1. Fetch new entries from RCSB API                          │ │
│  │    2. Download structure files                                 │ │
│  │    3. Upload to storage bucket                                 │ │
│  │    4. Insert metadata to database                              │ │
│  │                                                                 │ │
│  │  Function: cache-warmer                                        │ │
│  │    Trigger: Cron (hourly)                                      │ │
│  │    Purpose: Pre-cache popular structures                       │ │
│  │    Workflow:                                                   │ │
│  │    1. Query top 100 viewed structures                          │ │
│  │    2. Ensure cached in storage                                 │ │
│  │    3. Warm Vercel KV cache                                     │ │
│  └───────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

### Layer 4: External Dependencies

```
┌─────────────────────────────────────────────────────────────────────┐
│                     EXTERNAL API INTEGRATIONS                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  RCSB Protein Data Bank (Primary)                             │ │
│  │                                                                 │ │
│  │  Base URL: https://files.rcsb.org/download/                   │ │
│  │  Rate Limit: None (best effort)                                │ │
│  │  Retry Strategy: 3 attempts, exponential backoff               │ │
│  │                                                                 │ │
│  │  Endpoints:                                                    │ │
│  │    GET /{pdbId}.cif     → mmCIF file                          │ │
│  │    GET /{pdbId}.pdb     → Legacy PDB file                     │ │
│  │    GET /{pdbId}.xml     → PDBML file                          │ │
│  │                                                                 │ │
│  │  Fallback Chain:                                               │ │
│  │    1. RCSB US (files.rcsb.org)                                │ │
│  │    2. PDBe EU (ftp.ebi.ac.uk/pub/databases/pdb)               │ │
│  │    3. PDBj JP (ftp.pdbj.org/pub/pdb)                          │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  AlphaFold Protein Structure Database                          │ │
│  │                                                                 │ │
│  │  Base URL: https://alphafold.ebi.ac.uk/                       │ │
│  │  Rate Limit: 10 req/sec                                        │ │
│  │                                                                 │ │
│  │  Endpoints:                                                    │ │
│  │    GET /files/AF-{uniprotId}-F1-model_v4.cif                  │ │
│  │    GET /api/prediction/{uniprotId}                            │ │
│  │                                                                 │ │
│  │  Features:                                                     │ │
│  │    • Predicted structures for 200M+ proteins                   │ │
│  │    • Confidence scores (pLDDT)                                 │ │
│  │    • PAE (Predicted Aligned Error) matrices                    │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  UniProt (Protein Metadata)                                    │ │
│  │                                                                 │ │
│  │  Base URL: https://rest.uniprot.org/                          │ │
│  │  Rate Limit: None                                              │ │
│  │                                                                 │ │
│  │  Endpoints:                                                    │ │
│  │    GET /uniprotkb/{accession}.json                            │ │
│  │    GET /uniprotkb/search?query={query}                        │ │
│  │                                                                 │ │
│  │  Use Cases:                                                    │ │
│  │    • Protein function annotation                               │ │
│  │    • Gene ontology terms                                       │ │
│  │    • Cross-references to PDB                                   │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  Monitoring & Analytics                                        │ │
│  │                                                                 │ │
│  │  Vercel Analytics:                                             │ │
│  │    • Web Vitals (LCP, FID, CLS)                               │ │
│  │    • Page views, unique visitors                               │ │
│  │    • Geographic distribution                                   │ │
│  │                                                                 │ │
│  │  Sentry:                                                       │ │
│  │    • Error tracking                                            │ │
│  │    • Performance monitoring                                    │ │
│  │    • Session replay                                            │ │
│  │                                                                 │ │
│  │  PostHog (Optional):                                           │ │
│  │    • Product analytics                                         │ │
│  │    • Feature flags                                             │ │
│  │    • A/B testing                                               │ │
│  └───────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Architecture

### User Journey 1: View Structure

```
┌──────────────────────────────────────────────────────────────────────┐
│                    STRUCTURE VIEWING WORKFLOW                         │
└──────────────────────────────────────────────────────────────────────┘

Step 1: User Request
─────────────────────
User navigates to: https://lab-viz.vercel.app/viewer/1crn

Browser:
  ├─ DNS lookup (CloudFlare)
  └─ HTTP GET request

Step 2: CDN Layer
─────────────────
CloudFlare Edge:
  ├─ Check cache for HTML
  │  ├─ HIT → Return cached HTML (10ms)
  │  └─ MISS → Forward to Vercel
  └─ Apply WAF rules
     ├─ Rate limit check (100 req/min)
     ├─ DDoS detection
     └─ Bot filtering

Vercel Edge:
  ├─ Check edge cache for /viewer/[pdbId]
  │  ├─ HIT → Return SSR HTML (50ms)
  │  └─ MISS → Invoke Next.js server
  └─ Execute edge middleware
     ├─ Set CORS headers
     ├─ Add security headers (CSP, HSTS)
     └─ Log request

Step 3: Server-Side Rendering
──────────────────────────────
Next.js Server (Vercel Lambda):
  ├─ getServerSideProps({ params: { pdbId: '1crn' } })
  │  ├─ Fetch metadata from Supabase
  │  │  Query: SELECT * FROM structures WHERE pdb_id = '1crn'
  │  │  └─ Return: { id, title, organism, method, ... }
  │  │
  │  └─ Generate page props
  │     └─ { structure: {...}, initialState: {...} }
  │
  ├─ Render React components to HTML
  │  ├─ <ViewerPage structure={...} />
  │  │  ├─ <Header />
  │  │  ├─ <MolStarViewer /> (placeholder)
  │  │  └─ <ControlPanel />
  │  │
  │  └─ Inject script tags
  │     ├─ _app.js (React runtime)
  │     ├─ viewer/[pdbId].js (page chunk)
  │     └─ molstar.js (3D library)
  │
  └─ Return HTML response (200-500ms)
     └─ Cache-Control: public, max-age=3600, stale-while-revalidate

Browser receives HTML (Total: 250-600ms)

Step 4: Client-Side Hydration
──────────────────────────────
Browser:
  ├─ Parse HTML
  ├─ Download assets (parallel)
  │  ├─ _app.js (200KB, cached)
  │  ├─ viewer/[pdbId].js (50KB)
  │  ├─ molstar.js (800KB, cached)
  │  └─ styles.css (20KB, cached)
  │
  ├─ React hydration (100-200ms)
  │  ├─ Mount <ViewerPage />
  │  ├─ Initialize Zustand store
  │  │  └─ viewerStore.setState({ pdbId: '1crn', ... })
  │  │
  │  └─ Mount <MolStarViewer />
  │     └─ Trigger PDB fetch
  │
  └─ First Contentful Paint (FCP): 800ms
     └─ Largest Contentful Paint (LCP): 1.2s

Step 5: Structure Data Fetch (Multi-Tier Cache)
────────────────────────────────────────────────

L1 Cache: IndexedDB (Browser)
  ├─ Check: localforage.getItem('pdb:1crn')
  │  ├─ HIT → Parse structure (50ms) → Render
  │  └─ MISS → Continue to L2
  │
  └─ Store policy:
     ├─ Key: 'pdb:${pdbId}'
     ├─ TTL: 30 days
     ├─ Eviction: LRU (500MB max)

L2 Cache: Vercel KV (Redis)
  ├─ API call: GET /api/pdb/fetch?id=1crn
  │  └─ Server checks: await kv.get('pdb:1crn')
  │     ├─ HIT → Return binary (100ms) → Store in L1 → Render
  │     └─ MISS → Continue to L3
  │
  └─ Store policy:
     ├─ Key: 'pdb:${pdbId}'
     ├─ TTL: 7 days
     ├─ Max size: 10MB per entry

L3 Cache: Supabase Storage
  ├─ Query: SELECT file_url FROM structures WHERE pdb_id = '1crn'
  │  ├─ HIT → Download from bucket (200-500ms)
  │  │  └─ URL: https://xyz.supabase.co/storage/v1/object/public/structures/pdb/1crn.cif
  │  │     └─ Store in L2, L1 → Render
  │  │
  │  └─ MISS → Continue to external API
  │
  └─ Store policy:
     ├─ Path: /pdb/{pdbId}.{ext}
     ├─ TTL: 30 days
     ├─ CDN: CloudFront edge cache

L4: External API (RCSB PDB)
  ├─ Fetch: https://files.rcsb.org/download/1crn.cif
  │  ├─ Retry strategy: 3 attempts, exponential backoff
  │  ├─ Timeout: 10s per attempt
  │  └─ Fallback: PDBe → PDBj
  │
  ├─ Download structure file (500-2000ms)
  │  └─ Size: 100KB - 50MB (typical: 1-5MB)
  │
  ├─ Validate file
  │  ├─ Parse mmCIF/PDB format
  │  ├─ Check for errors
  │  └─ Extract metadata
  │
  ├─ Store in cache pipeline
  │  ├─ Upload to Supabase Storage
  │  ├─ Insert metadata to DB
  │  ├─ Cache in Vercel KV
  │  └─ Return to client → Store in IndexedDB
  │
  └─ Total time (cache miss): 1-3s

Step 6: Structure Parsing & Rendering
──────────────────────────────────────

Mol* Viewer:
  ├─ Parse structure data
  │  ├─ mmCIF parser (Mol* built-in)
  │  ├─ Build molecular topology
  │  │  ├─ Atoms: 327 (for 1crn)
  │  │  ├─ Bonds: computed from distance
  │  │  └─ Secondary structure: HELIX, SHEET
  │  │
  │  └─ Time: 50-200ms (small protein)
  │
  ├─ LOD selection (based on atom count)
  │  └─ 327 atoms → Full detail (ball-and-stick)
  │
  ├─ Build geometry
  │  ├─ Generate vertices, normals, colors
  │  ├─ Create WebGL buffers
  │  │  ├─ Position buffer
  │  │  ├─ Color buffer
  │  │  ├─ Normal buffer
  │  │  └─ Index buffer
  │  │
  │  └─ Time: 100-500ms
  │
  ├─ Initialize WebGL context
  │  ├─ Get canvas element
  │  ├─ Create WebGL2 context
  │  ├─ Compile shaders
  │  │  ├─ Vertex shader
  │  │  └─ Fragment shader
  │  │
  │  └─ Set initial camera
  │     ├─ Position: auto-computed bounding box
  │     ├─ Target: center of mass
  │     └─ FOV: 45 degrees
  │
  ├─ Render loop (60 FPS)
  │  ├─ Update uniforms (camera matrices)
  │  ├─ Draw calls
  │  │  ├─ Draw atoms
  │  │  ├─ Draw bonds
  │  │  └─ Draw ribbons
  │  │
  │  ├─ Post-processing
  │  │  ├─ FXAA (anti-aliasing)
  │  │  └─ Ambient occlusion (optional)
  │  │
  │  └─ requestAnimationFrame()
  │
  └─ First frame rendered: 200-800ms after data received
     └─ Time to Interactive (TTI): 2-4s total

Step 7: Progressive Enhancement
────────────────────────────────

Background tasks:
  ├─ Preload related structures
  │  └─ Fetch similar PDB IDs from API
  │     └─ Store in IndexedDB for instant access
  │
  ├─ Initialize collaboration
  │  └─ If share_id present:
  │     ├─ Connect to Realtime channel
  │     ├─ Subscribe to session updates
  │     └─ Sync camera/selection
  │
  ├─ Track analytics
  │  ├─ Log page view (Vercel Analytics)
  │  ├─ Track Web Vitals
  │  │  ├─ LCP: 1.2s (target: <2.5s) ✓
  │  │  ├─ FID: 50ms (target: <100ms) ✓
  │  │  └─ CLS: 0.05 (target: <0.1) ✓
  │  │
  │  └─ Record to Supabase analytics table
  │
  └─ Service Worker
     ├─ Cache assets for offline use
     └─ Enable PWA install prompt

Performance Summary
───────────────────
Cache HIT (95% of requests):
  ├─ L1 (IndexedDB): 50-100ms
  └─ User sees structure in <500ms ✓

Cache MISS (5% of requests):
  ├─ External fetch: 1-3s
  └─ User sees structure in 2-4s ✓

Target Metrics:
  ├─ LCP: <2.5s ✓
  ├─ FID: <100ms ✓
  ├─ CLS: <0.1 ✓
  └─ TTI: <4s ✓
```

### User Journey 2: Run Simulation

```
┌──────────────────────────────────────────────────────────────────────┐
│                   MOLECULAR DYNAMICS SIMULATION                       │
└──────────────────────────────────────────────────────────────────────┘

Step 1: Job Submission
──────────────────────

User Interface (/queue page):
  ├─ User fills form:
  │  ├─ Structure: 1crn (from viewer)
  │  ├─ Force field: AMBER14
  │  ├─ Simulation steps: 10,000
  │  ├─ Temperature: 300K
  │  ├─ Ensemble: NVT
  │  └─ Timestep: 2fs
  │
  ├─ Client-side validation
  │  ├─ Check required fields
  │  ├─ Validate numeric ranges
  │  └─ Estimate runtime: ~5 minutes
  │
  └─ Submit button click

Step 2: API Request
───────────────────

Browser:
  POST /api/simulation/submit
  Body: {
    structureId: 'uuid-of-1crn',
    parameters: {
      forcefield: 'amber14',
      steps: 10000,
      temperature: 300,
      ensemble: 'nvt',
      timestep: 2
    }
  }

API Route (/api/simulation/submit.ts):
  ├─ Authenticate user
  │  ├─ Extract JWT from Authorization header
  │  ├─ Verify with Supabase
  │  └─ Get user_id
  │
  ├─ Validate parameters
  │  ├─ Schema validation (Zod)
  │  ├─ Check resource limits
  │  │  ├─ Max concurrent jobs: 3 per user
  │  │  ├─ Max steps: 100,000
  │  │  └─ Structure size: <10,000 atoms
  │  │
  │  └─ Estimate cost: 0.5 credits
  │
  ├─ Create job record
  │  └─ INSERT INTO simulation_jobs
  │     (id, user_id, structure_id, status, parameters, created_at)
  │     VALUES (uuid, uuid, uuid, 'pending', jsonb, now())
  │     RETURNING id
  │
  ├─ Invoke Edge Function (async)
  │  └─ POST https://xyz.supabase.co/functions/v1/openmm-worker
  │     Headers: { Authorization: 'Bearer anon_key' }
  │     Body: { jobId: 'uuid' }
  │
  └─ Return response
     └─ { jobId: 'uuid', status: 'pending', estimatedTime: 300 }

Browser:
  ├─ Receive jobId
  ├─ Update UI (job added to queue)
  ├─ Show toast: "Simulation started"
  └─ Navigate to /queue

Step 3: Realtime Subscription
──────────────────────────────

Queue Page Component:
  ├─ useEffect(() => {
  │    const subscription = supabase
  │      .channel('simulation_jobs')
  │      .on('postgres_changes', {
  │         event: '*',
  │         schema: 'public',
  │         table: 'simulation_jobs',
  │         filter: `user_id=eq.${userId}`
  │       }, handleJobUpdate)
  │      .subscribe()
  │
  │    return () => subscription.unsubscribe()
  │  }, [userId])
  │
  └─ handleJobUpdate(payload)
     ├─ Extract: { eventType, new: jobData }
     ├─ Update local state
     │  └─ setJobs(jobs.map(j => j.id === jobData.id ? jobData : j))
     │
     └─ If eventType === 'UPDATE':
        ├─ If status === 'running':
        │  └─ Show progress bar (progress%)
        │
        ├─ If status === 'completed':
        │  ├─ Show toast: "Simulation complete!"
        │  ├─ Enable download button
        │  └─ Play success sound
        │
        └─ If status === 'failed':
           └─ Show error message

Step 4: Edge Function Execution
────────────────────────────────

Supabase Edge Function (openmm-worker):
  ├─ Runtime: Deno
  ├─ Memory: 2GB
  ├─ Timeout: 60 minutes
  │
  ├─ Initialize
  │  ├─ Parse request body: { jobId }
  │  ├─ Fetch job details from DB
  │  │  └─ SELECT * FROM simulation_jobs WHERE id = jobId
  │  │     └─ { structure_id, parameters, ... }
  │  │
  │  └─ Update status to 'running'
  │     └─ UPDATE simulation_jobs
  │        SET status = 'running', started_at = now()
  │        WHERE id = jobId
  │
  ├─ Fetch structure file
  │  ├─ Get file URL from structures table
  │  ├─ Download from Supabase Storage
  │  │  └─ GET https://xyz.supabase.co/storage/v1/object/public/structures/pdb/1crn.cif
  │  │
  │  └─ Parse mmCIF
  │     ├─ Extract atomic coordinates
  │     ├─ Build topology
  │     └─ Validate structure
  │
  ├─ Initialize OpenMM (Python subprocess)
  │  ├─ Import libraries
  │  │  ├─ from openmm import *
  │  │  ├─ from openmm.app import *
  │  │  └─ from openmm.unit import *
  │  │
  │  ├─ Load force field
  │  │  └─ forcefield = ForceField('amber14-all.xml')
  │  │
  │  ├─ Create system
  │  │  ├─ system = forcefield.createSystem(topology)
  │  │  ├─ Set periodic box (if applicable)
  │  │  └─ Add constraints (bonds to hydrogen)
  │  │
  │  └─ Create integrator
  │     └─ integrator = LangevinMiddleIntegrator(
  │            temperature=300*kelvin,
  │            friction=1.0/picosecond,
  │            stepSize=2*femtoseconds
  │         )
  │
  ├─ Energy minimization
  │  ├─ simulation.minimizeEnergy(maxIterations=1000)
  │  └─ Log: "Energy minimized"
  │
  ├─ Run simulation (with progress updates)
  │  ├─ Total steps: 10,000
  │  ├─ Report interval: 100 steps (1% progress)
  │  │
  │  └─ for i in range(0, steps, reportInterval):
  │       ├─ simulation.step(reportInterval)
  │       │
  │       ├─ Calculate progress
  │       │  └─ progress = (i / steps) * 100
  │       │
  │       ├─ Update database (every 1%)
  │       │  └─ UPDATE simulation_jobs
  │       │     SET progress = ${progress}
  │       │     WHERE id = jobId
  │       │
  │       ├─ Broadcast via Realtime (implicit via DB trigger)
  │       │  └─ Browser receives UPDATE event
  │       │     └─ Progress bar animates: 0% → 1% → 2% → ...
  │       │
  │       ├─ Write trajectory frame
  │       │  └─ reporter.report(simulation, state)
  │       │
  │       └─ Log metrics
  │          ├─ Time: 0.5s per 100 steps
  │          ├─ Energy: -1234.5 kJ/mol
  │          └─ Temperature: 299.8 K
  │
  ├─ Save trajectory
  │  ├─ Format: DCD binary
  │  ├─ Frames: 100 (every 100 steps)
  │  ├─ File size: ~5MB
  │  │
  │  └─ Upload to Supabase Storage
  │     └─ POST /storage/v1/object/trajectories/user/{userId}/sim/{jobId}.dcd
  │        ├─ Authorization: Service role key
  │        ├─ Content-Type: application/octet-stream
  │        └─ Returns: { path, url }
  │
  ├─ Update job status
  │  └─ UPDATE simulation_jobs
  │     SET
  │       status = 'completed',
  │       progress = 100,
  │       completed_at = now(),
  │       result_url = ${trajectoryUrl}
  │     WHERE id = jobId
  │
  └─ Return success
     └─ { status: 'ok', jobId, duration: 300 }

Browser (Realtime update):
  ├─ Receives final UPDATE event
  │  └─ { status: 'completed', progress: 100, result_url: '...' }
  │
  ├─ Update UI
  │  ├─ Progress bar → 100%
  │  ├─ Status badge: "Running" → "Completed"
  │  ├─ Enable "View Results" button
  │  └─ Enable "Download" button
  │
  └─ Show toast notification
     └─ "Simulation complete! Click to view results."

Step 5: View Results
────────────────────

User clicks "View Results":
  └─ Navigate to /player/${jobId}

Player Page:
  ├─ Fetch trajectory file
  │  ├─ GET /api/simulation/trajectory?jobId=${jobId}
  │  │  └─ Verify user owns job
  │  │     └─ Return signed URL from Supabase Storage
  │  │
  │  └─ Download trajectory (streaming)
  │     └─ Decompress if needed (gzip)
  │
  ├─ Load into Mol* Viewer
  │  ├─ Parse DCD format
  │  ├─ Extract frames (100 total)
  │  └─ Build animation timeline
  │
  ├─ Initialize player controls
  │  ├─ Play/Pause button
  │  ├─ Timeline scrubber
  │  ├─ Speed control (0.5x, 1x, 2x)
  │  └─ Frame counter: 1/100
  │
  ├─ Render first frame
  │  └─ Update WebGL buffers with frame 1 coordinates
  │
  └─ User presses Play
     └─ requestAnimationFrame loop
        ├─ Update frame index (based on speed)
        ├─ Interpolate coordinates (smooth motion)
        ├─ Update WebGL buffers
        └─ Render frame (60 FPS)

Performance Summary
───────────────────
Simulation timing (10,000 steps, 327 atoms):
  ├─ Energy minimization: 5s
  ├─ MD steps: 280s (0.028s per step)
  ├─ Trajectory saving: 10s
  ├─ Database updates: 5s
  └─ Total: ~5 minutes ✓

Realtime updates:
  ├─ Progress updates: 100 times (every 1%)
  ├─ Update frequency: 10 Hz
  ├─ Latency: <100ms
  └─ Total data: ~10KB ✓

User experience:
  ├─ Submit → Running: <1s
  ├─ Progress visibility: Real-time
  ├─ Complete → Notify: <1s
  └─ Trajectory loading: 2-5s ✓
```

### User Journey 3: Collaborative Session

```
┌──────────────────────────────────────────────────────────────────────┐
│                   REAL-TIME COLLABORATION WORKFLOW                    │
└──────────────────────────────────────────────────────────────────────┘

Step 1: Create Session
──────────────────────

Owner (User A):
  ├─ Viewing structure: /viewer/1crn
  ├─ Clicks "Share" button
  └─ Modal appears: "Create Collaboration Session"

Share Modal:
  ├─ Form fields:
  │  ├─ Session name: "Crambin Analysis"
  │  ├─ Permissions:
  │  │  ├─ [x] Allow camera control (Presenter)
  │  │  ├─ [x] Allow selection sync
  │  │  └─ [ ] Allow editing
  │  ├─ Expiry: 24 hours (default)
  │  └─ Password (optional): ••••••
  │
  └─ Click "Create Session"

API Request:
  POST /api/collaboration/create
  Body: {
    structureId: 'uuid-of-1crn',
    name: 'Crambin Analysis',
    permissions: {
      owner: ['camera', 'selection', 'edit', 'admin'],
      presenter: ['camera', 'selection'],
      viewer: ['view']
    },
    expiresAt: '2025-11-18T23:00:00Z',
    password: 'hashed-password'
  }

API Route:
  ├─ Authenticate owner
  ├─ Generate share_id (nanoid, 12 chars)
  │  └─ Example: 'xK9m2Pq4Zr8L'
  │
  ├─ Capture current viewer state
  │  ├─ Camera position, rotation, zoom
  │  ├─ Active representation
  │  ├─ Color scheme
  │  └─ Selection state
  │
  ├─ Insert to database
  │  └─ INSERT INTO collaboration_sessions
  │     (id, share_id, owner_id, structure_id, state, permissions, expires_at)
  │     VALUES (uuid, 'xK9m2Pq4Zr8L', uuid, uuid, jsonb, jsonb, timestamp)
  │
  └─ Return share URL
     └─ https://lab-viz.vercel.app/share/xK9m2Pq4Zr8L

Modal:
  ├─ Display share URL
  ├─ Copy to clipboard button
  ├─ QR code (optional)
  └─ Social share buttons

Step 2: Join Session
────────────────────

Participant (User B):
  ├─ Receives share link (email, Slack, etc.)
  ├─ Clicks link
  └─ Navigates to /share/xK9m2Pq4Zr8L

Share Page (/share/[shareId]):
  ├─ SSR: Fetch session data
  │  └─ SELECT * FROM collaboration_sessions
  │     WHERE share_id = 'xK9m2Pq4Zr8L'
  │     AND expires_at > now()
  │
  ├─ If password-protected:
  │  ├─ Show password input
  │  ├─ Verify hash
  │  └─ Set session cookie
  │
  ├─ Determine user role
  │  ├─ If user_id === owner_id: owner
  │  ├─ Else if authenticated: presenter (default)
  │  └─ Else: anonymous viewer
  │
  ├─ Load structure (from state.structureId)
  ├─ Apply saved state (camera, selection, settings)
  │
  └─ Connect to Realtime channel

Step 3: Realtime Connection
────────────────────────────

Client (User B):
  ├─ Initialize Supabase Realtime
  │  └─ const channel = supabase.channel(
  │       `collaboration:${sessionId}`,
  │       {
  │         config: {
  │           broadcast: { self: false },
  │           presence: { key: userId }
  │         }
  │       }
  │     )
  │
  ├─ Subscribe to presence
  │  └─ channel.on('presence', { event: 'sync' }, () => {
  │       const state = channel.presenceState()
  │       // state = { 'user-a-id': {...}, 'user-b-id': {...} }
  │       updateParticipantsList(state)
  │     })
  │
  ├─ Track own presence
  │  └─ channel.track({
  │       userId: 'user-b-id',
  │       role: 'presenter',
  │       username: 'User B',
  │       cursor: { x: 0, y: 0 },
  │       color: '#FF5722',
  │       timestamp: Date.now()
  │     })
  │
  ├─ Subscribe to broadcasts
  │  ├─ channel.on('broadcast', { event: 'cursor' }, (payload) => {
  │  │    updateCursor(payload.userId, payload.position)
  │  │  })
  │  │
  │  ├─ channel.on('broadcast', { event: 'camera' }, (payload) => {
  │  │    if (payload.userId !== myUserId && role !== 'owner') {
  │  │      syncCamera(payload.camera)
  │  │    }
  │  │  })
  │  │
  │  └─ channel.on('broadcast', { event: 'selection' }, (payload) => {
  │       syncSelection(payload.selection)
  │     })
  │
  ├─ Subscribe to database changes
  │  └─ channel.on('postgres_changes', {
  │       event: 'INSERT',
  │       schema: 'public',
  │       table: 'chat_messages',
  │       filter: `session_id=eq.${sessionId}`
  │     }, (payload) => {
  │       addChatMessage(payload.new)
  │     })
  │
  └─ Subscribe to channel
     └─ channel.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('Connected to collaboration session')
          }
        })

Server (Supabase Realtime):
  ├─ WebSocket connection established
  ├─ Authenticate via JWT
  ├─ Join channel: collaboration:${sessionId}
  ├─ Sync presence state
  │  └─ Broadcast to all clients:
  │     { event: 'presence', type: 'sync', users: [...] }
  │
  └─ Client now in session

UI Update:
  ├─ Participant list appears
  │  ├─ User A (Owner) 🔴
  │  └─ User B (Presenter) 🟢
  │
  └─ Toast: "User B joined the session"

Step 4: Real-Time Interactions
───────────────────────────────

Cursor Sync (30 Hz, throttled):
  User A moves mouse:
    ├─ onMouseMove event
    ├─ Throttle: 33ms (30 FPS)
    └─ Broadcast:
       channel.send({
         type: 'broadcast',
         event: 'cursor',
         payload: {
           userId: 'user-a-id',
           position: { x: 250, y: 180 }
         }
       })

  User B receives:
    ├─ Broadcast event: 'cursor'
    ├─ Update cursor position
    │  └─ <Cursor style={{ left: 250, top: 180, color: '#2196F3' }} />
    │
    └─ Smooth animation (CSS transition)

Camera Sync (Presenter controls):
  User A (Presenter) rotates camera:
    ├─ Mol* camera change event
    ├─ Debounce: 100ms
    └─ Broadcast:
       channel.send({
         type: 'broadcast',
         event: 'camera',
         payload: {
           userId: 'user-a-id',
           camera: {
             position: [10, 5, 30],
             target: [0, 0, 0],
             up: [0, 1, 0],
             zoom: 1.5
           }
         }
       })

  User B (Viewer) receives:
    ├─ Check permission: role.includes('camera') → false
    ├─ Apply camera state (smooth transition)
    │  └─ viewer.setCamera(payload.camera, { durationMs: 500 })
    │
    └─ Lock camera controls (grayed out)

Selection Sync:
  User A clicks atom:
    ├─ Mol* picking event
    ├─ Select atom: { chain: 'A', residue: 23, atom: 'CA' }
    └─ Broadcast:
       channel.send({
         type: 'broadcast',
         event: 'selection',
         payload: {
           userId: 'user-a-id',
           selection: {
             type: 'atom',
             chain: 'A',
             residue: 23,
             atom: 'CA'
           }
         }
       })

  User B receives:
    ├─ Apply selection to viewer
    ├─ Highlight atom (different color for remote selection)
    │  └─ Own selection: yellow
    │  └─ Remote selection: blue
    │
    └─ Show info panel: "User A selected: ALA 23 CA"

Chat Messages:
  User B types message:
    ├─ Input: "Look at the disulfide bond"
    ├─ Press Enter
    └─ API call:
       POST /api/collaboration/chat
       Body: {
         sessionId: 'uuid',
         message: 'Look at the disulfide bond'
       }

  API Route:
    ├─ Authenticate user
    ├─ Validate session membership
    └─ Insert to database:
       INSERT INTO chat_messages
       (session_id, user_id, message, created_at)
       VALUES (uuid, uuid, text, now())

  Database Trigger (Realtime):
    └─ Broadcast INSERT event to channel subscribers

  User A receives:
    ├─ postgres_changes event
    ├─ Add to chat UI
    │  └─ <ChatMessage user="User B" time="23:05">
    │       Look at the disulfide bond
    │     </ChatMessage>
    │
    └─ Play notification sound

Step 5: Presence Management
────────────────────────────

Heartbeat (automatic, 10s interval):
  Client:
    └─ Supabase automatically sends heartbeat
       └─ Update last_seen timestamp

  Server:
    ├─ If no heartbeat for 30s:
    │  └─ Mark user as "away"
    │
    └─ If no heartbeat for 60s:
       └─ Remove from presence state
          └─ Broadcast: User B disconnected

  UI Update:
    ├─ User status: 🟢 Online → 🟡 Away → ⚫ Offline
    └─ Toast: "User B left the session"

Manual Leave:
  User B closes tab:
    ├─ beforeunload event
    ├─ Unsubscribe from channel
    │  └─ channel.unsubscribe()
    │
    └─ Server removes from presence
       └─ All clients notified

Step 6: Session Persistence
────────────────────────────

Auto-save state (every 5 minutes):
  Owner (User A):
    ├─ Capture current state
    │  ├─ Camera position
    │  ├─ Representation settings
    │  ├─ Color scheme
    │  └─ Selection
    │
    └─ Update database:
       UPDATE collaboration_sessions
       SET state = ${currentState}, updated_at = now()
       WHERE id = ${sessionId}

Rejoin session:
  User A closes and reopens /share/xK9m2Pq4Zr8L:
    ├─ Fetch latest state from database
    ├─ Apply to viewer
    └─ Resume Realtime connection

Session expiry:
  Cron job (daily at 3 AM):
    ├─ DELETE FROM collaboration_sessions
    │  WHERE expires_at < now()
    │
    └─ Also delete related:
       ├─ session_participants
       └─ chat_messages

Performance Summary
───────────────────
Connection:
  ├─ WebSocket handshake: 100-200ms
  ├─ Presence sync: 50ms
  └─ Total join time: <500ms ✓

Real-time latency:
  ├─ Cursor updates: 30-50ms
  ├─ Camera sync: 50-100ms
  ├─ Chat messages: 100-200ms
  └─ Selection: 50-100ms ✓

Scalability:
  ├─ Max participants: 50 per session
  ├─ Concurrent sessions: 1,000
  ├─ Total connections: 1,000 (Supabase limit)
  └─ Bandwidth: ~10 KB/s per participant ✓
```

---

## Security Architecture

### Defense-in-Depth Strategy

```
┌─────────────────────────────────────────────────────────────────────┐
│                     SECURITY ARCHITECTURE LAYERS                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Layer 1: Network Security (Edge)                                    │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                       │
│  CloudFlare WAF (Web Application Firewall):                         │
│                                                                       │
│    ┌────────────────────────────────────────────────────────────┐  │
│    │  DDoS Protection                                            │  │
│    │  • Challenge suspicious traffic                             │  │
│    │  • Rate limiting: 100 req/min per IP                        │  │
│    │  • SYN flood protection                                     │  │
│    │  • HTTP flood mitigation                                    │  │
│    └────────────────────────────────────────────────────────────┘  │
│                                                                       │
│    ┌────────────────────────────────────────────────────────────┐  │
│    │  Bot Detection & Mitigation                                 │  │
│    │  • Browser integrity check                                  │  │
│    │  • JavaScript challenge                                     │  │
│    │  • CAPTCHA for suspicious requests                          │  │
│    │  • Known bot signatures blocking                            │  │
│    └────────────────────────────────────────────────────────────┘  │
│                                                                       │
│    ┌────────────────────────────────────────────────────────────┐  │
│    │  OWASP Top 10 Protection                                    │  │
│    │  • SQL injection blocking                                   │  │
│    │  • XSS (Cross-Site Scripting) filtering                     │  │
│    │  • CSRF token validation                                    │  │
│    │  • Path traversal prevention                                │  │
│    │  • Command injection blocking                               │  │
│    └────────────────────────────────────────────────────────────┘  │
│                                                                       │
│    ┌────────────────────────────────────────────────────────────┐  │
│    │  SSL/TLS Configuration                                      │  │
│    │  • Minimum version: TLS 1.2                                 │  │
│    │  • Cipher suites: Modern only (ECDHE+AES128)                │  │
│    │  • HSTS: max-age=31536000; includeSubDomains               │  │
│    │  • Certificate: Auto-renewed Let's Encrypt                  │  │
│    └────────────────────────────────────────────────────────────┘  │
│                                                                       │
│    ┌────────────────────────────────────────────────────────────┐  │
│    │  Geo-Blocking (Optional)                                    │  │
│    │  • Block high-risk countries                                │  │
│    │  • Allow-list for trusted regions                           │  │
│    │  • Custom rules per path                                    │  │
│    └────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ────────────────────────────────────────────────────────────────  │
│                                                                       │
│  Layer 2: Application Security (Runtime)                            │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                       │
│  Next.js Security Headers:                                          │
│                                                                       │
│    ┌────────────────────────────────────────────────────────────┐  │
│    │  Content Security Policy (CSP)                              │  │
│    │                                                              │  │
│    │  default-src 'self';                                        │  │
│    │  script-src 'self' 'unsafe-inline' 'unsafe-eval'            │  │
│    │             https://vercel.live;                            │  │
│    │  style-src 'self' 'unsafe-inline';                          │  │
│    │  img-src 'self' data: blob: https:;                         │  │
│    │  font-src 'self' data:;                                     │  │
│    │  connect-src 'self'                                          │  │
│    │              https://*.supabase.co                          │  │
│    │              https://files.rcsb.org                         │  │
│    │              wss://*.supabase.co;                           │  │
│    │  frame-ancestors 'none';                                    │  │
│    │  base-uri 'self';                                           │  │
│    │  form-action 'self';                                        │  │
│    │  upgrade-insecure-requests;                                 │  │
│    └────────────────────────────────────────────────────────────┘  │
│                                                                       │
│    ┌────────────────────────────────────────────────────────────┐  │
│    │  Other Security Headers                                     │  │
│    │                                                              │  │
│    │  X-Frame-Options: DENY                                      │  │
│    │  X-Content-Type-Options: nosniff                            │  │
│    │  X-XSS-Protection: 1; mode=block                            │  │
│    │  Referrer-Policy: strict-origin-when-cross-origin          │  │
│    │  Permissions-Policy:                                        │  │
│    │    camera=(), microphone=(), geolocation=(),                │  │
│    │    payment=(), usb=()                                       │  │
│    └────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  Input Validation & Sanitization:                                   │
│                                                                       │
│    ┌────────────────────────────────────────────────────────────┐  │
│    │  Server-Side Validation (Zod)                               │  │
│    │                                                              │  │
│    │  const SimulationSchema = z.object({                        │  │
│    │    structureId: z.string().uuid(),                          │  │
│    │    parameters: z.object({                                   │  │
│    │      forcefield: z.enum(['amber14', 'charmm36']),           │  │
│    │      steps: z.number().int().min(100).max(100000),          │  │
│    │      temperature: z.number().min(0).max(500),               │  │
│    │      ensemble: z.enum(['nve', 'nvt', 'npt']),               │  │
│    │      timestep: z.number().min(0.1).max(10)                  │  │
│    │    })                                                        │  │
│    │  });                                                         │  │
│    │                                                              │  │
│    │  // Validate request                                        │  │
│    │  const result = SimulationSchema.safeParse(req.body);       │  │
│    │  if (!result.success) {                                     │  │
│    │    return res.status(400).json({ errors: result.error });   │  │
│    │  }                                                           │  │
│    └────────────────────────────────────────────────────────────┘  │
│                                                                       │
│    ┌────────────────────────────────────────────────────────────┐  │
│    │  XSS Prevention                                             │  │
│    │                                                              │  │
│    │  • React auto-escaping (JSX)                                │  │
│    │  • DOMPurify for user-generated content                     │  │
│    │  • Avoid dangerouslySetInnerHTML                            │  │
│    │  • Sanitize URLs before opening                             │  │
│    │                                                              │  │
│    │  import DOMPurify from 'dompurify';                         │  │
│    │  const clean = DOMPurify.sanitize(userInput);               │  │
│    └────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ────────────────────────────────────────────────────────────────  │
│                                                                       │
│  Layer 3: Authentication & Authorization                            │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                       │
│  Supabase Auth (JWT):                                               │
│                                                                       │
│    ┌────────────────────────────────────────────────────────────┐  │
│    │  Authentication Flow                                        │  │
│    │                                                              │  │
│    │  1. Login (Email + Password):                               │  │
│    │     POST /auth/v1/token?grant_type=password                 │  │
│    │     Body: { email, password }                               │  │
│    │     ↓                                                        │  │
│    │     Supabase verifies credentials                           │  │
│    │     ↓                                                        │  │
│    │     Returns: {                                              │  │
│    │       access_token: 'eyJhbGc...' (JWT, 1h exp),             │  │
│    │       refresh_token: 'v1.abc...' (7d exp),                  │  │
│    │       user: { id, email, ... }                              │  │
│    │     }                                                        │  │
│    │     ↓                                                        │  │
│    │     Client stores in localStorage                           │  │
│    │                                                              │  │
│    │  2. Token Refresh (Auto, at 50 min):                        │  │
│    │     POST /auth/v1/token?grant_type=refresh_token            │  │
│    │     Body: { refresh_token }                                 │  │
│    │     ↓                                                        │  │
│    │     New access_token issued                                 │  │
│    │                                                              │  │
│    │  3. API Requests:                                           │  │
│    │     Authorization: Bearer ${access_token}                   │  │
│    │     ↓                                                        │  │
│    │     Vercel Edge verifies JWT signature                      │  │
│    │     ↓                                                        │  │
│    │     Extract user_id from token                              │  │
│    └────────────────────────────────────────────────────────────┘  │
│                                                                       │
│    ┌────────────────────────────────────────────────────────────┐  │
│    │  JWT Token Structure                                        │  │
│    │                                                              │  │
│    │  Header:                                                    │  │
│    │  {                                                           │  │
│    │    "alg": "HS256",                                          │  │
│    │    "typ": "JWT"                                             │  │
│    │  }                                                           │  │
│    │                                                              │  │
│    │  Payload:                                                   │  │
│    │  {                                                           │  │
│    │    "sub": "user-uuid",                                      │  │
│    │    "email": "user@example.com",                             │  │
│    │    "role": "authenticated",                                 │  │
│    │    "iat": 1700000000,                                       │  │
│    │    "exp": 1700003600                                        │  │
│    │  }                                                           │  │
│    │                                                              │  │
│    │  Signature:                                                 │  │
│    │    HMACSHA256(                                              │  │
│    │      base64(header) + "." + base64(payload),                │  │
│    │      secret_key                                             │  │
│    │    )                                                         │  │
│    └────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  Row Level Security (RLS):                                          │
│                                                                       │
│    ┌────────────────────────────────────────────────────────────┐  │
│    │  Policy: simulation_jobs SELECT                             │  │
│    │                                                              │  │
│    │  CREATE POLICY "Users can view own jobs"                    │  │
│    │  ON simulation_jobs FOR SELECT                              │  │
│    │  USING (                                                    │  │
│    │    auth.uid() = user_id                                     │  │
│    │  );                                                          │  │
│    │                                                              │  │
│    │  Effect:                                                    │  │
│    │  • User A (uuid-a) queries: SELECT * FROM simulation_jobs   │  │
│    │  • PostgreSQL auto-filters: WHERE user_id = 'uuid-a'        │  │
│    │  • User A only sees their own jobs                          │  │
│    └────────────────────────────────────────────────────────────┘  │
│                                                                       │
│    ┌────────────────────────────────────────────────────────────┐  │
│    │  Policy: collaboration_sessions UPDATE                      │  │
│    │                                                              │  │
│    │  CREATE POLICY "Only owner can update session"              │  │
│    │  ON collaboration_sessions FOR UPDATE                       │  │
│    │  USING (                                                    │  │
│    │    auth.uid() = owner_id                                    │  │
│    │  );                                                          │  │
│    │                                                              │  │
│    │  Effect:                                                    │  │
│    │  • Prevent participants from modifying session settings     │  │
│    │  • Only owner can change permissions, expiry, etc.          │  │
│    └────────────────────────────────────────────────────────────┘  │
│                                                                       │
│    ┌────────────────────────────────────────────────────────────┐  │
│    │  Policy: chat_messages INSERT                               │  │
│    │                                                              │  │
│    │  CREATE POLICY "Authenticated users in session can chat"    │  │
│    │  ON chat_messages FOR INSERT                                │  │
│    │  WITH CHECK (                                               │  │
│    │    auth.uid() IS NOT NULL                                   │  │
│    │    AND EXISTS (                                             │  │
│    │      SELECT 1 FROM session_participants                     │  │
│    │      WHERE session_id = chat_messages.session_id            │  │
│    │      AND user_id = auth.uid()                               │  │
│    │    )                                                         │  │
│    │  );                                                          │  │
│    │                                                              │  │
│    │  Effect:                                                    │  │
│    │  • Only logged-in participants can send messages            │  │
│    │  • Prevents unauthorized message injection                  │  │
│    └────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  Storage Bucket Policies:                                           │
│                                                                       │
│    ┌────────────────────────────────────────────────────────────┐  │
│    │  Bucket: structures (Public Read)                           │  │
│    │                                                              │  │
│    │  CREATE POLICY "Public read access"                         │  │
│    │  ON storage.objects FOR SELECT                              │  │
│    │  USING ( bucket_id = 'structures' );                        │  │
│    │                                                              │  │
│    │  CREATE POLICY "Authenticated write"                        │  │
│    │  ON storage.objects FOR INSERT                              │  │
│    │  WITH CHECK (                                               │  │
│    │    bucket_id = 'structures'                                 │  │
│    │    AND auth.uid() IS NOT NULL                               │  │
│    │  );                                                          │  │
│    └────────────────────────────────────────────────────────────┘  │
│                                                                       │
│    ┌────────────────────────────────────────────────────────────┐  │
│    │  Bucket: trajectories (Private)                             │  │
│    │                                                              │  │
│    │  CREATE POLICY "Owner read only"                            │  │
│    │  ON storage.objects FOR SELECT                              │  │
│    │  USING (                                                    │  │
│    │    bucket_id = 'trajectories'                               │  │
│    │    AND (storage.foldername(name))[1] = auth.uid()::text     │  │
│    │  );                                                          │  │
│    │  -- Path: /user/{user_id}/sim/{job_id}.dcd                  │  │
│    │  -- Ensures users can only read their own files             │  │
│    └────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ────────────────────────────────────────────────────────────────  │
│                                                                       │
│  Layer 4: Data Security                                             │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                       │
│  Encryption at Rest:                                                │
│    • Database: AES-256 (RDS default encryption)                     │
│    • Storage: AES-256 (S3 SSE-S3)                                   │
│    • Backups: Encrypted with same key                               │
│                                                                       │
│  Encryption in Transit:                                             │
│    • HTTPS: TLS 1.2+ (all client-server)                            │
│    • WSS: TLS 1.2+ (Realtime WebSocket)                             │
│    • Database: SSL connection enforced                              │
│    • Storage: HTTPS only for uploads/downloads                      │
│                                                                       │
│  Sensitive Data Handling:                                           │
│    ┌────────────────────────────────────────────────────────────┐  │
│    │  Passwords                                                  │  │
│    │  • Hashed with bcrypt (cost factor: 12)                     │  │
│    │  • Salted automatically                                     │  │
│    │  • Never logged or transmitted                              │  │
│    └────────────────────────────────────────────────────────────┘  │
│                                                                       │
│    ┌────────────────────────────────────────────────────────────┐  │
│    │  API Keys (External Services)                               │  │
│    │  • Stored in Vercel Environment Variables                   │  │
│    │  • Never committed to git                                   │  │
│    │  • Rotated every 90 days                                    │  │
│    │  • Masked in logs: "sk-...abc" → "sk-...***"                │  │
│    └────────────────────────────────────────────────────────────┘  │
│                                                                       │
│    ┌────────────────────────────────────────────────────────────┐  │
│    │  Personal Data (GDPR Compliance)                            │  │
│    │  • Email addresses: Encrypted column-level (pgcrypto)       │  │
│    │  • User deletion: CASCADE to all related records            │  │
│    │  • Data export: API endpoint for full user data             │  │
│    │  • Anonymization: Replace with 'deleted-user-{id}'          │  │
│    └────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  Audit Logging:                                                     │
│    ┌────────────────────────────────────────────────────────────┐  │
│    │  What to Log                                                │  │
│    │  • Authentication events (login, logout, failures)          │  │
│    │  • Authorization failures (403, RLS violations)             │  │
│    │  • Data access (PII queries)                                │  │
│    │  • Data modifications (CREATE, UPDATE, DELETE)              │  │
│    │  • Administrative actions (user role changes)               │  │
│    │  • Security events (XSS attempts, SQL injection)            │  │
│    └────────────────────────────────────────────────────────────┘  │
│                                                                       │
│    ┌────────────────────────────────────────────────────────────┐  │
│    │  Log Structure (JSON)                                       │  │
│    │  {                                                           │  │
│    │    "timestamp": "2025-11-17T23:00:00.000Z",                 │  │
│    │    "level": "warn",                                         │  │
│    │    "event": "auth_failure",                                 │  │
│    │    "user_id": "uuid",                                       │  │
│    │    "ip": "203.0.113.1",                                     │  │
│    │    "user_agent": "Mozilla/5.0...",                          │  │
│    │    "details": {                                             │  │
│    │      "reason": "invalid_password",                          │  │
│    │      "attempts": 3                                          │  │
│    │    }                                                         │  │
│    │  }                                                           │  │
│    └────────────────────────────────────────────────────────────┘  │
│                                                                       │
│    ┌────────────────────────────────────────────────────────────┐  │
│    │  Retention Policy                                           │  │
│    │  • Security logs: 1 year                                    │  │
│    │  • Access logs: 90 days                                     │  │
│    │  • Debug logs: 7 days                                       │  │
│    │  • Archived to cold storage (S3 Glacier)                    │  │
│    └────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ────────────────────────────────────────────────────────────────  │
│                                                                       │
│  Layer 5: Vulnerability Management                                  │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                       │
│  Dependency Scanning:                                               │
│    • npm audit (weekly)                                             │
│    • Snyk integration (CI/CD)                                       │
│    • Dependabot (auto PR for security updates)                      │
│    • OWASP Dependency-Check                                         │
│                                                                       │
│  Security Scanning:                                                 │
│    • Lighthouse security audit (CI)                                 │
│    • OWASP ZAP (monthly pen-test)                                   │
│    • Burp Suite (manual testing)                                    │
│                                                                       │
│  Incident Response:                                                 │
│    1. Detection: Automated alerts                                   │
│    2. Containment: Rate limiting, IP ban                            │
│    3. Eradication: Patch vulnerability                              │
│    4. Recovery: Restore from backup                                 │
│    5. Post-mortem: Document lessons learned                         │
└─────────────────────────────────────────────────────────────────────┘
```

### Threat Model

```
┌──────────────────────────────────────────────────────────────────────┐
│                         THREAT MATRIX (STRIDE)                        │
├──────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  Spoofing (Identity Theft)                                            │
│  ───────────────────────                                              │
│                                                                        │
│  Threat: Attacker impersonates legitimate user                        │
│  ├─ Attack Vector: Stolen JWT token                                   │
│  │  ├─ Mitigation: Short expiry (1h), HTTPS only                      │
│  │  ├─ Detection: Unusual IP/location changes                         │
│  │  └─ Response: Force re-authentication                              │
│  │                                                                     │
│  ├─ Attack Vector: Session fixation                                   │
│  │  ├─ Mitigation: Regenerate session on login                        │
│  │  ├─ Detection: N/A (prevented)                                     │
│  │  └─ Response: N/A                                                  │
│  │                                                                     │
│  └─ Attack Vector: Phishing (fake login page)                         │
│     ├─ Mitigation: User education, HSTS                               │
│     ├─ Detection: Monitor suspicious login locations                  │
│     └─ Response: Email notification, account lock                     │
│                                                                        │
│  Tampering (Data Modification)                                        │
│  ──────────────────────────────                                       │
│                                                                        │
│  Threat: Attacker modifies data in transit or at rest                 │
│  ├─ Attack Vector: Man-in-the-Middle (MITM)                           │
│  │  ├─ Mitigation: TLS 1.2+, HSTS, certificate pinning                │
│  │  ├─ Detection: Certificate errors                                  │
│  │  └─ Response: Block connection                                     │
│  │                                                                     │
│  ├─ Attack Vector: SQL injection                                      │
│  │  ├─ Mitigation: Parameterized queries, Supabase ORM                │
│  │  ├─ Detection: WAF rules, log analysis                             │
│  │  └─ Response: Block IP, patch vulnerable code                      │
│  │                                                                     │
│  └─ Attack Vector: Client-side tampering (DevTools)                   │
│     ├─ Mitigation: Server-side validation, RLS                        │
│     ├─ Detection: Impossible state changes                            │
│     └─ Response: Reject request, log attempt                          │
│                                                                        │
│  Repudiation (Denial of Action)                                       │
│  ───────────────────────────────                                      │
│                                                                        │
│  Threat: User denies performing an action                             │
│  ├─ Attack Vector: Deleted audit logs                                 │
│  │  ├─ Mitigation: Append-only logs, write to S3                      │
│  │  ├─ Detection: Log integrity checks                                │
│  │  └─ Response: Investigate source                                   │
│  │                                                                     │
│  └─ Attack Vector: Shared account                                     │
│     ├─ Mitigation: Require unique accounts                            │
│     ├─ Detection: Multiple IPs per account                            │
│     └─ Response: Disable account sharing                              │
│                                                                        │
│  Information Disclosure (Data Leak)                                   │
│  ───────────────────────────────────────                              │
│                                                                        │
│  Threat: Sensitive data exposed to unauthorized parties               │
│  ├─ Attack Vector: Directory traversal (/../../etc/passwd)            │
│  │  ├─ Mitigation: Path validation, no direct file access             │
│  │  ├─ Detection: WAF rules                                           │
│  │  └─ Response: Block request, log IP                                │
│  │                                                                     │
│  ├─ Attack Vector: Insecure direct object reference (IDOR)            │
│  │  ├─ Mitigation: RLS policies, ownership checks                     │
│  │  ├─ Detection: Unauthorized access logs                            │
│  │  └─ Response: Block access, notify admin                           │
│  │                                                                     │
│  ├─ Attack Vector: Error messages leaking info                        │
│  │  ├─ Mitigation: Generic error responses (production)               │
│  │  ├─ Detection: Monitor error rates                                 │
│  │  └─ Response: Fix verbose errors                                   │
│  │                                                                     │
│  └─ Attack Vector: Exposed secrets in code                            │
│     ├─ Mitigation: Environment variables, .gitignore                  │
│     ├─ Detection: GitHub secret scanning                              │
│     └─ Response: Rotate keys, revoke commits                          │
│                                                                        │
│  Denial of Service (Availability)                                     │
│  ─────────────────────────────────                                    │
│                                                                        │
│  Threat: System becomes unavailable to legitimate users               │
│  ├─ Attack Vector: DDoS (Distributed Denial of Service)               │
│  │  ├─ Mitigation: CloudFlare protection, rate limiting               │
│  │  ├─ Detection: Traffic spike alerts                                │
│  │  └─ Response: Enable "I'm Under Attack" mode                       │
│  │                                                                     │
│  ├─ Attack Vector: Resource exhaustion (expensive queries)            │
│  │  ├─ Mitigation: Query timeouts, pagination                         │
│  │  ├─ Detection: Slow query logs                                     │
│  │  └─ Response: Optimize/block queries                               │
│  │                                                                     │
│  └─ Attack Vector: Storage bombing (upload large files)               │
│     ├─ Mitigation: File size limits (50MB), quotas                    │
│     ├─ Detection: Storage usage alerts                                │
│     └─ Response: Delete files, ban user                               │
│                                                                        │
│  Elevation of Privilege (Authorization Bypass)                        │
│  ──────────────────────────────────────────────                       │
│                                                                        │
│  Threat: Attacker gains unauthorized permissions                      │
│  ├─ Attack Vector: JWT manipulation (change role claim)               │
│  │  ├─ Mitigation: Signature verification                             │
│  │  ├─ Detection: Invalid signature errors                            │
│  │  └─ Response: Reject token, log attempt                            │
│  │                                                                     │
│  ├─ Attack Vector: RLS policy bypass                                  │
│  │  ├─ Mitigation: Thorough testing, peer review                      │
│  │  ├─ Detection: Unauthorized data access                            │
│  │  └─ Response: Fix policy, audit logs                               │
│  │                                                                     │
│  └─ Attack Vector: Admin panel access                                 │
│     ├─ Mitigation: IP whitelist, MFA required                         │
│     ├─ Detection: Failed admin login attempts                         │
│     └─ Response: Lock account, notify                                 │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Monitoring & Observability

(Content continues with detailed monitoring architecture...)

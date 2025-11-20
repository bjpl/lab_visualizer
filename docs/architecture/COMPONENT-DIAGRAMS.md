# Component Diagrams - C4 Model

## Level 1: System Context Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                       External Systems                          │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  RCSB PDB    │  │  AlphaFold   │  │  UniProt     │         │
│  │  Database    │  │  Database    │  │  Database    │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
│         │                 │                 │                   │
└─────────┼─────────────────┼─────────────────┼───────────────────┘
          │                 │                 │
          │ REST API        │ REST API        │ REST API
          │                 │                 │
┌─────────▼─────────────────▼─────────────────▼───────────────────┐
│                                                                   │
│              Lab Visualizer Application                           │
│         (Molecular Structure Visualization Platform)              │
│                                                                   │
│  Features:                                                        │
│  • 3D molecular structure rendering                               │
│  • Molecular dynamics simulations                                 │
│  • Collaborative viewing                                          │
│  • Export & analysis tools                                        │
│  • Multi-tier caching (L1/L2/L3)                                 │
│  • Rate limiting & access control                                │
│                                                                   │
└─────────┬────────────────────────────────────┬──────────────────┘
          │                                    │
          │ HTTPS                              │ HTTPS
          │                                    │
┌─────────▼────────┐                  ┌────────▼─────────┐
│                  │                  │                  │
│  Web Users       │                  │  API Consumers   │
│  (Scientists,    │                  │  (External Apps, │
│   Students,      │                  │   Researchers)   │
│   Researchers)   │                  │                  │
│                  │                  │                  │
└──────────────────┘                  └──────────────────┘
```

## Level 2: Container Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Lab Visualizer System                             │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                    Browser Application                          │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │ │
│  │  │   React UI   │  │  Three.js    │  │  IndexedDB   │         │ │
│  │  │  Components  │  │   WebGL      │  │   L1 Cache   │         │ │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │ │
│  │         │                 │                 │                   │ │
│  │         └─────────────────┴─────────────────┘                   │ │
│  └────────────────────────────┬──────────────────────────────────┘ │
│                               │ HTTPS/WebSocket                     │
│  ┌────────────────────────────▼──────────────────────────────────┐ │
│  │              Vercel Edge Network (CDN + Compute)               │ │
│  │  ┌──────────────────────────────────────────────────────────┐ │ │
│  │  │  Next.js Middleware (Edge Functions)                      │ │ │
│  │  │  • Authentication & Authorization                          │ │ │
│  │  │  • Rate Limiting (Redis)                                   │ │ │
│  │  │  • Request Routing                                         │ │ │
│  │  │  • Security Headers                                        │ │ │
│  │  └───────────────┬──────────────────────────────────────────┘ │ │
│  │                  │                                              │ │
│  │  ┌───────────────▼──────────────────────────────────────────┐ │ │
│  │  │  Vercel KV (Redis) - L2 Cache & Rate Limiting             │ │ │
│  │  │  • Sliding window counters                                 │ │ │
│  │  │  • Popular structures cache                                │ │ │
│  │  │  • Session data                                            │ │ │
│  │  │  • Computed geometry cache                                 │ │ │
│  │  └────────────────────────────────────────────────────────────┘ │ │
│  └────────────────────────────┬──────────────────────────────────┘ │
│                               │                                     │
│  ┌────────────────────────────▼──────────────────────────────────┐ │
│  │           API Routes (Serverless Functions)                    │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │ │
│  │  │  Structures  │  │  Simulation  │  │    Export    │        │ │
│  │  │     API      │  │     API      │  │     API      │        │ │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘        │ │
│  │         │                 │                 │                  │ │
│  │         └─────────────────┴─────────────────┘                  │ │
│  └────────────────────────────┬──────────────────────────────────┘ │
│                               │                                     │
│  ┌────────────────────────────▼──────────────────────────────────┐ │
│  │        Supabase Platform (Backend Services)                    │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │ │
│  │  │  PostgreSQL  │  │   Storage    │  │  Realtime    │        │ │
│  │  │   Database   │  │   L3 Cache   │  │  (WebSocket) │        │ │
│  │  │              │  │  (S3-like)   │  │              │        │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘        │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

## Level 3: Component Diagram - Cache System

```
┌─────────────────────────────────────────────────────────────────┐
│                    Cache Orchestration Layer                     │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              Unified Cache Service                          │ │
│  │                                                              │ │
│  │  ┌─────────────────────────────────────────────────────┐   │ │
│  │  │  Cache Flow Manager                                  │   │ │
│  │  │  • Tier cascade logic (L1→L2→L3→Origin)            │   │ │
│  │  │  • Cache population strategy                         │   │ │
│  │  │  • Error handling & fallback                         │   │ │
│  │  │  • Circuit breaker                                   │   │ │
│  │  └──────┬───────────────────────┬───────────────────┬──┘   │ │
│  │         │                       │                   │       │ │
│  └─────────┼───────────────────────┼───────────────────┼──────┘ │
│            │                       │                   │         │
│  ┌─────────▼──────────┐  ┌─────────▼──────────┐  ┌───▼────────┐ │
│  │                    │  │                    │  │            │ │
│  │   L1 Cache Layer   │  │   L2 Cache Layer   │  │  L3 Cache  │ │
│  │   (Client-side)    │  │   (Edge/Redis)     │  │   Layer    │ │
│  │                    │  │                    │  │ (Storage)  │ │
│  │ ┌────────────────┐ │  │ ┌────────────────┐ │  │ ┌────────┐ │ │
│  │ │   IndexedDB    │ │  │ │  Vercel KV     │ │  │ │Supabase│ │ │
│  │ │   Manager      │ │  │ │  (Redis)       │ │  │ │Storage │ │ │
│  │ │                │ │  │ │                │ │  │ │        │ │ │
│  │ │ • PDB files    │ │  │ │ • Popular data │ │  │ │• Buckets│ │ │
│  │ │ • Computed     │ │  │ │ • Metadata     │ │  │ │• RLS    │ │ │
│  │ │ • Simulations  │ │  │ │ • Geometry     │ │  │ │• CDN    │ │ │
│  │ │                │ │  │ │                │ │  │ │        │ │ │
│  │ │ • LRU eviction │ │  │ │ • TTL-based    │ │  │ │• 30d   │ │ │
│  │ │ • 500MB quota  │ │  │ │ • 10GB capacity│ │  │ │  TTL   │ │ │
│  │ │ • 7d TTL       │ │  │ │ • 24h TTL      │ │  │ │        │ │ │
│  │ └────────────────┘ │  │ └────────────────┘ │  │ └────────┘ │ │
│  │                    │  │                    │  │            │ │
│  │ ┌────────────────┐ │  │ ┌────────────────┐ │  │ ┌────────┐ │ │
│  │ │  Hit/Miss      │ │  │ │  Tag-based     │ │  │ │Cleanup │ │ │
│  │ │  Tracking      │ │  │ │  Invalidation  │ │  │ │Jobs    │ │ │
│  │ └────────────────┘ │  │ └────────────────┘ │  │ └────────┘ │ │
│  │                    │  │                    │  │            │ │
│  └────────────────────┘  └────────────────────┘  └────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              Cache Strategy Engine                          │ │
│  │                                                              │ │
│  │  • Popularity scoring                                        │ │
│  │  • Recency tracking                                          │ │
│  │  • Relevance calculation                                     │ │
│  │  • Warming prioritization                                    │ │
│  │  • Budget management (500MB → 10GB → ∞)                     │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

## Level 3: Component Diagram - Rate Limiting System

```
┌─────────────────────────────────────────────────────────────────┐
│                   Rate Limiting System                           │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              Rate Limit Middleware                          │ │
│  │                                                              │ │
│  │  ┌─────────────────────────────────────────────────────┐   │ │
│  │  │  Request Processor                                   │   │ │
│  │  │  1. Extract identifier (user/IP/API key)            │   │ │
│  │  │  2. Determine tier (anonymous/free/pro/enterprise)  │   │ │
│  │  │  3. Check rate limit                                 │   │ │
│  │  │  4. Add response headers                             │   │ │
│  │  │  5. Allow or block request                           │   │ │
│  │  └──────────────────────┬──────────────────────────────┘   │ │
│  │                         │                                    │ │
│  └─────────────────────────┼────────────────────────────────┘ │
│                            │                                    │
│  ┌─────────────────────────▼────────────────────────────────┐ │
│  │          Sliding Window Rate Limiter                      │ │
│  │                                                            │ │
│  │  ┌──────────────────────────────────────────────────┐    │ │
│  │  │  Lua Script Executor (Atomic Operations)         │    │ │
│  │  │                                                    │    │ │
│  │  │  function checkLimit(key, now, limit, window):   │    │ │
│  │  │    1. ZREMRANGEBYSCORE(key, 0, now - window)     │    │ │
│  │  │    2. count = ZCARD(key)                          │    │ │
│  │  │    3. if count >= limit:                          │    │ │
│  │  │         return {allowed: false, ...}              │    │ │
│  │  │    4. ZADD(key, now, requestId)                   │    │ │
│  │  │    5. EXPIRE(key, window)                         │    │ │
│  │  │    6. return {allowed: true, ...}                 │    │ │
│  │  │                                                    │    │ │
│  │  └──────────────────────┬───────────────────────────┘    │ │
│  │                         │                                  │ │
│  └─────────────────────────┼──────────────────────────────┘ │
│                            │                                  │
│  ┌─────────────────────────▼──────────────────────────────┐ │
│  │               Vercel KV (Redis)                         │ │
│  │                                                          │ │
│  │  ┌────────────────────────────────────────────────┐    │ │
│  │  │  Sorted Sets (ZSET) - Sliding Window           │    │ │
│  │  │                                                  │    │ │
│  │  │  ratelimit:user:123:global:                     │    │ │
│  │  │    1731968400000 → "req1"                       │    │ │
│  │  │    1731968401000 → "req2"                       │    │ │
│  │  │    1731968402000 → "req3"                       │    │ │
│  │  │    ...                                           │    │ │
│  │  │                                                  │    │ │
│  │  │  ratelimit:ip:192.168.1.1:global:               │    │ │
│  │  │    ...timestamps...                              │    │ │
│  │  │                                                  │    │ │
│  │  └────────────────────────────────────────────────┘    │ │
│  │                                                          │ │
│  │  ┌────────────────────────────────────────────────┐    │ │
│  │  │  TTL Expiration (Automatic Cleanup)             │    │ │
│  │  │  • Keys auto-expire after window                │    │ │
│  │  │  • No manual cleanup needed                     │    │ │
│  │  └────────────────────────────────────────────────┘    │ │
│  │                                                          │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Tier Configuration Manager                 │ │
│  │                                                          │ │
│  │  ┌──────────────┬──────────┬──────────┬──────────┐     │ │
│  │  │ Anonymous    │   Free   │   Pro    │Enterprise│     │ │
│  │  ├──────────────┼──────────┼──────────┼──────────┤     │ │
│  │  │ 10/min       │ 30/min   │ 100/min  │ 500/min  │     │ │
│  │  │ 100/hr       │ 500/hr   │ 2000/hr  │ 10000/hr │     │ │
│  │  │ 1000/day     │ 5000/day │ 50000/day│ Unlimited│     │ │
│  │  │ Burst: 2x    │ Burst: 2x│ Burst: 3x│ Burst: 5x│     │ │
│  │  └──────────────┴──────────┴──────────┴──────────┘     │ │
│  │                                                          │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Circuit Breaker                            │ │
│  │                                                          │ │
│  │  States: CLOSED → OPEN → HALF_OPEN                     │ │
│  │                                                          │ │
│  │  • Failure threshold: 5 errors in 60s                  │ │
│  │  • Open timeout: 30s                                    │ │
│  │  • On failure: Fail open (allow requests)              │ │
│  │                                                          │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Metrics Collector                          │ │
│  │                                                          │ │
│  │  • Request counts by tier                               │ │
│  │  • Violation counts                                     │ │
│  │  • Top violators                                        │ │
│  │  • Rate limiter latency                                 │ │
│  │                                                          │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow Diagrams

### Cache Hit Flow (L2)

```
User Request
     │
     ▼
┌─────────────────┐
│  API Handler    │
└────────┬────────┘
         │ cacheKey = "pdb:1HHO"
         ▼
┌─────────────────┐
│  Unified Cache  │
│    Service      │
└────────┬────────┘
         │ L2Cache.get(key)
         ▼
┌─────────────────┐
│  Vercel KV      │
│  (Redis)        │
└────────┬────────┘
         │ FOUND (35ms)
         ▼
┌─────────────────┐
│ Populate L1     │
│ (background)    │
└────────┬────────┘
         │
         ▼
Response to User
X-Cache: L2
```

### Cache Miss Flow (Origin)

```
User Request
     │
     ▼
API Handler
     │
     ▼
L2 Cache → MISS
     │
     ▼
L3 Cache → MISS
     │
     ▼
┌─────────────────┐
│ Fetch from      │
│ RCSB PDB Origin │
└────────┬────────┘
         │ 500ms
         ▼
┌─────────────────┐
│ Populate All    │
│ Cache Tiers     │
│                 │
│ L3 ← data       │
│ L2 ← data (24h) │
│ L1 ← data (7d)  │
└────────┬────────┘
         │
         ▼
Response to User
X-Cache: MISS
```

### Rate Limit Check Flow

```
Request arrives
     │
     ▼
┌─────────────────┐
│ Extract User/IP │
└────────┬────────┘
         │ user:123 or ip:1.2.3.4
         ▼
┌─────────────────┐
│ Determine Tier  │
└────────┬────────┘
         │ tier = "pro"
         │ limit = 100/min
         ▼
┌─────────────────┐
│ Execute Lua     │
│ Script (Redis)  │
│                 │
│ 1. Remove old   │
│ 2. Count window │
│ 3. Check limit  │
│ 4. Add request  │
└────────┬────────┘
         │ 3ms
         ▼
    ┌─────────┐
    │Allowed? │
    └──┬───┬──┘
       │   │
   YES │   │ NO
       │   │
       ▼   ▼
   Continue  Return 429
   Request   + Retry-After
```

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Global Deployment                             │
│                                                                   │
│  ┌─────────────────────┐  ┌─────────────────────┐              │
│  │   Vercel Edge       │  │   Vercel Edge       │              │
│  │   (US East)         │  │   (EU West)         │  ... (15+)   │
│  │                     │  │                     │              │
│  │ • Next.js Functions │  │ • Next.js Functions │              │
│  │ • KV Cache (Redis)  │  │ • KV Cache (Redis)  │              │
│  │ • Rate Limiting     │  │ • Rate Limiting     │              │
│  └──────────┬──────────┘  └──────────┬──────────┘              │
│             │                        │                           │
│             └────────────┬───────────┘                           │
│                          │ Read Replicas                         │
│  ┌───────────────────────▼───────────────────────┐              │
│  │       Vercel KV Master (Global)                │              │
│  │       • Synchronized across regions            │              │
│  │       • <5ms cross-region latency              │              │
│  └────────────────────────────────────────────────┘              │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │       Supabase Multi-Region (PostgreSQL + Storage)         │ │
│  │                                                              │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │ │
│  │  │  US Primary  │  │  EU Replica  │  │  APAC Replica│     │ │
│  │  │  Database    │  │  Database    │  │  Database    │     │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘     │ │
│  │                                                              │ │
│  │  ┌────────────────────────────────────────────────────┐    │ │
│  │  │  S3-Compatible Storage (Global CDN)                 │    │ │
│  │  │  • Automatic geo-replication                        │    │ │
│  │  │  • CDN caching                                      │    │ │
│  │  └────────────────────────────────────────────────────┘    │ │
│  │                                                              │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

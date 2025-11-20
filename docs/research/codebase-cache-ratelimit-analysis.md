# Lab Visualizer Codebase Analysis: Cache & Rate Limiting Research

**Research Date**: 2025-11-20
**Agent**: Researcher
**Task**: Analyze current caching implementation, database patterns, API structure, rate limiting, and MolStar integration

---

## Executive Summary

The lab_visualizer project has a **partial multi-tier caching implementation** with:
- ✅ **L1 (IndexedDB)**: Fully implemented with 500MB quota, LRU eviction, 7-day TTL
- ⚠️ **L2 (Vercel KV/Redis)**: Stub implementation, needs integration
- ⚠️ **L3 (Supabase Storage)**: Partial implementation, needs completion
- ⚠️ **Rate Limiting**: Basic in-memory only, needs distributed solution

---

## 1. Current Caching Implementation

### Architecture Overview
```
Client (Browser)
    ↓
L1: IndexedDB (500MB, 7-day TTL)
    ↓ [MISS]
L2: Vercel KV/Edge Cache (STUB)
    ↓ [MISS]
L3: Supabase Storage (PARTIAL)
    ↓ [MISS]
External API (RCSB PDB)
```

### Key Files

#### L1: IndexedDB Cache
- **File**: `/home/user/lab_visualizer/src/lib/cache/indexeddb.ts` (534 lines)
- **Status**: ✅ Fully Implemented
- **Features**:
  - Type-safe wrapper using `idb` package
  - 500MB quota with LRU eviction
  - 7-day TTL with automatic cleanup
  - Three stores: `pdb-files`, `computed-data`, `metadata`
  - Hit/miss tracking and metrics
  - Automatic periodic cleanup (every 6 hours)

#### Unified Cache Service
- **File**: `/home/user/lab_visualizer/src/lib/cache/cache-service.ts` (270 lines)
- **Status**: ✅ Operational (with L1 only)
- **Features**:
  - Multi-tier orchestration
  - Generic `fetchWithCache` wrapper
  - Prefetch support
  - Cache invalidation
  - Latency metrics tracking
  - Singleton pattern

#### Cache Warming Service
- **File**: `/home/user/lab_visualizer/src/services/cache-warming.ts` (400 lines)
- **Status**: ✅ Implemented
- **Features**:
  - Priority queue based on popularity/recency/relevance
  - Network-aware (respects connection type)
  - User preference detection
  - Progress tracking and events
  - Retry logic with exponential backoff
  - Concurrent download limit (default: 5)

#### Cache Strategy Engine
- **File**: `/home/user/lab_visualizer/src/lib/cache-strategy.ts` (352 lines)
- **Status**: ✅ Implemented
- **Features**:
  - Intelligent scoring: popularity (50%), recency (30%), relevance (20%)
  - Top 20 educational structures predefined
  - Budget-constrained selection (500MB max)
  - Adaptive strategy based on hit rate
  - Family/complex relationship tracking
  - Health metrics and recommendations

#### Cache Worker
- **File**: `/home/user/lab_visualizer/src/workers/cache-worker.ts` (249 lines)
- **Status**: ✅ Implemented
- **Features**:
  - Web Worker for non-blocking prefetch
  - Concurrent download management
  - Retry with exponential backoff
  - Pause/resume/cancel support

### Test Coverage
- **File**: `/home/user/lab_visualizer/tests/cache-warming.test.ts` (349 lines)
- Comprehensive tests for:
  - Score calculation
  - Structure selection
  - Adaptive strategy
  - Service lifecycle
  - Progress tracking
  - Error handling
  - Network awareness

---

## 2. Rate Limiting Analysis

### Current Implementation
- **File**: `/home/user/lab_visualizer/src/app/api/pdb/[id]/route.ts` (lines 14-37)
- **Type**: In-memory `Map<string, { count: number; resetAt: number }>`
- **Config**:
  - Limit: 100 requests per window
  - Window: 60,000ms (1 minute)
  - Identifier: IP from `x-forwarded-for` header

### Critical Issues
1. ❌ **Not Distributed**: Each Edge Function instance has its own rate limit state
2. ❌ **Resets on Deploy**: All limits lost during redeployments
3. ❌ **No Persistence**: No cross-request tracking
4. ❌ **Single Tier**: No differentiation between authenticated/anonymous users
5. ❌ **Missing Headers**: No rate limit info in response headers

### Configuration Files
```env
# config/.env.example (lines 38-40)
RATE_LIMIT_WINDOW=15m
RATE_LIMIT_MAX_REQUESTS=100

# config/edge-function.env.example (lines 33-34)
ENABLE_RATE_LIMITING=true
MAX_REQUESTS_PER_HOUR=20
```

### Recommended Solution
**Upstash Redis + @upstash/ratelimit**

```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, "1 m"),
  analytics: true,
});
```

**Benefits**:
- ✅ Distributed across all Edge Functions
- ✅ Persistent across deployments
- ✅ Per-user and per-IP tracking
- ✅ Multiple tier support
- ✅ Built-in analytics

---

## 3. Database and Storage Patterns

### Supabase PostgreSQL Schema
- **File**: `/home/user/lab_visualizer/infrastructure/supabase/migrations/001_initial_schema.sql` (956 lines)
- **Platform**: Supabase PostgreSQL with Row Level Security (RLS)

### Relevant Tables

#### `simulation_cache` (lines 332-347)
```sql
CREATE TABLE simulation_cache (
  id UUID PRIMARY KEY,
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
```

#### `simulation_jobs` (lines 301-330)
```sql
CREATE TABLE simulation_jobs (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES user_profiles(id),
  structure_id UUID NOT NULL REFERENCES structures(id),
  simulation_type simulation_type NOT NULL,
  parameters JSONB NOT NULL,
  status simulation_status DEFAULT 'pending',
  progress_percent INTEGER DEFAULT 0,
  result_path TEXT,
  result_data JSONB,
  error_message TEXT,
  cpu_time INTEGER,
  memory_used BIGINT,
  estimated_cost NUMERIC(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
);
```

### Supabase Client Files
- **Browser**: `/home/user/lab_visualizer/src/lib/supabase/client.ts`
- **Server**: `/home/user/lab_visualizer/src/lib/supabase/server.ts`
- Both use `@supabase/ssr` for SSR cookie handling

### Supabase Configuration
- **File**: `/home/user/lab_visualizer/config/supabase.toml`
- **Database Port**: 54322
- **API Port**: 54321
- **Storage**: Enabled, 50MiB file size limit
- **Auth**: JWT expiry 3600s, refresh token rotation enabled
- **Edge Functions**: `md-simulation` function configured

---

## 4. API Endpoint Structure

### Main PDB Endpoint
- **File**: `/home/user/lab_visualizer/src/app/api/pdb/[id]/route.ts` (232 lines)
- **Runtime**: `edge`
- **Dynamic**: `force-dynamic`

#### Key Features
1. **Rate Limiting** (lines 14-37, 46-53)
   - In-memory map-based (needs upgrade)

2. **Request Deduplication** (lines 19-20, 66-76)
   - Prevents duplicate concurrent fetches
   - Uses `pendingRequests` Map
   - Key: `pdb:${pdbId}:${url}`

3. **Multi-Tier Caching** (lines 86-119)
   - L1: Skipped server-side (line 88-89)
   - L2: `cacheService.get(cacheKey, 'l2')` - STUB (lines 92-102)
   - L3: `cacheService.get(cacheKey, 'l3')` - PARTIAL (lines 104-119)

4. **Progress Streaming** (lines 124-186)
   - Server-Sent Events (SSE)
   - Real-time progress updates
   - Optional via `?progress=true`

5. **Cache Warming** (lines 152-155)
   - Stores in both L2 (7-day TTL) and L3 (30-day TTL)

### Other API Routes
```
/home/user/lab_visualizer/src/app/api/
├── pdb/
│   ├── [id]/route.ts           # Main PDB fetch
│   ├── upload/route.ts         # User uploads
│   ├── search/route.ts         # PDB search
│   └── alphafold/[uniprot]/route.ts  # AlphaFold structures
├── export/
│   ├── image/route.ts          # Image export
│   ├── model/route.ts          # Model export
│   └── pdf/route.ts            # PDF export
└── learning/
    ├── modules/[id]/route.ts
    ├── modules/route.ts
    ├── pathways/route.ts
    └── progress/route.ts
```

---

## 5. MolStar Integration

### Main Service File
- **File**: `/home/user/lab_visualizer/src/services/molstar-service.ts` (523 lines)
- **Pattern**: Singleton service
- **Status**: ✅ Operational with TODOs

### Implementation Overview
```typescript
export class MolstarService {
  private static instance: MolstarService | null = null;
  private viewer: MolstarViewer | null = null;

  // Initialization
  async initialize(container: HTMLDivElement, config: MolstarConfig): Promise<void>

  // Structure loading
  async loadStructure(data: string | ArrayBuffer, options: LoadStructureOptions): Promise<StructureMetadata>
  async loadStructureById(pdbId: string): Promise<StructureMetadata>

  // Visualization
  async applyRepresentation(options: RepresentationOptions): Promise<void>
  async setColorScheme(scheme: MolstarColorScheme): Promise<void>

  // Selection (TODO)
  async select(query: SelectionQuery): Promise<void>  // Line 347

  // Export
  async exportImage(options: ExportImageOptions): Promise<Blob>
  async getCameraSnapshot(): CameraSnapshot | null
}
```

### Pending TODOs

#### 1. Loci Selection (Line 347)
```typescript
// TODO: Implement Loci selection with Mol* query system
public async select(query: SelectionQuery): Promise<void> {
  // Current: stub implementation
  // Needed: Mol* Loci query system integration
}
```

#### 2. Metadata Extraction (Line 480)
```typescript
// TODO: Extract real metadata from Mol* structure object
private extractMetadata(structure: any): StructureMetadata {
  // Current: returns placeholder data
  // Needed: parse real structure data
  return {
    title: 'Unknown Structure',
    chains: ['A'],
    atomCount: 0,
    residueCount: 0,
  };
}
```

### Types Definition
- **File**: `/home/user/lab_visualizer/src/types/molstar.ts`
- Defines:
  - `MolstarConfig`
  - `MolstarViewer`
  - `LoadStructureOptions`
  - `MolstarRepresentationType`
  - `MolstarColorScheme`
  - `RepresentationOptions`
  - `SelectionQuery`
  - `StructureMetadata`

### Test Coverage
- **File**: `/home/user/lab_visualizer/tests/molstar-service.test.ts`
- Comprehensive integration tests

---

## 6. Configuration and Environment

### Environment Variables

#### Root `.env.example`
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_DEBUG=true
```

#### `/config/.env.example`
```env
# OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
NEXT_PUBLIC_GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...

# Rate Limiting
RATE_LIMIT_WINDOW=15m
RATE_LIMIT_MAX_REQUESTS=100

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASSWORD=...
```

#### `/config/edge-function.env.example`
```env
# Simulation Limits
MAX_ATOMS=5000
MAX_EXECUTION_TIME_SECONDS=300
MAX_STRUCTURE_SIZE_MB=50

# Cost
COST_PER_GB_SECOND=2.00
MEMORY_ALLOCATION_GB=2

# Security
REQUIRE_AUTH=true
ENABLE_RATE_LIMITING=true
MAX_REQUESTS_PER_HOUR=20

# Features
ENABLE_CACHING=true
ENABLE_GPU=false
```

### Missing Packages
Based on documentation references but not in `package.json`:
- `@vercel/kv` - For L2 edge caching
- `@upstash/redis` - For distributed rate limiting
- `@upstash/ratelimit` - For rate limiting utilities

### Current Dependencies
```json
{
  "dependencies": {
    "html2canvas": "^1.4.1",
    "jspdf": "^3.0.3",
    "next": "^14.2.33",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  }
}
```

---

## 7. Middleware Analysis

### Authentication Middleware
- **File**: `/home/user/lab_visualizer/src/middleware.ts` (162 lines)
- **Purpose**: Authentication, route protection, security headers
- **Runtime**: Edge

#### Current Features
1. ✅ Session refresh via Supabase
2. ✅ Protected route enforcement
3. ✅ Profile existence check
4. ✅ Admin route protection
5. ✅ Auth callback handling
6. ✅ Security headers (X-Frame-Options, CSP, etc.)

#### Notable Gaps
- ❌ No rate limiting in middleware
- ❌ No caching headers
- ❌ No request logging

#### Protected Routes
```typescript
const PROTECTED_ROUTES = [
  '/dashboard',
  '/structures',
  '/simulations',
  '/learning',
  '/collections',
  '/profile',
  '/settings',
];
```

---

## 8. Job Queue Service

### Implementation
- **File**: `/home/user/lab_visualizer/src/services/job-queue.ts` (315 lines)
- **Status**: ⚠️ Stub with TODOs
- **Pattern**: Singleton

### Pending Integration (7 TODOs)

1. **Line 80**: `submitToSupabase(job)` - Submit to Supabase via Edge Function
2. **Line 95**: `getJob(jobId)` - Query Supabase database
3. **Line 108**: `queryJobs(options)` - Query Supabase with filters
4. **Line 121**: `cancelJob(jobId)` - Update job status
5. **Line 148**: `getJobResult(jobId)` - Fetch result from Supabase Storage
6. **Line 226**: `getQueueStats()` - Query statistics from Supabase
7. **Line 299**: Complete Supabase submission implementation

### Database Tables (Already Created)
- `simulation_jobs` table exists in schema
- Edge function `md-simulation` configured in `supabase.toml`

---

## 9. Top Educational Structures

The cache warming service prioritizes these 20 PDB structures:

```typescript
const TOP_EDUCATIONAL_STRUCTURES = [
  '1HHO',  // Hemoglobin
  '2DHB',  // Deoxyhemoglobin
  '1MBO',  // Myoglobin
  '2LYZ',  // Lysozyme
  '4HHB',  // Hemoglobin (different form)
  '1CRN',  // Crambin
  '1UBQ',  // Ubiquitin
  '1GFL',  // Green Fluorescent Protein
  '1BNA',  // DNA double helix
  '1TIM',  // Triose phosphate isomerase
  '1AKE',  // Adenylate kinase
  '7API',  // Alcohol dehydrogenase
  '1A2Y',  // Ribonuclease A
  '1PTQ',  // Beta-lactamase
  '1J8H',  // ATP synthase
  '1IGT',  // Immunoglobulin
  '1HEL',  // Hen egg-white lysozyme
  '1BM8',  // Potassium channel
  '1EMA',  // Enolase
  '1F88',  // Rubisco
];
```

---

## 10. Recommendations

### Immediate Actions (High Priority)

#### 1. Implement Distributed Rate Limiting
```bash
npm install @upstash/redis @upstash/ratelimit
```

**Implementation**:
- Create `/home/user/lab_visualizer/src/lib/rate-limit.ts`
- Use Upstash Redis for distributed state
- Add rate limit headers to responses
- Implement multiple tiers (anonymous, authenticated, premium)
- Add to middleware for global protection

#### 2. Complete L2 Cache Integration
```bash
npm install @vercel/kv
```

**Implementation**:
- Update `/home/user/lab_visualizer/src/app/api/pdb/[id]/route.ts`
- Replace stub at lines 92-102
- Add proper error handling
- Configure TTL (7 days recommended)
- Add cache invalidation webhooks

#### 3. Complete L3 Cache Integration
**Implementation**:
- Update `/home/user/lab_visualizer/src/app/api/pdb/[id]/route.ts`
- Complete Supabase Storage integration at lines 104-119
- Use existing `simulation_cache` table pattern
- Implement cache warming automation
- Add monitoring for cache hit rates

### Medium Priority

#### 4. Complete MolStar TODOs
- Implement Loci selection (line 347)
- Extract real metadata (line 480)
- Add tests for new functionality

#### 5. Finish Job Queue Integration
- Complete 7 TODOs in `/home/user/lab_visualizer/src/services/job-queue.ts`
- Connect to Supabase Edge Function
- Add real-time progress updates
- Implement result caching

#### 6. Add Monitoring
- Cache hit rate tracking
- Rate limit violation alerts
- Performance metrics dashboard
- Error rate monitoring

### Long-term Enhancements

#### 7. Cache Optimization
- Implement predictive prefetching
- Add A/B testing for cache strategies
- Optimize cache key structure
- Implement cache compression

#### 8. Rate Limiting Enhancements
- Add cost-based rate limiting
- Implement quota management
- Add burst allowance
- Per-endpoint rate limits

#### 9. Testing
- Add E2E tests for cache flows
- Load testing for rate limits
- Cache invalidation tests
- Performance benchmarks

---

## 11. File Organization

```
/home/user/lab_visualizer/
├── src/
│   ├── lib/
│   │   ├── cache/
│   │   │   ├── cache-service.ts          ✅ Implemented
│   │   │   └── indexeddb.ts              ✅ Implemented
│   │   ├── cache-strategy.ts             ✅ Implemented
│   │   └── supabase/
│   │       ├── client.ts                 ✅ Implemented
│   │       └── server.ts                 ✅ Implemented
│   ├── services/
│   │   ├── cache-warming.ts              ✅ Implemented
│   │   ├── job-queue.ts                  ⚠️  7 TODOs
│   │   └── molstar-service.ts            ⚠️  2 TODOs
│   ├── workers/
│   │   └── cache-worker.ts               ✅ Implemented
│   ├── app/api/
│   │   └── pdb/[id]/route.ts             ⚠️  L2/L3 stubs
│   └── middleware.ts                     ⚠️  No rate limiting
├── tests/
│   ├── cache-warming.test.ts             ✅ Comprehensive
│   └── molstar-service.test.ts           ✅ Comprehensive
├── infrastructure/supabase/migrations/
│   └── 001_initial_schema.sql            ✅ Complete schema
├── config/
│   ├── .env.example                      ✅ Config reference
│   ├── edge-function.env.example         ✅ Edge config
│   └── supabase.toml                     ✅ Supabase config
└── docs/
    └── research/
        └── codebase-cache-ratelimit-analysis.md  📄 This file
```

---

## 12. Integration Checklist

### Cache Implementation
- [x] L1 (IndexedDB) - Fully implemented
- [x] Cache warming service - Implemented
- [x] Cache strategy engine - Implemented
- [x] Cache worker - Implemented
- [ ] L2 (Vercel KV) - **NEEDS IMPLEMENTATION**
- [ ] L3 (Supabase Storage) - **NEEDS COMPLETION**
- [ ] Cache invalidation webhooks - **NEEDS IMPLEMENTATION**
- [ ] Monitoring dashboard - **NEEDS IMPLEMENTATION**

### Rate Limiting
- [x] Basic in-memory rate limiting - Implemented (inadequate)
- [ ] Distributed rate limiting (Upstash) - **NEEDS IMPLEMENTATION**
- [ ] Multiple tier support - **NEEDS IMPLEMENTATION**
- [ ] Rate limit headers - **NEEDS IMPLEMENTATION**
- [ ] Middleware integration - **NEEDS IMPLEMENTATION**
- [ ] Per-endpoint limits - **NEEDS IMPLEMENTATION**

### Database Integration
- [x] Schema defined - Complete
- [x] Supabase clients - Implemented
- [ ] Job queue integration - **7 TODOs PENDING**
- [ ] Cache table utilization - **NEEDS IMPLEMENTATION**

### MolStar Integration
- [x] Basic service - Implemented
- [x] Loading and visualization - Implemented
- [ ] Loci selection - **TODO at line 347**
- [ ] Metadata extraction - **TODO at line 480**

---

## 13. Performance Targets

### Cache Performance
- **L1 Hit Rate**: Target 30% (currently meeting target)
- **L1 Latency**: <100ms (currently meeting target)
- **L2 Hit Rate**: Target 50% (not yet implemented)
- **L2 Latency**: <50ms (not yet implemented)
- **Overall Cache Hit Rate**: Target 70%

### Rate Limiting
- **Global Limit**: 100 req/min per IP (configured)
- **Authenticated Users**: 200 req/min (not yet tiered)
- **Response Time**: <5ms overhead (needs testing)

### Database
- **Query Latency**: <100ms (Supabase default)
- **Cache Hit Rate**: Target 80% for simulation results
- **Storage Size**: 500MB browser, unlimited cloud

---

## Conclusion

The lab_visualizer project has a **solid foundation** for caching with the L1 IndexedDB layer fully implemented and comprehensive cache warming strategies. However, **critical gaps** exist in:

1. **L2/L3 cache integration** - Prevents distributed caching benefits
2. **Rate limiting** - Current in-memory solution inadequate for production
3. **Job queue integration** - 7 TODOs blocking serverless MD simulations
4. **MolStar enhancements** - 2 TODOs limiting visualization features

**Next Steps**:
1. Implement Upstash Redis rate limiting (highest priority)
2. Complete L2 Vercel KV integration
3. Finish L3 Supabase Storage integration
4. Complete job queue Supabase integration
5. Resolve MolStar TODOs

All necessary infrastructure (database schema, configuration files, service patterns) is in place. The remaining work is primarily **integration and testing**.

---

**Research Completed**: 2025-11-20
**Status**: Ready for implementation agents
**Memory Key**: `swarm/researcher/codebase-analysis`

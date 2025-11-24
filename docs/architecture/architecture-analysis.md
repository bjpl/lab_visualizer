# LAB Visualization Platform - Architecture Analysis
**Vercel + Supabase Deployment Stack**
**Analysis Date:** November 17, 2025
**Analyst:** System Architecture Designer

---

## Executive Summary

The PRD presents a well-conceived architecture for a multi-scale molecular visualization platform. The Vercel + Supabase stack is **appropriate for the use case** but requires strategic enhancements to handle real-time 3D rendering, molecular dynamics simulations, and collaborative features at scale.

**Overall Assessment:** 7/10
- Strong foundation with modern cloud-native stack
- Critical gaps in compute-intensive workload architecture
- Real-time collaboration strategy needs refinement
- Scalability concerns with browser-based MD simulations

---

## 1. Architecture Strengths

### 1.1 Cloud-Native Stack Selection
**✓ Appropriate Choice:** Vercel + Supabase is well-suited for this use case:
- **Vercel:** Global CDN, edge functions, automatic scaling for Next.js
- **Supabase:** PostgreSQL with RLS, built-in real-time subscriptions, auth
- **Cost-effective:** Generous free tiers, predictable scaling costs
- **Developer experience:** Excellent DX with integrated deployment pipelines

### 1.2 Modern Frontend Architecture
**✓ React/Next.js with TypeScript:**
- Component-based architecture supports complex 3D visualization UIs
- TypeScript provides type safety for complex molecular data structures
- SSR/SSG capabilities enable SEO and fast initial loads for educational content
- React 18+ concurrent features support smooth 3D rendering updates

### 1.3 Multi-Library Visualization Strategy
**✓ Mol*/NGL/JSmol Integration:**
- **Smart diversification:** Different libraries for different use cases
  - Mol*: High-performance, feature-rich (large structures)
  - NGL: WebGL-optimized (interactive exploration)
  - JSmol: Java-to-JS, legacy compatibility
- **Fallback strategy:** Multiple engines provide redundancy
- **User choice:** Allows users to select preferred visualization style

### 1.4 Real-Time Collaboration Foundation
**✓ Supabase Realtime:**
- Built on PostgreSQL LISTEN/NOTIFY
- WebSocket-based subscriptions for low-latency updates
- Row-Level Security applies to real-time channels
- Proven for collaborative annotation use cases

### 1.5 Data Integration Approach
**✓ External API Strategy:**
- Client-side fetching reduces server costs
- Proxy option via Vercel Edge Functions for rate limiting/caching
- Direct integration with authoritative sources (RCSB, AlphaFold, UniProt)

---

## 2. Critical Architecture Issues

### 2.1 Browser-Based Molecular Dynamics: Architectural Mismatch ⚠️

**ISSUE:** WebDynamica/JSmol MD simulations in-browser are fundamentally constrained:

**Technical Limitations:**
- **JavaScript performance:** 10-100x slower than compiled C++/CUDA for MD
- **Memory constraints:** Browser tabs limited to ~2GB RAM (varies by browser)
- **No GPU acceleration:** WebGL compute shaders are limited vs. CUDA/OpenCL
- **Battery drain:** Intensive client-side compute on mobile/laptop devices
- **System size limits:** Practically limited to <1000 atoms for real-time dynamics

**User Experience Impact:**
- Simulations freeze UI during compute-intensive steps
- Mobile devices become unusable during MD runs
- Long simulations (>10 minutes) risk browser tab crashes
- No background processing when user closes tab

**ARCHITECTURAL RISK:** This is the highest-risk component. The PRD acknowledges "handoff to desktop tools" but treats browser MD as a primary feature, which will lead to user frustration.

### 2.2 Missing Compute Workload Architecture

**GAP:** No strategy for handling compute-intensive operations:

**What's Missing:**
1. **Serverless compute workers** for MD simulations
2. **Job queue system** for asynchronous processing
3. **Progress tracking** for long-running simulations
4. **Result caching** to avoid redundant calculations
5. **Compute budget/quotas** per user tier

**Impact:** Platform cannot deliver on "real-time molecular simulation" promise at scale.

### 2.3 Real-Time Collaboration Scalability Concerns

**ISSUE:** Supabase Realtime has limitations for high-frequency 3D collaboration:

**Constraints:**
- **Connection limits:** ~500 concurrent connections per Supabase project (free/pro tier)
- **Message throughput:** Not optimized for high-frequency 3D transform updates
- **Broadcast latency:** 50-200ms typical (acceptable for annotations, poor for synchronized 3D navigation)

**Collaboration Use Cases:**
| Use Case | Realtime Suitable? | Notes |
|----------|-------------------|-------|
| Shared annotations | ✓ Yes | Low-frequency events |
| Session state sync | ✓ Yes | Infrequent updates |
| Leader-guided tours | ⚠️ Maybe | Requires debouncing camera updates |
| Synchronized 3D navigation | ✗ No | Needs <50ms latency, high frequency |

**RECOMMENDATION:** Differentiate collaboration patterns by latency requirements.

### 2.4 Data Flow Architecture: Missing Diagrams

**GAP:** Sequence diagram provided is high-level; missing critical flows:

**Undocumented Flows:**
1. **Structure caching strategy:** Where are PDB files cached? Client? Vercel? Supabase Storage?
2. **Simulation result persistence:** How are MD trajectories stored and replayed?
3. **Large file handling:** 100MB+ structure files (e.g., ribosome, viral capsids)
4. **Failed API fallback:** Concrete retry/fallback logic
5. **Collaborative conflict resolution:** What happens when two users annotate the same residue simultaneously?

### 2.5 Missing Performance Budget

**GAP:** No quantitative performance targets:

**Undefined Metrics:**
- Initial load time targets for 3D viewer (should be <3s)
- Structure loading time for average protein (~300 residues)
- Maximum supported structure size (atoms/residues)
- Frame rate targets for 3D navigation (should be 60fps)
- Acceptable simulation speed (ns/day equivalent)

**Impact:** Without budgets, frontend teams will over-engineer or under-deliver.

---

## 3. Missing Architectural Components

### 3.1 Caching Layer (CRITICAL)

**WHY:** External APIs (RCSB, AlphaFold) have rate limits and can be slow.

**SOLUTION:**
```typescript
// Proposed caching architecture
interface CacheStrategy {
  // L1: Browser IndexedDB (client-side)
  clientCache: {
    maxSize: "500MB",
    ttl: "7 days",
    eviction: "LRU"
  },

  // L2: Vercel Edge KV (global CDN)
  edgeCache: {
    storage: "Vercel KV", // or Upstash Redis
    ttl: "30 days",
    scope: "Popular structures (top 1000)"
  },

  // L3: Supabase Storage (persistent)
  storageCache: {
    bucket: "structure-cache",
    ttl: "90 days",
    compression: "gzip"
  }
}
```

**Benefits:**
- 95%+ cache hit rate for common structures (e.g., lysozyme, hemoglobin)
- Reduces external API dependency
- Faster load times (50ms vs. 2000ms)

### 3.2 Asynchronous Job Queue System

**WHY:** MD simulations cannot block browser UI.

**SOLUTION:**
```typescript
// Proposed job architecture
interface JobSystem {
  queue: "Supabase pg_cron + Edge Functions",
  worker: {
    runtime: "Vercel Serverless Functions (30s timeout)" |
             "Railway/Fly.io long-running workers (minutes-hours)",
    compute: "CPU-optimized containers with OpenMM/GROMACS"
  },
  storage: {
    trajectories: "Supabase Storage (compressed)",
    frames: "Pre-rendered keyframes for playback"
  },
  notification: {
    realtime: "Supabase Realtime for job status updates",
    email: "Completion notifications for long jobs"
  }
}
```

**Alternative:** Integrate with established MD services (e.g., Galaxy, BioExcel) via API.

### 3.3 Content Delivery Optimization

**WHY:** 3D assets (textures, models) and videos are bandwidth-heavy.

**MISSING:**
- **Video streaming:** Use adaptive bitrate (HLS/DASH) via Mux or Cloudflare Stream
- **3D model streaming:** Progressive loading (LOD - Level of Detail)
- **Image optimization:** Next.js Image component with automatic WebP/AVIF

### 3.4 Monitoring & Observability

**MISSING:** How will you track performance and errors?

**REQUIRED:**
- **Frontend:** Vercel Analytics + Sentry for error tracking
- **Backend:** Supabase Dashboard + PostgREST logs
- **3D Performance:** Custom instrumentation (FPS, draw calls, memory)
- **User telemetry:** Visualization patterns, feature usage (privacy-compliant)

### 3.5 Search & Discovery Architecture

**GAP:** How do users find relevant structures/learning content?

**MISSING:**
- Full-text search implementation (PostgreSQL `tsvector` or Algolia)
- Taxonomy/tagging system for structures and content
- Recommendation engine (related structures/pathways)

---

## 4. Scalability Concerns & Mitigation

### 4.1 User Growth Scaling

**PROJECTED GROWTH:**
- **Year 1:** 10 academic programs × 50 users = 500 MAU (Monthly Active Users)
- **Year 3:** 100 programs × 100 users = 10,000 MAU
- **Year 5:** Enterprise adoption = 50,000+ MAU

**SCALING REQUIREMENTS:**

| Component | Year 1 | Year 3 | Mitigation Strategy |
|-----------|--------|--------|---------------------|
| **Vercel Bandwidth** | 100 GB/mo | 5 TB/mo | CDN caching, asset optimization |
| **Supabase DB Size** | 5 GB | 500 GB | Archival strategy, read replicas |
| **Realtime Connections** | 100 peak | 2,000 peak | Connection pooling, regional distribution |
| **Compute (MD Jobs)** | 1,000 jobs/mo | 100K jobs/mo | Job prioritization, queuing, rate limits |

**COST PROJECTION:**
- **Year 1:** ~$100-200/month (Vercel Pro + Supabase Pro)
- **Year 3:** ~$500-1,000/month (with optimizations)
- **Year 5:** ~$2,000-5,000/month (enterprise tier + dedicated compute)

### 4.2 Data Volume Scaling

**CHALLENGES:**
1. **Structure files:** Average 5MB per structure × 10K cached = 50GB
2. **Simulation trajectories:** 100MB per trajectory × 1K/month = 100GB/month
3. **User uploads:** Unpredictable, could be 10GB-1TB

**MITIGATION:**
- Implement storage quotas per user tier
- Automatic compression (gzip for text, H.264 for trajectories)
- Lifecycle policies (delete old jobs after 30 days)
- Offload to cheaper storage (S3 Glacier for archival)

### 4.3 Compute Scaling for Simulations

**BOTTLENECK:** Browser MD is not scalable.

**STRATEGIC PIVOT:**

**Option A: Serverless MD Workers (Recommended)**
```yaml
Architecture:
  - User submits job via Vercel API
  - Job queued in Supabase (pg_cron or external queue)
  - Worker (Railway/Fly.io) picks job
  - Worker runs OpenMM/GROMACS in Docker
  - Results saved to Supabase Storage
  - User notified via Realtime

Cost: ~$0.10-0.50 per simulation (10-60 minutes)
Scalability: Horizontal (add more workers)
```

**Option B: Hybrid Approach**
```yaml
Strategy:
  - Small molecules (<500 atoms): Browser-based with WebDynamica
  - Large molecules (>500 atoms): Server-side MD workers
  - User warned about limitations before starting

Benefits: Best UX for simple cases, scalability for complex ones
```

**Option C: Partnership Model**
```yaml
Strategy:
  - Integrate with existing MD services (Galaxy, BioExcel, SBGrid)
  - Platform acts as visualization + learning wrapper
  - MD jobs offloaded to specialized infrastructure

Benefits: No compute infrastructure to manage, leverage expert platforms
Drawback: Dependency on external services
```

**RECOMMENDATION:** Start with Option B (hybrid), evolve to Option A as user base grows.

### 4.4 Real-Time Collaboration at Scale

**ISSUE:** 10K users × 10% concurrent in sessions = 1,000 connections (exceeds Supabase limits)

**SCALING STRATEGIES:**

**Phase 1: Optimize Supabase Realtime**
- Use presence channels (more efficient than broadcast)
- Debounce high-frequency updates (camera transforms)
- Regional routing (multiple Supabase projects per region)

**Phase 2: Dedicated WebSocket Infrastructure**
- Deploy separate WebSocket server (e.g., Soketi on Railway)
- Use Supabase for persistence, WebSocket for real-time
- Scales to 10K+ concurrent connections

**Phase 3: P2P for Low-Latency Sync**
- WebRTC data channels for synchronized 3D navigation
- Supabase for session discovery/matchmaking
- Peer-to-peer for <20ms latency (LAN-like experience)

---

## 5. Strategic Improvements (HIGH IMPACT)

### 5.1 IMPROVEMENT #1: Compute-Offload Architecture (CRITICAL)

**PROBLEM:** Browser MD simulations are architectural dead-end.

**SOLUTION:**

```typescript
// Proposed Compute Architecture
interface ComputeArchitecture {
  // Tier 1: Instant preview (browser)
  browserSimulation: {
    engine: "WebDynamica",
    limits: {
      maxAtoms: 500,
      maxDuration: "30 seconds",
      features: ["energy minimization", "basic MD"]
    },
    purpose: "Educational demos, quick previews"
  },

  // Tier 2: Short jobs (serverless)
  serverlessWorkers: {
    platform: "Vercel Functions (30s) or Railway (5min)",
    engine: "OpenMM (Python)",
    limits: {
      maxAtoms: 5000,
      maxDuration: "5 minutes"
    },
    cost: "~$0.05-0.10 per job"
  },

  // Tier 3: Long jobs (dedicated workers)
  dedicatedWorkers: {
    platform: "Railway/Fly.io containers",
    engine: "GROMACS (GPU-accelerated)",
    limits: {
      maxAtoms: 50000,
      maxDuration: "1-24 hours"
    },
    cost: "~$0.50-5.00 per job",
    queue: "Bull/BullMQ with Redis"
  }
}
```

**IMPLEMENTATION PLAN:**
1. **Week 1-2:** Create API endpoints for job submission/status
2. **Week 3-4:** Implement Tier 1 (browser) with clear limitations
3. **Week 5-8:** Deploy Tier 2 (serverless) with OpenMM
4. **Week 9-12:** Add Tier 3 (dedicated) for advanced users
5. **Ongoing:** Monitor usage, optimize costs

**IMPACT:**
- Unlocks scalability for complex simulations
- Better UX (no browser freezing)
- Enables background processing
- Prepares for enterprise features (batch jobs, HPC integration)

**COST:** ~$500-1,000 initial development + $0.10-1.00 per simulation

### 5.2 IMPROVEMENT #2: Multi-Tier Caching Strategy

**PROBLEM:** Every structure load hits external APIs (slow, unreliable, rate-limited).

**SOLUTION:**

```typescript
// Intelligent caching with tiered strategy
interface CachingArchitecture {
  // Layer 1: Browser (fastest, smallest)
  browser: {
    storage: "IndexedDB",
    capacity: "500MB",
    ttl: "7 days",
    scope: "User's recent structures"
  },

  // Layer 2: Edge (global, medium)
  edge: {
    storage: "Vercel KV or Upstash Redis",
    capacity: "10GB",
    ttl: "30 days",
    scope: "Popular structures (95th percentile)",
    strategy: "Lazy population + analytics-driven preloading"
  },

  // Layer 3: Object Storage (persistent, large)
  storage: {
    provider: "Supabase Storage",
    capacity: "1TB+",
    ttl: "90 days",
    scope: "All fetched structures",
    compression: "gzip (5:1 ratio typical)"
  },

  // Cache warming
  preloading: {
    trigger: "Daily cron job",
    targets: [
      "Educational pathway structures",
      "Top 100 most-viewed",
      "Featured in current learning modules"
    ]
  }
}
```

**CACHE HIT TARGETS:**
- Layer 1 (Browser): 30% of requests (repeat user sessions)
- Layer 2 (Edge): 60% of requests (popular structures)
- Layer 3 (Storage): 9% of requests (less common)
- Cache miss (External API): <5% of requests

**IMPLEMENTATION:**
1. **Week 1:** Implement browser IndexedDB caching
2. **Week 2:** Add Vercel KV edge caching with analytics
3. **Week 3:** Implement Supabase Storage fallback layer
4. **Week 4:** Add cache warming cron jobs
5. **Ongoing:** Monitor hit rates, tune TTLs

**IMPACT:**
- 10x faster structure loading (50ms vs. 500ms+)
- 95% reduction in external API calls
- Resilience to API outages
- Lower infrastructure costs (less egress bandwidth)

**COST:** ~$50/month (Vercel KV or Upstash) + storage (~$10/month)

### 5.3 IMPROVEMENT #3: Progressive 3D Rendering & LOD System

**PROBLEM:** Large structures (>10K atoms) cause:
- Long initial load times (5-10 seconds)
- Poor performance on low-end devices
- Browser crashes on mobile

**SOLUTION:**

```typescript
// Level-of-Detail (LOD) progressive rendering
interface LODArchitecture {
  // Stage 1: Instant preview (< 200ms)
  previewStage: {
    representation: "Cartoon backbone only",
    atoms: "< 100 (Cα trace)",
    quality: "Low poly",
    purpose: "Immediate visual feedback"
  },

  // Stage 2: Interactive detail (< 1s)
  interactiveStage: {
    representation: "Secondary structure",
    atoms: "< 1000 (key residues)",
    quality: "Medium poly",
    purpose: "User can navigate/interact"
  },

  // Stage 3: Full detail (< 3s)
  fullStage: {
    representation: "All atoms + surfaces",
    atoms: "Complete structure",
    quality: "High poly (culled by viewport)",
    purpose: "Publication-quality rendering"
  },

  // Dynamic LOD based on performance
  adaptiveLOD: {
    metrics: ["FPS", "memory", "device capability"],
    strategy: "Auto-downgrade quality if FPS < 30"
  }
}
```

**IMPLEMENTATION TECHNIQUES:**
1. **Frustum culling:** Only render atoms in viewport
2. **Instanced rendering:** GPU instancing for repeated residues
3. **Web Workers:** Parse PDB/mmCIF off main thread
4. **Streaming:** Fetch structure in chunks (backbone → sidechains → water)
5. **Mesh simplification:** Reduce polygon count for distant atoms

**IMPACT:**
- 5x faster initial render (200ms vs. 1000ms for preview)
- Smooth 60fps on mid-range devices
- Graceful degradation on mobile
- Supports larger structures (up to 100K atoms)

**COST:** ~$1,000 development time (2-3 weeks engineering)

---

## 6. Decision Framework & Recommendations

### 6.1 Architecture Decision Records (ADRs)

**REQUIRED ADRs (to be created):**

**ADR-001: Browser vs. Server-Side Molecular Dynamics**
- **Decision:** Hybrid approach (browser for <500 atoms, server for larger)
- **Rationale:** Balances UX for simple cases with scalability for complex ones
- **Alternatives considered:** Browser-only (fails at scale), server-only (poor UX for demos)

**ADR-002: Real-Time Collaboration Protocol**
- **Decision:** Supabase Realtime for annotations, WebRTC for synchronized navigation
- **Rationale:** Leverages Supabase strengths, supplements with P2P for low latency
- **Alternatives:** Pure WebSocket server (more complex), Firebase (vendor lock-in)

**ADR-003: Structure Data Caching Strategy**
- **Decision:** Three-tier caching (browser, edge, storage)
- **Rationale:** Optimizes for speed, cost, and resilience
- **Alternatives:** No caching (slow), pure CDN (expensive for dynamic content)

**ADR-004: Visualization Library Selection**
- **Decision:** Mol* as primary, NGL/JSmol as alternatives
- **Rationale:** Mol* is most actively developed, NGL for WebGL optimization
- **Alternatives:** Single library (less flexibility), custom renderer (massive dev cost)

### 6.2 Immediate Action Items (Sprint 0)

**BEFORE DEVELOPMENT STARTS:**

1. **[CRITICAL] Prototype MD Compute Architecture** (1 week)
   - Build proof-of-concept serverless MD worker
   - Test OpenMM on Vercel Functions (30s limit)
   - Estimate costs per simulation type

2. **[HIGH] Implement Browser Caching** (3 days)
   - Add IndexedDB for structure files
   - Measure cache hit rates with test users

3. **[HIGH] Define Performance Budgets** (2 days)
   - Set quantitative targets (load time, FPS, memory)
   - Create performance testing suite

4. **[MEDIUM] Design Job Queue Schema** (3 days)
   - Database schema for job tracking
   - Status update API design
   - Notification strategy

5. **[MEDIUM] Create Scaling Cost Model** (2 days)
   - Project costs at 500, 5K, 50K users
   - Identify cost optimization opportunities

### 6.3 Long-Term Strategic Considerations

**YEAR 1 (MVP → Product-Market Fit):**
- Focus: Core visualization + educational content
- Compute: Browser-only MD with clear limitations
- Scale: Support 500-1,000 users
- Validation: User feedback on simulation usefulness

**YEAR 2 (Scale → Monetization):**
- Focus: Server-side MD, collaboration features
- Compute: Hybrid browser/server architecture
- Scale: Support 5,000-10,000 users
- Monetization: Freemium model (free browsing, paid simulations)

**YEAR 3 (Enterprise → Sustainability):**
- Focus: Institutional features (SSO, LMS, dashboards)
- Compute: GPU-accelerated workers, batch processing
- Scale: Support 50,000+ users
- Partnerships: Integration with HPC centers, CROs

---

## 7. Risk Assessment & Mitigation

### 7.1 Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| **Browser MD performance inadequate** | 80% | High | Implement compute-offload (5.1) immediately |
| **External API rate limiting** | 60% | Medium | Multi-tier caching (5.2), fallback sources |
| **Supabase Realtime limits** | 40% | Medium | Phase 1: optimize, Phase 2: dedicated WebSocket |
| **Large structure rendering crashes** | 50% | Medium | Progressive rendering + LOD (5.3) |
| **Cost overruns from compute** | 30% | Medium | Job quotas, cost monitoring, user tier limits |

### 7.2 Business Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| **Low user adoption** | 30% | High | MVP testing with 2-3 pilot programs before full launch |
| **Competition from established tools** | 50% | Medium | Focus on educational UX, not just visualization |
| **Grant funding dependency** | 40% | High | Build sustainable freemium model by Year 2 |

---

## 8. Conclusion & Final Recommendations

### 8.1 Summary Assessment

**STRENGTHS:**
- Solid foundation with Vercel + Supabase
- Well-thought-out feature set for target users
- Modern frontend architecture

**WEAKNESSES:**
- Compute-intensive workloads (MD) not architecturally viable in browser
- Missing caching strategy leads to poor performance + high costs
- Real-time collaboration needs deeper technical design
- No performance budgets or scaling cost models

**OVERALL VERDICT:**
The PRD is **70% ready for implementation** but requires architectural refinements before development begins. The three strategic improvements outlined in Section 5 are **non-negotiable** for a production-ready platform.

### 8.2 Go/No-Go Recommendation

**RECOMMENDATION: GO, with conditions**

**Prerequisites before Sprint 1:**
1. Accept compute-offload architecture (5.1) as core requirement
2. Implement browser caching (5.2, Layer 1) in prototype
3. Define performance budgets and testing strategy
4. Create ADR-001 (MD architecture) and ADR-003 (caching)
5. Build cost model with realistic simulation volume projections

**Timeline Estimate:**
- **Sprint 0 (Architectural POC):** 2-3 weeks
- **Sprint 1-4 (MVP Core):** 8-12 weeks
- **Sprint 5-8 (Compute Infrastructure):** 8-12 weeks
- **Launch-ready:** 6-8 months from start

### 8.3 Success Criteria for Architecture Review

**PHASE 1 (Prototype - 4 weeks):**
- [ ] Browser caching achieves >30% hit rate
- [ ] Serverless MD worker can run 500-atom simulation in <5 minutes
- [ ] Mol* renders 5000-atom structure in <1s (interactive stage)
- [ ] Cost per simulation <$0.50

**PHASE 2 (MVP - 12 weeks):**
- [ ] Average structure load time <500ms (cached)
- [ ] 3D navigation maintains 60fps on 3-year-old laptops
- [ ] Real-time annotations sync in <200ms
- [ ] Supports 100 concurrent users with <$500/month infrastructure cost

**PHASE 3 (Production - 24 weeks):**
- [ ] 95% cache hit rate for top 1000 structures
- [ ] Supports 10K concurrent users
- [ ] Average simulation wait time <5 minutes
- [ ] Infrastructure costs <$0.10 per MAU (Monthly Active User)

---

## Appendix A: Technology Stack Deep Dive

### A.1 Vercel Capabilities & Limits

**Strengths:**
- Edge Functions: 0ms cold starts, global deployment
- Automatic scaling: No DevOps for traffic spikes
- Preview deployments: Every PR gets URL for testing

**Limits:**
- Function timeout: 10s (Hobby), 60s (Pro), 900s (Enterprise)
- Memory: 1 GB max per function
- Not suitable for: Long-running MD jobs, stateful WebSocket servers

**Optimization Tips:**
- Use Edge Functions for caching logic (faster than serverless)
- Stream responses for large datasets (don't buffer in memory)
- Leverage ISR (Incremental Static Regeneration) for educational content

### A.2 Supabase Capabilities & Limits

**Strengths:**
- PostgreSQL with extensions (pg_vector for embeddings, pg_cron for jobs)
- Built-in auth with social providers
- Storage with resumable uploads (tus protocol)
- Realtime with presence and broadcast

**Limits:**
- Connection pooling: PgBouncer limits (250 connections default)
- Realtime: ~500 concurrent connections (free), ~5K (pro)
- Storage: 100GB included (pro), then $0.021/GB
- Database size: Vertical scaling only (no sharding)

**Optimization Tips:**
- Use PostgREST sparingly for complex queries (write custom RPC functions)
- Enable connection pooling for serverless functions
- Store large files (>10MB) in Storage, not database
- Use materialized views for analytics queries

### A.3 Molecular Visualization Library Comparison

| Library | Strengths | Weaknesses | Best For |
|---------|-----------|------------|----------|
| **Mol*** | Most features, active dev, RCSB's choice | Large bundle (~2MB), complex API | Primary viewer |
| **NGL** | Fast WebGL, great performance | Less frequent updates | High-performance mode |
| **JSmol** | Java legacy compatibility, full Jmol features | Large bundle (~5MB), slower | Fallback for specific file types |
| **3DMol.js** | Lightweight, simple API | Limited features | Mobile/low-power devices |

**RECOMMENDATION:**
- Default: Mol* (best features)
- Performance mode: NGL (faster rendering)
- Mobile: 3DMol.js (smaller bundle)
- Legacy: JSmol (only when needed)

---

## Appendix B: Molecular Dynamics Simulation Options

### B.1 Server-Side MD Engines

| Engine | Language | GPU Support | Ease of Integration | License |
|--------|----------|-------------|---------------------|---------|
| **OpenMM** | Python | ✓ CUDA | High (Python API) | MIT |
| **GROMACS** | C++ | ✓ CUDA | Medium (CLI) | LGPL |
| **NAMD** | C++ | ✓ CUDA | Low (complex setup) | Free (non-commercial) |
| **Amber** | Fortran/C | ✓ CUDA | Low (commercial) | Proprietary |

**RECOMMENDATION:** Start with OpenMM (easiest Python integration).

### B.2 Cost Estimation for MD Jobs

**Assumptions:**
- Average job: 1000 atoms, 10 minutes compute time
- Serverless worker: $0.000024/GB-second (Railway)
- 4 GB RAM, 600 seconds = $0.058 per job

**Scenarios:**
- **100 jobs/month:** $5.80/month
- **1,000 jobs/month:** $58/month
- **10,000 jobs/month:** $580/month

**Cost Optimization:**
- Use spot instances (Railway/Fly.io) for 50% savings
- Implement job batching (run multiple small jobs per container)
- Cache common simulation results (e.g., standard protein folds)

---

## Appendix C: Recommended Reading

**Architecture Patterns:**
1. "Multi-Tier Caching Strategies" - AWS Architecture Blog
2. "Real-Time Collaboration at Scale" - Figma Engineering
3. "WebGL Performance Best Practices" - MDN Web Docs

**Molecular Visualization:**
1. Mol* Documentation - https://molstar.org/docs/
2. "High-Performance Molecular Visualization" - RCSB PDB
3. "WebGL for Scientific Visualization" - Khronos Group

**Vercel + Supabase:**
1. "Next.js on Vercel: Best Practices" - Vercel Docs
2. "Scaling Supabase to 1M Users" - Supabase Blog
3. "Serverless Postgres at Scale" - Supabase Engineering

---

**Document Status:** Ready for stakeholder review
**Next Steps:** Present findings to engineering and product teams, prioritize improvements
**Contact:** Architecture team for questions on implementation strategy

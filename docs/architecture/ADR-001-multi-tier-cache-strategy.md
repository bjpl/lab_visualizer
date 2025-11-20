# ADR-001: Multi-Tier Cache Strategy with Vercel KV and Supabase Storage

**Status:** Proposed
**Date:** 2025-11-20
**Decision Makers:** System Architecture Team
**Target:** 70% combined cache hit rate

## Context

The lab_visualizer application currently implements L1 caching (IndexedDB, 30% hit rate) for molecular structure data. To achieve the target 70% hit rate and reduce latency for distributed users, we need to implement L2 (edge) and L3 (persistent storage) caching layers.

### Current Architecture
- **L1 Cache:** IndexedDB (Browser)
  - Hit Rate: ~30%
  - Latency: <100ms
  - Size: 500MB quota
  - TTL: 7 days
  - Strategy: LRU eviction

### Requirements
1. Achieve 70% combined cache hit rate across all tiers
2. L2 latency: <50ms (edge-optimized)
3. L3 latency: <200ms (regional storage)
4. Support for large molecular structures (up to 50MB per file)
5. Global distribution for international users
6. Cost-effective storage and bandwidth usage

## Decision

Implement a three-tier caching architecture:

### L1: IndexedDB (Browser) - EXISTING
- **Technology:** idb library
- **Target Hit Rate:** 30%
- **Latency:** <100ms
- **Capacity:** 500MB per user
- **TTL:** 7 days
- **Eviction:** LRU (Least Recently Used)

### L2: Vercel KV (Redis-compatible Edge Cache) - NEW
- **Technology:** Vercel KV (Upstash-powered Redis)
- **Target Hit Rate:** 35% (of L1 misses)
- **Latency:** <50ms (edge-optimized)
- **Capacity:** 10GB shared across all users
- **TTL:** 24 hours (frequently accessed data)
- **Deployment:** Edge locations globally
- **Use Cases:**
  - Popular PDB structures (top 100)
  - Recently fetched structures (last 24h)
  - Parsed structure metadata
  - Computed geometry data (LOD levels)

### L3: Supabase Storage (Persistent Object Storage) - NEW
- **Technology:** Supabase Storage (S3-compatible)
- **Target Hit Rate:** 25% (of L2 misses)
- **Latency:** <200ms
- **Capacity:** Unlimited (pay-per-use)
- **TTL:** 30 days (infrequently accessed)
- **Use Cases:**
  - Full PDB file repository
  - User-uploaded structures
  - Computed simulation results
  - Export artifacts (PDF, images)
  - Backup and archival

## Cache Key Strategy

### L1 Keys (IndexedDB)
```
pdb:{pdbId}                    # Raw PDB file
computed:{pdbId}:lod:{level}   # LOD geometry
computed:{pdbId}:metadata      # Parsed metadata
simulation:{simId}:frame:{n}   # Simulation frames
```

### L2 Keys (Vercel KV)
```
l2:pdb:{pdbId}                    # Popular structures
l2:metadata:{pdbId}               # Structure metadata
l2:geometry:{pdbId}:lod:{level}   # Geometry cache
l2:popular:top100                 # List of top 100 PDBs
l2:session:{userId}:recent        # User recent access
```

### L3 Keys (Supabase Storage)
```
pdb-files/{pdbId}.pdb                    # Raw PDB files
processed/{pdbId}/metadata.json          # Processed metadata
processed/{pdbId}/lod-{level}.bin        # Precomputed LOD
user-uploads/{userId}/{uploadId}.pdb     # User uploads
simulations/{simId}/trajectory.bin       # Simulation data
exports/{userId}/{exportId}.{ext}        # Export artifacts
```

## Cache Flow Architecture

```
User Request
    ↓
┌───────────────────────────────────────────┐
│ L1: IndexedDB (Browser)                   │
│ • Check local cache                       │
│ • 30% hit rate, <100ms                    │
└───────────────────────────────────────────┘
    ↓ (miss)
┌───────────────────────────────────────────┐
│ L2: Vercel KV (Edge Cache)                │
│ • Check edge Redis                        │
│ • 35% additional hit rate, <50ms          │
│ • Populate L1 on hit                      │
└───────────────────────────────────────────┘
    ↓ (miss)
┌───────────────────────────────────────────┐
│ L3: Supabase Storage (Persistent)         │
│ • Check object storage                    │
│ • 25% additional hit rate, <200ms         │
│ • Populate L2 and L1 on hit               │
└───────────────────────────────────────────┘
    ↓ (miss)
┌───────────────────────────────────────────┐
│ Origin: RCSB PDB / External APIs          │
│ • Fetch from source                       │
│ • Populate L3, L2, L1                     │
│ • ~10% of requests (target)               │
└───────────────────────────────────────────┘
```

## TTL & Eviction Policies

### L1 (IndexedDB)
- **TTL:** 7 days
- **Eviction:** LRU when quota exceeded
- **Cleanup:** Every 6 hours (automatic)

### L2 (Vercel KV)
- **Popular Structures:** 24 hours (renewable on access)
- **Session Data:** 1 hour
- **Computed Data:** 6 hours
- **Eviction:** Redis LRU with maxmemory-policy
- **Refresh:** On access if TTL < 25% remaining

### L3 (Supabase Storage)
- **PDB Files:** 30 days (renewable on access)
- **User Uploads:** No expiration (user-managed)
- **Simulations:** 30 days
- **Exports:** 7 days (temporary)
- **Cleanup:** Scheduled cleanup job (daily)

## Error Handling & Fallback

### Cache Miss Strategy
```typescript
async function fetchWithCache(pdbId: string): Promise<PDBData> {
  // L1 attempt
  try {
    const l1Data = await l1Cache.get(pdbId);
    if (l1Data) return l1Data;
  } catch (error) {
    console.warn('L1 cache error', error);
  }

  // L2 attempt
  try {
    const l2Data = await l2Cache.get(pdbId);
    if (l2Data) {
      await l1Cache.set(pdbId, l2Data); // Populate L1
      return l2Data;
    }
  } catch (error) {
    console.warn('L2 cache error', error);
  }

  // L3 attempt
  try {
    const l3Data = await l3Cache.get(pdbId);
    if (l3Data) {
      await Promise.all([
        l1Cache.set(pdbId, l3Data),
        l2Cache.set(pdbId, l3Data, { ttl: 86400 })
      ]);
      return l3Data;
    }
  } catch (error) {
    console.warn('L3 cache error', error);
  }

  // Origin fetch (no cache available)
  const originData = await fetchFromOrigin(pdbId);

  // Populate all caches (fire-and-forget)
  Promise.allSettled([
    l1Cache.set(pdbId, originData),
    l2Cache.set(pdbId, originData, { ttl: 86400 }),
    l3Cache.set(pdbId, originData)
  ]);

  return originData;
}
```

### Circuit Breaker Pattern
- If L2 fails 5 times in 60s, skip L2 for 5 minutes
- If L3 fails 3 times in 30s, skip L3 for 2 minutes
- Track error rates with exponential backoff

## Cost Analysis

### Vercel KV (L2)
- **Pricing:** $0.15/GB transferred + $0.30/GB stored
- **Expected Usage:**
  - Storage: 10GB (popular structures)
  - Bandwidth: ~100GB/month
  - **Estimated Cost:** $18/month

### Supabase Storage (L3)
- **Pricing:** $0.021/GB stored + $0.09/GB transferred
- **Expected Usage:**
  - Storage: 500GB (full repository)
  - Bandwidth: ~200GB/month
  - **Estimated Cost:** $28.50/month

**Total Cache Infrastructure Cost:** ~$46.50/month

## Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Combined Hit Rate | 70% | (L1+L2+L3 hits) / total requests |
| L1 Hit Rate | 30% | L1 hits / total requests |
| L2 Hit Rate | 35% | L2 hits / L1 misses |
| L3 Hit Rate | 25% | L3 hits / L2 misses |
| Origin Fetch Rate | 10% | Origin fetches / total requests |
| P50 Latency (L1) | <100ms | 50th percentile |
| P50 Latency (L2) | <50ms | 50th percentile |
| P50 Latency (L3) | <200ms | 50th percentile |
| P99 Latency (All) | <500ms | 99th percentile |

## Monitoring & Metrics

### Key Metrics to Track
1. **Hit Rates:** L1, L2, L3, combined
2. **Latency:** P50, P90, P95, P99 per tier
3. **Error Rates:** Cache failures, timeouts
4. **Storage:** Size per tier, growth rate
5. **Cost:** Bandwidth, storage, requests
6. **Cache Efficiency:** Eviction rate, stale hits

### Monitoring Tools
- **Vercel Analytics:** Edge cache performance
- **Supabase Dashboard:** Storage metrics
- **Custom Metrics API:** Aggregate statistics
- **Sentry:** Error tracking and alerting

## Consequences

### Positive
- **70% cache hit rate** reduces origin load by 7x
- **<50ms edge latency** improves UX globally
- **Cost-effective** scaling ($46.50/month vs CDN costs)
- **Resilient** multi-tier fallback strategy
- **Flexible** TTL policies per data type

### Negative
- **Complexity** increased with multi-tier coordination
- **Stale data** possible with aggressive caching
- **Cost** scales with usage (bandwidth-dependent)
- **Invalidation** across tiers requires coordination

### Risks & Mitigation
| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| L2/L3 downtime | High | Low | Circuit breaker, fallback to origin |
| Cache stampede | Medium | Medium | Distributed locking, jitter on TTL |
| Stale data | Low | Medium | ETags, versioned cache keys |
| Cost overrun | Medium | Low | Budget alerts, tiered limits |

## Implementation Plan

### Phase 1: L2 (Vercel KV) - Week 1
1. Setup Vercel KV project and integration
2. Implement L2 cache service wrapper
3. Add L2 to cache flow middleware
4. Deploy to staging with top 20 PDBs
5. Monitor hit rate and latency

### Phase 2: L3 (Supabase Storage) - Week 2
1. Setup Supabase Storage buckets
2. Implement L3 cache service wrapper
3. Migrate existing PDB files to L3
4. Add L3 to cache flow middleware
5. Deploy cleanup jobs

### Phase 3: Optimization - Week 3
1. Implement cache warming for top 100 PDBs
2. Add distributed locking for cache stampede
3. Tune TTL policies based on metrics
4. Add cost tracking and budget alerts

### Phase 4: Production - Week 4
1. Gradual rollout (10%, 50%, 100%)
2. Monitor all metrics closely
3. Adjust policies based on real usage
4. Document operational procedures

## References
- [Vercel KV Documentation](https://vercel.com/docs/storage/vercel-kv)
- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Cache Patterns (AWS)](https://aws.amazon.com/caching/)
- [Redis Best Practices](https://redis.io/docs/manual/patterns/)

## Related ADRs
- ADR-002: Redis Distributed Rate Limiting
- ADR-003: Cache Invalidation Strategy

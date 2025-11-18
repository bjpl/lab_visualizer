# ADR-003: Multi-Tier Caching Strategy

## Status
Accepted

## Context

The LAB Visualization Platform relies heavily on external data sources that introduce latency and cost concerns:

1. **External Dependencies**:
   - RCSB PDB API: Protein structures (100-500KB per structure)
   - UniProt API: Protein sequences and annotations
   - AlphaFold Database: Predicted structures (500KB-2MB each)
   - ChEMBL: Chemical compound data
   - PubChem: Small molecule information

2. **Performance Issues**:
   - Average PDB API response: 2-5 seconds
   - Mobile networks: 10-30 seconds for large structures
   - API rate limits: 10 requests/second (RCSB PDB)
   - Downstream API failures impact user experience

3. **Cost Concerns**:
   - Vercel bandwidth: $0.15/GB after free tier (100GB/month)
   - External API egress can be rate-limited or costly
   - Storage costs for caching: $0.025/GB/month (Supabase)

4. **User Experience Requirements**:
   - Target: <1s load time for previously viewed structures
   - Target: <3s load time for new structures
   - Offline support for educational environments
   - Collaborate mode: Share cached structures between users

## Decision

We will implement a **3-tier caching strategy** with intelligent invalidation:

### Tier 1: Browser Cache (IndexedDB)
- **Scope**: User's personal cache
- **Storage**: Up to 1GB per domain (browser dependent)
- **TTL**: 30 days (LRU eviction)
- **Use Cases**: Frequently accessed structures, offline mode
- **Performance**: <50ms retrieval time

### Tier 2: Edge Cache (Vercel KV)
- **Scope**: Global edge cache (CDN)
- **Storage**: 1GB total (shared across users)
- **TTL**: 7 days for structures, 1 day for metadata
- **Use Cases**: Popular structures (hemoglobin, insulin, etc.)
- **Performance**: <200ms retrieval time

### Tier 3: Database Cache (Supabase Storage)
- **Scope**: Long-term persistent cache
- **Storage**: 100GB (expandable)
- **TTL**: 90 days (cold storage for rarely accessed data)
- **Use Cases**: Complete structure library, user-uploaded data
- **Performance**: <1s retrieval time

### Cache Flow
```
User Request → IndexedDB (hit: <50ms)
              ↓ (miss)
           Vercel KV (hit: <200ms)
              ↓ (miss)
        Supabase Storage (hit: <1s)
              ↓ (miss)
         External API (2-5s)
              ↓
        Populate all caches
```

### Cache Key Structure
```typescript
interface CacheKey {
  type: 'structure' | 'trajectory' | 'metadata' | 'image';
  id: string; // PDB ID, UniProt ID, etc.
  version: string; // Data version for invalidation
  format: 'pdb' | 'cif' | 'json' | 'dcd';
}

// Example: "structure:1abc:v2:pdb"
```

### Invalidation Strategy
- **Version-based**: Increment version when structure updates
- **TTL-based**: Expire old cache entries automatically
- **Manual**: Admin can purge specific entries or entire cache
- **Smart prefetch**: Preload related structures (e.g., similar proteins)

## Consequences

### Positive
1. **10x Faster Load Times**: 95%+ cache hit rate → <200ms average load
2. **Reduced External API Calls**: 95% reduction → stay within rate limits
3. **Lower Bandwidth Costs**: Cache hit = 0 bandwidth charges
4. **Offline Support**: IndexedDB enables full offline mode
5. **Improved Reliability**: Resilient to external API outages
6. **Better Mobile Experience**: Less data transfer on cellular networks
7. **Collaboration Benefits**: Shared edge cache = faster for all users

### Negative
1. **Storage Costs**: ~$2.50/month for 100GB Supabase storage
2. **Cache Complexity**: Must manage 3 different caching layers
3. **Stale Data Risk**: Cached structures may be outdated
4. **Increased Complexity**: More moving parts = more potential failures
5. **Cache Warming**: Cold start performance for rare structures

### Metrics
- **Expected Cache Hit Rate**: 95% (based on Zipf's law for structure popularity)
- **Average Load Time**: <200ms (cached) vs 3s (uncached)
- **Bandwidth Savings**: 90% reduction ($150/month → $15/month)
- **Storage Cost**: $2.50/month (100GB) + $40/month (Vercel KV)

### Risk Mitigation
- **Stale Data**: Implement versioning and periodic revalidation
- **Cache Stampede**: Use request coalescing for popular structures
- **Storage Limits**: Implement LRU eviction with smart prioritization
- **IndexedDB Quota**: Graceful degradation if user denies storage

## Alternatives Considered

### 1. No Caching (Direct API Calls)
**Rejected**:
- Poor performance (3-5s load times)
- High bandwidth costs ($150+/month)
- Rate limit issues (10 req/s)
- No offline support

### 2. Single-Tier (Supabase Only)
**Rejected**:
- Higher latency than edge cache (1s vs 200ms)
- More expensive bandwidth (Supabase egress)
- No offline support
- Single point of failure

### 3. CDN Only (CloudFront/CloudFlare)
**Rejected**:
- No offline support (requires network)
- Limited control over invalidation
- Cannot cache user-specific data
- Higher bandwidth costs than edge KV

### 4. Service Worker Cache
**Rejected**:
- Limited to HTTP caching semantics
- Cannot cache programmatic API responses efficiently
- No structured query capabilities
- Difficult to manage across sessions

## Implementation Notes

### IndexedDB Schema
```typescript
interface IndexedDBSchema {
  structures: {
    key: string; // CacheKey
    value: Uint8Array; // Compressed structure data
    metadata: {
      size: number;
      lastAccessed: Date;
      accessCount: number;
    };
  };
  trajectories: {
    key: string;
    value: Uint8Array;
    metadata: { /* ... */ };
  };
}
```

### Vercel KV (Redis)
```typescript
// Edge function caching
export default async function handler(req: Request) {
  const cacheKey = `structure:${pdbId}:v${version}:pdb`;

  // Try edge cache first
  const cached = await kv.get(cacheKey);
  if (cached) return new Response(cached, {
    headers: { 'X-Cache': 'HIT' }
  });

  // Fetch from Supabase or external API
  const data = await fetchStructure(pdbId);

  // Populate edge cache
  await kv.set(cacheKey, data, { ex: 7 * 24 * 60 * 60 }); // 7 days

  return new Response(data, {
    headers: { 'X-Cache': 'MISS' }
  });
}
```

### Supabase Storage
```typescript
// Long-term storage with metadata
const { data, error } = await supabase
  .storage
  .from('structures')
  .upload(`${pdbId}/${version}.pdb`, fileData, {
    cacheControl: '7776000', // 90 days
    contentType: 'chemical/x-pdb',
    upsert: true
  });
```

### Smart Prefetching
```typescript
// Preload related structures
async function prefetchRelated(pdbId: string) {
  const related = await getRelatedStructures(pdbId); // Similar proteins

  // Prefetch top 3 related structures
  for (const id of related.slice(0, 3)) {
    fetch(`/api/structures/${id}`, { priority: 'low' })
      .then(res => res.arrayBuffer())
      .then(data => cacheInIndexedDB(id, data));
  }
}
```

### Cache Warming Strategy
- Preload top 100 most popular structures on deployment
- Scheduled job: Refresh edge cache every 6 hours for popular entries
- User behavior: Prefetch structures from search results

### Monitoring
```typescript
interface CacheMetrics {
  hits: number;
  misses: number;
  hitRate: number; // hits / (hits + misses)
  avgHitLatency: number; // milliseconds
  avgMissLatency: number; // milliseconds
  storageUsed: number; // bytes
}

// Log cache metrics for optimization
await logCacheMetrics({
  tier: 'indexeddb',
  hits: 950,
  misses: 50,
  hitRate: 0.95,
  avgHitLatency: 45,
  avgMissLatency: 2500
});
```

## References
- IndexedDB API: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
- Vercel KV: https://vercel.com/docs/storage/vercel-kv
- Supabase Storage: https://supabase.com/docs/guides/storage
- Technical Analysis: `/docs/analysis/technical-analysis.md`
- Performance Budget: `/docs/adrs/006-performance-budgets.md`

# Multi-Tier Cache System Implementation

## Overview

This implementation provides a comprehensive multi-tier caching system with three levels:

- **L1 (IndexedDB)**: Browser-side cache for instant access (30% target hit rate, <100ms latency)
- **L2 (Vercel KV)**: Edge cache with Redis-compatible interface (70% target hit rate, <500ms latency)
- **L3 (Supabase Storage)**: Long-term storage for large objects (90% combined hit rate, <2s latency)

## Architecture

```
┌──────────────┐
│   Request    │
└──────┬───────┘
       │
       ▼
┌──────────────┐    Hit
│  L1 Cache    │───────────► Return Data
│ (IndexedDB)  │
└──────┬───────┘
       │ Miss
       ▼
┌──────────────┐    Hit
│  L2 Cache    │───────────► Return Data + Backfill L1
│ (Vercel KV)  │
└──────┬───────┘
       │ Miss
       ▼
┌──────────────┐    Hit
│  L3 Cache    │───────────► Return Data + Backfill L1 & L2
│  (Supabase)  │
└──────┬───────┘
       │ Miss
       ▼
┌──────────────┐
│Fetch from    │
│   Origin     │───────────► Store in L1, L2, L3
└──────────────┘
```

## Features

### L2 Cache (Vercel KV)
- Connection pooling for efficient resource usage
- Retry logic with exponential backoff
- Rate limiting (100 req/s, 10 concurrent)
- Smart key strategies
- Compression support
- Health monitoring

### L3 Cache (Supabase Storage)
- Automatic compression for molecular data
- Large object support (>500MB)
- Intelligent storage paths (type/date/key)
- Browser-native compression (gzip)
- Automatic L2→L3 fallback

### Cache Manager
- Multi-level lookup orchestration
- Automatic backfilling to lower tiers
- Performance metrics collection
- Health checks across all tiers
- Prefetch support for cache warming

## Usage

### Basic Usage

```typescript
import { getCacheManager } from '@/services/cache';

const cacheManager = getCacheManager();

// Simple get/set
const data = await cacheManager.get<MyData>('my-key');

if (!data.data) {
  const freshData = await fetchFromAPI();
  await cacheManager.set('my-key', freshData, { ttl: 3600 });
}
```

### Fetch with Auto-Caching

```typescript
import { getCacheManager } from '@/services/cache';
import { CACHE_KEY_PATTERNS, CACHE_TTL } from '@/config/cache.config';

const cacheManager = getCacheManager();

// Automatically cache with smart fallback
const pdbData = await cacheManager.fetchWithCache(
  CACHE_KEY_PATTERNS.pdb('1abc'),
  async () => {
    const response = await fetch('/api/pdb/1abc');
    return response.json();
  },
  {
    ttl: CACHE_TTL.long,
    tags: ['pdb', 'molecular'],
  }
);
```

### Specific Tier Access

```typescript
// Only check L2 cache
const result = await cacheManager.get<Data>('key', { tier: 'l2' });

// Only store in L1
await cacheManager.set('key', data, { tier: 'l1' });
```

### Cache Invalidation

```typescript
// Invalidate across all tiers
await cacheManager.invalidate('my-key');

// Clear all caches
await cacheManager.clearAll();
```

### Prefetching

```typescript
import { POPULAR_PDB_IDS } from '@/data/popular-structures';

// Warm cache with popular structures
await cacheManager.prefetch(
  POPULAR_PDB_IDS.map(id => CACHE_KEY_PATTERNS.pdb(id)),
  async (key) => {
    const pdbId = key.split(':')[1];
    return fetchPDBData(pdbId);
  }
);
```

### Metrics and Monitoring

```typescript
// Get comprehensive metrics
const metrics = await cacheManager.getMetrics();

console.log('Cache Performance:', {
  l1HitRate: metrics.l1.hitRate,
  l2HitRate: metrics.l2.hitRate,
  l3HitRate: metrics.l3.hitRate,
  combinedHitRate: metrics.overall.combinedHitRate,
  avgLatency: metrics.overall.avgLatency,
});

// Health check
const health = await cacheManager.healthCheck();
console.log('Cache Health:', health); // { l1: true, l2: true, l3: true }
```

## Configuration

### Environment Variables

Create a `.env.local` file with the following:

```bash
# Vercel KV (L2 Cache)
KV_REST_API_URL=https://your-kv-instance.upstash.io
KV_REST_API_TOKEN=your-kv-token

# Supabase (L3 Cache)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Optional: Disable specific tiers
NEXT_PUBLIC_DISABLE_L2_CACHE=false
NEXT_PUBLIC_DISABLE_L3_CACHE=false
NEXT_PUBLIC_CACHE_METRICS=true
```

### Programmatic Configuration

```typescript
import { DEFAULT_CACHE_CONFIG } from '@/config/cache.config';

// Customize TTL
DEFAULT_CACHE_CONFIG.tiers.l2.ttl = 7200; // 2 hours

// Disable compression
DEFAULT_CACHE_CONFIG.tiers.l3.compressionEnabled = false;

// Change fallback strategy
DEFAULT_CACHE_CONFIG.fallbackStrategy = 'parallel'; // Not recommended
```

## Key Patterns

Use predefined patterns for consistency:

```typescript
import { CACHE_KEY_PATTERNS } from '@/config/cache.config';

// PDB structures
const key = CACHE_KEY_PATTERNS.pdb('1abc');
// Result: "pdb:1abc"

// Molecular data
const key = CACHE_KEY_PATTERNS.molecular('mol123', 'protein');
// Result: "molecular:protein:mol123"

// Simulation frames
const key = CACHE_KEY_PATTERNS.simulation('sim456', 100);
// Result: "sim:sim456:frame:100"

// Analysis results
const key = CACHE_KEY_PATTERNS.analysis('res789', 'energy');
// Result: "analysis:energy:res789"
```

## Performance Targets

| Tier | Target Hit Rate | Max Latency | Use Case |
|------|----------------|-------------|----------|
| L1   | 30%            | <100ms      | Frequently accessed, small data |
| L2   | 70%            | <500ms      | Popular structures, shared across users |
| L3   | 90%            | <2s         | Large molecular data, trajectories |

## Best Practices

### 1. Use Appropriate TTLs

```typescript
import { CACHE_TTL } from '@/config/cache.config';

// Short-lived: Real-time collaboration data
await cache.set(key, data, { ttl: CACHE_TTL.short }); // 5 min

// Medium: PDB structures, analysis results
await cache.set(key, data, { ttl: CACHE_TTL.medium }); // 1 hour

// Long: Static molecular data
await cache.set(key, data, { ttl: CACHE_TTL.long }); // 24 hours

// Permanent: Reference data
await cache.set(key, data, { ttl: CACHE_TTL.permanent }); // 30 days
```

### 2. Tag Related Data

```typescript
// Tag for bulk invalidation
await cache.set('analysis:123', data, {
  tags: ['analysis', 'user:456', 'project:789']
});

// Later: Invalidate all analysis data
// (Note: Pattern invalidation not yet implemented)
```

### 3. Handle Errors Gracefully

```typescript
import { CacheError } from '@/services/cache';

try {
  const data = await cache.get('key');
} catch (error) {
  if (error instanceof CacheError) {
    console.error(`Cache error in ${error.tier}:`, error.message);
    // Fallback to origin
  }
}
```

### 4. Monitor Performance

```typescript
// Set up periodic metrics collection
setInterval(async () => {
  const metrics = await cacheManager.getMetrics();

  if (metrics.l2.hitRate < 0.7) {
    console.warn('L2 hit rate below target:', metrics.l2.hitRate);
  }

  if (metrics.overall.avgLatency > 500) {
    console.warn('Average latency exceeds 500ms:', metrics.overall.avgLatency);
  }
}, 60000); // Every minute
```

## Migration from Existing Cache

The new multi-tier cache is backward compatible with the existing `CacheService`:

```typescript
// Old code (still works)
import { getCacheService } from '@/lib/cache/cache-service';
const cache = getCacheService();
await cache.fetchPDB('1abc');

// New code (recommended)
import { getCacheManager } from '@/services/cache';
const cache = getCacheManager();
await cache.fetchWithCache(
  'pdb:1abc',
  () => fetchPDBData('1abc'),
  { ttl: 3600 }
);
```

## Troubleshooting

### L2 Cache Not Working

1. Check environment variables:
   ```bash
   echo $KV_REST_API_URL
   echo $KV_REST_API_TOKEN
   ```

2. Verify Vercel KV is provisioned:
   ```bash
   vercel env pull
   ```

3. Check health:
   ```typescript
   const health = await cacheManager.healthCheck();
   console.log('L2 Health:', health.l2);
   ```

### L3 Cache Errors

1. Verify Supabase credentials:
   ```typescript
   import { createClient } from '@/lib/supabase/client';
   const supabase = createClient();
   // Should not throw
   ```

2. Check bucket permissions in Supabase dashboard

3. Verify storage quota

### High Latency

1. Check metrics to identify slow tier:
   ```typescript
   const metrics = await cacheManager.getMetrics();
   console.log('L1:', metrics.l1.avgLatency);
   console.log('L2:', metrics.l2.avgLatency);
   console.log('L3:', metrics.l3.avgLatency);
   ```

2. Consider increasing L1/L2 TTLs for frequently accessed data

3. Use prefetching for predictable access patterns

## API Reference

### CacheManager

#### Methods

- `get<T>(key: string, options?: CacheOptions): Promise<CacheResult<T>>`
- `set<T>(key: string, value: T, options?: CacheOptions): Promise<void>`
- `fetchWithCache<T>(key: string, fetcher: () => Promise<T>, options?: CacheOptions): Promise<T>`
- `invalidate(key: string): Promise<void>`
- `clearAll(): Promise<void>`
- `getMetrics(): Promise<CacheMetrics>`
- `healthCheck(): Promise<{ l1: boolean; l2: boolean; l3: boolean }>`
- `prefetch(keys: string[], fetcher: (key: string) => Promise<any>): Promise<void>`

### CacheOptions

```typescript
interface CacheOptions {
  ttl?: number;           // Time to live in seconds
  tags?: string[];        // Tags for grouping
  forceRefresh?: boolean; // Skip cache, fetch fresh
  compression?: boolean;  // Enable compression (L2/L3)
  tier?: 'l1' | 'l2' | 'l3' | 'all'; // Target specific tier
}
```

### CacheResult

```typescript
interface CacheResult<T> {
  data: T | null;
  metadata?: CacheMetadata;
  source: 'l1' | 'l2' | 'l3' | 'origin' | 'miss';
  latency: number;
}
```

## Implementation Notes

### Stored in Memory: `swarm/backend/cache-implementation`

**Architecture Decisions:**
- Sequential fallback strategy (L1→L2→L3) chosen over parallel for efficiency
- Automatic backfilling ensures lower tiers are populated on higher tier hits
- Connection pooling in L2 prevents resource exhaustion
- Browser-native compression in L3 (no external dependencies)
- Mock clients for development without cloud services

**Performance Optimizations:**
- L1 uses IndexedDB for zero-network latency
- L2 implements retry logic with exponential backoff
- L3 uses organized storage paths (type/date/key) for efficient retrieval
- Metrics collection with rolling window (last 1000 requests)

**Error Handling:**
- Graceful degradation: If L2 fails, fall back to L3
- Non-blocking writes: Cache failures don't block application
- Health checks for proactive monitoring
- Detailed error logging for debugging

**Security Considerations:**
- KV tokens stored in environment variables only
- Supabase bucket is private by default
- No sensitive data in cache keys
- TTL enforcement prevents stale data exposure

## Future Enhancements

1. **Pattern Invalidation**: Invalidate by regex or tag
2. **Distributed Locking**: Prevent cache stampede
3. **Batch Operations**: Bulk get/set for efficiency
4. **Smart Eviction**: LRU/LFU policies for L1
5. **Compression Levels**: Dynamic based on data type
6. **Cache Warming Strategies**: Predictive prefetching
7. **Real-time Metrics Dashboard**: Live performance monitoring
8. **A/B Testing**: Compare different caching strategies

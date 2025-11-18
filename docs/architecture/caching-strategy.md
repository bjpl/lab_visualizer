# Caching Strategy - LAB Visualization Platform

## Overview

Multi-tier caching architecture optimized for 3D molecular visualization with target 30% L1 hit rate and <100ms latency.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Application                      │
├─────────────────────────────────────────────────────────────┤
│  React Query         │  Zustand Store    │  React Hooks     │
│  - Server state      │  - UI state       │  - useCachedPDB  │
│  - Optimistic UI     │  - 3D state       │  - useCacheStats │
│  - Retry logic       │  - Collaboration  │  - usePrefetch   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Cache Service                           │
│  - Unified API                                               │
│  - Multi-tier orchestration                                  │
│  - Metrics collection                                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  L1: Browser (IndexedDB) - 500MB, 7-day TTL                 │
│  ├── PDB Files Store                                         │
│  ├── Computed Data Store                                     │
│  └── Metadata Store (hit/miss tracking)                      │
└─────────────────────────────────────────────────────────────┘
                              │ (miss)
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  L2: Edge Cache (Cloudflare Workers) - Global CDN           │
│  - Regional caching                                          │
│  - Smart routing                                             │
│  - DDoS protection                                           │
└─────────────────────────────────────────────────────────────┘
                              │ (miss)
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  L3: Storage (Supabase) - Persistent storage                │
│  - PostgreSQL for metadata                                   │
│  - Storage buckets for files                                 │
│  - Server-side caching                                       │
└─────────────────────────────────────────────────────────────┘
```

## L1 Cache (IndexedDB)

### Configuration
- **Quota**: 500MB maximum
- **TTL**: 7 days automatic expiration
- **Eviction**: LRU (Least Recently Used)
- **Stores**:
  - `pdb-files`: Molecular structure files
  - `computed-data`: Analysis results, trajectories
  - `metadata`: Cache statistics

### Key Features
- Type-safe TypeScript API
- Automatic quota management
- Access tracking for LRU eviction
- Hit/miss rate metrics
- Background cleanup every 6 hours

### Usage Example
```typescript
import { getCache } from '@/lib/cache/indexeddb';

const cache = getCache();

// Store PDB file
await cache.cachePDB('1abc', {
  content: pdbString,
  metadata: { title: 'Example', resolution: 2.0 }
});

// Retrieve PDB file
const data = await cache.getPDB('1abc');

// Get statistics
const stats = await cache.getStats();
console.log(`Hit rate: ${(await cache.getHitRate() * 100).toFixed(1)}%`);
```

## Cache Service

### Unified API
Single interface for all caching operations with automatic tier fallback:

```typescript
import { getCacheService } from '@/lib/cache/cache-service';

const service = getCacheService();

// Fetch with automatic caching
const data = await service.fetchPDB('1abc', {
  useL1: true,
  useL2: true,
  forceRefresh: false
});

// Generic caching
const result = await service.fetchWithCache(
  'analysis:1abc',
  () => performAnalysis('1abc'),
  { ttl: 3600000, tags: ['analysis'] }
);
```

### Features
- Cache-first strategy
- Automatic tier fallback
- Latency tracking
- Batch prefetching
- Invalidation API

## State Management (Zustand)

### Store Architecture
```typescript
// Main store combines slices
export const useAppStore = create<AppState>()(
  devtools(
    persist(
      immer((...a) => ({
        ...createVisualizationSlice(...a),
        ...createCollaborationSlice(...a),
        ...createSimulationSlice(...a),
        ...createUISlice(...a),
      })),
      { name: 'lab-visualizer-storage' }
    )
  )
);
```

### Slices

#### 1. Visualization Slice
Manages 3D viewer state:
- Loaded structure
- Representation style (cartoon, ball-and-stick, etc.)
- Color scheme
- Selection state
- Camera position

```typescript
const { structure, setRepresentation, setCamera } = useVisualization();
```

#### 2. Collaboration Slice
Real-time collaboration state:
- Active session
- Connected users
- Cursor positions
- Action history

```typescript
const { session, users, broadcastAction } = useCollaboration();
```

#### 3. Simulation Slice
Job management:
- Active jobs
- Job status tracking
- Results storage

```typescript
const { jobs, createJob, updateJob } = useSimulation();
```

#### 4. UI Slice
Global UI state:
- Sidebar visibility
- Theme (light/dark/system)
- Loading states
- Notifications

```typescript
const { theme, setTheme, addNotification } = useUI();
```

## React Query Integration

### Hooks for Cached Data

#### useCachedPDB
```typescript
const { data, isLoading, error } = useCachedPDB('1abc', {
  staleTime: 7 * 24 * 60 * 60 * 1000, // 7 days
  retry: 2
});
```

#### useCacheStats
```typescript
const { data: stats } = useCacheStats();
// { l1HitRate: 0.35, l1Size: 52428800, avgLatency: 45 }
```

#### useCacheInvalidation
```typescript
const { invalidatePDB, clearAll } = useCacheInvalidation();

await invalidatePDB('1abc');
await clearAll();
```

#### useCacheWarming
```typescript
// Prefetch on mount
useCacheWarming(['1abc', '2xyz', '3def'], true);
```

## Performance Targets

### L1 Cache (IndexedDB)
- **Hit Rate**: 30%+ target
- **Latency**: <100ms for cache hits
- **Capacity**: 500MB quota
- **TTL**: 7 days

### L2 Cache (Edge)
- **Hit Rate**: 60%+ target
- **Latency**: <200ms global
- **Coverage**: Multi-region CDN

### L3 Storage
- **Latency**: <500ms database query
- **Throughput**: 1000+ req/sec

## Metrics & Monitoring

### Tracked Metrics
```typescript
interface CacheMetrics {
  hitRate: number;           // % of requests served from cache
  avgLatency: number;        // Average response time (ms)
  totalSize: number;         // Cache size in bytes
  entryCount: number;        // Number of cached entries
  evictionCount: number;     // LRU evictions
  quotaUsage: number;        // % of quota used
}
```

### Dashboard Integration
```typescript
const stats = await cacheService.getStats();

// Display in UI
<CacheStatsDashboard
  hitRate={stats.l1HitRate}
  size={formatBytes(stats.l1Size)}
  latency={stats.avgLatency.toFixed(0)}
/>
```

## Cache Warming Strategy

### Initial Load
```typescript
// Warm cache with common structures on app load
const popularPDBs = ['1abc', '2xyz', '3def'];
await cacheService.prefetchPDBs(popularPDBs);
```

### Background Warming
```typescript
// Continuously warm cache based on usage patterns
setInterval(async () => {
  const trending = await fetchTrendingStructures();
  await cacheService.prefetchPDBs(trending);
}, 3600000); // Every hour
```

### User-Driven
```typescript
// Prefetch related structures
const relatedStructures = findRelatedPDBs(currentPDB);
await cacheService.prefetchPDBs(relatedStructures);
```

## Invalidation Strategy

### Time-Based (TTL)
- Automatic expiration after 7 days
- Background cleanup every 6 hours

### Manual Invalidation
```typescript
// Invalidate specific entry
await cacheService.invalidate('pdb:1abc');

// Invalidate by pattern
await cacheService.invalidatePattern(/^analysis:/);

// Clear all caches
await cacheService.clearAll();
```

### Event-Driven
```typescript
// Invalidate on structure update
eventBus.on('structure:updated', async (pdbId) => {
  await cacheService.invalidate(`pdb:${pdbId}`);
});
```

## Best Practices

### 1. Cache Keys
Use consistent, descriptive keys:
```typescript
// Good
'pdb:1abc'
'analysis:1abc:rmsd'
'trajectory:1abc:frame-100'

// Bad
'data1'
'temp'
'xyz'
```

### 2. Size Management
Monitor quota usage:
```typescript
const stats = await cache.getStats();
const quotaPercent = (stats.totalSize / (500 * 1024 * 1024)) * 100;

if (quotaPercent > 90) {
  console.warn('Cache quota approaching limit');
  await cache.cleanup();
}
```

### 3. Error Handling
Always handle cache failures gracefully:
```typescript
try {
  const data = await cache.getPDB(pdbId);
  if (!data) {
    // Cache miss - fetch from server
    data = await fetchFromServer(pdbId);
  }
} catch (error) {
  // Cache error - fallback to direct fetch
  console.error('Cache error:', error);
  data = await fetchFromServer(pdbId);
}
```

### 4. Selective Caching
Don't cache everything:
```typescript
// Cache large, static data
await cache.cachePDB(pdbId, pdbData); // ✓

// Don't cache user-specific, real-time data
// User cursor positions, live notifications ✗
```

## Testing

### Unit Tests
```typescript
import { IndexedDBCache } from '@/lib/cache/indexeddb';

describe('IndexedDBCache', () => {
  it('should cache and retrieve PDB files', async () => {
    const cache = new IndexedDBCache();
    await cache.cachePDB('1abc', testData);
    const retrieved = await cache.getPDB('1abc');
    expect(retrieved).toEqual(testData);
  });

  it('should respect TTL', async () => {
    // Mock time to test expiration
  });

  it('should evict LRU entries when quota exceeded', async () => {
    // Test quota management
  });
});
```

### Integration Tests
```typescript
describe('Cache Service Integration', () => {
  it('should fetch from L1 → L2 → L3', async () => {
    // Test tier fallback
  });

  it('should track hit rate accurately', async () => {
    // Test metrics
  });
});
```

## Future Enhancements

### Phase 2
- [ ] ServiceWorker integration for offline support
- [ ] Compression for cached data (gzip/brotli)
- [ ] Smart prefetching based on ML predictions
- [ ] Cross-tab synchronization

### Phase 3
- [ ] Distributed cache coordination (multi-device)
- [ ] P2P cache sharing (WebRTC)
- [ ] Advanced analytics dashboard
- [ ] Custom eviction policies per data type

## References

- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)
- [React Query Guide](https://tanstack.com/query/latest)
- [Cache-First Strategy](https://web.dev/offline-cookbook/)

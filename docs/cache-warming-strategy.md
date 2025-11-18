# Cache Warming Strategy & Performance Metrics

## Overview

Intelligent cache warming system for the LAB Visualization Platform that prefetches protein structures in the background to improve user experience and reduce latency.

## Architecture

### Components

1. **Cache Strategy Engine** (`/src/lib/cache-strategy.ts`)
   - Scoring algorithm with multi-factor weighting
   - Adaptive strategy adjustment
   - Budget management (500MB constraint)
   - Health monitoring and recommendations

2. **Cache Warming Service** (`/src/services/cache-warming.ts`)
   - Priority queue management
   - Concurrent fetching (5 simultaneous downloads)
   - Network-aware prefetching
   - Progress tracking and event emission
   - Retry logic with exponential backoff

3. **Background Worker** (`/src/workers/cache-worker.ts`)
   - Non-blocking Web Worker execution
   - Message-based communication
   - Cancellation support
   - Independent from main thread

4. **React Hooks** (`/src/hooks/use-cache-warming.ts`)
   - `useCacheWarming()` - Main control hook
   - `useCacheProgress()` - Progress monitoring
   - `useCacheHealth()` - Health metrics
   - `useAutoWarm()` - Automatic warming on mount
   - `useCacheSettings()` - User preferences

5. **Admin Panel** (`/src/components/admin/CacheWarmingPanel.tsx`)
   - Real-time monitoring dashboard
   - Manual controls (start/pause/cancel/clear)
   - Settings configuration
   - Health visualization

## Scoring Algorithm

### Multi-Factor Scoring

Each structure receives a composite score based on three factors:

```typescript
score = (popularity × 0.5) + (recency × 0.3) + (relevance × 0.2)
```

### Factors

#### 1. Popularity (Weight: 0.5)
- **Educational Structures**: Pre-loaded top 20 structures (1HHO, 2LYZ, etc.)
- **Initial Score**: 1.0 for most popular, decaying to 0.5 for 20th
- **Dynamic Updates**: Increments by 0.1 on each access
- **Maximum**: Capped at 1.0

**Top Educational Structures:**
- 1HHO (Hemoglobin)
- 2DHB (Deoxyhemoglobin)
- 1MBO (Myoglobin)
- 2LYZ (Lysozyme)
- 4HHB (Hemoglobin variant)
- 1CRN (Crambin)
- 1UBQ (Ubiquitin)
- 1GFL (Green Fluorescent Protein)
- 1BNA (DNA double helix)
- 1TIM (Triose phosphate isomerase)
- ...and 10 more

#### 2. Recency (Weight: 0.3)
- **History Tracking**: Last 10 accessed structures
- **Exponential Decay**: score = e^(-index/3)
- **Most Recent**: Gets score of 1.0
- **4th Most Recent**: Gets ~0.26
- **10th Most Recent**: Gets ~0.04

#### 3. Relevance (Weight: 0.2)
- **Family Relationships**: Same protein family
- **Complex Relationships**: Part of same molecular complex
- **Scoring**: 0.5 per relationship match
- **Context**: Based on 5 most recent accesses

### Adaptive Adjustment

The system automatically adjusts weights based on performance:

```typescript
if (hitRate < target) {
  // Underperforming - increase popularity
  popularWeight += 0.1  // max 0.7
  recencyWeight -= 0.05  // min 0.2
}

if (hitRate > target + 0.1) {
  // Over-performing - optimize for user behavior
  recencyWeight += 0.05  // max 0.4
  popularWeight -= 0.05  // min 0.4
}

// Normalize to sum to 1.0
```

## Budget Management

### Constraints

- **Maximum Cache Size**: 500MB (configurable)
- **Structure Selection**: Knapsack algorithm
- **Priority Order**: Highest score first
- **Size Tracking**: Cumulative size check
- **Early Termination**: Stop at 30 structures or budget exhausted

### Algorithm

```typescript
selected = []
totalSize = 0

for structure in sortedByScore:
  if totalSize + structure.size <= maxSize:
    selected.push(structure)
    totalSize += structure.size

  if selected.length >= 30:
    break
```

## Performance Targets

### Baseline (Before Cache Warming)
- **Hit Rate**: 30%
- **Avg Load Time**: 1000-1500ms
- **Cold Start**: 2000-3000ms
- **Network Bandwidth**: Variable per request

### Target (After Cache Warming)
- **Hit Rate**: 50%+ (67% improvement)
- **Avg Load Time**: 300-500ms (70% reduction)
- **Warm Start**: 100-200ms (93% reduction)
- **Initial Bandwidth**: <50MB (one-time)
- **Warming Time**: <30s background

### Projected Impact

```
Scenario: 100 structure requests/day

Before:
- Cache hits: 30
- Cache misses: 70
- Total load time: 100 × 1000ms = 100s

After:
- Cache hits: 50
- Cache misses: 50
- Hit load time: 50 × 200ms = 10s
- Miss load time: 50 × 1000ms = 50s
- Total load time: 60s

Savings: 40s/day = 40% time reduction
```

## Network Awareness

### Connection Quality Detection

```typescript
// Check effective connection type
if (connection.effectiveType === 'slow-2g' || effectiveType === '2g') {
  skipPrefetch()
}

// Respect data saver mode
if (connection.saveData) {
  skipPrefetch()
}
```

### Bandwidth Management

- **Max Concurrent**: 5 downloads (configurable)
- **Per-structure Size**: ~2MB average
- **Total Initial**: 20 structures × 2MB = ~40MB
- **Background Priority**: Low priority fetch hints
- **Throttling**: Respects browser connection limits

## User Preferences

### Settings

```typescript
{
  enabled: true,              // Master toggle
  maxConcurrent: 5,           // 1-10 downloads
  maxSize: 500MB,             // 100MB-1GB
  strategies: [               // Active strategies
    'popular',
    'recent',
    'related'
  ],
  networkAware: true,         // Skip on slow connections
  respectUserPrefs: true      // Check localStorage
}
```

### Opt-out

Users can disable via:
- Admin panel toggle
- localStorage: `cacheWarming = 'disabled'`
- Network settings (data saver)

## Health Monitoring

### Metrics

1. **Hit Rate**: `cacheHits / totalRequests`
2. **Effectiveness**:
   - Poor: <30%
   - Good: 30-50%
   - Excellent: >50%
3. **Average Load Time**: Mean of all requests
4. **Bytes Downloaded**: Total prefetched data
5. **Warming Time**: Duration of prefetch session

### Recommendations

**Poor Performance (<30% hit rate):**
- "Increase popular structure weight"
- "Enable more aggressive prefetching"
- "Consider increasing cache size budget"

**Good Performance (30-50% hit rate):**
- "Monitor user patterns for optimization"
- "Current strategy is adequate"

**Excellent Performance (>50% hit rate):**
- "Current strategy is performing well"
- "Consider reducing prefetch frequency"

## Analytics & Optimization

### Tracked Events

```typescript
// Cache warming events
analytics.track('cache_warming_started', {
  structureCount: 20,
  estimatedSize: '40MB'
})

analytics.track('cache_warming_completed', {
  duration: 28000,
  succeeded: 18,
  failed: 2,
  bytesDownloaded: 38400000
})

// Cache hit events
analytics.track('cache_hit', {
  pdbId: '1HHO',
  loadTime: 150,
  source: 'indexeddb'
})

analytics.track('cache_miss', {
  pdbId: '3XYZ',
  loadTime: 1200,
  source: 'network'
})
```

### A/B Testing

Test different strategies:
- **Control**: No warming
- **Variant A**: Popular only (weight: 1.0, 0, 0)
- **Variant B**: Balanced (weight: 0.5, 0.3, 0.2)
- **Variant C**: User-focused (weight: 0.3, 0.5, 0.2)

Measure impact on:
- Hit rate improvement
- Time saved per user
- Bandwidth consumption
- User satisfaction scores

## Integration Example

### Basic Usage

```typescript
import { useCacheWarming } from '@/hooks/use-cache-warming';

function App() {
  const { start, isActive, progress } = useCacheWarming({
    enabled: true,
    maxConcurrent: 5,
  });

  useEffect(() => {
    // Start warming on mount
    start();
  }, [start]);

  return (
    <div>
      {isActive && (
        <ProgressBar
          value={progress.completed}
          max={progress.total}
        />
      )}
    </div>
  );
}
```

### Auto-warming

```typescript
import { useAutoWarm } from '@/hooks/use-cache-warming';

function App() {
  // Automatically starts warming 1s after mount
  const { isActive, progress } = useAutoWarm();

  return <YourApp />;
}
```

### Admin Dashboard

```typescript
import CacheWarmingPanel from '@/components/admin/CacheWarmingPanel';

function AdminPage() {
  return (
    <div>
      <h1>Cache Management</h1>
      <CacheWarmingPanel />
    </div>
  );
}
```

## Testing

### Unit Tests

```bash
npm test tests/cache-warming.test.ts
```

**Coverage:**
- Score calculation (popularity, recency, relevance)
- Structure selection (budget, filtering)
- Adaptive strategy adjustment
- Service lifecycle (start, pause, resume, cancel)
- Progress tracking
- Error handling and retries
- Network awareness

### Performance Tests

```typescript
// Measure warming speed
const start = Date.now();
await service.start();
const duration = Date.now() - start;
expect(duration).toBeLessThan(30000); // <30s

// Measure hit rate improvement
const beforeHitRate = 0.30;
// ... warm cache ...
const afterHitRate = strategy.getStats().hitRate;
expect(afterHitRate).toBeGreaterThan(0.50);
```

## Deployment Checklist

- [ ] Strategy engine implemented and tested
- [ ] Warming service with priority queue
- [ ] Background worker non-blocking
- [ ] React hooks functional
- [ ] Admin panel with controls
- [ ] Test suite passing (>90% coverage)
- [ ] Analytics events integrated
- [ ] User preferences respected
- [ ] Network awareness enabled
- [ ] Documentation complete
- [ ] Performance targets validated

## Future Enhancements

1. **Machine Learning**
   - Predict user's next structure request
   - Personalized warming strategies
   - Temporal pattern recognition

2. **Collaborative Filtering**
   - "Users who viewed X also viewed Y"
   - Cross-user pattern learning
   - Educational cohort optimization

3. **Predictive Prefetching**
   - Prefetch on hover intent
   - Navigation pattern analysis
   - Time-of-day optimization

4. **Advanced Compression**
   - Structure data compression
   - Delta encoding for related structures
   - Client-side decompression

5. **Service Worker Integration**
   - Offline support
   - Background sync
   - Push notifications for cache updates

## Support

For issues or questions:
- GitHub Issues: [repo]/issues
- Documentation: /docs/cache-warming-strategy.md
- Admin Panel: Access via dashboard

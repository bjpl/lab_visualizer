# Cache & Rate Limiting Integration Architecture

## Overview

This document describes the integration architecture for the multi-tier cache strategy (L1/L2/L3) and Redis-based distributed rate limiting system for the lab_visualizer application.

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                           Client (Browser)                          │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ L1 Cache: IndexedDB (500MB, 7d TTL, LRU)                     │  │
│  │ • PDB files, computed data, simulation frames                │  │
│  │ • 30% hit rate, <100ms latency                               │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────────┘
                             │ HTTPS
                             ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    Vercel Edge Network (Global)                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Next.js Middleware (Rate Limiting + Routing)                 │  │
│  │ • IP/User identification                                     │  │
│  │ • Rate limit check (Redis)                                   │  │
│  │ • Add X-RateLimit-* headers                                  │  │
│  │ • Circuit breaker for Redis failures                         │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                             ↓                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ L2 Cache: Vercel KV (Redis) - 10GB, 24h TTL                 │  │
│  │ • Popular structures (top 100)                               │  │
│  │ • Recent fetches, metadata, geometry                         │  │
│  │ • 35% additional hit rate, <50ms latency                     │  │
│  │ • Sliding window rate limit counters                         │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────────┐
│                   API Routes (Serverless Functions)                 │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Cache Middleware Pipeline                                    │  │
│  │ 1. Check L2 cache (Vercel KV)                               │  │
│  │ 2. Check L3 cache (Supabase Storage)                        │  │
│  │ 3. Fetch from origin (RCSB PDB)                             │  │
│  │ 4. Populate caches (L3 → L2 → L1)                           │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────────┐
│              L3 Cache: Supabase Storage (S3-compatible)             │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Buckets:                                                     │  │
│  │ • pdb-files: Raw PDB structures (30d TTL)                   │  │
│  │ • processed: Metadata, LOD geometry (permanent)              │  │
│  │ • user-uploads: User-submitted structures (no expiration)    │  │
│  │ • simulations: MD trajectories (30d TTL)                     │  │
│  │ • exports: PDF, images, exports (7d TTL)                     │  │
│  │ 25% additional hit rate, <200ms latency                      │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    Origin APIs (External)                           │
│  • RCSB PDB API (protein structures)                                │
│  • AlphaFold DB (predicted structures)                              │
│  • User uploads (authenticated)                                     │
│  ~10% of total requests (cache miss fallback)                       │
└─────────────────────────────────────────────────────────────────────┘
```

## Data Flow Sequence

### 1. User Request Flow with Cache & Rate Limiting

```
1. User requests PDB structure (e.g., GET /api/structures/1HHO)
   ↓
2. Browser checks L1 cache (IndexedDB)
   • HIT (30%) → Return immediately (<100ms)
   • MISS (70%) → Continue to server
   ↓
3. Request reaches Vercel Edge Network
   ↓
4. Next.js Middleware executes:
   a. Extract user/IP identifier
   b. Check rate limit via Vercel KV (Redis)
      • ALLOWED → Continue (add headers)
      • BLOCKED → Return 429 Too Many Requests
   ↓
5. Request routed to API handler
   ↓
6. API handler checks L2 cache (Vercel KV)
   • HIT (35% of L1 misses) → Return + populate L1 (<50ms)
   • MISS (65%) → Continue to L3
   ↓
7. API handler checks L3 cache (Supabase Storage)
   • HIT (25% of L2 misses) → Return + populate L2 + L1 (<200ms)
   • MISS (~10% total) → Continue to origin
   ↓
8. Fetch from origin (RCSB PDB API)
   • Fetch structure from source (~500ms)
   • Populate L3, L2, L1 caches
   • Return to user
```

### 2. Cache Warming Flow (Proactive)

```
Background Job (Scheduled: Daily 2 AM UTC)
   ↓
1. Identify top 100 popular structures
   • Query Supabase analytics
   • Fetch cache strategy engine rankings
   ↓
2. For each structure:
   a. Check if exists in L3 (Supabase Storage)
      • MISSING → Fetch from origin and store
      • EXISTS → Continue
   ↓
   b. Check if exists in L2 (Vercel KV)
      • MISSING or TTL < 6h → Refresh from L3
      • EXISTS → Skip
   ↓
3. Log warming statistics
   • Structures warmed
   • Bandwidth used
   • Errors encountered
```

### 3. Rate Limiting Flow (Per Request)

```
Request arrives at middleware
   ↓
1. Identify request source:
   • Authenticated → user:{userId}
   • Anonymous → ip:{ipAddress}
   • API Key → apikey:{keyId}
   ↓
2. Determine rate limit tier:
   • Anonymous: 10/min, 100/hr, 1000/day
   • Free: 30/min, 500/hr, 5000/day
   • Pro: 100/min, 2000/hr, 50000/day
   • Enterprise: 500/min, 10000/hr, unlimited
   ↓
3. Execute Lua script on Vercel KV (atomic):
   a. Remove entries outside sliding window
   b. Count requests in current window
   c. Check if limit exceeded
      • YES → Return {allowed: false, retryAfter: X}
      • NO → Add current request timestamp
   ↓
4. Add response headers:
   • X-RateLimit-Limit
   • X-RateLimit-Remaining
   • X-RateLimit-Reset
   • Retry-After (if blocked)
   ↓
5. Return result:
   • ALLOWED → Continue to handler
   • BLOCKED → Return 429 response
```

## Configuration Management

### Environment Variables

```bash
# .env.local

# Vercel KV (Redis) - L2 Cache & Rate Limiting
KV_REST_API_URL=https://your-kv-instance.upstash.io
KV_REST_API_TOKEN=your-kv-token

# Supabase - L3 Cache & Storage
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Cache Configuration
CACHE_L1_MAX_SIZE_MB=500
CACHE_L1_TTL_DAYS=7
CACHE_L2_MAX_SIZE_GB=10
CACHE_L2_TTL_HOURS=24
CACHE_L3_TTL_DAYS=30

# Rate Limiting Configuration
RATE_LIMIT_ANONYMOUS_PER_MIN=10
RATE_LIMIT_FREE_PER_MIN=30
RATE_LIMIT_PRO_PER_MIN=100
RATE_LIMIT_ENTERPRISE_PER_MIN=500

# Feature Flags
ENABLE_L2_CACHE=true
ENABLE_L3_CACHE=true
ENABLE_RATE_LIMITING=true
ENABLE_CACHE_WARMING=true

# Monitoring
ENABLE_CACHE_METRICS=true
ENABLE_RATE_LIMIT_METRICS=true
```

### TypeScript Configuration Types

```typescript
// src/lib/config/cache-config.ts

export interface CacheConfig {
  l1: {
    enabled: boolean;
    maxSizeMB: number;
    ttlDays: number;
    cleanupIntervalHours: number;
  };
  l2: {
    enabled: boolean;
    maxSizeGB: number;
    ttlHours: number;
    popularStructuresTTL: number;
    sessionDataTTL: number;
  };
  l3: {
    enabled: boolean;
    ttlDays: number;
    buckets: {
      pdbFiles: string;
      processed: string;
      userUploads: string;
      simulations: string;
      exports: string;
    };
  };
  warming: {
    enabled: boolean;
    schedule: string; // Cron expression
    topN: number; // Top N structures to warm
  };
}

export interface RateLimitConfig {
  enabled: boolean;
  tiers: {
    anonymous: TierConfig;
    free: TierConfig;
    pro: TierConfig;
    enterprise: TierConfig;
  };
  circuitBreaker: {
    failureThreshold: number;
    resetTimeout: number;
  };
}

interface TierConfig {
  perMinute: number;
  perHour: number;
  perDay: number;
  burstMultiplier: number;
}
```

## Middleware Architecture

### File Structure

```
src/
├── middleware.ts                    # Main Next.js middleware entry
├── lib/
│   ├── cache/
│   │   ├── l1-cache.ts             # IndexedDB cache (existing)
│   │   ├── l2-cache.ts             # Vercel KV cache (new)
│   │   ├── l3-cache.ts             # Supabase Storage cache (new)
│   │   ├── cache-service.ts        # Unified cache orchestrator
│   │   └── cache-middleware.ts     # API middleware for caching
│   ├── rate-limiter/
│   │   ├── sliding-window.ts       # Core algorithm
│   │   ├── rate-limiter.ts         # Main rate limiter class
│   │   ├── middleware.ts           # Next.js middleware integration
│   │   └── config.ts               # Tier configurations
│   ├── monitoring/
│   │   ├── cache-metrics.ts        # Cache performance tracking
│   │   ├── rate-limit-metrics.ts   # Rate limit violation tracking
│   │   └── dashboard.ts            # Metrics aggregation
│   └── utils/
│       ├── client-ip.ts            # IP extraction utilities
│       ├── circuit-breaker.ts      # Circuit breaker pattern
│       └── redis-client.ts         # Vercel KV client wrapper
```

### Middleware Execution Order

```typescript
// src/middleware.ts

export async function middleware(req: NextRequest) {
  // 1. Skip static assets and API internals
  if (shouldSkip(req.nextUrl.pathname)) {
    return NextResponse.next();
  }

  // 2. Rate Limiting (fast fail)
  const rateLimitResult = await checkRateLimit(req);
  if (!rateLimitResult.allowed) {
    return createRateLimitResponse(rateLimitResult);
  }

  // 3. Authentication & Session (existing)
  const session = await authenticateRequest(req);

  // 4. Authorization (existing)
  const authorized = await authorizeRequest(req, session);
  if (!authorized) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  // 5. Security Headers (existing)
  const response = NextResponse.next();
  addSecurityHeaders(response);
  addRateLimitHeaders(response, rateLimitResult);

  return response;
}
```

## API Route Integration

### Cache Middleware Pattern

```typescript
// src/lib/cache/cache-middleware.ts

export function withCache<T>(
  handler: (req: NextRequest) => Promise<T>,
  options: CacheOptions
) {
  return async (req: NextRequest): Promise<Response> => {
    const cacheKey = generateCacheKey(req, options);

    // Check caches in order: L2 → L3
    const cachedData = await checkCacheTiers(cacheKey);
    if (cachedData) {
      return new Response(JSON.stringify(cachedData), {
        headers: {
          'Content-Type': 'application/json',
          'X-Cache': cachedData.tier, // 'L2' or 'L3'
          'X-Cache-Key': cacheKey,
        },
      });
    }

    // Execute handler (fetch from origin)
    const data = await handler(req);

    // Populate caches (fire-and-forget)
    populateCacheTiers(cacheKey, data, options).catch(console.error);

    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'X-Cache': 'MISS',
      },
    });
  };
}
```

### Usage Example

```typescript
// src/app/api/structures/[id]/route.ts

import { withCache } from '@/lib/cache/cache-middleware';
import { withRateLimit } from '@/lib/rate-limiter/middleware';

const handler = async (
  req: NextRequest,
  { params }: { params: { id: string } }
) => {
  const pdbId = params.id;

  // Fetch from origin (RCSB PDB)
  const structure = await fetchPDBFromOrigin(pdbId);

  return structure;
};

export const GET = withRateLimit(
  withCache(handler, {
    ttl: { l2: 86400, l3: 2592000 }, // 24h L2, 30d L3
    tags: ['pdb', 'structure'],
  }),
  {
    scope: 'pdb-fetch',
    tier: 'per-user',
  }
);
```

## Monitoring & Observability

### Metrics Collection

```typescript
// src/lib/monitoring/cache-metrics.ts

interface CacheMetrics {
  timestamp: number;
  tier: 'L1' | 'L2' | 'L3';
  operation: 'hit' | 'miss' | 'set' | 'eviction';
  key: string;
  latency: number;
  size?: number;
}

class CacheMetricsCollector {
  async recordCacheOperation(metrics: CacheMetrics) {
    // Store in time-series database (Vercel Analytics, Supabase)
    await this.storage.insert('cache_metrics', metrics);

    // Real-time aggregation
    await this.updateAggregates(metrics);
  }

  async getHitRateByTier(tier: string, window: number) {
    // Query aggregated metrics
  }

  async getCacheCosts(period: string) {
    // Calculate L2/L3 costs
  }
}
```

### Rate Limit Metrics

```typescript
// src/lib/monitoring/rate-limit-metrics.ts

interface RateLimitMetrics {
  timestamp: number;
  identifier: string; // User ID or IP
  tier: string;
  allowed: boolean;
  remaining: number;
  endpoint: string;
}

class RateLimitMetricsCollector {
  async recordRateLimitCheck(metrics: RateLimitMetrics) {
    // Log to analytics
    await this.storage.insert('rate_limit_events', metrics);

    // Alert on high violation rate
    if (!metrics.allowed) {
      await this.checkViolationThreshold(metrics.identifier);
    }
  }

  async getViolationsByTier(tier: string, period: string) {
    // Query violation statistics
  }

  async getTopViolators(limit: number) {
    // Identify abuse patterns
  }
}
```

### Dashboard Queries

```sql
-- Cache hit rate by tier (last 24h)
SELECT
  tier,
  COUNT(CASE WHEN operation = 'hit' THEN 1 END) * 100.0 / COUNT(*) as hit_rate,
  AVG(latency) as avg_latency,
  COUNT(*) as total_requests
FROM cache_metrics
WHERE timestamp > NOW() - INTERVAL '24 hours'
GROUP BY tier;

-- Rate limit violations by tier (last 1h)
SELECT
  tier,
  COUNT(CASE WHEN allowed = false THEN 1 END) as violations,
  COUNT(*) as total_requests,
  COUNT(CASE WHEN allowed = false THEN 1 END) * 100.0 / COUNT(*) as violation_rate
FROM rate_limit_events
WHERE timestamp > NOW() - INTERVAL '1 hour'
GROUP BY tier;

-- Top violated endpoints
SELECT
  endpoint,
  COUNT(*) as violations
FROM rate_limit_events
WHERE allowed = false
  AND timestamp > NOW() - INTERVAL '24 hours'
GROUP BY endpoint
ORDER BY violations DESC
LIMIT 10;
```

## Error Handling & Resilience

### Circuit Breaker Implementation

```typescript
// src/lib/utils/circuit-breaker.ts

class CircuitBreaker {
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failures = 0;
  private lastFailureTime = 0;

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
    }
  }
}
```

### Graceful Degradation Strategy

```
Redis Unavailable:
  Rate Limiting → Fail OPEN (allow all requests, log warning)
  L2 Cache → Skip tier, check L3 directly

Supabase Unavailable:
  L3 Cache → Skip tier, fetch from origin
  Storage Write → Queue for retry, log error

Origin Unavailable:
  Return cached data even if stale (with warning header)
  Return 503 Service Unavailable if no cache
```

## Security Considerations

### 1. Cache Poisoning Prevention
- Validate all cached data before serving
- Sign cache keys with HMAC to prevent injection
- Implement ETag-based versioning

### 2. Rate Limit Bypass Protection
- Multiple identifiers (IP + fingerprint + session)
- Detect distributed attacks (IP ranges)
- Manual review queue for suspicious patterns

### 3. Data Privacy
- Encrypt sensitive data in L3 storage
- No PII in cache keys
- User-scoped access controls

## Performance Benchmarks

### Target Latencies
| Operation | Target | P50 | P95 | P99 |
|-----------|--------|-----|-----|-----|
| L1 Check | <100ms | 45ms | 85ms | 95ms |
| L2 Check | <50ms | 25ms | 42ms | 48ms |
| L3 Check | <200ms | 120ms | 180ms | 195ms |
| Rate Limit | <5ms | 2ms | 4ms | 4.5ms |
| Full Request (cached) | <150ms | 80ms | 130ms | 145ms |
| Full Request (origin) | <800ms | 550ms | 720ms | 780ms |

### Throughput Targets
- **Rate Limiter:** 10,000+ RPS
- **L2 Cache:** 50,000+ RPS
- **L3 Cache:** 5,000+ RPS

## Related Documentation
- [ADR-001: Multi-Tier Cache Strategy](./ADR-001-multi-tier-cache-strategy.md)
- [ADR-002: Redis Distributed Rate Limiting](./ADR-002-redis-distributed-rate-limiting.md)
- [Implementation Guide](./IMPLEMENTATION-GUIDE.md)
- [Runbook & Troubleshooting](./RUNBOOK.md)

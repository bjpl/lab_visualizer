# ADR-002: Redis Distributed Rate Limiting with Sliding Window

**Status:** Proposed
**Date:** 2025-11-20
**Decision Makers:** System Architecture Team
**Dependencies:** ADR-001 (Vercel KV integration)

## Context

The lab_visualizer application requires distributed rate limiting to:
1. Prevent abuse and resource exhaustion
2. Ensure fair usage across all users
3. Protect third-party APIs (RCSB PDB) from overuse
4. Enable tier-based access control (free/pro/enterprise)
5. Support multi-region deployment

### Current State
- No rate limiting implemented
- Vulnerable to abuse and DDoS
- Cannot enforce usage tiers
- Third-party API limits not managed

### Requirements
1. **Distributed:** Work across multiple edge functions/regions
2. **Accurate:** Sliding window for precise rate calculation
3. **Fast:** <5ms overhead per request
4. **Scalable:** Support 10,000+ concurrent users
5. **Flexible:** Multiple tiers and time windows
6. **Observable:** Track usage metrics and violations

## Decision

Implement distributed rate limiting using **Vercel KV (Redis)** with a **sliding window log algorithm**.

### Architecture

```
Request → Middleware → Rate Limiter → API Handler
                ↓
          Vercel KV (Redis)
          • Sliding window counters
          • User/IP tracking
          • Rate limit headers
```

### Rate Limit Tiers

| Tier | Requests/Minute | Requests/Hour | Requests/Day | Burst Allowance |
|------|-----------------|---------------|--------------|-----------------|
| **Anonymous (IP)** | 10 | 100 | 1,000 | 2x (20/min) |
| **Free User** | 30 | 500 | 5,000 | 2x (60/min) |
| **Pro User** | 100 | 2,000 | 50,000 | 3x (300/min) |
| **Enterprise** | 500 | 10,000 | Unlimited | 5x (2,500/min) |
| **Internal API** | 1,000 | Unlimited | Unlimited | None |

### Sliding Window Log Algorithm

**Advantages:**
- Precise rate calculation
- Prevents burst abuse
- Smooth rate enforcement
- No boundary issues (unlike fixed window)

**Implementation:**
```typescript
interface RateLimitConfig {
  limit: number;        // Max requests allowed
  window: number;       // Time window in seconds
  burstMultiplier: number; // Burst allowance multiplier
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;      // Unix timestamp
  retryAfter?: number;  // Seconds until retry (if blocked)
}

class SlidingWindowRateLimiter {
  constructor(
    private kv: VercelKV,
    private config: RateLimitConfig
  ) {}

  async check(key: string): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = now - (this.config.window * 1000);
    const redisKey = `ratelimit:${key}`;

    // Redis Lua script for atomic operations
    const script = `
      local key = KEYS[1]
      local now = tonumber(ARGV[1])
      local window_start = tonumber(ARGV[2])
      local limit = tonumber(ARGV[3])
      local ttl = tonumber(ARGV[4])

      -- Remove old entries outside window
      redis.call('ZREMRANGEBYSCORE', key, 0, window_start)

      -- Count requests in current window
      local count = redis.call('ZCARD', key)

      -- Check if limit exceeded
      if count >= limit then
        local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
        local reset_at = oldest[2] + (ttl * 1000)
        return {0, count, reset_at}
      end

      -- Add new request
      redis.call('ZADD', key, now, now)
      redis.call('EXPIRE', key, ttl)

      return {1, count + 1, now + (ttl * 1000)}
    `;

    const result = await this.kv.eval(
      script,
      [redisKey],
      [now, windowStart, this.config.limit, this.config.window]
    ) as [number, number, number];

    const [allowed, count, resetAt] = result;

    return {
      allowed: allowed === 1,
      remaining: Math.max(0, this.config.limit - count),
      resetAt,
      retryAfter: allowed === 0 ? Math.ceil((resetAt - now) / 1000) : undefined
    };
  }

  async reset(key: string): Promise<void> {
    await this.kv.del(`ratelimit:${key}`);
  }
}
```

## Rate Limit Keys

### Hierarchical Key Structure
```
ratelimit:{type}:{identifier}:{scope}

Examples:
ratelimit:ip:192.168.1.1:global          # Global IP limit
ratelimit:user:user123:api               # User API limit
ratelimit:user:user123:pdb-fetch         # Specific endpoint
ratelimit:apikey:abc123:global           # API key limit
ratelimit:session:sess456:simulation     # Session-based limit
```

### Key Composition Strategy
- **Anonymous:** `ip:{ip}:global`
- **Authenticated:** `user:{userId}:{endpoint}`
- **API Key:** `apikey:{keyId}:{scope}`
- **Internal:** `internal:{serviceId}` (high limits)

## Rate Limit Headers

### Standard Headers (RFC 6585)
```http
X-RateLimit-Limit: 100          # Max requests in window
X-RateLimit-Remaining: 87       # Remaining requests
X-RateLimit-Reset: 1732064400   # Unix timestamp when limit resets
X-RateLimit-Window: 60          # Window size in seconds
X-RateLimit-Policy: user-api    # Policy name applied

# When rate limited (429 Too Many Requests):
Retry-After: 45                 # Seconds until retry
```

### Custom Headers
```http
X-RateLimit-Tier: pro           # User's rate limit tier
X-RateLimit-Burst: 300          # Burst allowance
X-RateLimit-Cost: 1             # Cost of this request (for weighted limits)
```

## Middleware Integration

### Next.js Middleware Flow

```typescript
// src/middleware.ts
import { rateLimiter } from '@/lib/rate-limiter';

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Skip rate limiting for static assets
  if (pathname.startsWith('/_next') || pathname.includes('.')) {
    return NextResponse.next();
  }

  // Determine rate limit key
  const session = await getSession(req);
  const rateLimitKey = session?.user?.id
    ? `user:${session.user.id}:api`
    : `ip:${getClientIP(req)}:global`;

  // Determine tier and config
  const tier = session?.user?.tier || 'anonymous';
  const config = RATE_LIMIT_CONFIGS[tier];

  // Check rate limit
  const result = await rateLimiter.check(rateLimitKey, config);

  // Add headers to response
  const response = result.allowed
    ? NextResponse.next()
    : new NextResponse('Too Many Requests', { status: 429 });

  response.headers.set('X-RateLimit-Limit', String(config.limit));
  response.headers.set('X-RateLimit-Remaining', String(result.remaining));
  response.headers.set('X-RateLimit-Reset', String(result.resetAt));
  response.headers.set('X-RateLimit-Window', String(config.window));
  response.headers.set('X-RateLimit-Tier', tier);

  if (result.retryAfter) {
    response.headers.set('Retry-After', String(result.retryAfter));
  }

  return response;
}
```

### API Route Rate Limiting

```typescript
// src/app/api/structures/[id]/route.ts
import { withRateLimit } from '@/lib/rate-limiter/middleware';

export const GET = withRateLimit(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    const pdbId = params.id;
    // ... fetch structure
  },
  {
    tier: 'per-endpoint',
    limit: 50,
    window: 60,
    scope: 'pdb-fetch'
  }
);
```

## Distributed Counter Synchronization

### Redis Atomic Operations
- **ZADD:** Add timestamp to sorted set (O(log N))
- **ZREMRANGEBYSCORE:** Remove old entries (O(log N + M))
- **ZCARD:** Count entries in window (O(1))
- **EXPIRE:** Set TTL for automatic cleanup (O(1))

### Lua Script Benefits
1. **Atomic:** All operations in single transaction
2. **Fast:** No network round-trips
3. **Consistent:** No race conditions
4. **Efficient:** Server-side execution

### Handling Edge Cases
```typescript
// Race condition protection
const LUA_SCRIPT = `
  -- Acquire lock
  local lock = redis.call('SET', KEYS[1]..':lock', 'locked', 'NX', 'PX', 100)
  if not lock then
    return {-1, 0, 0}  -- Lock failed, retry
  end

  -- Perform rate limit check
  -- ... (sliding window logic)

  -- Release lock
  redis.call('DEL', KEYS[1]..':lock')

  return {allowed, count, reset}
`;
```

## Cost-Based Rate Limiting (Future)

### Weighted Requests
Different operations consume different "cost":

```typescript
const REQUEST_COSTS = {
  'GET /api/structures/:id': 1,
  'POST /api/simulation/start': 10,
  'GET /api/simulation/:id/frames': 5,
  'POST /api/export/pdf': 3,
};

async function checkCostBasedLimit(
  key: string,
  cost: number
): Promise<RateLimitResult> {
  // Deduct cost from token bucket
  // Refill at constant rate
}
```

## Error Handling

### Graceful Degradation
```typescript
async function checkRateLimitWithFallback(
  key: string
): Promise<RateLimitResult> {
  try {
    return await rateLimiter.check(key);
  } catch (error) {
    // Redis unavailable - allow request with warning
    console.error('Rate limiter error:', error);

    // Log to monitoring
    await monitoring.logError('rate-limiter-failure', { error, key });

    // Allow request (fail open)
    return {
      allowed: true,
      remaining: 0,
      resetAt: Date.now() + 60000,
    };
  }
}
```

### Circuit Breaker
```typescript
class RateLimiterCircuitBreaker {
  private failures = 0;
  private lastFailure = 0;
  private isOpen = false;

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.isOpen) {
      // Circuit open - fail fast
      if (Date.now() - this.lastFailure > 30000) {
        this.isOpen = false; // Try half-open
      } else {
        throw new Error('Circuit breaker open');
      }
    }

    try {
      const result = await fn();
      this.failures = 0;
      return result;
    } catch (error) {
      this.failures++;
      this.lastFailure = Date.now();

      if (this.failures >= 5) {
        this.isOpen = true;
      }

      throw error;
    }
  }
}
```

## Monitoring & Alerts

### Key Metrics
1. **Rate Limit Hit Rate:** % of requests blocked
2. **Violations by Tier:** Abuse detection
3. **P99 Latency:** Rate limiter overhead
4. **Redis Availability:** Uptime tracking
5. **Cost:** Redis operations and storage

### Alerting Thresholds
```typescript
const ALERT_THRESHOLDS = {
  // High violation rate indicates abuse
  violationRate: 0.1,  // 10% of requests blocked

  // High latency indicates Redis issues
  p99Latency: 50,      // 50ms overhead

  // Redis unavailable
  redisDowntime: 60,   // 60 seconds

  // Unusual patterns
  suddenSpike: 5,      // 5x normal rate
};
```

### Dashboard Metrics
- Real-time rate limit violations
- Requests per tier (anonymous, free, pro)
- Top violators (IP/user)
- Rate limiter performance (latency)
- Redis health and capacity

## Testing Strategy

### Unit Tests
```typescript
describe('SlidingWindowRateLimiter', () => {
  it('allows requests within limit', async () => {
    const result = await limiter.check('test-key');
    expect(result.allowed).toBe(true);
  });

  it('blocks requests exceeding limit', async () => {
    // Exhaust limit
    for (let i = 0; i < 10; i++) {
      await limiter.check('test-key');
    }

    const result = await limiter.check('test-key');
    expect(result.allowed).toBe(false);
  });

  it('resets after window expires', async () => {
    // ... time-based test
  });
});
```

### Load Tests
```bash
# Simulate 1000 concurrent users
k6 run --vus 1000 --duration 60s rate-limit-load-test.js

# Expected results:
# - 95% requests succeed
# - 5% properly rate limited (429)
# - P99 latency <50ms
```

## Cost Analysis

### Vercel KV Usage
- **Operations:** ~1M requests/month
- **Storage:** Minimal (<100MB for rate limit data)
- **Cost:** ~$5/month (included in L2 cache costs)

### Performance Impact
- **Latency:** +3-5ms per request (acceptable)
- **Throughput:** 10,000+ RPS (Redis capacity)

## Implementation Plan

### Phase 1: Foundation (Week 1)
1. Implement sliding window rate limiter class
2. Add Vercel KV integration
3. Unit tests for core algorithm
4. Benchmark performance

### Phase 2: Middleware (Week 1-2)
1. Next.js middleware integration
2. Multi-tier configuration
3. Rate limit headers
4. Error handling and circuit breaker

### Phase 3: Monitoring (Week 2)
1. Metrics collection
2. Violation logging
3. Dashboard integration
4. Alert setup

### Phase 4: Production (Week 3)
1. Gradual rollout (testing → staging → production)
2. Monitor metrics closely
3. Tune limits based on actual usage
4. Document API and troubleshooting

## Consequences

### Positive
- **Abuse Prevention:** Protect against DDoS and abuse
- **Fair Usage:** Ensure equitable access for all users
- **Cost Control:** Prevent third-party API overuse
- **Scalability:** Distributed architecture supports growth
- **Observability:** Track usage patterns and violations

### Negative
- **Complexity:** Additional infrastructure dependency
- **Latency:** +3-5ms overhead per request
- **Cost:** ~$5/month for Redis operations
- **False Positives:** Legitimate users may hit limits

### Risks & Mitigation
| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Redis downtime | High | Low | Circuit breaker, fail-open policy |
| False positives | Medium | Medium | Generous burst allowance, easy appeal |
| Cost overrun | Low | Low | Budget alerts, usage caps |
| Abuse bypass | Medium | Medium | IP + fingerprinting, manual review |

## Related ADRs
- ADR-001: Multi-Tier Cache Strategy
- ADR-003: API Authentication & Authorization
- ADR-004: Observability & Monitoring

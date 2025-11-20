# Implementation Guide: Multi-Tier Cache & Rate Limiting

## Prerequisites

### 1. Vercel KV Setup
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link project
vercel link

# Create KV store
vercel kv create lab-visualizer-cache

# Get credentials (copy to .env.local)
vercel env pull .env.local
```

### 2. Supabase Storage Setup
```sql
-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('pdb-files', 'pdb-files', true),
  ('processed', 'processed', true),
  ('user-uploads', 'user-uploads', false),
  ('simulations', 'simulations', false),
  ('exports', 'exports', false);

-- Set up RLS policies
CREATE POLICY "Public read access to PDB files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'pdb-files');

CREATE POLICY "Authenticated users can upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'user-uploads'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

## Phase 1: L2 Cache (Vercel KV)

### Step 1: Install Dependencies
```bash
npm install @vercel/kv ioredis
npm install -D @types/ioredis
```

### Step 2: Create L2 Cache Service

```typescript
// src/lib/cache/l2-cache.ts

import { kv } from '@vercel/kv';

export interface L2CacheOptions {
  ttl?: number; // seconds
  tags?: string[];
}

export class L2Cache {
  private readonly prefix = 'l2:';

  async get<T>(key: string): Promise<T | null> {
    try {
      const fullKey = this.prefix + key;
      const data = await kv.get<T>(fullKey);

      if (data) {
        console.log(`[L2Cache] HIT: ${key}`);
      } else {
        console.log(`[L2Cache] MISS: ${key}`);
      }

      return data;
    } catch (error) {
      console.error('[L2Cache] Error:', error);
      return null;
    }
  }

  async set<T>(
    key: string,
    value: T,
    options: L2CacheOptions = {}
  ): Promise<void> {
    try {
      const fullKey = this.prefix + key;
      const ttl = options.ttl || 86400; // 24h default

      await kv.set(fullKey, value, {
        ex: ttl,
      });

      // Store tags for invalidation
      if (options.tags && options.tags.length > 0) {
        await this.storeTags(key, options.tags);
      }

      console.log(`[L2Cache] SET: ${key} (TTL: ${ttl}s)`);
    } catch (error) {
      console.error('[L2Cache] Set error:', error);
    }
  }

  async delete(key: string): Promise<void> {
    const fullKey = this.prefix + key;
    await kv.del(fullKey);
  }

  async invalidateByTag(tag: string): Promise<void> {
    const tagKey = `${this.prefix}tag:${tag}`;
    const keys = await kv.smembers(tagKey);

    if (keys.length > 0) {
      await kv.del(...keys.map(k => this.prefix + k));
      await kv.del(tagKey);
      console.log(`[L2Cache] Invalidated ${keys.length} entries for tag: ${tag}`);
    }
  }

  private async storeTags(key: string, tags: string[]): Promise<void> {
    const promises = tags.map(tag =>
      kv.sadd(`${this.prefix}tag:${tag}`, key)
    );
    await Promise.all(promises);
  }

  async getStats(): Promise<{
    size: number;
    keys: number;
  }> {
    try {
      const info = await kv.info('memory');
      const dbsize = await kv.dbsize();

      return {
        size: parseInt(info.match(/used_memory:(\d+)/)?.[1] || '0'),
        keys: dbsize,
      };
    } catch (error) {
      console.error('[L2Cache] Stats error:', error);
      return { size: 0, keys: 0 };
    }
  }
}

export const l2Cache = new L2Cache();
```

### Step 3: Create Rate Limiter

```typescript
// src/lib/rate-limiter/sliding-window.ts

import { kv } from '@vercel/kv';

export interface RateLimitConfig {
  limit: number;
  window: number; // seconds
  burstMultiplier?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}

export class SlidingWindowRateLimiter {
  private readonly prefix = 'ratelimit:';

  async check(
    key: string,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    const fullKey = this.prefix + key;
    const now = Date.now();
    const windowStart = now - (config.window * 1000);

    try {
      // Lua script for atomic sliding window
      const script = `
        local key = KEYS[1]
        local now = tonumber(ARGV[1])
        local window_start = tonumber(ARGV[2])
        local limit = tonumber(ARGV[3])
        local ttl = tonumber(ARGV[4])

        -- Remove old entries
        redis.call('ZREMRANGEBYSCORE', key, 0, window_start)

        -- Count requests in window
        local count = redis.call('ZCARD', key)

        if count >= limit then
          local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
          if #oldest > 0 then
            local reset_at = tonumber(oldest[2]) + (ttl * 1000)
            return {0, limit - count, reset_at}
          end
          return {0, 0, now + (ttl * 1000)}
        end

        -- Add current request
        redis.call('ZADD', key, now, now .. ':' .. math.random())
        redis.call('EXPIRE', key, ttl)

        return {1, limit - count - 1, now + (ttl * 1000)}
      `;

      const result = await kv.eval(
        script,
        [fullKey],
        [now, windowStart, config.limit, config.window]
      ) as [number, number, number];

      const [allowed, remaining, resetAt] = result;

      return {
        allowed: allowed === 1,
        remaining: Math.max(0, remaining),
        resetAt,
        retryAfter: allowed === 0 ? Math.ceil((resetAt - now) / 1000) : undefined,
      };
    } catch (error) {
      console.error('[RateLimiter] Error:', error);
      // Fail open on error
      return {
        allowed: true,
        remaining: 0,
        resetAt: now + (config.window * 1000),
      };
    }
  }

  async reset(key: string): Promise<void> {
    const fullKey = this.prefix + key;
    await kv.del(fullKey);
  }
}

export const rateLimiter = new SlidingWindowRateLimiter();
```

### Step 4: Create Middleware

```typescript
// src/lib/rate-limiter/middleware.ts

import { NextRequest, NextResponse } from 'next/server';
import { rateLimiter, RateLimitConfig } from './sliding-window';

const RATE_LIMIT_TIERS: Record<string, RateLimitConfig> = {
  anonymous: { limit: 10, window: 60 },
  free: { limit: 30, window: 60 },
  pro: { limit: 100, window: 60 },
  enterprise: { limit: 500, window: 60 },
};

export async function checkRateLimit(req: NextRequest) {
  const session = await getSession(req);
  const tier = session?.user?.tier || 'anonymous';
  const config = RATE_LIMIT_TIERS[tier];

  const identifier = session?.user?.id
    ? `user:${session.user.id}`
    : `ip:${getClientIP(req)}`;

  const key = `${identifier}:global`;
  const result = await rateLimiter.check(key, config);

  return { ...result, tier, config };
}

export function addRateLimitHeaders(
  response: NextResponse,
  result: Awaited<ReturnType<typeof checkRateLimit>>
) {
  response.headers.set('X-RateLimit-Limit', String(result.config.limit));
  response.headers.set('X-RateLimit-Remaining', String(result.remaining));
  response.headers.set('X-RateLimit-Reset', String(result.resetAt));
  response.headers.set('X-RateLimit-Tier', result.tier);

  if (result.retryAfter) {
    response.headers.set('Retry-After', String(result.retryAfter));
  }
}

function getClientIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0] ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}
```

### Step 5: Update Main Middleware

```typescript
// src/middleware.ts

import { checkRateLimit, addRateLimitHeaders } from '@/lib/rate-limiter/middleware';

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Skip for static assets
  if (pathname.startsWith('/_next') || pathname.includes('.')) {
    return NextResponse.next();
  }

  // Check rate limit
  const rateLimitResult = await checkRateLimit(req);

  if (!rateLimitResult.allowed) {
    const response = new NextResponse('Too Many Requests', { status: 429 });
    addRateLimitHeaders(response, rateLimitResult);
    return response;
  }

  // Continue to existing auth middleware...
  const response = NextResponse.next();
  addRateLimitHeaders(response, rateLimitResult);

  return response;
}
```

## Phase 2: L3 Cache (Supabase Storage)

### Step 1: Create L3 Cache Service

```typescript
// src/lib/cache/l3-cache.ts

import { createClient } from '@/lib/supabase/server';

export class L3Cache {
  private readonly bucket = 'pdb-files';

  async get(key: string): Promise<Blob | null> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.storage
        .from(this.bucket)
        .download(key);

      if (error) {
        console.log(`[L3Cache] MISS: ${key}`);
        return null;
      }

      console.log(`[L3Cache] HIT: ${key}`);
      return data;
    } catch (error) {
      console.error('[L3Cache] Error:', error);
      return null;
    }
  }

  async set(key: string, data: Blob | File): Promise<void> {
    try {
      const supabase = await createClient();
      const { error } = await supabase.storage
        .from(this.bucket)
        .upload(key, data, {
          cacheControl: '2592000', // 30 days
          upsert: true,
        });

      if (error) {
        throw error;
      }

      console.log(`[L3Cache] SET: ${key}`);
    } catch (error) {
      console.error('[L3Cache] Set error:', error);
    }
  }

  async delete(key: string): Promise<void> {
    const supabase = await createClient();
    await supabase.storage.from(this.bucket).remove([key]);
  }

  async list(prefix?: string): Promise<string[]> {
    const supabase = await createClient();
    const { data, error } = await supabase.storage
      .from(this.bucket)
      .list(prefix);

    if (error) return [];

    return data.map(file => file.name);
  }

  async cleanup(olderThanDays: number): Promise<void> {
    const supabase = await createClient();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - olderThanDays);

    const { data: files } = await supabase.storage
      .from(this.bucket)
      .list();

    if (!files) return;

    const toDelete = files
      .filter(f => new Date(f.created_at) < cutoff)
      .map(f => f.name);

    if (toDelete.length > 0) {
      await supabase.storage.from(this.bucket).remove(toDelete);
      console.log(`[L3Cache] Cleaned up ${toDelete.length} old files`);
    }
  }
}

export const l3Cache = new L3Cache();
```

### Step 2: Unified Cache Service

```typescript
// src/lib/cache/unified-cache.ts

import { l2Cache } from './l2-cache';
import { l3Cache } from './l3-cache';
import { CacheService as L1Cache } from './cache-service'; // existing

export class UnifiedCacheService {
  constructor(
    private l1: L1Cache,
    private l2: typeof l2Cache,
    private l3: typeof l3Cache
  ) {}

  async get(key: string): Promise<any> {
    // Try L2 (fastest remote)
    const l2Data = await this.l2.get(key);
    if (l2Data) {
      return { data: l2Data, tier: 'L2' };
    }

    // Try L3 (persistent)
    const l3Data = await this.l3.get(key);
    if (l3Data) {
      // Populate L2
      const parsed = await l3Data.text();
      await this.l2.set(key, JSON.parse(parsed), { ttl: 86400 });

      return { data: JSON.parse(parsed), tier: 'L3' };
    }

    return null;
  }

  async set(key: string, value: any, options?: {
    l2TTL?: number;
    l3?: boolean;
  }): Promise<void> {
    // Always set in L2
    await this.l2.set(key, value, { ttl: options?.l2TTL || 86400 });

    // Optionally set in L3
    if (options?.l3 !== false) {
      const blob = new Blob([JSON.stringify(value)], {
        type: 'application/json'
      });
      await this.l3.set(key, blob);
    }
  }

  async invalidate(key: string): Promise<void> {
    await Promise.all([
      this.l2.delete(key),
      this.l3.delete(key),
    ]);
  }
}

export const unifiedCache = new UnifiedCacheService(
  new L1Cache(),
  l2Cache,
  l3Cache
);
```

### Step 3: API Route Integration

```typescript
// src/app/api/structures/[id]/route.ts

import { unifiedCache } from '@/lib/cache/unified-cache';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const pdbId = params.id.toLowerCase();
  const cacheKey = `pdb:${pdbId}`;

  // Check unified cache (L2 → L3)
  const cached = await unifiedCache.get(cacheKey);
  if (cached) {
    return NextResponse.json(cached.data, {
      headers: {
        'X-Cache': cached.tier,
        'X-Cache-Key': cacheKey,
      },
    });
  }

  // Fetch from origin
  const structure = await fetchFromRCSB(pdbId);

  // Populate caches
  await unifiedCache.set(cacheKey, structure, {
    l2TTL: 86400,  // 24 hours
    l3: true,       // Store in L3
  });

  return NextResponse.json(structure, {
    headers: {
      'X-Cache': 'MISS',
    },
  });
}

async function fetchFromRCSB(pdbId: string) {
  const response = await fetch(
    `https://files.rcsb.org/download/${pdbId}.pdb`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch ${pdbId}`);
  }

  const content = await response.text();

  return {
    pdbId,
    content,
    fetchedAt: new Date().toISOString(),
  };
}
```

## Phase 3: Monitoring & Metrics

### Step 1: Create Metrics Service

```typescript
// src/lib/monitoring/metrics.ts

import { createClient } from '@/lib/supabase/server';

interface CacheMetric {
  tier: 'L1' | 'L2' | 'L3';
  operation: 'hit' | 'miss' | 'set';
  key: string;
  latency: number;
  timestamp: number;
}

export class MetricsCollector {
  async recordCacheOperation(metric: CacheMetric) {
    const supabase = await createClient();
    await supabase.from('cache_metrics').insert(metric);
  }

  async getHitRate(tier: string, hours: number = 24) {
    const supabase = await createClient();
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - hours);

    const { data } = await supabase
      .from('cache_metrics')
      .select('operation')
      .eq('tier', tier)
      .gte('timestamp', cutoff.getTime());

    if (!data || data.length === 0) return 0;

    const hits = data.filter(m => m.operation === 'hit').length;
    return hits / data.length;
  }
}

export const metrics = new MetricsCollector();
```

### Step 2: Add Monitoring to Cache Operations

```typescript
// Update L2Cache.get() method
async get<T>(key: string): Promise<T | null> {
  const start = performance.now();

  const data = await kv.get<T>(this.prefix + key);
  const latency = performance.now() - start;

  await metrics.recordCacheOperation({
    tier: 'L2',
    operation: data ? 'hit' : 'miss',
    key,
    latency,
    timestamp: Date.now(),
  });

  return data;
}
```

## Testing

### Unit Tests

```typescript
// tests/lib/cache/l2-cache.test.ts

import { describe, it, expect, beforeEach } from 'vitest';
import { l2Cache } from '@/lib/cache/l2-cache';

describe('L2Cache', () => {
  beforeEach(async () => {
    // Clear test data
  });

  it('should store and retrieve data', async () => {
    await l2Cache.set('test-key', { foo: 'bar' });
    const result = await l2Cache.get('test-key');
    expect(result).toEqual({ foo: 'bar' });
  });

  it('should respect TTL', async () => {
    await l2Cache.set('test-key', 'value', { ttl: 1 });
    await new Promise(resolve => setTimeout(resolve, 1100));
    const result = await l2Cache.get('test-key');
    expect(result).toBeNull();
  });
});
```

### Integration Tests

```typescript
// tests/integration/cache-flow.test.ts

import { describe, it, expect } from 'vitest';
import { unifiedCache } from '@/lib/cache/unified-cache';

describe('Unified Cache Flow', () => {
  it('should cascade through cache tiers', async () => {
    const key = 'test:cascade';
    const value = { data: 'test' };

    // Set in all tiers
    await unifiedCache.set(key, value);

    // Should hit L2 first
    const result1 = await unifiedCache.get(key);
    expect(result1.tier).toBe('L2');

    // Clear L2, should hit L3
    await l2Cache.delete(key);
    const result2 = await unifiedCache.get(key);
    expect(result2.tier).toBe('L3');
  });
});
```

## Deployment

### 1. Environment Setup

```bash
# Production
vercel env add KV_REST_API_URL production
vercel env add KV_REST_API_TOKEN production

# Staging
vercel env add KV_REST_API_URL preview
vercel env add KV_REST_API_TOKEN preview
```

### 2. Gradual Rollout

```typescript
// Feature flags for gradual rollout
const ROLLOUT_PERCENTAGE = parseInt(
  process.env.CACHE_ROLLOUT_PERCENTAGE || '0'
);

function shouldUseCache(userId?: string): boolean {
  if (!userId) return false;

  const hash = hashCode(userId);
  return (hash % 100) < ROLLOUT_PERCENTAGE;
}

// Start with 10%, then 50%, then 100%
```

### 3. Monitoring Alerts

```typescript
// Setup alerts in Vercel/Supabase
const ALERT_THRESHOLDS = {
  hitRateTooLow: 0.4,      // Alert if <40%
  latencyTooHigh: 200,     // Alert if >200ms
  errorRateTooHigh: 0.05,  // Alert if >5% errors
};
```

## Troubleshooting

### Common Issues

1. **Redis Connection Errors**
   - Check KV_REST_API_URL and token
   - Verify Vercel KV store exists
   - Check network connectivity

2. **Supabase Storage Errors**
   - Verify bucket policies
   - Check file size limits
   - Ensure RLS is configured

3. **Rate Limiting Too Aggressive**
   - Adjust tier limits in config
   - Check for clock skew
   - Verify Lua script syntax

## Next Steps

1. Implement cache warming job (see ADR-001)
2. Add cost tracking dashboard
3. Setup automated cleanup jobs
4. Implement cache invalidation webhooks
5. Add distributed tracing

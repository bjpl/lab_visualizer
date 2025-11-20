# Technology Evaluation Matrix

## L2 Cache: Edge Cache Solutions

### Evaluation Criteria
- **Performance:** Latency, throughput
- **Cost:** Pricing model, predictability
- **Developer Experience:** API quality, tooling
- **Scalability:** Global distribution, capacity
- **Integration:** Vercel/Next.js compatibility

### Options Compared

| Solution | Performance | Cost | DX | Scalability | Integration | Score |
|----------|-------------|------|-----|-------------|-------------|-------|
| **Vercel KV (Upstash)** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 24/25 |
| CloudFlare KV | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | 22/25 |
| Redis Cloud | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | 18/25 |
| AWS ElastiCache | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | 16/25 |
| Memcached | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | 16/25 |

### Detailed Comparison

#### Vercel KV (Upstash Redis) - SELECTED ✅

**Pros:**
- Native Vercel integration (zero-config)
- Global edge network (low latency everywhere)
- Redis-compatible API (familiar)
- Automatic scaling
- REST API for edge functions
- Free tier: 10,000 commands/day, 256MB storage
- Pay-as-you-go: $0.15/GB transferred
- Built-in rate limiting support (Lua scripts)
- Excellent DX with TypeScript SDK

**Cons:**
- Vendor lock-in (Vercel-specific)
- More expensive than self-hosted Redis
- Limited to Upstash features (no Redis modules)

**Cost Estimate:**
- Storage: 10GB @ $0.30/GB = $3/month
- Transfer: 100GB @ $0.15/GB = $15/month
- **Total: ~$18/month**

**Latency Benchmarks:**
- P50: 15-25ms (global edge)
- P95: 35-45ms
- P99: 45-55ms

**Decision:** Best fit for Vercel-hosted Next.js apps with global users.

---

#### CloudFlare KV

**Pros:**
- Extremely fast (edge-optimized)
- Very generous free tier (100,000 reads/day)
- Global distribution (275+ locations)
- Simple key-value API
- Lowest cost ($0.50/million reads)

**Cons:**
- Eventually consistent (not strongly consistent)
- No Redis compatibility (different API)
- Limited data structures (only key-value)
- Would require API migration
- Not integrated with Vercel
- No Lua scripting support

**Cost Estimate:**
- Reads: 10M @ $0.50/M = $5/month
- Writes: 1M @ $5.00/M = $5/month
- Storage: 10GB @ $0.50/GB = $5/month
- **Total: ~$15/month**

**Decision:** Cheaper but lacks Redis features needed for rate limiting.

---

#### Redis Cloud (Redis Labs)

**Pros:**
- Full Redis compatibility
- Advanced features (modules, clustering)
- High performance
- Good free tier (30MB)
- Multi-cloud support

**Cons:**
- Not edge-optimized (single region by default)
- Higher latency for global users
- More expensive than Vercel KV
- Requires VPC/network setup
- Manual scaling

**Cost Estimate:**
- 10GB plan: $40/month (fixed)
- High-speed replication: +$20/month
- **Total: ~$60/month**

**Decision:** Too expensive and not edge-optimized for global use case.

---

#### AWS ElastiCache

**Pros:**
- Full Redis compatibility
- Highly scalable
- Advanced features (Redis 7.x)
- AWS ecosystem integration

**Cons:**
- Requires VPC setup (complex)
- Single-region (high latency for global users)
- Expensive for small workloads
- No edge deployment
- Poor DX for serverless apps

**Cost Estimate:**
- cache.t4g.medium (6.38GB): $34/month
- Data transfer: ~$20/month
- **Total: ~$54/month**

**Decision:** Overkill for edge caching, better for backend systems.

---

### Winner: Vercel KV ✅

**Reasoning:**
1. **Native integration** with Vercel/Next.js (zero config)
2. **Edge-optimized** for global low latency
3. **Redis-compatible** for rate limiting algorithms
4. **Cost-effective** for our scale (~$18/month)
5. **Excellent DX** with TypeScript SDK
6. **Proven** technology (used by major apps)

---

## L3 Cache: Object Storage Solutions

### Options Compared

| Solution | Performance | Cost | DX | Scalability | Integration | Score |
|----------|-------------|------|-----|-------------|-------------|-------|
| **Supabase Storage** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 24/25 |
| AWS S3 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | 20/25 |
| CloudFlare R2 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | 21/25 |
| Google Cloud Storage | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | 19/25 |
| Vercel Blob | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 20/25 |

### Detailed Comparison

#### Supabase Storage - SELECTED ✅

**Pros:**
- S3-compatible API (standard)
- Already using Supabase (database)
- Built-in CDN (global distribution)
- Row-Level Security (RLS) for access control
- Free tier: 1GB storage, 2GB bandwidth
- Cheap: $0.021/GB storage, $0.09/GB transfer
- Excellent TypeScript SDK
- Image transformations built-in
- Resumable uploads
- Signed URLs for private files

**Cons:**
- Not as fast as S3 for large files
- Limited to Supabase ecosystem
- Regional storage (not multi-region by default)

**Cost Estimate:**
- Storage: 500GB @ $0.021/GB = $10.50/month
- Transfer: 200GB @ $0.09/GB = $18/month
- **Total: ~$28.50/month**

**Latency Benchmarks:**
- P50: 120-150ms (with CDN)
- P95: 180-220ms
- P99: 220-280ms

**Decision:** Best fit for existing Supabase users, excellent DX and cost.

---

#### AWS S3

**Pros:**
- Industry standard (most mature)
- Extremely scalable
- Advanced features (versioning, lifecycle)
- Global edge locations (CloudFront)
- Excellent durability (11 9's)
- Lowest latency with CloudFront

**Cons:**
- More complex setup (IAM, buckets, policies)
- Requires CloudFront for fast access
- Higher egress costs
- Poor DX for simple use cases

**Cost Estimate:**
- Storage: 500GB @ $0.023/GB = $11.50/month
- Transfer: 200GB @ $0.09/GB = $18/month
- CloudFront: 200GB @ $0.085/GB = $17/month
- **Total: ~$46.50/month**

**Decision:** More expensive and complex than Supabase for our use case.

---

#### CloudFlare R2

**Pros:**
- S3-compatible API
- Zero egress fees (huge savings)
- Global edge network
- Excellent performance
- Low storage cost ($0.015/GB)

**Cons:**
- Newer service (less proven)
- Limited features vs S3
- No built-in CDN (requires CloudFlare Workers)
- Separate vendor (not integrated with Vercel/Supabase)

**Cost Estimate:**
- Storage: 500GB @ $0.015/GB = $7.50/month
- Transfer: FREE (no egress fees)
- **Total: ~$7.50/month**

**Decision:** Cheapest option but requires additional integration work.

---

### Winner: Supabase Storage ✅

**Reasoning:**
1. **Already using Supabase** (database, auth) - consolidation
2. **Built-in CDN** for global distribution
3. **RLS policies** for security
4. **Excellent SDK** and DX
5. **Cost-effective** ($28.50/month)
6. **Simple** compared to AWS S3 + CloudFront

---

## Rate Limiting: Algorithm Comparison

### Options Compared

| Algorithm | Accuracy | Memory | Complexity | Burst Handling | Score |
|-----------|----------|--------|------------|----------------|-------|
| **Sliding Window Log** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 20/25 |
| Sliding Window Counter | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 21/25 |
| Fixed Window | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | 16/25 |
| Token Bucket | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 21/25 |
| Leaky Bucket | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | 18/25 |

### Detailed Comparison

#### Sliding Window Log - SELECTED ✅

**How it Works:**
```
Store each request timestamp in Redis sorted set (ZSET)
On each request:
  1. Remove timestamps older than window
  2. Count remaining requests
  3. If count < limit, allow and add new timestamp
  4. Else, reject with retry-after
```

**Pros:**
- Perfect accuracy (no approximation)
- Handles burst traffic smoothly
- No boundary issues (true sliding window)
- Fair distribution of rate limit

**Cons:**
- Higher memory usage (stores all timestamps)
- O(log N) complexity for Redis operations
- Requires cleanup of old entries

**Memory Usage:**
- Per user: ~40 bytes per request
- 100 requests/minute = 4KB per user
- 10,000 users = 40MB total

**Decision:** Best accuracy and burst handling, memory usage acceptable.

---

#### Sliding Window Counter

**How it Works:**
```
Store counters for current + previous window
Rate = current_count + (previous_count * overlap_percentage)
```

**Pros:**
- Low memory (only 2 counters)
- O(1) complexity
- Good approximation of sliding window

**Cons:**
- Approximate (not exact)
- Can allow up to 2x limit at window boundary
- Complex calculation

**Decision:** Good alternative if memory is constrained.

---

#### Fixed Window

**How it Works:**
```
Increment counter for fixed time window (e.g., minute)
Reset counter at window boundary
```

**Pros:**
- Simplest implementation
- Lowest memory usage
- O(1) complexity

**Cons:**
- Allows 2x limit at window boundaries
- Unfair burst distribution
- Poor user experience

**Decision:** Too inaccurate for production use.

---

### Winner: Sliding Window Log ✅

**Reasoning:**
1. **Perfect accuracy** - no approximation errors
2. **Smooth burst handling** - no boundary spikes
3. **Fair** - evenly distributes rate limit
4. **Acceptable memory** - ~40MB for 10K users
5. **Redis native** - efficient ZSET operations

---

## Summary of Technology Decisions

| Component | Technology | Runner-Up | Cost/Month | Reason |
|-----------|------------|-----------|------------|--------|
| **L1 Cache** | IndexedDB | LocalStorage | Free | Browser-native, 500MB quota |
| **L2 Cache** | Vercel KV | CloudFlare KV | $18 | Edge-optimized, Redis-compatible |
| **L3 Cache** | Supabase Storage | CloudFlare R2 | $28.50 | Integrated, CDN, RLS |
| **Rate Limiting** | Sliding Window Log | Token Bucket | Included in L2 | Accurate, fair, burst-friendly |
| **Monitoring** | Vercel Analytics | Datadog | Free (basic) | Built-in, sufficient for MVP |

**Total Infrastructure Cost: ~$46.50/month**

---

## Performance Projections

### Expected Metrics

| Metric | Target | Projected | Confidence |
|--------|--------|-----------|------------|
| Combined Cache Hit Rate | 70% | 68-75% | High |
| L1 Hit Rate | 30% | 28-35% | High |
| L2 Hit Rate | 35% | 30-40% | Medium |
| L3 Hit Rate | 25% | 20-30% | Medium |
| P50 Latency (cached) | <150ms | 80-120ms | High |
| P99 Latency (cached) | <500ms | 200-400ms | High |
| Rate Limiter Overhead | <5ms | 2-4ms | High |

### Scaling Projections

| Metric | Month 1 | Month 6 | Month 12 |
|--------|---------|---------|----------|
| Users | 1,000 | 5,000 | 20,000 |
| Requests/Day | 50K | 250K | 1M |
| L2 Storage | 2GB | 8GB | 15GB |
| L3 Storage | 100GB | 400GB | 1TB |
| Monthly Cost | $25 | $60 | $150 |

---

## Risk Assessment

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| L2/L3 Downtime | High | Low | Circuit breaker, fail open |
| Cost Overrun | Medium | Medium | Budget alerts, usage caps |
| Poor Cache Hit Rate | High | Low | Cache warming, strategy tuning |
| Rate Limit Too Strict | Medium | Medium | Generous burst allowance |
| Vendor Lock-In | Low | High | Abstract cache interface |

---

## Future Considerations

### Year 2 Optimization Opportunities

1. **Multi-Region L3**: Replicate Supabase Storage to Asia-Pacific
2. **CDN Upgrade**: Add CloudFlare in front of Supabase for <50ms L3 latency
3. **Redis Clustering**: Scale Vercel KV to multiple clusters
4. **Cost-Based Rate Limiting**: Charge different "costs" per operation
5. **ML-Powered Cache Strategy**: Predict popular structures using ML
6. **Edge Compute**: Move more logic to edge functions

### Technology Reevaluation Triggers

- Cache hit rate <50% for 2 weeks → Reevaluate strategy
- Cost >$200/month → Reevaluate CloudFlare R2
- Latency P99 >1s → Reevaluate CDN setup
- Rate limit violations >20% → Reevaluate limits

---

## References

- [Vercel KV Pricing](https://vercel.com/docs/storage/vercel-kv/pricing)
- [Supabase Storage Pricing](https://supabase.com/pricing)
- [Rate Limiting Algorithms (Stripe)](https://stripe.com/blog/rate-limiters)
- [Cache Strategies (AWS)](https://aws.amazon.com/caching/best-practices/)

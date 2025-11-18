# Cost Tracking Architecture

## Overview

The LAB Visualization Platform cost tracking system provides real-time monitoring, analysis, and optimization recommendations for infrastructure and operational costs across Vercel, Supabase, and custom simulation services.

**Target Budget**: <$500/month for 5,000 users ($0.10 per user)

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Cost Dashboard UI                         │
│  (React Component - Real-time Updates Every 5 Minutes)      │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│              Cost Tracking Service Layer                     │
│  - Vercel Metrics Collection                                 │
│  - Supabase Metrics Collection                               │
│  - Simulation Metrics Tracking                               │
│  - Custom Application Metrics                                │
│  - Cache Management (5-minute TTL)                           │
└────┬───────────────┬───────────────┬──────────────┬─────────┘
     │               │               │              │
     ▼               ▼               ▼              ▼
┌─────────┐  ┌──────────────┐  ┌─────────┐  ┌──────────────┐
│ Vercel  │  │  Supabase    │  │Internal │  │  External    │
│   API   │  │  Mgmt API    │  │Analytics│  │  APIs        │
│         │  │              │  │ DB      │  │(PDB, Alpha)  │
└─────────┘  └──────────────┘  └─────────┘  └──────────────┘
```

## Core Components

### 1. Cost Tracking Service (`/src/services/cost-tracking.ts`)

**Responsibilities**:
- Fetch metrics from Vercel and Supabase APIs
- Collect custom application metrics
- Aggregate and normalize cost data
- Implement caching layer for performance
- Handle API errors gracefully

**Key Methods**:
```typescript
fetchVercelMetrics(): Promise<VercelMetrics>
fetchSupabaseMetrics(): Promise<SupabaseMetrics>
fetchSimulationMetrics(): Promise<SimulationMetrics>
fetchCustomMetrics(): Promise<CustomMetrics>
getCostSummary(): Promise<CostSummary>
getCostTrends(timeRange): Promise<CostTrend[]>
getPopularStructures(): Promise<PopularStructure[]>
```

**Caching Strategy**:
- 5-minute TTL for all metrics
- Stale-while-revalidate pattern
- In-memory cache for fast access
- Automatic cache invalidation

### 2. Cost Calculator Library (`/src/lib/cost-calculator.ts`)

**Responsibilities**:
- Calculate costs based on usage metrics
- Generate projections using linear regression
- Identify cost optimization opportunities
- Analyze feature-level costs
- Format data for display

**Key Functions**:
```typescript
calculateVercelCosts(usage): number
calculateSupabaseCosts(usage): number
calculateSimulationCosts(jobs): number
projectCosts(trends, period, scenario): CostProjection
generateCostAlerts(summary): CostAlert[]
generateOptimizationRecommendations(summary, structures): Recommendation[]
calculateFeatureCosts(summary): FeatureCostBreakdown[]
```

**Projection Algorithm**:
- Linear regression on historical data
- Confidence score based on data variance
- Growth multipliers for different scenarios (conservative, moderate, aggressive)
- 30-day rolling average for trend analysis

### 3. Cost Dashboard Component (`/src/components/admin/CostDashboard.tsx`)

**Responsibilities**:
- Display real-time cost metrics
- Visualize trends with interactive charts
- Show alerts and recommendations
- Enable admin actions (acknowledge alerts, mark recommendations)
- Auto-refresh data every 5 minutes

**Features**:
- Summary cards for total, per-user, and per-service costs
- Real-time alerts with severity levels
- Cost trend visualization
- Feature cost breakdown table
- Optimization recommendations with estimated savings
- Popular structures for caching analysis
- Detailed metrics panel

### 4. Budget Configuration (`/config/cost-budgets.ts`)

**Responsibilities**:
- Define monthly budget limits
- Set alert thresholds
- Configure pricing tiers
- Specify optimization thresholds
- Define tracking intervals

**Key Configurations**:
- Monthly budget: $500 total
- Alert thresholds: 75% warning, 90% critical
- Per-user target: $0.10, max: $0.15
- Cache thresholds, cleanup policies
- Service-specific limits

## Cost Breakdown

### Vercel Costs

**Components**:
- **Bandwidth**: 100GB included, $0.15/GB overage
- **Functions**: 100 GB-hours included, $0.18/GB-hour overage
- **Builds**: 6000 minutes included, $0.005/minute overage
- **Edge Functions**: 500K invocations included, $2.00/million overage

**Optimization Strategies**:
1. Enable CDN caching for static assets
2. Implement response compression
3. Optimize function cold starts
4. Use edge functions for lightweight operations
5. Minimize build frequency

### Supabase Costs

**Components**:
- **Database**: 8GB included (Pro), $0.125/GB/month overage
- **Storage**: 100GB included, $0.021/GB/month overage
- **Bandwidth**: 250GB included, $0.09/GB overage
- **Realtime Connections**: 500 concurrent included, $10.00/1000/month overage
- **Auth**: 100K MAU included, $0.00325/1000 MAU overage
- **Edge Functions**: 2M invocations included, $2.00/million overage

**Optimization Strategies**:
1. Implement data cleanup for old records (>90 days)
2. Archive historical data (>180 days)
3. Optimize database queries
4. Use connection pooling
5. Compress stored files

### Simulation Costs

**Pricing Tiers**:
- **Simple**: $0.10 per job (energy minimization, 30s avg)
- **Medium**: $0.50 per job (short MD, ligand docking, 120s avg)
- **Complex**: $1.00 per job (long MD, advanced analysis, 300s avg)

**Optimization Strategies**:
1. Cache popular structures (10+ views)
2. Pre-compute common simulations
3. Implement result deduplication
4. Set simulation timeouts
5. Validate inputs before execution

## Monitoring & Alerts

### Alert Levels

**Info**:
- General usage updates
- New features deployed
- Scheduled maintenance

**Warning** (75% threshold):
- Approaching budget limit
- Per-user cost exceeds target
- Service approaching quota
- Cache hit rate below 60%

**Critical** (90% threshold):
- Budget limit exceeded
- Per-user cost exceeds maximum
- Service quota exceeded
- High simulation failure rate (>5%)

### Alert Actions

1. **Real-time Notification**: Display in dashboard
2. **Email Alert**: Send to admin team
3. **Slack Integration**: Post to #cost-alerts channel
4. **Auto-Response**: Trigger optimization actions (if configured)
5. **Escalation**: Page on-call if critical threshold breached

## Optimization Recommendations

### Automatic Recommendations

The system generates recommendations based on:

1. **Caching Opportunities**
   - Structures with 10+ views
   - Estimated savings >$2/month
   - Priority based on view count

2. **Bandwidth Optimization**
   - When usage >80% of included bandwidth
   - Image compression suggestions
   - CDN configuration improvements

3. **Storage Cleanup**
   - When storage >80% of limit
   - Automated cleanup scripts
   - Archival strategies

4. **Function Optimization**
   - High function invocation costs
   - Cold start reduction techniques
   - Request batching opportunities

5. **Simulation Efficiency**
   - High failure rates (>5%)
   - Input validation improvements
   - Timeout optimization

### Implementation Tracking

- Recommendations marked as implemented
- Savings tracked post-implementation
- A/B testing for major changes
- ROI calculation for each optimization

## Data Flow

### Metrics Collection Flow

```
1. Dashboard requests update
   ↓
2. Service checks cache (5-min TTL)
   ↓
3. If cache miss:
   a. Fetch Vercel metrics (parallel)
   b. Fetch Supabase metrics (parallel)
   c. Query internal analytics DB (parallel)
   d. Fetch external API stats (parallel)
   ↓
4. Aggregate and normalize data
   ↓
5. Calculate derived metrics:
   - Total costs
   - Per-user costs
   - Projections
   - Trends
   ↓
6. Generate alerts
   ↓
7. Generate recommendations
   ↓
8. Update cache
   ↓
9. Return to dashboard
```

### Dashboard Update Flow

```
1. Component mounts or timer triggers
   ↓
2. Call costTrackingService.getCostSummary()
   ↓
3. Display loading state (if no cached data)
   ↓
4. Receive cost summary
   ↓
5. Update state:
   - Summary cards
   - Alerts
   - Recommendations
   - Trends
   ↓
6. Re-render UI components
   ↓
7. Schedule next update (5 minutes)
```

## API Integration

### Vercel API

**Endpoint**: `https://api.vercel.com/v1/integrations/usage`

**Authentication**: Bearer token

**Response Format**:
```json
{
  "bandwidth": { "used": 67.3, "limit": 100, "cost": 0 },
  "functions": { "invocations": 12450, "duration": 3821, "cost": 18.45 },
  "builds": { "count": 42, "duration": 124, "cost": 0.62 },
  "edgeFunctions": { "invocations": 234567, "cost": 0 },
  "total": 19.07
}
```

### Supabase Management API

**Endpoint**: `https://api.supabase.com/v1/projects/{id}/metrics`

**Authentication**: Service role key

**Response Format**:
```json
{
  "database": { "size": 3.2, "limit": 8, "cost": 0 },
  "storage": { "size": 24.7, "bandwidth": 89.3, "cost": 0.52 },
  "realtime": { "concurrent": 87, "peak": 142, "cost": 0 },
  "auth": { "activeUsers": 2156, "cost": 0 },
  "total": 25.52
}
```

## Performance Considerations

### Caching Strategy

- **Level 1**: Component-level state (React state)
- **Level 2**: Service-level in-memory cache (5-min TTL)
- **Level 3**: API-level caching (Vercel/Supabase)

### Optimization Techniques

1. **Parallel Requests**: Fetch all metrics simultaneously
2. **Stale-While-Revalidate**: Show cached data while fetching new data
3. **Request Batching**: Combine multiple API calls
4. **Lazy Loading**: Load detailed metrics on demand
5. **Virtualization**: Render only visible table rows

### Scalability

- **5K users**: Current implementation handles well
- **50K users**: Requires dedicated analytics DB
- **500K+ users**: Requires data warehouse solution (BigQuery, Snowflake)

## Security

### API Key Management

- Store keys in environment variables
- Use Vercel secrets for production
- Rotate keys quarterly
- Implement least-privilege access

### Data Access Control

- Admin-only dashboard access
- Role-based permissions
- Audit logging for cost data access
- Encrypted data transmission

## Testing Strategy

### Unit Tests

- Cost calculation functions
- Alert generation logic
- Projection algorithms
- Format utilities

### Integration Tests

- API client mocking
- Cache behavior verification
- Error handling scenarios
- Data aggregation correctness

### E2E Tests

- Dashboard rendering
- Real-time updates
- User interactions
- Alert acknowledgment flow

## Future Enhancements

### Phase 2 (Q2 2025)

1. **Predictive Analytics**
   - ML-based cost forecasting
   - Anomaly detection
   - Seasonal trend analysis

2. **Advanced Visualizations**
   - Interactive charts (D3.js)
   - Cost heatmaps
   - Service dependency graphs

3. **Automated Optimization**
   - Auto-enable caching for popular structures
   - Dynamic resource scaling
   - Intelligent request routing

### Phase 3 (Q3 2025)

1. **Multi-tenant Cost Allocation**
   - Per-organization cost tracking
   - Chargeback reports
   - Usage quotas

2. **Integration Expansion**
   - AWS CloudWatch
   - Datadog
   - New Relic
   - Custom metric sources

3. **Cost Governance**
   - Approval workflows for high-cost operations
   - Budget alerts with auto-shutdown
   - Cost center allocation

## Monitoring & Maintenance

### Daily Tasks

- Review critical alerts
- Acknowledge/resolve warnings
- Monitor cache hit rates
- Check API rate limits

### Weekly Tasks

- Analyze cost trends
- Review optimization recommendations
- Update budget projections
- Generate weekly cost report

### Monthly Tasks

- Budget vs. actual analysis
- ROI calculation for optimizations
- Pricing model updates
- Capacity planning review

## Support & Documentation

### Internal Resources

- Architecture diagrams
- API documentation
- Runbooks for common issues
- Cost optimization playbooks

### External Dependencies

- [Vercel API Documentation](https://vercel.com/docs/api)
- [Supabase Management API](https://supabase.com/docs/reference/api)
- [Cost Optimization Best Practices](internal-wiki)

## Conclusion

The cost tracking system provides comprehensive visibility into platform costs with real-time monitoring, intelligent alerts, and actionable optimization recommendations. By maintaining costs below $0.10 per user, the platform ensures sustainable growth while delivering high-quality services.

**Key Success Metrics**:
- Cost per user: <$0.10 (target), <$0.15 (maximum)
- Monthly budget adherence: >95%
- Alert response time: <1 hour for critical, <24 hours for warnings
- Optimization implementation rate: >80% within 30 days
- Cache hit rate: >70% for popular structures

---

**Last Updated**: 2025-11-17
**Version**: 1.0
**Owner**: Engineering Team
**Review Cycle**: Quarterly

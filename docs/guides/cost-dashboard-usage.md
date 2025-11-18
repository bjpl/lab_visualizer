# Cost Dashboard Usage Guide

## Quick Start

### Installation

The cost tracking system is already integrated into the LAB Visualization Platform. No additional installation is required.

### Basic Setup

1. **Configure API Keys** (`.env` file):
```bash
# Vercel API Key (from Vercel dashboard)
VERCEL_API_KEY=your_vercel_api_key

# Supabase Service Key (from Supabase project settings)
SUPABASE_SERVICE_KEY=your_supabase_service_key

# Optional: Custom tracking endpoint
ANALYTICS_API_URL=https://your-analytics-api.com
```

2. **Import and Use the Dashboard**:
```tsx
import CostDashboard from '@/components/admin/CostDashboard';
import '@/components/admin/CostDashboard.css';

function AdminPanel() {
  return (
    <div className="admin-panel">
      <CostDashboard
        refreshInterval={300000}  // 5 minutes
        showDetailedMetrics={true}
        onAlertClick={(alert) => console.log('Alert clicked:', alert)}
        onRecommendationClick={(rec) => console.log('Recommendation:', rec)}
      />
    </div>
  );
}
```

## Component Props

### `CostDashboard` Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `refreshInterval` | `number` | `300000` | Auto-refresh interval in milliseconds (5 min default) |
| `showDetailedMetrics` | `boolean` | `true` | Show/hide detailed metrics section |
| `onAlertClick` | `(alert: CostAlert) => void` | `undefined` | Callback when alert is clicked |
| `onRecommendationClick` | `(rec: OptimizationRecommendation) => void` | `undefined` | Callback when recommendation is clicked |

## Using the Cost Tracking Service

### Standalone Service Usage

```typescript
import { costTrackingService } from '@/services/cost-tracking';

// Get current cost summary
const summary = await costTrackingService.getCostSummary();
console.log('Total cost:', summary.total.current);
console.log('Per-user cost:', summary.users.costPerUser);

// Get cost trends for last 30 days
const trends = await costTrackingService.getCostTrends('30d');
console.log('Trends:', trends);

// Get popular structures for caching
const structures = await costTrackingService.getPopularStructures(20);
console.log('Top 20 structures:', structures);
```

### Custom Configuration

```typescript
import { CostTrackingService } from '@/services/cost-tracking';

// Create custom instance with API keys
const customService = new CostTrackingService({
  vercelApiKey: process.env.VERCEL_API_KEY,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY,
});

// Fetch metrics
const vercelMetrics = await customService.fetchVercelMetrics();
const supabaseMetrics = await customService.fetchSupabaseMetrics();

// Disable caching
customService.setCacheEnabled(false);

// Clear cache manually
customService.clearCache();
```

## Using the Cost Calculator

### Calculate Costs

```typescript
import {
  calculateVercelCosts,
  calculateSupabaseCosts,
  calculateSimulationCosts,
} from '@/lib/cost-calculator';

// Calculate Vercel costs
const vercelCost = calculateVercelCosts({
  bandwidthGB: 150,
  functionGBHours: 250,
  buildMinutes: 6500,
  edgeFunctionInvocations: 1000000,
});

// Calculate Supabase costs
const supabaseCost = calculateSupabaseCosts({
  databaseGB: 12,
  storageGB: 150,
  bandwidthGB: 300,
  concurrentConnections: 800,
  monthlyActiveUsers: 120000,
  edgeFunctionInvocations: 3000000,
});

// Calculate simulation costs
const simCost = calculateSimulationCosts({
  simple: 100,   // 100 simple simulations
  medium: 50,    // 50 medium simulations
  complex: 10,   // 10 complex simulations
});
```

### Generate Projections

```typescript
import { projectCosts } from '@/lib/cost-calculator';

// Get historical trends
const trends = await costTrackingService.getCostTrends('30d');

// Project monthly costs (conservative scenario)
const projection = projectCosts(trends, 'monthly', 'conservative');
console.log('Projected monthly cost:', projection.projected);
console.log('Confidence:', projection.confidence, '%');
console.log('Trend:', projection.basedOn.trend);

// Project weekly costs (moderate scenario)
const weeklyProjection = projectCosts(trends, 'weekly', 'moderate');

// Project daily costs (aggressive scenario)
const dailyProjection = projectCosts(trends, 'daily', 'aggressive');
```

### Generate Alerts

```typescript
import { generateCostAlerts } from '@/lib/cost-calculator';

const summary = await costTrackingService.getCostSummary();
const alerts = generateCostAlerts(summary);

// Filter by severity
const criticalAlerts = alerts.filter(a => a.severity === 'critical');
const warningAlerts = alerts.filter(a => a.severity === 'warning');

// Handle alerts
alerts.forEach(alert => {
  if (alert.severity === 'critical') {
    sendSlackNotification(alert);
    sendEmailAlert(alert);
  }
});
```

### Generate Optimization Recommendations

```typescript
import { generateOptimizationRecommendations } from '@/lib/cost-calculator';

const summary = await costTrackingService.getCostSummary();
const structures = await costTrackingService.getPopularStructures(20);

const recommendations = generateOptimizationRecommendations(summary, structures);

// Sort by potential savings
const topRecommendations = recommendations
  .sort((a, b) => b.estimatedSavings - a.estimatedSavings)
  .slice(0, 5);

// Implement high-priority recommendations
const highPriority = recommendations.filter(r => r.priority === 'high');
```

## Dashboard Features

### 1. Cost Summary Cards

The dashboard displays 6 summary cards:

- **Total Cost**: Current spend and monthly projection
- **Cost Per User**: Per-user cost vs. target
- **Vercel**: Bandwidth, functions, and build metrics
- **Supabase**: Database, storage, and connection metrics
- **Simulations**: Job count, avg cost, and cache hit rate
- **Monthly Projection**: Projected cost with confidence level

### 2. Active Alerts

Alerts are displayed at the top of the dashboard with:
- Severity indicator (⚠️ warning, 🔴 critical)
- Category (total, perUser, vercel, supabase, simulations)
- Detailed message
- Timestamp
- Acknowledge button

### 3. Cost Trends Chart

Interactive SVG chart showing:
- Daily cost trends over selected time range
- Budget threshold line
- Data points with hover tooltips
- 24h, 7d, 30d, 90d time range selector

### 4. Feature Cost Breakdown

Table showing cost allocation by feature:
- Molecular Visualization
- Real-Time Simulations
- Collaborative Sessions
- Data Storage
- Learning Content

Each row includes:
- Total cost
- Usage count
- Cost per use
- Percentage of total

### 5. Optimization Recommendations

Cards showing actionable recommendations:
- Priority badge (high, medium, low)
- Estimated monthly savings
- Detailed description
- "Mark Implemented" button

Categories:
- Caching opportunities
- Bandwidth optimization
- Storage cleanup
- Function optimization
- Simulation efficiency

### 6. Popular Structures for Caching

Table showing most-viewed structures:
- Structure ID and name
- Source (PDB, AlphaFold, upload)
- View count
- Simulation count
- Estimated savings from caching
- Cache action button

### 7. Detailed Metrics

Optional section showing:
- API call breakdown (RCSB, AlphaFold, UniProt)
- Visualization metrics (rendered, cached, hit rate)
- Session statistics (active, collaborative, avg duration)
- Simulation success rate

## Automation Examples

### Automated Alert Handling

```typescript
import { costTrackingService } from '@/services/cost-tracking';
import { generateCostAlerts } from '@/lib/cost-calculator';

// Check costs every 10 minutes
setInterval(async () => {
  const summary = await costTrackingService.getCostSummary();
  const alerts = generateCostAlerts(summary);

  const unacknowledged = alerts.filter(a => !a.acknowledged);

  for (const alert of unacknowledged) {
    if (alert.severity === 'critical') {
      await sendPagerDutyAlert(alert);
      await sendSlackNotification(alert);
      await sendEmailAlert(alert);
    } else if (alert.severity === 'warning') {
      await sendSlackNotification(alert);
    }
  }
}, 600000); // 10 minutes
```

### Automated Cache Implementation

```typescript
import { costTrackingService } from '@/services/cost-tracking';
import { OPTIMIZATION_THRESHOLDS } from '@/config/cost-budgets';

// Daily job to identify and cache popular structures
async function autoCachePopularStructures() {
  const structures = await costTrackingService.getPopularStructures(50);

  const cacheableSt = structures.filter(s =>
    s.cacheCandidate &&
    s.views >= OPTIMIZATION_THRESHOLDS.caching.minViews &&
    s.estimatedSavings >= OPTIMIZATION_THRESHOLDS.caching.minSavings
  );

  for (const structure of cacheableStructures) {
    try {
      await cacheStructure(structure.id);
      console.log(`Cached structure ${structure.id}, savings: $${structure.estimatedSavings}/mo`);
    } catch (error) {
      console.error(`Failed to cache ${structure.id}:`, error);
    }
  }
}

// Run daily at 2 AM
cron.schedule('0 2 * * *', autoCachePopularStructures);
```

### Cost Budget Monitoring

```typescript
import { costTrackingService } from '@/services/cost-tracking';
import { COST_BUDGETS } from '@/config/cost-budgets';

async function checkBudgetCompliance() {
  const summary = await costTrackingService.getCostSummary();
  const { total, users } = summary;

  // Check total budget
  if (total.projected > COST_BUDGETS.monthly.total) {
    console.warn(`Projected cost ($${total.projected}) exceeds budget ($${COST_BUDGETS.monthly.total})`);
    await triggerCostReductionPlan();
  }

  // Check per-user cost
  if (users.costPerUser > COST_BUDGETS.perUser.max) {
    console.error(`Per-user cost ($${users.costPerUser}) exceeds maximum ($${COST_BUDGETS.perUser.max})`);
    await escalateToManagement();
  }

  // Generate report
  const report = generateBudgetReport(summary);
  await saveBudgetReport(report);
}

// Run daily
cron.schedule('0 0 * * *', checkBudgetCompliance);
```

## Best Practices

### 1. Regular Monitoring

- Check dashboard daily for critical alerts
- Review weekly cost trends
- Analyze monthly budget compliance
- Update projections quarterly

### 2. Alert Management

- Acknowledge alerts within 1 hour (critical) or 24 hours (warning)
- Document resolution actions
- Track alert frequency to identify systemic issues
- Set up escalation paths for unresolved alerts

### 3. Optimization Implementation

- Prioritize high-savings recommendations
- Implement optimizations incrementally
- Test in staging before production
- Track actual savings post-implementation
- Calculate ROI for each optimization

### 4. Cache Strategy

- Cache structures with 10+ views
- Review cache effectiveness monthly
- Purge unused cache entries (>30 days without access)
- Monitor cache storage costs
- Balance cache size vs. compute costs

### 5. Cost Allocation

- Tag resources by feature/team
- Track costs per feature
- Identify cost-intensive features
- Optimize high-cost areas first
- Review allocation quarterly

### 6. Capacity Planning

- Project costs for 3, 6, 12 months
- Plan for seasonal variations
- Account for feature launches
- Budget for growth scenarios
- Set aside contingency funds (10% buffer)

## Troubleshooting

### Dashboard Not Loading

**Symptoms**: Loading spinner never completes

**Solutions**:
1. Check API keys in environment variables
2. Verify network connectivity
3. Check browser console for errors
4. Verify service availability
5. Clear browser cache

### Incorrect Cost Data

**Symptoms**: Costs don't match actual bills

**Solutions**:
1. Verify API key permissions
2. Check date range settings
3. Compare with Vercel/Supabase dashboards
4. Review cost calculation logic
5. Clear cache and refresh

### High Cache Miss Rate

**Symptoms**: Cache hit rate <50%

**Solutions**:
1. Increase cache TTL
2. Review popular structures
3. Pre-cache common simulations
4. Optimize cache invalidation logic
5. Monitor cache size limits

### Alert Fatigue

**Symptoms**: Too many alerts, desensitization

**Solutions**:
1. Adjust alert thresholds
2. Implement alert cooldown periods
3. Group similar alerts
4. Auto-acknowledge minor alerts
5. Focus on critical issues

## Support

For issues or questions:
- Internal: #cost-tracking Slack channel
- Engineering: cost-tracking@company.com
- Documentation: /docs/architecture/cost-tracking.md
- Runbooks: /docs/runbooks/cost-tracking/

---

**Last Updated**: 2025-11-17
**Version**: 1.0
**Next Review**: 2025-12-17

/**
 * Cost Calculator Library
 *
 * Provides utility functions for calculating costs, projections,
 * and optimization recommendations for the LAB Visualization Platform.
 */

import {
  CostSummary,
  CostTrend,
  CostProjection,
  CostAlert,
  OptimizationRecommendation,
  FeatureCostBreakdown,
  TimeRange,
  DateRange,
} from '../types/cost-tracking';
import {
  COST_BUDGETS,
  VERCEL_PRICING,
  SUPABASE_PRICING,
  SIMULATION_PRICING,
  OPTIMIZATION_THRESHOLDS,
  GROWTH_PROJECTIONS,
} from '../../config/cost-budgets';

/**
 * Calculate Vercel costs based on usage metrics
 */
export function calculateVercelCosts(usage: {
  bandwidthGB: number;
  functionGBHours: number;
  buildMinutes: number;
  edgeFunctionInvocations: number;
}): number {
  const bandwidthOverage = Math.max(0, usage.bandwidthGB - VERCEL_PRICING.bandwidth.included);
  const functionOverage = Math.max(0, usage.functionGBHours - VERCEL_PRICING.functions.included);
  const buildOverage = Math.max(0, usage.buildMinutes - VERCEL_PRICING.builds.included);
  const edgeOverage = Math.max(0, usage.edgeFunctionInvocations - VERCEL_PRICING.edgeFunctions.included);

  return (
    bandwidthOverage * VERCEL_PRICING.bandwidth.overageCostPerGB +
    functionOverage * VERCEL_PRICING.functions.overageCostPerGBHour +
    buildOverage * VERCEL_PRICING.builds.overageCostPerMinute +
    (edgeOverage / 1000000) * VERCEL_PRICING.edgeFunctions.overageCostPer1M
  );
}

/**
 * Calculate Supabase costs based on usage metrics
 */
export function calculateSupabaseCosts(usage: {
  databaseGB: number;
  storageGB: number;
  bandwidthGB: number;
  concurrentConnections: number;
  monthlyActiveUsers: number;
  edgeFunctionInvocations: number;
}): number {
  const dbOverage = Math.max(0, usage.databaseGB - SUPABASE_PRICING.database.included);
  const storageOverage = Math.max(0, usage.storageGB - SUPABASE_PRICING.storage.included);
  const bandwidthOverage = Math.max(0, usage.bandwidthGB - SUPABASE_PRICING.bandwidth.included);
  const connectionOverage = Math.max(0, usage.concurrentConnections - SUPABASE_PRICING.realtimeConnections.included);
  const authOverage = Math.max(0, usage.monthlyActiveUsers - SUPABASE_PRICING.auth.included);
  const edgeOverage = Math.max(0, usage.edgeFunctionInvocations - SUPABASE_PRICING.edgeFunctions.included);

  return (
    dbOverage * SUPABASE_PRICING.database.overageCostPerGB +
    storageOverage * SUPABASE_PRICING.storage.overageCostPerGB +
    bandwidthOverage * SUPABASE_PRICING.bandwidth.overageCostPerGB +
    (connectionOverage / 1000) * SUPABASE_PRICING.realtimeConnections.overageCostPer1K +
    (authOverage / 1000) * SUPABASE_PRICING.auth.overageCostPer1K +
    (edgeOverage / 1000000) * SUPABASE_PRICING.edgeFunctions.overageCostPer1M
  );
}

/**
 * Calculate simulation costs based on job types and count
 */
export function calculateSimulationCosts(jobs: {
  simple: number;
  medium: number;
  complex: number;
}): number {
  return (
    jobs.simple * SIMULATION_PRICING.simple.computeCost +
    jobs.medium * SIMULATION_PRICING.medium.computeCost +
    jobs.complex * SIMULATION_PRICING.complex.computeCost
  );
}

/**
 * Calculate cost savings from caching
 */
export function calculateCachingSavings(cacheHits: number, avgSimCost: number = 0.25): number {
  return cacheHits * avgSimCost;
}

/**
 * Generate cost projection based on historical trends
 */
export function projectCosts(
  trends: CostTrend[],
  period: 'daily' | 'weekly' | 'monthly',
  growthScenario: 'conservative' | 'moderate' | 'aggressive' = 'moderate'
): CostProjection {
  if (trends.length < 2) {
    return {
      period,
      projected: trends[0]?.total || 0,
      confidence: 0,
      basedOn: { days: 0, trend: 'stable' },
    };
  }

  // Calculate linear regression for trend
  const sortedTrends = [...trends].sort((a, b) => a.date.getTime() - b.date.getTime());
  const n = sortedTrends.length;

  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  sortedTrends.forEach((trend, i) => {
    sumX += i;
    sumY += trend.total;
    sumXY += i * trend.total;
    sumXX += i * i;
  });

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Determine trend direction
  const trendDirection = slope > 0.05 ? 'increasing' : slope < -0.05 ? 'decreasing' : 'stable';

  // Apply growth multiplier
  const growth = GROWTH_PROJECTIONS[growthScenario];
  const growthMultiplier = 1 + (growth.userGrowthRate + growth.usageGrowthRate);

  // Project based on period
  let daysToProject: number;
  switch (period) {
    case 'daily':
      daysToProject = 1;
      break;
    case 'weekly':
      daysToProject = 7;
      break;
    case 'monthly':
      daysToProject = 30;
      break;
  }

  const baseProjection = slope * (n + daysToProject - 1) + intercept;
  const projected = baseProjection * Math.pow(growthMultiplier, daysToProject / 30);

  // Calculate confidence based on data consistency
  const variance = sortedTrends.reduce((sum, trend) => {
    const expected = slope * sortedTrends.indexOf(trend) + intercept;
    return sum + Math.pow(trend.total - expected, 2);
  }, 0) / n;

  const stdDev = Math.sqrt(variance);
  const avgValue = sumY / n;
  const confidence = Math.max(0, Math.min(100, 100 - (stdDev / avgValue) * 100));

  return {
    period,
    projected: Math.max(0, projected),
    confidence: Math.round(confidence),
    basedOn: {
      days: n,
      trend: trendDirection,
    },
  };
}

/**
 * Generate cost alerts based on current usage and budgets
 */
export function generateCostAlerts(summary: CostSummary): CostAlert[] {
  const alerts: CostAlert[] = [];
  const { total, users } = summary;
  const budget = COST_BUDGETS.monthly.total;
  const percentUsed = (total.current / budget) * 100;

  // Total budget alerts
  if (percentUsed >= COST_BUDGETS.alerts.critical) {
    alerts.push({
      id: `alert-total-critical-${Date.now()}`,
      severity: 'critical',
      category: 'total',
      message: `Critical: ${percentUsed.toFixed(1)}% of monthly budget used ($${total.current.toFixed(2)} / $${budget})`,
      threshold: COST_BUDGETS.alerts.critical,
      current: percentUsed,
      timestamp: new Date(),
      acknowledged: false,
    });
  } else if (percentUsed >= COST_BUDGETS.alerts.warning) {
    alerts.push({
      id: `alert-total-warning-${Date.now()}`,
      severity: 'warning',
      category: 'total',
      message: `Warning: ${percentUsed.toFixed(1)}% of monthly budget used ($${total.current.toFixed(2)} / $${budget})`,
      threshold: COST_BUDGETS.alerts.warning,
      current: percentUsed,
      timestamp: new Date(),
      acknowledged: false,
    });
  }

  // Per-user cost alerts
  if (users.costPerUser > COST_BUDGETS.perUser.max) {
    alerts.push({
      id: `alert-peruser-critical-${Date.now()}`,
      severity: 'critical',
      category: 'perUser',
      message: `Critical: Cost per user ($${users.costPerUser.toFixed(3)}) exceeds maximum ($${COST_BUDGETS.perUser.max})`,
      threshold: COST_BUDGETS.perUser.max,
      current: users.costPerUser,
      timestamp: new Date(),
      acknowledged: false,
    });
  } else if (users.costPerUser > COST_BUDGETS.perUser.target * 1.2) {
    alerts.push({
      id: `alert-peruser-warning-${Date.now()}`,
      severity: 'warning',
      category: 'perUser',
      message: `Warning: Cost per user ($${users.costPerUser.toFixed(3)}) exceeds target ($${COST_BUDGETS.perUser.target})`,
      threshold: COST_BUDGETS.perUser.target,
      current: users.costPerUser,
      timestamp: new Date(),
      acknowledged: false,
    });
  }

  // Service-specific alerts
  const vercelPercent = (summary.vercel.total / COST_BUDGETS.monthly.vercel) * 100;
  if (vercelPercent >= 90) {
    alerts.push({
      id: `alert-vercel-${Date.now()}`,
      severity: vercelPercent >= 100 ? 'critical' : 'warning',
      category: 'vercel',
      message: `Vercel costs at ${vercelPercent.toFixed(1)}% of budget ($${summary.vercel.total.toFixed(2)})`,
      threshold: COST_BUDGETS.monthly.vercel,
      current: summary.vercel.total,
      timestamp: new Date(),
      acknowledged: false,
    });
  }

  const supabasePercent = (summary.supabase.total / COST_BUDGETS.monthly.supabase) * 100;
  if (supabasePercent >= 90) {
    alerts.push({
      id: `alert-supabase-${Date.now()}`,
      severity: supabasePercent >= 100 ? 'critical' : 'warning',
      category: 'supabase',
      message: `Supabase costs at ${supabasePercent.toFixed(1)}% of budget ($${summary.supabase.total.toFixed(2)})`,
      threshold: COST_BUDGETS.monthly.supabase,
      current: summary.supabase.total,
      timestamp: new Date(),
      acknowledged: false,
    });
  }

  return alerts;
}

/**
 * Generate optimization recommendations based on usage patterns
 */
export function generateOptimizationRecommendations(
  summary: CostSummary,
  popularStructures: Array<{ views: number; simulations: number; id: string; name: string }>
): OptimizationRecommendation[] {
  const recommendations: OptimizationRecommendation[] = [];

  // Caching recommendations
  const cacheableStructures = popularStructures.filter(
    s => s.views >= OPTIMIZATION_THRESHOLDS.caching.minViews
  );

  if (cacheableStructures.length > 0 && summary.simulations.caching.hitRate < 70) {
    const estimatedSavings = cacheableStructures.reduce((sum, s) => {
      return sum + (s.simulations * SIMULATION_PRICING.caching.savingsPerHit);
    }, 0);

    if (estimatedSavings >= OPTIMIZATION_THRESHOLDS.caching.minSavings) {
      recommendations.push({
        id: `opt-caching-${Date.now()}`,
        category: 'caching',
        title: 'Implement Structure Caching',
        description: `Cache ${cacheableStructures.length} popular structures to reduce simulation costs. Current cache hit rate: ${summary.simulations.caching.hitRate.toFixed(1)}%`,
        estimatedSavings,
        priority: estimatedSavings > 50 ? 'high' : 'medium',
        implemented: false,
      });
    }
  }

  // Bandwidth optimization
  if (summary.vercel.bandwidth.used > VERCEL_PRICING.bandwidth.included * 0.8) {
    recommendations.push({
      id: `opt-bandwidth-${Date.now()}`,
      category: 'bandwidth',
      title: 'Optimize Bandwidth Usage',
      description: 'Implement image compression, enable CDN caching, and lazy-load large assets to reduce bandwidth costs.',
      estimatedSavings: (summary.vercel.bandwidth.used - VERCEL_PRICING.bandwidth.included) *
                        VERCEL_PRICING.bandwidth.overageCostPerGB * 0.5,
      priority: 'high',
      implemented: false,
    });
  }

  // Storage optimization
  if (summary.supabase.storage.size > SUPABASE_PRICING.storage.included * 0.8) {
    recommendations.push({
      id: `opt-storage-${Date.now()}`,
      category: 'storage',
      title: 'Clean Up Old Data',
      description: `Implement automated cleanup of data older than ${OPTIMIZATION_THRESHOLDS.database.cleanupThreshold} days and archival of data older than ${OPTIMIZATION_THRESHOLDS.database.archiveThreshold} days.`,
      estimatedSavings: (summary.supabase.storage.size - SUPABASE_PRICING.storage.included) *
                        SUPABASE_PRICING.storage.overageCostPerGB * 0.3,
      priority: 'medium',
      implemented: false,
    });
  }

  // Function optimization
  if (summary.vercel.functions.invocations > VERCEL_PRICING.functions.included * 0.8) {
    recommendations.push({
      id: `opt-functions-${Date.now()}`,
      category: 'functions',
      title: 'Optimize Function Execution',
      description: 'Reduce function cold starts, implement request batching, and optimize function runtime to reduce costs.',
      estimatedSavings: summary.vercel.functions.cost * 0.2,
      priority: 'medium',
      implemented: false,
    });
  }

  // Simulation optimization
  if (summary.simulations.jobs.failed / summary.simulations.jobs.total > 0.05) {
    const failedCost = (summary.simulations.jobs.failed * summary.simulations.costs.perJob.avg);
    recommendations.push({
      id: `opt-simulations-${Date.now()}`,
      category: 'simulations',
      title: 'Reduce Failed Simulations',
      description: `${((summary.simulations.jobs.failed / summary.simulations.jobs.total) * 100).toFixed(1)}% of simulations are failing. Implement better validation and error handling.`,
      estimatedSavings: failedCost,
      priority: 'high',
      implemented: false,
    });
  }

  return recommendations.sort((a, b) => {
    const priorityWeight = { high: 3, medium: 2, low: 1 };
    return (priorityWeight[b.priority] - priorityWeight[a.priority]) ||
           (b.estimatedSavings - a.estimatedSavings);
  });
}

/**
 * Calculate feature cost breakdown
 */
export function calculateFeatureCosts(summary: CostSummary): FeatureCostBreakdown[] {
  const total = summary.total.current;

  return [
    {
      feature: 'Molecular Visualization',
      cost: summary.vercel.bandwidth.cost * 0.4 + summary.supabase.storage.cost * 0.3,
      usage: summary.custom.visualizations.rendered,
      costPerUse: 0,
      percentOfTotal: 0,
    },
    {
      feature: 'Real-Time Simulations',
      cost: summary.simulations.costs.total,
      usage: summary.simulations.jobs.total,
      costPerUse: summary.simulations.costs.perJob.avg,
      percentOfTotal: (summary.simulations.costs.total / total) * 100,
    },
    {
      feature: 'Collaborative Sessions',
      cost: summary.supabase.realtimeConnections.cost + summary.vercel.functions.cost * 0.2,
      usage: summary.custom.sessions.collaborative,
      costPerUse: 0,
      percentOfTotal: 0,
    },
    {
      feature: 'Data Storage',
      cost: summary.supabase.database.cost + summary.supabase.storage.cost * 0.7,
      usage: summary.users.totalUsers,
      costPerUse: 0,
      percentOfTotal: 0,
    },
    {
      feature: 'Learning Content',
      cost: summary.vercel.bandwidth.cost * 0.2 + summary.supabase.storage.cost * 0.1,
      usage: summary.users.activeUsers,
      costPerUse: 0,
      percentOfTotal: 0,
    },
  ].map(feature => {
    const costPerUse = feature.usage > 0 ? feature.cost / feature.usage : 0;
    const percentOfTotal = (feature.cost / total) * 100;
    return { ...feature, costPerUse, percentOfTotal };
  });
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number, decimals: number = 2): string {
  return `$${amount.toFixed(decimals)}`;
}

/**
 * Format percentage for display
 */
export function formatPercent(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Get date range for time range selector
 */
export function getDateRange(timeRange: TimeRange, customRange?: DateRange): DateRange {
  const end = new Date();
  let start = new Date();

  switch (timeRange) {
    case '24h':
      start.setDate(start.getDate() - 1);
      break;
    case '7d':
      start.setDate(start.getDate() - 7);
      break;
    case '30d':
      start.setDate(start.getDate() - 30);
      break;
    case '90d':
      start.setDate(start.getDate() - 90);
      break;
    case 'custom':
      if (customRange) {
        return customRange;
      }
      start.setDate(start.getDate() - 30); // Default to 30 days
      break;
  }

  return { start, end };
}

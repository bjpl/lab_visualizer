/**
 * Cost Budget Configuration
 *
 * Defines budget thresholds, alerts, and limits for the LAB Visualization Platform.
 * Target: <$500/month for 5K users
 */

import { CostBudget } from '../src/types/cost-tracking';

export const COST_BUDGETS: CostBudget = {
  monthly: {
    total: 500, // USD - target maximum
    vercel: 150, // USD - 30% of budget
    supabase: 150, // USD - 30% of budget
    simulations: 150, // USD - 30% of budget
    buffer: 10, // 10% buffer for unexpected costs
  },
  alerts: {
    warning: 75, // Alert at 75% of budget
    critical: 90, // Critical alert at 90% of budget
  },
  perUser: {
    target: 0.10, // $0.10 per user target
    max: 0.15, // $0.15 per user maximum
  },
};

// Vercel pricing tiers (Hobby/Pro)
export const VERCEL_PRICING = {
  bandwidth: {
    included: 100, // GB included
    overageCostPerGB: 0.15, // USD per GB
  },
  functions: {
    included: 100, // GB-hours included
    overageCostPerGBHour: 0.18, // USD per GB-hour
  },
  builds: {
    included: 6000, // minutes included
    overageCostPerMinute: 0.005, // USD per minute
  },
  edgeFunctions: {
    included: 500000, // invocations included
    overageCostPer1M: 2.0, // USD per million
  },
};

// Supabase pricing tiers (Free/Pro)
export const SUPABASE_PRICING = {
  database: {
    included: 8, // GB included (Pro tier)
    overageCostPerGB: 0.125, // USD per GB per month
  },
  storage: {
    included: 100, // GB included (Pro tier)
    overageCostPerGB: 0.021, // USD per GB per month
  },
  bandwidth: {
    included: 250, // GB included (Pro tier)
    overageCostPerGB: 0.09, // USD per GB
  },
  realtimeConnections: {
    included: 500, // concurrent connections included (Pro tier)
    overageCostPer1K: 10.0, // USD per 1000 connections per month
  },
  auth: {
    included: 100000, // MAU included (Pro tier)
    overageCostPer1K: 0.00325, // USD per 1000 MAU
  },
  edgeFunctions: {
    included: 2000000, // invocations included (Pro tier)
    overageCostPer1M: 2.0, // USD per million
  },
};

// Simulation cost estimates
export const SIMULATION_PRICING = {
  simple: {
    // Energy minimization, basic visualization
    computeCost: 0.10, // USD per job
    avgDuration: 30, // seconds
  },
  medium: {
    // Short MD simulation, ligand docking
    computeCost: 0.50, // USD per job
    avgDuration: 120, // seconds
  },
  complex: {
    // Long MD simulation, advanced analysis
    computeCost: 1.00, // USD per job
    avgDuration: 300, // seconds
  },
  caching: {
    savingsPerHit: 0.25, // USD saved per cache hit (avg)
    storageCostPerGB: 0.021, // USD per GB per month
  },
};

// Cost optimization thresholds
export const OPTIMIZATION_THRESHOLDS = {
  caching: {
    minViews: 10, // Minimum views to consider caching
    minSavings: 2.0, // Minimum monthly savings to implement (USD)
  },
  bandwidth: {
    compressionThreshold: 1024, // KB - compress responses larger than this
    cdnCacheThreshold: 100, // KB - cache assets larger than this
  },
  database: {
    cleanupThreshold: 90, // days - cleanup data older than this
    archiveThreshold: 180, // days - archive data older than this
  },
  simulations: {
    cacheDuration: 30, // days - how long to cache simulation results
    maxCacheSize: 50, // GB - maximum cache size
  },
};

// Feature cost allocation
export const FEATURE_BUDGET_ALLOCATION = {
  visualization: 0.25, // 25% of budget
  simulation: 0.30, // 30% of budget
  collaboration: 0.15, // 15% of budget
  learning: 0.10, // 10% of budget
  storage: 0.10, // 10% of budget
  other: 0.10, // 10% of budget
};

// Cost tracking intervals
export const TRACKING_CONFIG = {
  metrics: {
    collectionInterval: 300000, // 5 minutes in milliseconds
    aggregationInterval: 3600000, // 1 hour in milliseconds
    retentionDays: 90, // Keep detailed metrics for 90 days
  },
  alerts: {
    checkInterval: 600000, // 10 minutes in milliseconds
    cooldownPeriod: 3600000, // 1 hour cooldown between same alerts
  },
  caching: {
    ttl: 300, // 5 minutes cache TTL for cost data
    staleWhileRevalidate: 60, // 1 minute stale-while-revalidate
  },
};

// User tier limits
export const USER_TIER_LIMITS = {
  free: {
    maxSimulationsPerDay: 10,
    maxStorageGB: 1,
    maxCollaborators: 3,
    features: ['basic-viz', 'simple-sim'],
  },
  pro: {
    maxSimulationsPerDay: 100,
    maxStorageGB: 50,
    maxCollaborators: 20,
    features: ['basic-viz', 'simple-sim', 'advanced-sim', 'collab', 'export'],
  },
  enterprise: {
    maxSimulationsPerDay: -1, // unlimited
    maxStorageGB: 500,
    maxCollaborators: -1, // unlimited
    features: ['all'],
  },
};

// Expected growth projections
export const GROWTH_PROJECTIONS = {
  conservative: {
    userGrowthRate: 0.10, // 10% monthly growth
    usageGrowthRate: 0.05, // 5% monthly growth per user
  },
  moderate: {
    userGrowthRate: 0.20, // 20% monthly growth
    usageGrowthRate: 0.10, // 10% monthly growth per user
  },
  aggressive: {
    userGrowthRate: 0.50, // 50% monthly growth
    usageGrowthRate: 0.20, // 20% monthly growth per user
  },
};

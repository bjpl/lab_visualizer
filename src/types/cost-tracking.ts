/**
 * Cost Tracking Types for LAB Visualization Platform
 *
 * Defines all cost-related metrics, budgets, and tracking interfaces
 * for Vercel, Supabase, and custom simulation costs.
 */

export interface VercelMetrics {
  bandwidth: {
    used: number; // GB
    limit: number; // GB
    cost: number; // USD
  };
  functions: {
    invocations: number;
    duration: number; // seconds
    cost: number; // USD
  };
  builds: {
    count: number;
    duration: number; // minutes
    cost: number; // USD
  };
  edgeFunctions: {
    invocations: number;
    cost: number; // USD
  };
  total: number; // USD
}

export interface SupabaseMetrics {
  database: {
    size: number; // GB
    limit: number; // GB
    cost: number; // USD
  };
  storage: {
    size: number; // GB
    bandwidth: number; // GB
    cost: number; // USD
  };
  realtimeConnections: {
    concurrent: number;
    peak: number;
    cost: number; // USD
  };
  auth: {
    activeUsers: number;
    cost: number; // USD
  };
  edgeFunctions: {
    invocations: number;
    cost: number; // USD
  };
  total: number; // USD
}

export interface SimulationMetrics {
  jobs: {
    total: number;
    successful: number;
    failed: number;
    avgDuration: number; // seconds
  };
  costs: {
    perJob: {
      min: number;
      max: number;
      avg: number;
    };
    total: number; // USD
  };
  caching: {
    hits: number;
    misses: number;
    hitRate: number; // percentage
    savedCost: number; // USD
  };
}

export interface CustomMetrics {
  apiCalls: {
    rcsb: number;
    alphafold: number;
    uniprot: number;
    total: number;
  };
  visualizations: {
    rendered: number;
    cached: number;
    cacheHitRate: number; // percentage
  };
  sessions: {
    active: number;
    collaborative: number;
    avgDuration: number; // minutes
  };
}

export interface UserMetrics {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  costPerUser: number; // USD
}

export interface CostSummary {
  vercel: VercelMetrics;
  supabase: SupabaseMetrics;
  simulations: SimulationMetrics;
  custom: CustomMetrics;
  users: UserMetrics;
  total: {
    current: number; // USD
    projected: number; // USD
    budget: number; // USD
    percentOfBudget: number;
  };
  timestamp: Date;
}

export interface CostBudget {
  monthly: {
    total: number; // USD
    vercel: number;
    supabase: number;
    simulations: number;
    buffer: number; // percentage
  };
  alerts: {
    warning: number; // percentage threshold
    critical: number; // percentage threshold
  };
  perUser: {
    target: number; // USD
    max: number; // USD
  };
}

export interface CostTrend {
  date: Date;
  total: number;
  vercel: number;
  supabase: number;
  simulations: number;
  users: number;
}

export interface CostAlert {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  category: 'vercel' | 'supabase' | 'simulations' | 'total' | 'perUser';
  message: string;
  threshold: number;
  current: number;
  timestamp: Date;
  acknowledged: boolean;
}

export interface OptimizationRecommendation {
  id: string;
  category: 'caching' | 'bandwidth' | 'storage' | 'functions' | 'simulations';
  title: string;
  description: string;
  estimatedSavings: number; // USD per month
  priority: 'low' | 'medium' | 'high';
  implemented: boolean;
}

export interface PopularStructure {
  id: string;
  name: string;
  source: 'pdb' | 'alphafold' | 'upload';
  views: number;
  simulations: number;
  cacheCandidate: boolean;
  estimatedSavings: number; // USD per month
}

export interface FeatureCostBreakdown {
  feature: string;
  cost: number;
  usage: number;
  costPerUse: number;
  percentOfTotal: number;
}

export interface CostProjection {
  period: 'daily' | 'weekly' | 'monthly';
  projected: number;
  confidence: number; // percentage
  basedOn: {
    days: number;
    trend: 'increasing' | 'stable' | 'decreasing';
  };
}

export type TimeRange = '24h' | '7d' | '30d' | '90d' | 'custom';

export interface DateRange {
  start: Date;
  end: Date;
}

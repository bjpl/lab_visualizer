/**
 * Cost Tracking Service
 *
 * Handles collection of cost metrics from Vercel, Supabase,
 * and custom application metrics for the LAB Visualization Platform.
 */

import { COST_BUDGETS, TRACKING_CONFIG } from '../../config/cost-budgets';
import {
  calculateVercelCosts,
  calculateSupabaseCosts,
  calculateSimulationCosts,
  calculateCachingSavings,
  getDateRange,
} from '../lib/cost-calculator';
import type {
  CostSummary,
  CostTrend,
  VercelMetrics,
  SupabaseMetrics,
  SimulationMetrics,
  CustomMetrics,
  UserMetrics,
  PopularStructure,
  TimeRange} from '../types/cost-tracking';
import {
  DateRange,
} from '../types/cost-tracking';

/**
 * Cost Tracking Service Class
 */
export class CostTrackingService {
  private vercelApiKey: string | null = null;
  private supabaseServiceKey: string | null = null;
  private cacheEnabled: boolean = true;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();

  constructor(config?: { vercelApiKey?: string; supabaseServiceKey?: string }) {
    if (config?.vercelApiKey) {
      this.vercelApiKey = config.vercelApiKey;
    }
    if (config?.supabaseServiceKey) {
      this.supabaseServiceKey = config.supabaseServiceKey;
    }
  }

  /**
   * Fetch Vercel metrics from API
   */
  async fetchVercelMetrics(): Promise<VercelMetrics> {
    const cacheKey = 'vercel-metrics';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      if (!this.vercelApiKey) {
        // Return mock data for development
        return this.getMockVercelMetrics();
      }

      // In production, fetch from Vercel API
      const response = await fetch('https://api.vercel.com/v1/integrations/usage', {
        headers: {
          Authorization: `Bearer ${this.vercelApiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Vercel API error: ${response.statusText}`);
      }

      const data = await response.json();
      const metrics = this.parseVercelMetrics(data);

      this.setCache(cacheKey, metrics);
      return metrics;
    } catch (error) {
      console.error('Error fetching Vercel metrics:', error);
      return this.getMockVercelMetrics();
    }
  }

  /**
   * Fetch Supabase metrics from API
   */
  async fetchSupabaseMetrics(): Promise<SupabaseMetrics> {
    const cacheKey = 'supabase-metrics';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      if (!this.supabaseServiceKey) {
        // Return mock data for development
        return this.getMockSupabaseMetrics();
      }

      // In production, fetch from Supabase Management API
      const response = await fetch('https://api.supabase.com/v1/projects/metrics', {
        headers: {
          Authorization: `Bearer ${this.supabaseServiceKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Supabase API error: ${response.statusText}`);
      }

      const data = await response.json();
      const metrics = this.parseSupabaseMetrics(data);

      this.setCache(cacheKey, metrics);
      return metrics;
    } catch (error) {
      console.error('Error fetching Supabase metrics:', error);
      return this.getMockSupabaseMetrics();
    }
  }

  /**
   * Fetch custom application metrics
   */
  async fetchCustomMetrics(): Promise<CustomMetrics> {
    const cacheKey = 'custom-metrics';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    // In production, query from your analytics/tracking system
    // For now, return mock data
    const metrics: CustomMetrics = {
      apiCalls: {
        rcsb: 1245,
        alphafold: 856,
        uniprot: 432,
        total: 2533,
      },
      visualizations: {
        rendered: 8234,
        cached: 5821,
        cacheHitRate: 70.7,
      },
      sessions: {
        active: 142,
        collaborative: 38,
        avgDuration: 24.5,
      },
    };

    this.setCache(cacheKey, metrics);
    return metrics;
  }

  /**
   * Fetch simulation metrics
   */
  async fetchSimulationMetrics(): Promise<SimulationMetrics> {
    const cacheKey = 'simulation-metrics';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    // In production, query from your simulation tracking system
    // For now, return mock data
    const metrics: SimulationMetrics = {
      jobs: {
        total: 523,
        successful: 498,
        failed: 25,
        avgDuration: 87,
      },
      costs: {
        perJob: {
          min: 0.10,
          max: 1.00,
          avg: 0.31,
        },
        total: 162.13,
      },
      caching: {
        hits: 234,
        misses: 289,
        hitRate: 44.7,
        savedCost: 58.50,
      },
    };

    this.setCache(cacheKey, metrics);
    return metrics;
  }

  /**
   * Fetch user metrics
   */
  async fetchUserMetrics(): Promise<UserMetrics> {
    const cacheKey = 'user-metrics';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    // In production, query from your user database
    // For now, return mock data
    const totalUsers = 3847;
    const activeUsers = 2156;
    const newUsers = 234;

    const metrics: UserMetrics = {
      totalUsers,
      activeUsers,
      newUsers,
      costPerUser: 0, // Will be calculated later
    };

    this.setCache(cacheKey, metrics);
    return metrics;
  }

  /**
   * Get complete cost summary
   */
  async getCostSummary(): Promise<CostSummary> {
    const [vercel, supabase, simulations, custom, users] = await Promise.all([
      this.fetchVercelMetrics(),
      this.fetchSupabaseMetrics(),
      this.fetchSimulationMetrics(),
      this.fetchCustomMetrics(),
      this.fetchUserMetrics(),
    ]);

    const totalCurrent = vercel.total + supabase.total + simulations.costs.total;
    const costPerUser = users.totalUsers > 0 ? totalCurrent / users.totalUsers : 0;
    users.costPerUser = costPerUser;

    // Project monthly cost based on current usage
    const daysInMonth = 30;
    const currentDay = new Date().getDate();
    const projectedMonthly = (totalCurrent / currentDay) * daysInMonth;

    const summary: CostSummary = {
      vercel,
      supabase,
      simulations,
      custom,
      users,
      total: {
        current: totalCurrent,
        projected: projectedMonthly,
        budget: COST_BUDGETS.monthly.total,
        percentOfBudget: (projectedMonthly / COST_BUDGETS.monthly.total) * 100,
      },
      timestamp: new Date(),
    };

    return summary;
  }

  /**
   * Get cost trends for time range
   */
  async getCostTrends(timeRange: TimeRange = '30d'): Promise<CostTrend[]> {
    const dateRange = getDateRange(timeRange);

    // In production, query historical data from your database
    // For now, generate mock trend data
    const trends: CostTrend[] = [];
    const days = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));

    for (let i = 0; i < days; i++) {
      const date = new Date(dateRange.start);
      date.setDate(date.getDate() + i);

      // Simulate realistic cost growth
      const baseCost = 150;
      const growth = i * 0.5;
      const noise = (Math.random() - 0.5) * 10;
      const totalCost = baseCost + growth + noise;

      trends.push({
        date,
        total: totalCost,
        vercel: totalCost * 0.35,
        supabase: totalCost * 0.30,
        simulations: totalCost * 0.30,
        users: Math.floor(3000 + i * 30 + (Math.random() - 0.5) * 50),
      });
    }

    return trends;
  }

  /**
   * Get popular structures for caching analysis
   */
  async getPopularStructures(limit: number = 20): Promise<PopularStructure[]> {
    const cacheKey = `popular-structures-${limit}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    // In production, query from your analytics database
    // For now, return mock data
    const structures: PopularStructure[] = [
      {
        id: '1ABC',
        name: 'Lactate Dehydrogenase',
        source: 'pdb',
        views: 234,
        simulations: 89,
        cacheCandidate: true,
        estimatedSavings: 22.25,
      },
      {
        id: '2XYZ',
        name: 'Probiotic Surface Protein',
        source: 'alphafold',
        views: 189,
        simulations: 67,
        cacheCandidate: true,
        estimatedSavings: 16.75,
      },
      {
        id: '3DEF',
        name: 'Cell Wall Peptidoglycan',
        source: 'pdb',
        views: 156,
        simulations: 54,
        cacheCandidate: true,
        estimatedSavings: 13.50,
      },
    ];

    this.setCache(cacheKey, structures);
    return structures;
  }

  /**
   * Parse Vercel API response
   */
  private parseVercelMetrics(data: any): VercelMetrics {
    // Parse actual Vercel API response format
    // This is a placeholder - adjust based on actual API response
    return {
      bandwidth: {
        used: data.bandwidth?.used || 0,
        limit: data.bandwidth?.limit || 100,
        cost: data.bandwidth?.cost || 0,
      },
      functions: {
        invocations: data.functions?.invocations || 0,
        duration: data.functions?.duration || 0,
        cost: data.functions?.cost || 0,
      },
      builds: {
        count: data.builds?.count || 0,
        duration: data.builds?.duration || 0,
        cost: data.builds?.cost || 0,
      },
      edgeFunctions: {
        invocations: data.edgeFunctions?.invocations || 0,
        cost: data.edgeFunctions?.cost || 0,
      },
      total: data.total || 0,
    };
  }

  /**
   * Parse Supabase API response
   */
  private parseSupabaseMetrics(data: any): SupabaseMetrics {
    // Parse actual Supabase API response format
    // This is a placeholder - adjust based on actual API response
    return {
      database: {
        size: data.database?.size || 0,
        limit: data.database?.limit || 8,
        cost: data.database?.cost || 0,
      },
      storage: {
        size: data.storage?.size || 0,
        bandwidth: data.storage?.bandwidth || 0,
        cost: data.storage?.cost || 0,
      },
      realtimeConnections: {
        concurrent: data.realtime?.concurrent || 0,
        peak: data.realtime?.peak || 0,
        cost: data.realtime?.cost || 0,
      },
      auth: {
        activeUsers: data.auth?.activeUsers || 0,
        cost: data.auth?.cost || 0,
      },
      edgeFunctions: {
        invocations: data.edgeFunctions?.invocations || 0,
        cost: data.edgeFunctions?.cost || 0,
      },
      total: data.total || 0,
    };
  }

  /**
   * Get mock Vercel metrics for development
   */
  private getMockVercelMetrics(): VercelMetrics {
    return {
      bandwidth: {
        used: 67.3,
        limit: 100,
        cost: 0,
      },
      functions: {
        invocations: 12450,
        duration: 3821,
        cost: 18.45,
      },
      builds: {
        count: 42,
        duration: 124,
        cost: 0.62,
      },
      edgeFunctions: {
        invocations: 234567,
        cost: 0,
      },
      total: 19.07,
    };
  }

  /**
   * Get mock Supabase metrics for development
   */
  private getMockSupabaseMetrics(): SupabaseMetrics {
    return {
      database: {
        size: 3.2,
        limit: 8,
        cost: 0,
      },
      storage: {
        size: 24.7,
        bandwidth: 89.3,
        cost: 0.52,
      },
      realtimeConnections: {
        concurrent: 87,
        peak: 142,
        cost: 0,
      },
      auth: {
        activeUsers: 2156,
        cost: 0,
      },
      edgeFunctions: {
        invocations: 45678,
        cost: 0,
      },
      total: 25.52,
    };
  }

  /**
   * Cache management
   */
  private getFromCache(key: string): any | null {
    if (!this.cacheEnabled) return null;

    const cached = this.cache.get(key);
    if (!cached) return null;

    const age = Date.now() - cached.timestamp;
    const ttl = TRACKING_CONFIG.caching.ttl * 1000;

    if (age > ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  private setCache(key: string, data: any): void {
    if (!this.cacheEnabled) return;

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Enable/disable caching
   */
  setCacheEnabled(enabled: boolean): void {
    this.cacheEnabled = enabled;
    if (!enabled) {
      this.clearCache();
    }
  }
}

// Export singleton instance
export const costTrackingService = new CostTrackingService();

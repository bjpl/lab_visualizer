/**
 * Health Check System
 * Monitors status of all critical services and dependencies
 */

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  checks: {
    [key: string]: HealthCheck;
  };
}

export interface HealthCheck {
  status: 'pass' | 'warn' | 'fail';
  message?: string;
  responseTime?: number;
  details?: Record<string, any>;
}

export class HealthChecker {
  private startTime: number;
  private version: string;

  constructor(version: string = '0.1.0') {
    this.startTime = Date.now();
    this.version = version;
  }

  /**
   * Get application uptime in seconds
   */
  private getUptime(): number {
    return Math.floor((Date.now() - this.startTime) / 1000);
  }

  /**
   * Check database health
   */
  async checkDatabase(): Promise<HealthCheck> {
    const start = Date.now();

    try {
      // Import Supabase client
      const { createClient } = await import('@supabase/supabase-js');

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        return {
          status: 'fail',
          message: 'Supabase credentials not configured',
          responseTime: Date.now() - start,
        };
      }

      const supabase = createClient(supabaseUrl, supabaseKey);

      // Simple health check query
      const { error } = await supabase
        .from('pdb_structures')
        .select('id')
        .limit(1);

      if (error) {
        return {
          status: 'fail',
          message: `Database error: ${error.message}`,
          responseTime: Date.now() - start,
        };
      }

      const responseTime = Date.now() - start;

      return {
        status: responseTime < 500 ? 'pass' : 'warn',
        message: 'Database connected',
        responseTime,
        details: {
          provider: 'Supabase',
          region: process.env.NEXT_PUBLIC_SUPABASE_REGION || 'unknown',
        },
      };
    } catch (error) {
      return {
        status: 'fail',
        message: error instanceof Error ? error.message : 'Unknown error',
        responseTime: Date.now() - start,
      };
    }
  }

  /**
   * Check Redis/Vercel KV health
   */
  async checkCache(): Promise<HealthCheck> {
    const start = Date.now();

    try {
      // Check for Vercel KV
      const kvUrl = process.env.KV_REST_API_URL;
      const kvToken = process.env.KV_REST_API_TOKEN;

      if (!kvUrl || !kvToken) {
        return {
          status: 'warn',
          message: 'Cache not configured (using in-memory fallback)',
          responseTime: Date.now() - start,
        };
      }

      // Simple ping to KV
      const response = await fetch(`${kvUrl}/ping`, {
        headers: {
          Authorization: `Bearer ${kvToken}`,
        },
        signal: AbortSignal.timeout(2000),
      });

      const responseTime = Date.now() - start;

      if (!response.ok) {
        return {
          status: 'fail',
          message: `Cache error: ${response.statusText}`,
          responseTime,
        };
      }

      return {
        status: responseTime < 200 ? 'pass' : 'warn',
        message: 'Cache connected',
        responseTime,
        details: {
          provider: 'Vercel KV',
        },
      };
    } catch (error) {
      return {
        status: 'warn',
        message: 'Cache unavailable (using fallback)',
        responseTime: Date.now() - start,
      };
    }
  }

  /**
   * Check external PDB API health
   */
  async checkPDBAPI(): Promise<HealthCheck> {
    const start = Date.now();

    try {
      // Test RCSB PDB API
      const response = await fetch('https://data.rcsb.org/rest/v1/status', {
        signal: AbortSignal.timeout(5000),
      });

      const responseTime = Date.now() - start;

      if (!response.ok) {
        return {
          status: 'warn',
          message: 'PDB API degraded',
          responseTime,
        };
      }

      return {
        status: responseTime < 1000 ? 'pass' : 'warn',
        message: 'PDB API reachable',
        responseTime,
        details: {
          provider: 'RCSB PDB',
        },
      };
    } catch (error) {
      return {
        status: 'warn',
        message: 'PDB API unreachable (fallback sources available)',
        responseTime: Date.now() - start,
      };
    }
  }

  /**
   * Check storage health
   */
  async checkStorage(): Promise<HealthCheck> {
    const start = Date.now();

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        return {
          status: 'warn',
          message: 'Storage not configured',
          responseTime: Date.now() - start,
        };
      }

      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, supabaseKey);

      // List buckets to verify storage connection
      const { error } = await supabase.storage.listBuckets();

      const responseTime = Date.now() - start;

      if (error) {
        return {
          status: 'fail',
          message: `Storage error: ${error.message}`,
          responseTime,
        };
      }

      return {
        status: 'pass',
        message: 'Storage accessible',
        responseTime,
      };
    } catch (error) {
      return {
        status: 'fail',
        message: error instanceof Error ? error.message : 'Unknown error',
        responseTime: Date.now() - start,
      };
    }
  }

  /**
   * Check memory usage
   */
  checkMemory(): HealthCheck {
    if (typeof process === 'undefined' || !process.memoryUsage) {
      return {
        status: 'warn',
        message: 'Memory stats unavailable (client-side)',
      };
    }

    const usage = process.memoryUsage();
    const usedMB = Math.round(usage.heapUsed / 1024 / 1024);
    const totalMB = Math.round(usage.heapTotal / 1024 / 1024);
    const percentage = (usedMB / totalMB) * 100;

    let status: 'pass' | 'warn' | 'fail' = 'pass';
    if (percentage > 90) status = 'fail';
    else if (percentage > 75) status = 'warn';

    return {
      status,
      message: `Memory usage: ${usedMB}MB / ${totalMB}MB (${percentage.toFixed(1)}%)`,
      details: {
        heapUsed: usedMB,
        heapTotal: totalMB,
        percentage: percentage.toFixed(1),
        rss: Math.round(usage.rss / 1024 / 1024),
      },
    };
  }

  /**
   * Run all health checks
   */
  async checkAll(): Promise<HealthStatus> {
    const checks: { [key: string]: HealthCheck } = {};

    // Run all checks in parallel
    const [database, cache, pdbApi, storage] = await Promise.all([
      this.checkDatabase(),
      this.checkCache(),
      this.checkPDBAPI(),
      this.checkStorage(),
    ]);

    checks.database = database;
    checks.cache = cache;
    checks.pdb_api = pdbApi;
    checks.storage = storage;
    checks.memory = this.checkMemory();

    // Determine overall status
    const hasFailure = Object.values(checks).some((c) => c.status === 'fail');
    const hasWarning = Object.values(checks).some((c) => c.status === 'warn');

    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (hasFailure) overallStatus = 'unhealthy';
    else if (hasWarning) overallStatus = 'degraded';

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: this.getUptime(),
      version: this.version,
      checks,
    };
  }

  /**
   * Get simplified readiness check
   */
  async checkReadiness(): Promise<{ ready: boolean; reason?: string }> {
    const [database, cache] = await Promise.all([
      this.checkDatabase(),
      this.checkCache(),
    ]);

    // Must have database to be ready
    if (database.status === 'fail') {
      return {
        ready: false,
        reason: database.message || 'Database unavailable',
      };
    }

    // Cache is optional but warn if down
    if (cache.status === 'fail') {
      console.warn('[Health] Cache unavailable but continuing');
    }

    return { ready: true };
  }

  /**
   * Get simplified liveness check
   */
  checkLiveness(): { alive: boolean } {
    // Simple check - if we can execute this, we're alive
    return { alive: true };
  }
}

// Singleton instance
export const healthChecker = new HealthChecker(
  process.env.NEXT_PUBLIC_APP_VERSION || '0.1.0'
);

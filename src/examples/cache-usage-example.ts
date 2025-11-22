/**
 * Cache System Usage Examples
 *
 * Demonstrates how to use the multi-tier cache system
 * in various scenarios.
 */

import React from 'react';
import { getCacheManager } from '@/services/cache';
import { CACHE_KEY_PATTERNS, CACHE_TTL } from '@/config/cache.config';

// ============================================
// Example 1: Basic Get/Set
// ============================================

export async function basicGetSetExample() {
  const cache = getCacheManager();

  // Set data in cache
  await cache.set('user:123', {
    id: 123,
    name: 'John Doe',
    email: 'john@example.com',
  }, {
    ttl: CACHE_TTL.medium, // 1 hour
    tags: ['user', 'profile'],
  });

  // Get data from cache
  const result = await cache.get('user:123');

  if (result.data) {
    console.log('Found in cache:', result.source);
    console.log('Data:', result.data);
    console.log('Latency:', result.latency, 'ms');
  }
}

// ============================================
// Example 2: Fetch with Auto-Caching
// ============================================

export async function fetchWithCacheExample() {
  const cache = getCacheManager();

  const pdbData = await cache.fetchWithCache(
    CACHE_KEY_PATTERNS.pdb('1abc'),
    async () => {
      // This function only runs on cache miss
      console.log('Cache miss - fetching from API...');
      const response = await fetch('/api/pdb/1abc');
      return response.json();
    },
    {
      ttl: CACHE_TTL.long, // 24 hours
      tags: ['pdb', 'molecular'],
    }
  );

  return pdbData;
}

// ============================================
// Example 3: Multi-Tier Specific Access
// ============================================

export async function tierSpecificExample() {
  const cache = getCacheManager();

  // Only check L2 cache (skip L1)
  const l2Result = await cache.get('expensive-data', { tier: 'l2' });

  if (l2Result.data) {
    console.log('Found in L2:', l2Result.data);
  } else {
    // Fetch and store only in L2
    const freshData = await fetchExpensiveData();
    await cache.set('expensive-data', freshData, {
      tier: 'l2',
      ttl: CACHE_TTL.long,
    });
  }
}

// ============================================
// Example 4: PDB Structure Caching
// ============================================

export async function pdbCachingExample(pdbId: string) {
  const cache = getCacheManager();
  const key = CACHE_KEY_PATTERNS.pdb(pdbId);

  return await cache.fetchWithCache(
    key,
    async () => {
      // Fetch from RCSB PDB
      const response = await fetch(`https://files.rcsb.org/download/${pdbId}.pdb`);
      if (!response.ok) {
        throw new Error(`PDB ${pdbId} not found`);
      }
      const content = await response.text();

      return {
        id: pdbId,
        content,
        fetchedAt: Date.now(),
      };
    },
    {
      ttl: CACHE_TTL.permanent, // 30 days (PDB structures don't change)
      tags: ['pdb', pdbId],
    }
  );
}

// ============================================
// Example 5: Simulation Frame Caching
// ============================================

export async function simulationFrameCachingExample(
  simulationId: string,
  frameNumber: number
) {
  const cache = getCacheManager();
  const key = CACHE_KEY_PATTERNS.simulation(simulationId, frameNumber);

  return await cache.fetchWithCache(
    key,
    async () => {
      // Calculate or fetch simulation frame
      return await calculateSimulationFrame(simulationId, frameNumber);
    },
    {
      ttl: CACHE_TTL.medium, // 1 hour
      tags: ['simulation', simulationId],
      // Large frames stored in L3 automatically
    }
  );
}

// ============================================
// Example 6: Cache Prefetching
// ============================================

export async function prefetchPopularStructures() {
  const cache = getCacheManager();

  const popularPDBs = ['1abc', '2xyz', '3def', '4ghi'];

  console.log('Prefetching popular structures...');

  await cache.prefetch(
    popularPDBs.map(id => CACHE_KEY_PATTERNS.pdb(id)),
    async (key) => {
      const pdbId = key.split(':')[1];
      return await fetchPDBStructure(pdbId);
    }
  );

  console.log('Prefetch complete!');
}

// ============================================
// Example 7: Cache Invalidation
// ============================================

export async function invalidationExample(userId: string) {
  const cache = getCacheManager();

  // User updates their profile
  await updateUserProfile(userId, { name: 'Jane Doe' });

  // Invalidate cached user data across all tiers
  await cache.invalidate(`user:${userId}`);

  console.log(`User ${userId} cache invalidated`);
}

// ============================================
// Example 8: Performance Monitoring
// ============================================

export async function monitoringExample() {
  const cache = getCacheManager();

  // Get comprehensive metrics
  const metrics = await cache.getMetrics();

  console.log('Cache Performance Report:');
  console.log('========================');
  console.log(`L1 Hit Rate: ${(metrics.l1.hitRate * 100).toFixed(2)}%`);
  console.log(`L2 Hit Rate: ${(metrics.l2.hitRate * 100).toFixed(2)}%`);
  console.log(`L3 Hit Rate: ${(metrics.l3.hitRate * 100).toFixed(2)}%`);
  console.log(`Combined Hit Rate: ${(metrics.overall.combinedHitRate * 100).toFixed(2)}%`);
  console.log(`Average Latency: ${metrics.overall.avgLatency.toFixed(2)}ms`);
  console.log(`Total Requests: ${metrics.overall.totalRequests}`);
  console.log('========================');

  // Check if performance meets targets
  if (metrics.l2.hitRate < 0.7) {
    console.warn('⚠️  L2 hit rate below 70% target');
  }

  if (metrics.overall.avgLatency > 500) {
    console.warn('⚠️  Average latency exceeds 500ms');
  }
}

// ============================================
// Example 9: Health Checks
// ============================================

export async function healthCheckExample() {
  const cache = getCacheManager();

  const health = await cache.healthCheck();

  console.log('Cache Health Status:');
  console.log(`L1 (IndexedDB): ${health.l1 ? '✓ Healthy' : '✗ Unhealthy'}`);
  console.log(`L2 (Vercel KV): ${health.l2 ? '✓ Healthy' : '✗ Unhealthy'}`);
  console.log(`L3 (Supabase):  ${health.l3 ? '✓ Healthy' : '✗ Unhealthy'}`);

  // Alert if any tier is unhealthy
  if (!health.l2 || !health.l3) {
    console.error('Cache degradation detected!');
    // Send alert to monitoring service
  }
}

// ============================================
// Example 10: Analysis Results Caching
// ============================================

export async function analysisCachingExample(
  moleculeId: string,
  analysisType: 'energy' | 'rmsd' | 'contacts'
) {
  const cache = getCacheManager();
  const key = CACHE_KEY_PATTERNS.analysis(moleculeId, analysisType);

  return await cache.fetchWithCache(
    key,
    async () => {
      console.log(`Running ${analysisType} analysis for ${moleculeId}...`);
      // Expensive computational analysis
      return await runMolecularAnalysis(moleculeId, analysisType);
    },
    {
      ttl: CACHE_TTL.long, // 24 hours
      tags: ['analysis', analysisType, moleculeId],
      // Results stored in L3 for long-term access
    }
  );
}

// ============================================
// Example 11: Batch Operations
// ============================================

export async function batchOperationsExample() {
  const cache = getCacheManager();

  const moleculeIds = ['mol1', 'mol2', 'mol3', 'mol4', 'mol5'];

  // Fetch multiple molecules with automatic caching
  const molecules = await Promise.all(
    moleculeIds.map(id =>
      cache.fetchWithCache(
        CACHE_KEY_PATTERNS.molecular(id, 'protein'),
        () => fetchMolecule(id),
        { ttl: CACHE_TTL.long }
      )
    )
  );

  console.log(`Fetched ${molecules.length} molecules`);

  // Get metrics after batch operation
  const metrics = await cache.getMetrics();
  console.log(`Cache hit rate: ${(metrics.overall.combinedHitRate * 100).toFixed(2)}%`);
}

// ============================================
// Example 12: Force Refresh
// ============================================

export async function forceRefreshExample(pdbId: string) {
  const cache = getCacheManager();
  const key = CACHE_KEY_PATTERNS.pdb(pdbId);

  // Force refresh - bypass all cache tiers
  const freshData = await cache.fetchWithCache(
    key,
    () => fetchPDBStructure(pdbId),
    {
      forceRefresh: true, // Skip cache lookup
      ttl: CACHE_TTL.permanent,
    }
  );

  console.log('Fresh data fetched and cached');
  return freshData;
}

// ============================================
// Helper Functions (Mocked)
// ============================================

async function fetchExpensiveData() {
  // Simulate expensive operation
  await new Promise(resolve => setTimeout(resolve, 1000));
  return { data: 'expensive result' };
}

async function calculateSimulationFrame(simId: string, frame: number) {
  // Simulate frame calculation
  return {
    simulationId: simId,
    frame,
    positions: Array(1000).fill(0).map(() => Math.random()),
    timestamp: Date.now(),
  };
}

async function fetchPDBStructure(pdbId: string) {
  const response = await fetch(`/api/pdb/${pdbId}`);
  return response.json();
}

async function updateUserProfile(userId: string, data: any) {
  // Update user profile in database
  console.log(`Updating user ${userId}:`, data);
}

async function runMolecularAnalysis(moleculeId: string, type: string) {
  // Simulate analysis
  await new Promise(resolve => setTimeout(resolve, 2000));
  return {
    moleculeId,
    type,
    results: { score: Math.random() * 100 },
    computedAt: Date.now(),
  };
}

async function fetchMolecule(id: string) {
  return { id, data: 'molecule data' };
}

// ============================================
// Usage in React Components
// ============================================

/**
 * React Hook Example
 */
export function useCachedPDB(pdbId: string) {
  const [data, setData] = React.useState<unknown>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<unknown>(null);

  React.useEffect(() => {
    const cache = getCacheManager();

    async function loadPDB() {
      try {
        setLoading(true);
        const result = await cache.fetchWithCache(
          CACHE_KEY_PATTERNS.pdb(pdbId),
          () => fetchPDBStructure(pdbId),
          { ttl: CACHE_TTL.permanent }
        );
        setData(result);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    loadPDB();
  }, [pdbId]);

  return { data, loading, error };
}

/**
 * API Route Example
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const pdbId = url.searchParams.get('id');

  if (!pdbId) {
    return Response.json({ error: 'PDB ID required' }, { status: 400 });
  }

  const cache = getCacheManager();

  try {
    const data = await cache.fetchWithCache(
      CACHE_KEY_PATTERNS.pdb(pdbId),
      () => fetchPDBStructure(pdbId),
      { ttl: CACHE_TTL.permanent }
    );

    return Response.json(data);
  } catch (error) {
    return Response.json(
      { error: 'Failed to fetch PDB' },
      { status: 500 }
    );
  }
}

/**
 * Cache Service Re-export
 * Provides the expected import path for API routes
 */

export {
  CacheService,
  getCacheService,
  resetCacheService,
  type CacheOptions,
  type CacheStats,
  type FetchWithCacheOptions,
} from '@/lib/cache/cache-service';

// Create a singleton instance for convenience
import { getCacheService } from '@/lib/cache/cache-service';

export const cacheService = getCacheService();

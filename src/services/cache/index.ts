/**
 * Multi-Tier Cache System
 *
 * Exports all cache-related modules for easy access
 */

export * from './types';
export * from './vercelKvCache';
export * from './supabaseStorageCache';
export * from './cacheManager';

export { getCacheManager as getCache } from './cacheManager';
export { getCacheConfig, CACHE_KEY_PATTERNS, CACHE_TTL } from '@/config/cache.config';

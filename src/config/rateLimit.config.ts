/**
 * Rate Limiting Configuration
 *
 * Environment-based rate limits with support for multiple tiers
 * and per-endpoint customization
 */

import { RateLimitTier, RateLimitConfig, EndpointRateLimit, RedisConnectionConfig } from '../types/rateLimit.types';

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Default rate limit configurations by tier
 */
export const TIER_LIMITS: Record<RateLimitTier, RateLimitConfig> = {
  [RateLimitTier.FREE]: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: isDevelopment ? 1000 : 100,
    tier: RateLimitTier.FREE,
    message: 'Free tier rate limit exceeded. Upgrade to Pro for higher limits.'
  },
  [RateLimitTier.PRO]: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: isDevelopment ? 5000 : 1000,
    tier: RateLimitTier.PRO,
    message: 'Pro tier rate limit exceeded. Contact support for Enterprise options.'
  },
  [RateLimitTier.ENTERPRISE]: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: isDevelopment ? 50000 : 10000,
    tier: RateLimitTier.ENTERPRISE,
    message: 'Enterprise tier rate limit exceeded. Contact your account manager.'
  },
  [RateLimitTier.ADMIN]: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: Number.MAX_SAFE_INTEGER,
    tier: RateLimitTier.ADMIN,
    message: 'Admin tier has no rate limits.'
  }
};

/**
 * Per-endpoint custom rate limits
 * Override default tier limits for specific endpoints
 */
export const ENDPOINT_LIMITS: EndpointRateLimit[] = [
  // Authentication endpoints - stricter limits
  {
    path: '/api/auth/login',
    method: 'POST',
    config: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: isDevelopment ? 100 : 5,
      tier: RateLimitTier.FREE,
      message: 'Too many login attempts. Please try again later.'
    }
  },
  {
    path: '/api/auth/register',
    method: 'POST',
    config: {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: isDevelopment ? 50 : 3,
      tier: RateLimitTier.FREE,
      message: 'Too many registration attempts. Please try again later.'
    }
  },
  {
    path: '/api/auth/reset-password',
    method: 'POST',
    config: {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: isDevelopment ? 20 : 3,
      tier: RateLimitTier.FREE,
      message: 'Too many password reset attempts. Please try again later.'
    }
  },

  // Data-intensive endpoints
  {
    path: '/api/visualizations/render',
    method: 'POST',
    config: {
      windowMs: 5 * 60 * 1000, // 5 minutes
      maxRequests: isDevelopment ? 200 : 10,
      tier: RateLimitTier.FREE,
      message: 'Rendering rate limit exceeded. Please wait before requesting more visualizations.'
    }
  },
  {
    path: '/api/simulations/run',
    method: 'POST',
    config: {
      windowMs: 10 * 60 * 1000, // 10 minutes
      maxRequests: isDevelopment ? 100 : 5,
      tier: RateLimitTier.FREE,
      message: 'Simulation rate limit exceeded. Upgrade for more concurrent simulations.'
    }
  },

  // Upload endpoints
  {
    path: '/api/upload',
    config: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: isDevelopment ? 500 : 20,
      tier: RateLimitTier.FREE,
      message: 'Upload rate limit exceeded. Please try again later.'
    }
  },

  // Search endpoints - moderate limits
  {
    path: '/api/search',
    config: {
      windowMs: 1 * 60 * 1000, // 1 minute
      maxRequests: isDevelopment ? 300 : 30,
      tier: RateLimitTier.FREE,
      message: 'Search rate limit exceeded. Please slow down your requests.'
    }
  }
];

/**
 * Redis connection configuration
 */
export const REDIS_CONFIG: RedisConnectionConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0', 10),
  maxRetriesPerRequest: 3,
  enableOfflineQueue: false,
  connectTimeout: 10000,
  retryStrategy: (times: number) => {
    if (times > 3) {
      console.error('Redis connection failed after 3 retries');
      return undefined; // Stop retrying
    }
    return Math.min(times * 200, 2000); // Exponential backoff
  }
};

/**
 * Global rate limiter settings
 */
export const RATE_LIMIT_SETTINGS = {
  // Enable rate limit headers (X-RateLimit-*)
  enableHeaders: true,

  // Use draft-7 header format
  draft7: false,

  // Skip counting failed requests
  skipFailedRequests: false,

  // Skip counting successful requests
  skipSuccessfulRequests: false,

  // Key prefix for Redis
  keyPrefix: process.env.RATE_LIMIT_KEY_PREFIX || 'rl:',

  // Enable graceful degradation when Redis is unavailable
  enableGracefulDegradation: true,

  // Fallback to in-memory rate limiting when Redis is down
  fallbackToMemory: true,

  // Log rate limit events
  enableLogging: isProduction,

  // Enable metrics collection
  enableMetrics: true,

  // Metrics retention (in seconds)
  metricsRetention: 86400, // 24 hours
};

/**
 * Get rate limit config for a specific tier
 */
export function getTierConfig(tier: RateLimitTier = RateLimitTier.FREE): RateLimitConfig {
  return TIER_LIMITS[tier] || TIER_LIMITS[RateLimitTier.FREE];
}

/**
 * Get endpoint-specific rate limit config
 */
export function getEndpointConfig(path: string, method?: string): EndpointRateLimit | undefined {
  return ENDPOINT_LIMITS.find(limit => {
    const pathMatches = limit.path === path || new RegExp(limit.path).test(path);
    const methodMatches = !limit.method || !method || limit.method.toLowerCase() === method.toLowerCase();
    return pathMatches && methodMatches;
  });
}

/**
 * Determine tier from API key or user context
 */
export function determineTier(apiKey?: string, userId?: string): RateLimitTier {
  // Check API key prefix for tier identification
  if (apiKey) {
    if (apiKey.startsWith('admin_')) return RateLimitTier.ADMIN;
    if (apiKey.startsWith('ent_')) return RateLimitTier.ENTERPRISE;
    if (apiKey.startsWith('pro_')) return RateLimitTier.PRO;
  }

  // Default to free tier
  return RateLimitTier.FREE;
}

export default {
  TIER_LIMITS,
  ENDPOINT_LIMITS,
  REDIS_CONFIG,
  RATE_LIMIT_SETTINGS,
  getTierConfig,
  getEndpointConfig,
  determineTier
};

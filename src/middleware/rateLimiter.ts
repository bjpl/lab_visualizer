/**
 * Distributed Rate Limiter Middleware
 *
 * Redis-based rate limiting with sliding window algorithm
 * Supports multiple tiers, IP-based and API-key-based limiting
 * Includes graceful degradation and comprehensive monitoring
 */

import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';
import {
  RateLimitTier,
  RateLimitOptions,
  RedisRateLimitResult,
  RateLimitMetrics,
  RateLimitInfo
} from '../types/rateLimit.types';
import {
  REDIS_CONFIG,
  RATE_LIMIT_SETTINGS,
  getTierConfig,
  getEndpointConfig,
  determineTier
} from '../config/rateLimit.config';

/**
 * In-memory fallback store for when Redis is unavailable
 */
class MemoryRateLimitStore {
  private store: Map<string, { count: number; timestamps: number[] }> = new Map();

  async increment(key: string, windowMs: number): Promise<RedisRateLimitResult> {
    const now = Date.now();
    const windowStart = now - windowMs;

    let record = this.store.get(key);

    if (!record) {
      record = { count: 0, timestamps: [] };
      this.store.set(key, record);
    }

    // Remove expired timestamps
    record.timestamps = record.timestamps.filter(ts => ts > windowStart);

    // Add current request
    record.timestamps.push(now);
    record.count = record.timestamps.length;

    return {
      allowed: true,
      limit: 0,
      remaining: 0,
      reset: now + windowMs
    };
  }

  clear(): void {
    this.store.clear();
  }
}

/**
 * Redis Rate Limiter Class
 */
export class RedisRateLimiter {
  private redis: Redis | null = null;
  private isRedisAvailable: boolean = false;
  private memoryStore: MemoryRateLimitStore;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 3;

  constructor() {
    this.memoryStore = new MemoryRateLimitStore();
    this.initializeRedis();
  }

  /**
   * Initialize Redis connection with error handling
   */
  private initializeRedis(): void {
    try {
      this.redis = new Redis({
        host: REDIS_CONFIG.host,
        port: REDIS_CONFIG.port,
        password: REDIS_CONFIG.password,
        db: REDIS_CONFIG.db,
        maxRetriesPerRequest: REDIS_CONFIG.maxRetriesPerRequest,
        enableOfflineQueue: REDIS_CONFIG.enableOfflineQueue,
        connectTimeout: REDIS_CONFIG.connectTimeout,
        retryStrategy: REDIS_CONFIG.retryStrategy,
        lazyConnect: true
      });

      this.redis.on('connect', () => {
        this.isRedisAvailable = true;
        this.reconnectAttempts = 0;
        if (RATE_LIMIT_SETTINGS.enableLogging) {
          console.log('[RateLimiter] Redis connected successfully');
        }
      });

      this.redis.on('error', (err) => {
        this.isRedisAvailable = false;
        if (RATE_LIMIT_SETTINGS.enableLogging) {
          console.error('[RateLimiter] Redis error:', err.message);
        }
      });

      this.redis.on('close', () => {
        this.isRedisAvailable = false;
        if (RATE_LIMIT_SETTINGS.enableLogging) {
          console.warn('[RateLimiter] Redis connection closed');
        }
      });

      // Attempt initial connection
      this.redis.connect().catch((err) => {
        if (RATE_LIMIT_SETTINGS.enableLogging) {
          console.error('[RateLimiter] Initial Redis connection failed:', err.message);
        }
      });

    } catch (error) {
      console.error('[RateLimiter] Failed to initialize Redis:', error);
      this.isRedisAvailable = false;
    }
  }

  /**
   * Sliding window rate limit algorithm using Redis
   */
  async checkRateLimit(
    identifier: string,
    windowMs: number,
    maxRequests: number
  ): Promise<RedisRateLimitResult> {
    const now = Date.now();
    const windowStart = now - windowMs;
    const key = `${RATE_LIMIT_SETTINGS.keyPrefix}${identifier}`;

    // Use memory fallback if Redis unavailable
    if (!this.isRedisAvailable || !this.redis) {
      if (RATE_LIMIT_SETTINGS.fallbackToMemory) {
        return this.memoryStore.increment(key, windowMs);
      }

      // Allow request if graceful degradation enabled
      if (RATE_LIMIT_SETTINGS.enableGracefulDegradation) {
        return {
          allowed: true,
          limit: maxRequests,
          remaining: maxRequests,
          reset: now + windowMs
        };
      }

      throw new Error('Rate limiting service unavailable');
    }

    try {
      // Use Lua script for atomic operations
      const script = `
        local key = KEYS[1]
        local now = tonumber(ARGV[1])
        local window = tonumber(ARGV[2])
        local limit = tonumber(ARGV[3])
        local windowStart = now - window

        -- Remove old entries
        redis.call('ZREMRANGEBYSCORE', key, 0, windowStart)

        -- Count current entries
        local current = redis.call('ZCARD', key)

        if current < limit then
          -- Add new entry
          redis.call('ZADD', key, now, now)
          redis.call('PEXPIRE', key, window)
          return {1, limit - current - 1, now + window}
        else
          -- Get oldest entry for reset time
          local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
          local resetTime = tonumber(oldest[2]) + window
          return {0, 0, resetTime}
        end
      `;

      const result = await this.redis.eval(
        script,
        1,
        key,
        now.toString(),
        windowMs.toString(),
        maxRequests.toString()
      ) as [number, number, number];

      const [allowed, remaining, reset] = result;

      return {
        allowed: allowed === 1,
        limit: maxRequests,
        remaining: remaining,
        reset: reset,
        retryAfter: allowed === 0 ? Math.ceil((reset - now) / 1000) : undefined
      };

    } catch (error) {
      console.error('[RateLimiter] Redis operation failed:', error);

      if (RATE_LIMIT_SETTINGS.enableGracefulDegradation) {
        return {
          allowed: true,
          limit: maxRequests,
          remaining: maxRequests,
          reset: now + windowMs
        };
      }

      throw error;
    }
  }

  /**
   * Store rate limit metrics
   */
  async storeMetrics(metrics: RateLimitMetrics): Promise<void> {
    if (!RATE_LIMIT_SETTINGS.enableMetrics || !this.isRedisAvailable || !this.redis) {
      return;
    }

    try {
      const key = `${RATE_LIMIT_SETTINGS.keyPrefix}metrics`;
      await this.redis.zadd(key, metrics.timestamp, JSON.stringify(metrics));
      await this.redis.expire(key, RATE_LIMIT_SETTINGS.metricsRetention);
    } catch (error) {
      if (RATE_LIMIT_SETTINGS.enableLogging) {
        console.error('[RateLimiter] Failed to store metrics:', error);
      }
    }
  }

  /**
   * Get metrics for an identifier
   */
  async getMetrics(identifier: string, since?: number): Promise<RateLimitMetrics[]> {
    if (!this.isRedisAvailable || !this.redis) {
      return [];
    }

    try {
      const key = `${RATE_LIMIT_SETTINGS.keyPrefix}metrics`;
      const minScore = since || Date.now() - (60 * 60 * 1000); // Last hour by default
      const results = await this.redis.zrangebyscore(key, minScore, '+inf');

      return results
        .map(r => JSON.parse(r) as RateLimitMetrics)
        .filter(m => m.identifier === identifier);
    } catch (error) {
      console.error('[RateLimiter] Failed to get metrics:', error);
      return [];
    }
  }

  /**
   * Reset rate limit for an identifier
   */
  async reset(identifier: string): Promise<void> {
    if (!this.isRedisAvailable || !this.redis) {
      this.memoryStore.clear();
      return;
    }

    try {
      const key = `${RATE_LIMIT_SETTINGS.keyPrefix}${identifier}`;
      await this.redis.del(key);
    } catch (error) {
      console.error('[RateLimiter] Failed to reset rate limit:', error);
    }
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
    }
  }
}

// Singleton instance
const rateLimiter = new RedisRateLimiter();

/**
 * Generate rate limit key from request
 */
function generateKey(req: Request, options: RateLimitOptions): string {
  if (options.keyGenerator) {
    return options.keyGenerator(req);
  }

  // API key based limiting
  const apiKey = req.headers['x-api-key'] as string;
  if (apiKey) {
    return `apikey:${apiKey}`;
  }

  // IP based limiting
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  return `ip:${ip}`;
}

/**
 * Set rate limit headers
 */
function setRateLimitHeaders(res: Response, info: RateLimitInfo, draft7: boolean = false): void {
  if (draft7) {
    res.set('RateLimit-Limit', info.limit.toString());
    res.set('RateLimit-Remaining', info.remaining.toString());
    res.set('RateLimit-Reset', Math.ceil(info.reset / 1000).toString());
  } else {
    res.set('X-RateLimit-Limit', info.limit.toString());
    res.set('X-RateLimit-Remaining', info.remaining.toString());
    res.set('X-RateLimit-Reset', Math.ceil(info.reset / 1000).toString());
  }

  if (info.retryAfter) {
    res.set('Retry-After', info.retryAfter.toString());
  }
}

/**
 * Create rate limiter middleware
 */
export function createRateLimiter(options: RateLimitOptions = {}) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Determine tier from API key or user context
      const apiKey = req.headers['x-api-key'] as string;
      const tier = options.tier || determineTier(apiKey);

      // Check for endpoint-specific limits
      const endpointLimit = getEndpointConfig(req.path, req.method);
      const config = endpointLimit?.config || getTierConfig(tier);

      // Override with options if provided
      const windowMs = options.windowMs || config.windowMs;
      const maxRequests = options.maxRequests || config.maxRequests;

      // Generate unique identifier
      const identifier = generateKey(req, options);

      // Check rate limit
      const result = await rateLimiter.checkRateLimit(identifier, windowMs, maxRequests);

      // Set headers if enabled
      if (options.enableHeaders !== false && RATE_LIMIT_SETTINGS.enableHeaders) {
        setRateLimitHeaders(res, result, options.draft7 || RATE_LIMIT_SETTINGS.draft7);
      }

      // Store metrics
      const metrics: RateLimitMetrics = {
        identifier,
        timestamp: Date.now(),
        allowed: result.allowed,
        tier,
        endpoint: `${req.method} ${req.path}`,
        remaining: result.remaining
      };
      await rateLimiter.storeMetrics(metrics);

      // Handle rate limit exceeded
      if (!result.allowed) {
        if (RATE_LIMIT_SETTINGS.enableLogging) {
          console.warn(`[RateLimiter] Rate limit exceeded for ${identifier} on ${req.method} ${req.path}`);
        }

        if (options.onLimitReached) {
          options.onLimitReached(req, identifier);
        }

        if (options.handler) {
          return options.handler(req, res);
        }

        res.status(429).json({
          error: 'Too Many Requests',
          message: config.message || 'Rate limit exceeded. Please try again later.',
          retryAfter: result.retryAfter,
          limit: result.limit,
          reset: Math.ceil(result.reset / 1000)
        });
        return;
      }

      // Request allowed
      next();

    } catch (error) {
      console.error('[RateLimiter] Middleware error:', error);

      // Continue if graceful degradation enabled
      if (RATE_LIMIT_SETTINGS.enableGracefulDegradation) {
        next();
      } else {
        res.status(500).json({
          error: 'Internal Server Error',
          message: 'Rate limiting service error'
        });
      }
    }
  };
}

/**
 * Export utilities
 */
export { rateLimiter };
export default createRateLimiter;

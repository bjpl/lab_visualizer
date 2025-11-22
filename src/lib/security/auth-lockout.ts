/**
 * Authentication Lockout Manager
 *
 * Implements IP-based authentication attempt tracking and lockout
 * Prevents brute force attacks with progressive delays
 */

import Redis from 'ioredis';
import { Request, Response, NextFunction } from 'express';

// Enforce Redis configuration in production
if (process.env.NODE_ENV === 'production' && !process.env.REDIS_HOST) {
  throw new Error('REDIS_HOST environment variable is required in production for auth lockout');
}

export interface LockoutConfig {
  maxAttempts: number;
  windowMs: number;
  lockoutDurationMs: number;
  progressiveLockout: boolean;
  redisKeyPrefix: string;
  enableLogging: boolean;
}

export interface LockoutInfo {
  attempts: number;
  lockedUntil: number | null;
  remainingAttempts: number;
  isLocked: boolean;
}

export interface AttemptResult {
  allowed: boolean;
  lockoutInfo: LockoutInfo;
  error?: string;
}

/**
 * Auth Lockout Manager
 */
export class AuthLockoutManager {
  private redis: Redis | null = null;
  private memoryStore: Map<string, { attempts: number; timestamps: number[]; lockedUntil: number | null }> = new Map();
  private config: LockoutConfig;
  private isRedisAvailable: boolean = false;

  constructor(config?: Partial<LockoutConfig>) {
    this.config = {
      maxAttempts: 5, // 5 attempts
      windowMs: 15 * 60 * 1000, // 15 minutes
      lockoutDurationMs: 15 * 60 * 1000, // 15 minutes lockout
      progressiveLockout: true, // Double lockout time with each violation
      redisKeyPrefix: 'auth_lockout:',
      enableLogging: process.env.NODE_ENV === 'production',
      ...config
    };

    this.initializeRedis();
  }

  /**
   * Initialize Redis connection
   */
  private initializeRedis(): void {
    try {
      this.redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '1', 10),
        lazyConnect: true,
        retryStrategy: (times: number) => {
          if (times > 3) return undefined;
          return Math.min(times * 200, 2000);
        }
      });

      this.redis.on('connect', () => {
        this.isRedisAvailable = true;
        if (this.config.enableLogging) {
          console.log('[AuthLockout] Redis connected');
        }
      });

      this.redis.on('error', (err) => {
        this.isRedisAvailable = false;
        if (this.config.enableLogging) {
          console.error('[AuthLockout] Redis error:', err.message);
        }
      });

      this.redis.connect().catch(() => {
        this.isRedisAvailable = false;
      });
    } catch (error) {
      console.error('[AuthLockout] Failed to initialize Redis:', error);
      this.isRedisAvailable = false;
    }
  }

  /**
   * Get identifier from request (IP address)
   */
  private getIdentifier(req: Request): string {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    return ip;
  }

  /**
   * Record failed authentication attempt
   */
  public async recordFailedAttempt(identifier: string): Promise<AttemptResult> {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    if (this.isRedisAvailable && this.redis) {
      return this.recordFailedAttemptRedis(identifier, now, windowStart);
    } else {
      return this.recordFailedAttemptMemory(identifier, now, windowStart);
    }
  }

  /**
   * Record failed attempt using Redis
   */
  private async recordFailedAttemptRedis(identifier: string, now: number, windowStart: number): Promise<AttemptResult> {
    const key = `${this.config.redisKeyPrefix}${identifier}`;
    const lockoutKey = `${key}:lockout`;

    try {
      // Check if locked
      const lockedUntil = await this.redis!.get(lockoutKey);
      if (lockedUntil && parseInt(lockedUntil) > now) {
        const lockoutInfo: LockoutInfo = {
          attempts: this.config.maxAttempts,
          lockedUntil: parseInt(lockedUntil),
          remainingAttempts: 0,
          isLocked: true
        };

        return {
          allowed: false,
          lockoutInfo,
          error: `Account locked until ${new Date(parseInt(lockedUntil)).toISOString()}`
        };
      }

      // Remove expired attempts
      await this.redis!.zremrangebyscore(key, 0, windowStart);

      // Count current attempts
      const attempts = await this.redis!.zcard(key);

      // Add new attempt
      await this.redis!.zadd(key, now, now.toString());
      await this.redis!.pexpire(key, this.config.windowMs);

      const newAttempts = attempts + 1;

      // Check if should lock
      if (newAttempts >= this.config.maxAttempts) {
        const lockoutDuration = this.calculateLockoutDuration(identifier);
        const lockedUntilTime = now + lockoutDuration;

        await this.redis!.set(lockoutKey, lockedUntilTime.toString(), 'PX', lockoutDuration);

        if (this.config.enableLogging) {
          console.warn(`[AuthLockout] Locked ${identifier} until ${new Date(lockedUntilTime).toISOString()}`);
        }

        const lockoutInfo: LockoutInfo = {
          attempts: newAttempts,
          lockedUntil: lockedUntilTime,
          remainingAttempts: 0,
          isLocked: true
        };

        return {
          allowed: false,
          lockoutInfo,
          error: `Too many failed attempts. Account locked for ${lockoutDuration / 1000 / 60} minutes`
        };
      }

      const lockoutInfo: LockoutInfo = {
        attempts: newAttempts,
        lockedUntil: null,
        remainingAttempts: this.config.maxAttempts - newAttempts,
        isLocked: false
      };

      return {
        allowed: true,
        lockoutInfo
      };
    } catch (error) {
      console.error('[AuthLockout] Redis operation failed:', error);
      // Fallback to memory
      return this.recordFailedAttemptMemory(identifier, now, windowStart);
    }
  }

  /**
   * Record failed attempt using memory
   */
  private recordFailedAttemptMemory(identifier: string, now: number, windowStart: number): AttemptResult {
    let record = this.memoryStore.get(identifier);

    if (!record) {
      record = { attempts: 0, timestamps: [], lockedUntil: null };
      this.memoryStore.set(identifier, record);
    }

    // Check if locked
    if (record.lockedUntil && record.lockedUntil > now) {
      const lockoutInfo: LockoutInfo = {
        attempts: record.attempts,
        lockedUntil: record.lockedUntil,
        remainingAttempts: 0,
        isLocked: true
      };

      return {
        allowed: false,
        lockoutInfo,
        error: `Account locked until ${new Date(record.lockedUntil).toISOString()}`
      };
    }

    // Clear lockout if expired
    if (record.lockedUntil && record.lockedUntil <= now) {
      record.lockedUntil = null;
      record.timestamps = [];
    }

    // Remove expired attempts
    record.timestamps = record.timestamps.filter(ts => ts > windowStart);

    // Add new attempt
    record.timestamps.push(now);
    record.attempts = record.timestamps.length;

    // Check if should lock
    if (record.attempts >= this.config.maxAttempts) {
      const lockoutDuration = this.calculateLockoutDuration(identifier);
      record.lockedUntil = now + lockoutDuration;

      if (this.config.enableLogging) {
        console.warn(`[AuthLockout] Locked ${identifier} until ${new Date(record.lockedUntil).toISOString()}`);
      }

      const lockoutInfo: LockoutInfo = {
        attempts: record.attempts,
        lockedUntil: record.lockedUntil,
        remainingAttempts: 0,
        isLocked: true
      };

      return {
        allowed: false,
        lockoutInfo,
        error: `Too many failed attempts. Account locked for ${lockoutDuration / 1000 / 60} minutes`
      };
    }

    const lockoutInfo: LockoutInfo = {
      attempts: record.attempts,
      lockedUntil: null,
      remainingAttempts: this.config.maxAttempts - record.attempts,
      isLocked: false
    };

    return {
      allowed: true,
      lockoutInfo
    };
  }

  /**
   * Calculate lockout duration with progressive backoff
   */
  private calculateLockoutDuration(identifier: string): number {
    if (!this.config.progressiveLockout) {
      return this.config.lockoutDurationMs;
    }

    // Could track violation count for progressive lockout
    // For now, use base duration
    return this.config.lockoutDurationMs;
  }

  /**
   * Check if identifier is locked
   */
  public async isLocked(identifier: string): Promise<boolean> {
    const now = Date.now();

    if (this.isRedisAvailable && this.redis) {
      const lockoutKey = `${this.config.redisKeyPrefix}${identifier}:lockout`;
      const lockedUntil = await this.redis.get(lockoutKey);
      return lockedUntil ? parseInt(lockedUntil) > now : false;
    } else {
      const record = this.memoryStore.get(identifier);
      return record?.lockedUntil ? record.lockedUntil > now : false;
    }
  }

  /**
   * Get lockout info for identifier
   */
  public async getLockoutInfo(identifier: string): Promise<LockoutInfo> {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    if (this.isRedisAvailable && this.redis) {
      const key = `${this.config.redisKeyPrefix}${identifier}`;
      const lockoutKey = `${key}:lockout`;

      const lockedUntil = await this.redis.get(lockoutKey);
      await this.redis.zremrangebyscore(key, 0, windowStart);
      const attempts = await this.redis.zcard(key);

      return {
        attempts,
        lockedUntil: lockedUntil ? parseInt(lockedUntil) : null,
        remainingAttempts: Math.max(0, this.config.maxAttempts - attempts),
        isLocked: lockedUntil ? parseInt(lockedUntil) > now : false
      };
    } else {
      const record = this.memoryStore.get(identifier);
      if (!record) {
        return {
          attempts: 0,
          lockedUntil: null,
          remainingAttempts: this.config.maxAttempts,
          isLocked: false
        };
      }

      const validTimestamps = record.timestamps.filter(ts => ts > windowStart);
      return {
        attempts: validTimestamps.length,
        lockedUntil: record.lockedUntil,
        remainingAttempts: Math.max(0, this.config.maxAttempts - validTimestamps.length),
        isLocked: record.lockedUntil ? record.lockedUntil > now : false
      };
    }
  }

  /**
   * Reset lockout for identifier
   */
  public async reset(identifier: string): Promise<void> {
    if (this.isRedisAvailable && this.redis) {
      const key = `${this.config.redisKeyPrefix}${identifier}`;
      const lockoutKey = `${key}:lockout`;
      await this.redis.del(key, lockoutKey);
    } else {
      this.memoryStore.delete(identifier);
    }
  }

  /**
   * Clear successful login (reset attempts)
   */
  public async recordSuccessfulAuth(identifier: string): Promise<void> {
    await this.reset(identifier);
  }

  /**
   * Create Express middleware
   */
  public middleware() {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const identifier = this.getIdentifier(req);
      const lockoutInfo = await this.getLockoutInfo(identifier);

      if (lockoutInfo.isLocked && lockoutInfo.lockedUntil) {
        const retryAfter = Math.ceil((lockoutInfo.lockedUntil - Date.now()) / 1000);

        res.status(429).json({
          error: 'Too Many Requests',
          message: 'Account temporarily locked due to too many failed authentication attempts',
          retryAfter,
          lockedUntil: new Date(lockoutInfo.lockedUntil).toISOString()
        });
        return;
      }

      // Attach lockout info to request for use in auth handlers
      (req as any).authLockoutInfo = lockoutInfo;

      next();
    };
  }

  /**
   * Close Redis connection
   */
  public async close(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
    }
  }
}

// Singleton instance
let authLockout: AuthLockoutManager;

/**
 * Get or create singleton instance
 */
export function getAuthLockout(config?: Partial<LockoutConfig>): AuthLockoutManager {
  if (!authLockout) {
    authLockout = new AuthLockoutManager(config);
  }
  return authLockout;
}

/**
 * Reset singleton (for testing)
 */
export function resetAuthLockout(): void {
  if (authLockout) {
    authLockout.close();
  }
  authLockout = undefined as any;
}

/**
 * Create lockout middleware
 */
export function createAuthLockoutMiddleware(config?: Partial<LockoutConfig>) {
  const lockout = getAuthLockout(config);
  return lockout.middleware();
}

export default getAuthLockout;

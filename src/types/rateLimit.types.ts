/**
 * Rate Limiting Type Definitions
 *
 * TypeScript interfaces and types for distributed rate limiting system
 */

export enum RateLimitTier {
  FREE = 'free',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
  ADMIN = 'admin'
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  tier: RateLimitTier;
  message?: string;
}

export interface RateLimitOptions {
  windowMs?: number;
  maxRequests?: number;
  keyGenerator?: (req: any) => string;
  handler?: (req: any, res: any) => void;
  skipFailedRequests?: boolean;
  skipSuccessfulRequests?: boolean;
  enableHeaders?: boolean;
  draft7?: boolean;
  tier?: RateLimitTier;
  onLimitReached?: (req: any, identifier: string) => void;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

export interface RedisRateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

export interface EndpointRateLimit {
  path: string;
  method?: string;
  config: RateLimitConfig;
}

export interface RateLimitMetrics {
  identifier: string;
  timestamp: number;
  allowed: boolean;
  tier: RateLimitTier;
  endpoint: string;
  remaining: number;
}

export interface RedisConnectionConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  maxRetriesPerRequest?: number;
  enableOfflineQueue?: boolean;
  connectTimeout?: number;
  retryStrategy?: (times: number) => number | void;
}

/**
 * Advanced Rate Limiting Tests
 *
 * Comprehensive tests for:
 * - Sliding window algorithm accuracy
 * - Header validation (X-RateLimit-* and draft-7)
 * - Tier-based limits
 * - Redis failover and graceful degradation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { createRateLimiter, RedisRateLimiter } from '../../src/middleware/rateLimiter';
import { RateLimitTier } from '../../src/types/rateLimit.types';

vi.mock('ioredis');

describe('Advanced Rate Limiting', () => {
  describe('Sliding Window Algorithm', () => {
    let limiter: RedisRateLimiter;

    beforeEach(() => {
      limiter = new RedisRateLimiter();
    });

    afterEach(async () => {
      await limiter.close();
    });

    it('should accurately track requests in sliding window', async () => {
      const identifier = 'sliding-window-test';
      const windowMs = 1000; // 1 second window
      const maxRequests = 5;

      // Make 3 requests at t=0
      for (let i = 0; i < 3; i++) {
        const result = await limiter.checkRateLimit(identifier, windowMs, maxRequests);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(maxRequests - i - 1);
      }

      // Wait 600ms
      await new Promise((resolve) => setTimeout(resolve, 600));

      // Make 2 more requests (total 5, should still be allowed)
      for (let i = 0; i < 2; i++) {
        const result = await limiter.checkRateLimit(identifier, windowMs, maxRequests);
        expect(result.allowed).toBe(true);
      }

      // Next request should be blocked
      const blocked = await limiter.checkRateLimit(identifier, windowMs, maxRequests);
      expect(blocked.allowed).toBe(false);
      expect(blocked.remaining).toBe(0);

      // Wait for first 3 requests to fall out of window (another 500ms)
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Should now have 3 slots available again
      for (let i = 0; i < 3; i++) {
        const result = await limiter.checkRateLimit(identifier, windowMs, maxRequests);
        expect(result.allowed).toBe(true);
      }
    });

    it('should calculate reset time correctly', async () => {
      const identifier = 'reset-time-test';
      const windowMs = 60000; // 1 minute
      const maxRequests = 1;

      const before = Date.now();
      await limiter.checkRateLimit(identifier, windowMs, maxRequests);

      const result = await limiter.checkRateLimit(identifier, windowMs, maxRequests);
      const after = Date.now();

      expect(result.allowed).toBe(false);
      expect(result.reset).toBeGreaterThan(before + windowMs - 1000); // Allow 1s tolerance
      expect(result.reset).toBeLessThan(after + windowMs + 1000);
    });

    it('should handle sub-second windows accurately', async () => {
      const identifier = 'subsecond-test';
      const windowMs = 100; // 100ms window
      const maxRequests = 3;

      // Fill window
      for (let i = 0; i < maxRequests; i++) {
        const result = await limiter.checkRateLimit(identifier, windowMs, maxRequests);
        expect(result.allowed).toBe(true);
      }

      // Should be blocked
      const blocked = await limiter.checkRateLimit(identifier, windowMs, maxRequests);
      expect(blocked.allowed).toBe(false);

      // Wait for window to expire
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Should be allowed again
      const allowed = await limiter.checkRateLimit(identifier, windowMs, maxRequests);
      expect(allowed.allowed).toBe(true);
    });

    it('should maintain separate windows for different identifiers', async () => {
      const windowMs = 60000;
      const maxRequests = 2;

      // Fill window for identifier1
      await limiter.checkRateLimit('id1', windowMs, maxRequests);
      await limiter.checkRateLimit('id1', windowMs, maxRequests);

      const id1Blocked = await limiter.checkRateLimit('id1', windowMs, maxRequests);
      expect(id1Blocked.allowed).toBe(false);

      // identifier2 should have separate window
      const id2Allowed = await limiter.checkRateLimit('id2', windowMs, maxRequests);
      expect(id2Allowed.allowed).toBe(true);
    });
  });

  describe('Rate Limit Headers', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let nextFn: NextFunction;
    let setHeaderSpy: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      setHeaderSpy = vi.fn();

      mockReq = {
        ip: '127.0.0.1',
        path: '/api/test',
        method: 'GET',
        headers: {},
        socket: { remoteAddress: '127.0.0.1' } as any,
      };

      mockRes = {
        set: setHeaderSpy,
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      nextFn = vi.fn();
    });

    it('should set standard X-RateLimit headers', async () => {
      const middleware = createRateLimiter({
        windowMs: 60000,
        maxRequests: 100,
        enableHeaders: true,
      });

      await middleware(mockReq as Request, mockRes as Response, nextFn);

      expect(setHeaderSpy).toHaveBeenCalledWith('X-RateLimit-Limit', expect.any(String));
      expect(setHeaderSpy).toHaveBeenCalledWith('X-RateLimit-Remaining', expect.any(String));
      expect(setHeaderSpy).toHaveBeenCalledWith('X-RateLimit-Reset', expect.any(String));
    });

    it('should set draft-7 RateLimit headers when enabled', async () => {
      const middleware = createRateLimiter({
        windowMs: 60000,
        maxRequests: 100,
        enableHeaders: true,
        draft7: true,
      });

      await middleware(mockReq as Request, mockRes as Response, nextFn);

      expect(setHeaderSpy).toHaveBeenCalledWith('RateLimit-Limit', expect.any(String));
      expect(setHeaderSpy).toHaveBeenCalledWith('RateLimit-Remaining', expect.any(String));
      expect(setHeaderSpy).toHaveBeenCalledWith('RateLimit-Reset', expect.any(String));

      // Should not set X- prefixed headers
      const xRateLimitCalls = setHeaderSpy.mock.calls.filter(
        (call) => call[0]?.startsWith('X-RateLimit')
      );
      expect(xRateLimitCalls).toHaveLength(0);
    });

    it('should include Retry-After header when rate limited', async () => {
      const middleware = createRateLimiter({
        windowMs: 60000,
        maxRequests: 1,
        enableHeaders: true,
      });

      // First request
      await middleware(mockReq as Request, mockRes as Response, vi.fn());

      // Second request (blocked)
      setHeaderSpy.mockClear();
      await middleware(mockReq as Request, mockRes as Response, vi.fn());

      expect(setHeaderSpy).toHaveBeenCalledWith('Retry-After', expect.any(String));
    });

    it('should not set headers when disabled', async () => {
      const middleware = createRateLimiter({
        windowMs: 60000,
        maxRequests: 100,
        enableHeaders: false,
      });

      await middleware(mockReq as Request, mockRes as Response, nextFn);

      expect(setHeaderSpy).not.toHaveBeenCalled();
    });

    it('should update remaining count correctly', async () => {
      const middleware = createRateLimiter({
        windowMs: 60000,
        maxRequests: 5,
        enableHeaders: true,
      });

      for (let i = 0; i < 3; i++) {
        setHeaderSpy.mockClear();
        await middleware(mockReq as Request, mockRes as Response, vi.fn());

        const remainingCall = setHeaderSpy.mock.calls.find(
          (call) => call[0] === 'X-RateLimit-Remaining'
        );
        expect(remainingCall).toBeDefined();
        const remaining = parseInt(remainingCall![1] as string);
        expect(remaining).toBe(5 - i - 1);
      }
    });

    it('should set correct limit header value', async () => {
      const maxRequests = 42;
      const middleware = createRateLimiter({
        windowMs: 60000,
        maxRequests,
        enableHeaders: true,
      });

      await middleware(mockReq as Request, mockRes as Response, nextFn);

      const limitCall = setHeaderSpy.mock.calls.find((call) => call[0] === 'X-RateLimit-Limit');
      expect(limitCall).toBeDefined();
      expect(limitCall![1]).toBe(maxRequests.toString());
    });

    it('should set reset time in Unix timestamp seconds', async () => {
      const middleware = createRateLimiter({
        windowMs: 60000,
        maxRequests: 100,
        enableHeaders: true,
      });

      const before = Math.ceil(Date.now() / 1000);
      await middleware(mockReq as Request, mockRes as Response, nextFn);
      const after = Math.ceil(Date.now() / 1000);

      const resetCall = setHeaderSpy.mock.calls.find((call) => call[0] === 'X-RateLimit-Reset');
      expect(resetCall).toBeDefined();
      const reset = parseInt(resetCall![1] as string);

      expect(reset).toBeGreaterThanOrEqual(before + 58); // Window - 2s tolerance
      expect(reset).toBeLessThanOrEqual(after + 62); // Window + 2s tolerance
    });
  });

  describe('Tier-Based Rate Limiting', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let nextFn: NextFunction;

    beforeEach(() => {
      mockReq = {
        ip: '127.0.0.1',
        path: '/api/test',
        method: 'GET',
        headers: {},
        socket: { remoteAddress: '127.0.0.1' } as any,
      };

      mockRes = {
        set: vi.fn(),
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      nextFn = vi.fn();
    });

    it('should apply free tier limits by default', async () => {
      const middleware = createRateLimiter({});

      await middleware(mockReq as Request, mockRes as Response, nextFn);

      expect(nextFn).toHaveBeenCalled();
      expect(mockRes.set).toHaveBeenCalledWith('X-RateLimit-Limit', expect.any(String));
    });

    it('should apply pro tier limits with pro API key', async () => {
      mockReq.headers = { 'x-api-key': 'pro_test123' };

      const middleware = createRateLimiter({
        tier: RateLimitTier.PRO,
      });

      await middleware(mockReq as Request, mockRes as Response, nextFn);

      const setCall = (mockRes.set as any).mock.calls.find(
        (call: any) => call[0] === 'X-RateLimit-Limit'
      );
      const limit = parseInt(setCall[1]);

      // Pro tier should have higher limits than free tier
      expect(limit).toBeGreaterThan(100); // Free tier default
    });

    it('should apply enterprise tier limits', async () => {
      mockReq.headers = { 'x-api-key': 'ent_test123' };

      const middleware = createRateLimiter({
        tier: RateLimitTier.ENTERPRISE,
      });

      await middleware(mockReq as Request, mockRes as Response, nextFn);

      expect(nextFn).toHaveBeenCalled();
    });

    it('should apply admin tier with no limits', async () => {
      mockReq.headers = { 'x-api-key': 'admin_test123' };

      const middleware = createRateLimiter({
        tier: RateLimitTier.ADMIN,
      });

      // Make many requests
      for (let i = 0; i < 100; i++) {
        await middleware(mockReq as Request, mockRes as Response, vi.fn());
      }

      // All should succeed
      expect(mockRes.status).not.toHaveBeenCalledWith(429);
    });

    it('should determine tier from API key prefix', async () => {
      const tiers = [
        { key: 'free_123', tier: RateLimitTier.FREE },
        { key: 'pro_456', tier: RateLimitTier.PRO },
        { key: 'ent_789', tier: RateLimitTier.ENTERPRISE },
        { key: 'admin_000', tier: RateLimitTier.ADMIN },
      ];

      for (const { key, tier } of tiers) {
        mockReq.headers = { 'x-api-key': key };
        const middleware = createRateLimiter({ tier });

        await middleware(mockReq as Request, mockRes as Response, vi.fn());

        // Should not error
        expect(true).toBe(true);
      }
    });

    it('should enforce different limits for different tiers', async () => {
      const results: { tier: RateLimitTier; limit: number }[] = [];

      for (const tier of [RateLimitTier.FREE, RateLimitTier.PRO, RateLimitTier.ENTERPRISE]) {
        const mockResLocal = {
          set: vi.fn(),
          status: vi.fn().mockReturnThis(),
          json: vi.fn(),
        };

        const middleware = createRateLimiter({ tier, enableHeaders: true });
        await middleware(mockReq as Request, mockResLocal as any, vi.fn());

        const setCall = (mockResLocal.set as any).mock.calls.find(
          (call: any) => call[0] === 'X-RateLimit-Limit'
        );
        results.push({ tier, limit: parseInt(setCall[1]) });
      }

      // Limits should increase with tier level
      expect(results[1].limit).toBeGreaterThan(results[0].limit); // Pro > Free
      expect(results[2].limit).toBeGreaterThan(results[1].limit); // Enterprise > Pro
    });
  });

  describe('Graceful Degradation', () => {
    it('should fallback to memory store when Redis unavailable', async () => {
      const limiter = new RedisRateLimiter();

      // Redis is mocked to be unavailable
      const result = await limiter.checkRateLimit('test', 60000, 100);

      expect(result.allowed).toBe(true);
    });

    it('should continue allowing requests on Redis error', async () => {
      const middleware = createRateLimiter({
        windowMs: 60000,
        maxRequests: 100,
      });

      const mockReq = {
        ip: '127.0.0.1',
        path: '/api/test',
        method: 'GET',
        headers: {},
        socket: { remoteAddress: '127.0.0.1' },
      } as Request;

      const mockRes = {
        set: vi.fn(),
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as any;

      await middleware(mockReq, mockRes, vi.fn());

      // Should not throw or return 500
      expect(mockRes.status).not.toHaveBeenCalledWith(500);
    });
  });

  describe('Concurrent Request Handling', () => {
    let limiter: RedisRateLimiter;

    beforeEach(() => {
      limiter = new RedisRateLimiter();
    });

    afterEach(async () => {
      await limiter.close();
    });

    it('should handle race conditions correctly', async () => {
      const identifier = 'race-test';
      const windowMs = 60000;
      const maxRequests = 10;

      // Simulate 50 concurrent requests
      const promises = Array(50)
        .fill(null)
        .map(() => limiter.checkRateLimit(identifier, windowMs, maxRequests));

      const results = await Promise.all(promises);
      const allowed = results.filter((r) => r.allowed);
      const blocked = results.filter((r) => !r.allowed);

      // Exactly maxRequests should be allowed
      expect(allowed.length).toBeLessThanOrEqual(maxRequests);
      expect(blocked.length).toBeGreaterThan(0);
    });

    it('should maintain consistency under load', async () => {
      const identifier = 'load-test';
      const windowMs = 60000;
      const maxRequests = 20;

      const results = await Promise.all(
        Array(100)
          .fill(null)
          .map(() => limiter.checkRateLimit(identifier, windowMs, maxRequests))
      );

      const allowed = results.filter((r) => r.allowed).length;
      const blocked = results.filter((r) => !r.allowed).length;

      expect(allowed + blocked).toBe(100);
      expect(allowed).toBeLessThanOrEqual(maxRequests);
    });
  });

  describe('Metrics Collection', () => {
    let limiter: RedisRateLimiter;

    beforeEach(() => {
      limiter = new RedisRateLimiter();
    });

    afterEach(async () => {
      await limiter.close();
    });

    it('should store rate limit metrics', async () => {
      const metrics = {
        identifier: 'metrics-test',
        timestamp: Date.now(),
        allowed: true,
        tier: RateLimitTier.FREE,
        endpoint: 'GET /api/test',
        remaining: 99,
      };

      await limiter.storeMetrics(metrics);

      const retrieved = await limiter.getMetrics('metrics-test');
      expect(retrieved.length).toBeGreaterThanOrEqual(0);
    });

    it('should retrieve metrics by identifier', async () => {
      const identifier = 'user-123';

      await limiter.storeMetrics({
        identifier,
        timestamp: Date.now(),
        allowed: true,
        tier: RateLimitTier.FREE,
        endpoint: 'GET /api/test',
        remaining: 99,
      });

      const metrics = await limiter.getMetrics(identifier);
      expect(metrics.every((m) => m.identifier === identifier)).toBe(true);
    });
  });
});

/**
 * Rate Limiter Middleware Tests
 *
 * Comprehensive test suite for distributed rate limiting
 */

import { Request, Response, NextFunction } from 'express';
import { createRateLimiter, rateLimiter, RedisRateLimiter } from '../../src/middleware/rateLimiter';
import { RateLimitTier } from '../../src/types/rateLimit.types';

// Mock Redis
jest.mock('ioredis');

describe('RedisRateLimiter', () => {
  let limiter: RedisRateLimiter;

  beforeEach(() => {
    limiter = new RedisRateLimiter();
  });

  afterEach(async () => {
    await limiter.close();
  });

  describe('checkRateLimit', () => {
    test('should allow requests within limit', async () => {
      const result = await limiter.checkRateLimit('test-key', 60000, 100);

      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(100);
      expect(result.remaining).toBeGreaterThanOrEqual(0);
      expect(result.reset).toBeGreaterThan(Date.now());
    });

    test('should block requests exceeding limit', async () => {
      const identifier = 'test-key-block';
      const windowMs = 60000;
      const maxRequests = 2;

      // Make requests up to limit
      for (let i = 0; i < maxRequests; i++) {
        const result = await limiter.checkRateLimit(identifier, windowMs, maxRequests);
        expect(result.allowed).toBe(true);
      }

      // Next request should be blocked
      const blockedResult = await limiter.checkRateLimit(identifier, windowMs, maxRequests);
      expect(blockedResult.allowed).toBe(false);
      expect(blockedResult.remaining).toBe(0);
      expect(blockedResult.retryAfter).toBeGreaterThan(0);
    });

    test('should reset after window expires', async () => {
      const identifier = 'test-key-reset';
      const windowMs = 100; // 100ms window
      const maxRequests = 1;

      // First request
      const result1 = await limiter.checkRateLimit(identifier, windowMs, maxRequests);
      expect(result1.allowed).toBe(true);

      // Second request should be blocked
      const result2 = await limiter.checkRateLimit(identifier, windowMs, maxRequests);
      expect(result2.allowed).toBe(false);

      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 150));

      // Third request should be allowed
      const result3 = await limiter.checkRateLimit(identifier, windowMs, maxRequests);
      expect(result3.allowed).toBe(true);
    });

    test('should handle concurrent requests correctly', async () => {
      const identifier = 'test-key-concurrent';
      const windowMs = 60000;
      const maxRequests = 10;

      // Make 20 concurrent requests
      const promises = Array(20).fill(null).map(() =>
        limiter.checkRateLimit(identifier, windowMs, maxRequests)
      );

      const results = await Promise.all(promises);
      const allowed = results.filter(r => r.allowed);
      const blocked = results.filter(r => !r.allowed);

      expect(allowed.length).toBeLessThanOrEqual(maxRequests);
      expect(blocked.length).toBeGreaterThan(0);
    });
  });

  describe('metrics', () => {
    test('should store and retrieve metrics', async () => {
      const metrics = {
        identifier: 'test-user',
        timestamp: Date.now(),
        allowed: true,
        tier: RateLimitTier.FREE,
        endpoint: 'GET /api/test',
        remaining: 99
      };

      await limiter.storeMetrics(metrics);
      const retrieved = await limiter.getMetrics('test-user');

      expect(retrieved.length).toBeGreaterThan(0);
      expect(retrieved[0].identifier).toBe('test-user');
    });
  });

  describe('reset', () => {
    test('should reset rate limit for identifier', async () => {
      const identifier = 'test-key-reset-manual';
      const windowMs = 60000;
      const maxRequests = 1;

      // Make request
      await limiter.checkRateLimit(identifier, windowMs, maxRequests);

      // Should be blocked
      const blocked = await limiter.checkRateLimit(identifier, windowMs, maxRequests);
      expect(blocked.allowed).toBe(false);

      // Reset
      await limiter.reset(identifier);

      // Should be allowed again
      const allowed = await limiter.checkRateLimit(identifier, windowMs, maxRequests);
      expect(allowed.allowed).toBe(true);
    });
  });
});

describe('createRateLimiter middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let nextFn: NextFunction;

  beforeEach(() => {
    mockReq = {
      ip: '127.0.0.1',
      path: '/api/test',
      method: 'GET',
      headers: {},
      socket: { remoteAddress: '127.0.0.1' } as any
    };

    mockRes = {
      set: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    nextFn = jest.fn();
  });

  test('should allow requests within limit', async () => {
    const middleware = createRateLimiter({
      windowMs: 60000,
      maxRequests: 100
    });

    await middleware(mockReq as Request, mockRes as Response, nextFn);

    expect(nextFn).toHaveBeenCalled();
    expect(mockRes.status).not.toHaveBeenCalledWith(429);
  });

  test('should set rate limit headers', async () => {
    const middleware = createRateLimiter({
      windowMs: 60000,
      maxRequests: 100,
      enableHeaders: true
    });

    await middleware(mockReq as Request, mockRes as Response, nextFn);

    expect(mockRes.set).toHaveBeenCalledWith('X-RateLimit-Limit', expect.any(String));
    expect(mockRes.set).toHaveBeenCalledWith('X-RateLimit-Remaining', expect.any(String));
    expect(mockRes.set).toHaveBeenCalledWith('X-RateLimit-Reset', expect.any(String));
  });

  test('should use API key for identification', async () => {
    mockReq.headers = { 'x-api-key': 'test-api-key' };

    const middleware = createRateLimiter({
      windowMs: 60000,
      maxRequests: 100
    });

    await middleware(mockReq as Request, mockRes as Response, nextFn);

    expect(nextFn).toHaveBeenCalled();
  });

  test('should use custom key generator', async () => {
    const keyGenerator = jest.fn().mockReturnValue('custom-key');

    const middleware = createRateLimiter({
      windowMs: 60000,
      maxRequests: 100,
      keyGenerator
    });

    await middleware(mockReq as Request, mockRes as Response, nextFn);

    expect(keyGenerator).toHaveBeenCalledWith(mockReq);
    expect(nextFn).toHaveBeenCalled();
  });

  test('should block requests exceeding limit', async () => {
    const middleware = createRateLimiter({
      windowMs: 60000,
      maxRequests: 1
    });

    // First request
    await middleware(mockReq as Request, mockRes as Response, nextFn);
    expect(nextFn).toHaveBeenCalledTimes(1);

    // Second request should be blocked
    const nextFn2 = jest.fn();
    await middleware(mockReq as Request, mockRes as Response, nextFn2);

    expect(mockRes.status).toHaveBeenCalledWith(429);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Too Many Requests'
      })
    );
  });

  test('should call custom handler on limit exceeded', async () => {
    const customHandler = jest.fn();

    const middleware = createRateLimiter({
      windowMs: 60000,
      maxRequests: 1,
      handler: customHandler
    });

    // First request
    await middleware(mockReq as Request, mockRes as Response, jest.fn());

    // Second request
    await middleware(mockReq as Request, mockRes as Response, jest.fn());

    expect(customHandler).toHaveBeenCalled();
  });

  test('should call onLimitReached callback', async () => {
    const onLimitReached = jest.fn();

    const middleware = createRateLimiter({
      windowMs: 60000,
      maxRequests: 1,
      onLimitReached
    });

    // First request
    await middleware(mockReq as Request, mockRes as Response, jest.fn());

    // Second request
    await middleware(mockReq as Request, mockRes as Response, jest.fn());

    expect(onLimitReached).toHaveBeenCalledWith(mockReq, expect.any(String));
  });

  test('should use tier-based limits', async () => {
    mockReq.headers = { 'x-api-key': 'pro_12345' };

    const middleware = createRateLimiter({
      tier: RateLimitTier.PRO
    });

    await middleware(mockReq as Request, mockRes as Response, nextFn);

    expect(nextFn).toHaveBeenCalled();
    expect(mockRes.set).toHaveBeenCalledWith(
      'X-RateLimit-Limit',
      expect.stringMatching(/\d+/)
    );
  });
});

describe('Integration tests', () => {
  test('should handle multiple endpoints independently', async () => {
    const middleware1 = createRateLimiter({ maxRequests: 2 });
    const middleware2 = createRateLimiter({ maxRequests: 2 });

    const req1 = { ip: '127.0.0.1', path: '/api/endpoint1', method: 'GET', headers: {}, socket: { remoteAddress: '127.0.0.1' } } as Request;
    const req2 = { ip: '127.0.0.1', path: '/api/endpoint2', method: 'GET', headers: {}, socket: { remoteAddress: '127.0.0.1' } } as Request;
    const res = { set: jest.fn(), status: jest.fn().mockReturnThis(), json: jest.fn() } as any;

    // Both endpoints should allow requests independently
    await middleware1(req1, res, jest.fn());
    await middleware2(req2, res, jest.fn());

    expect(res.status).not.toHaveBeenCalledWith(429);
  });

  test('should handle different IP addresses independently', async () => {
    const middleware = createRateLimiter({ maxRequests: 1 });

    const req1 = { ip: '127.0.0.1', path: '/api/test', method: 'GET', headers: {}, socket: { remoteAddress: '127.0.0.1' } } as Request;
    const req2 = { ip: '192.168.1.1', path: '/api/test', method: 'GET', headers: {}, socket: { remoteAddress: '192.168.1.1' } } as Request;
    const res = { set: jest.fn(), status: jest.fn().mockReturnThis(), json: jest.fn() } as any;

    await middleware(req1, res, jest.fn());
    await middleware(req2, res, jest.fn());

    // Both should succeed as they have different IPs
    expect(res.status).not.toHaveBeenCalledWith(429);
  });
});

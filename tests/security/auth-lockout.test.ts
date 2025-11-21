/**
 * Authentication Lockout Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AuthLockoutManager, getAuthLockout, resetAuthLockout } from '@/lib/security/auth-lockout';
import type { Request, Response, NextFunction } from 'express';

describe('Authentication Lockout Manager', () => {
  let lockout: AuthLockoutManager;

  beforeEach(() => {
    resetAuthLockout();
    lockout = getAuthLockout({
      maxAttempts: 5,
      windowMs: 15 * 60 * 1000, // 15 minutes
      lockoutDurationMs: 15 * 60 * 1000, // 15 minutes
      progressiveLockout: true,
      enableLogging: false
    });
  });

  afterEach(async () => {
    await lockout.close();
    resetAuthLockout();
  });

  describe('recordFailedAttempt', () => {
    it('should record first failed attempt', async () => {
      const identifier = 'test-user-1';
      const result = await lockout.recordFailedAttempt(identifier);

      expect(result.allowed).toBe(true);
      expect(result.lockoutInfo.attempts).toBe(1);
      expect(result.lockoutInfo.remainingAttempts).toBe(4);
      expect(result.lockoutInfo.isLocked).toBe(false);
    });

    it('should increment attempt count', async () => {
      const identifier = 'test-user-2';

      await lockout.recordFailedAttempt(identifier);
      await lockout.recordFailedAttempt(identifier);
      const result = await lockout.recordFailedAttempt(identifier);

      expect(result.lockoutInfo.attempts).toBe(3);
      expect(result.lockoutInfo.remainingAttempts).toBe(2);
    });

    it('should lock account after max attempts', async () => {
      const identifier = 'test-user-3';

      // Record max attempts
      for (let i = 0; i < 4; i++) {
        await lockout.recordFailedAttempt(identifier);
      }

      const result = await lockout.recordFailedAttempt(identifier);

      expect(result.allowed).toBe(false);
      expect(result.lockoutInfo.isLocked).toBe(true);
      expect(result.lockoutInfo.lockedUntil).toBeGreaterThan(Date.now());
      expect(result.error).toBeDefined();
      expect(result.error).toContain('locked');
    });

    it('should prevent further attempts when locked', async () => {
      const identifier = 'test-user-4';

      // Lock the account
      for (let i = 0; i < 5; i++) {
        await lockout.recordFailedAttempt(identifier);
      }

      // Try another attempt
      const result = await lockout.recordFailedAttempt(identifier);

      expect(result.allowed).toBe(false);
      expect(result.lockoutInfo.isLocked).toBe(true);
    });

    it('should track different identifiers separately', async () => {
      const user1 = 'test-user-5';
      const user2 = 'test-user-6';

      await lockout.recordFailedAttempt(user1);
      await lockout.recordFailedAttempt(user1);

      const result1 = await lockout.getLockoutInfo(user1);
      const result2 = await lockout.getLockoutInfo(user2);

      expect(result1.attempts).toBe(2);
      expect(result2.attempts).toBe(0);
    });
  });

  describe('isLocked', () => {
    it('should return false for unlocked account', async () => {
      const identifier = 'test-user-7';
      const locked = await lockout.isLocked(identifier);

      expect(locked).toBe(false);
    });

    it('should return true for locked account', async () => {
      const identifier = 'test-user-8';

      // Lock account
      for (let i = 0; i < 5; i++) {
        await lockout.recordFailedAttempt(identifier);
      }

      const locked = await lockout.isLocked(identifier);
      expect(locked).toBe(true);
    });
  });

  describe('getLockoutInfo', () => {
    it('should return correct info for new identifier', async () => {
      const identifier = 'test-user-9';
      const info = await lockout.getLockoutInfo(identifier);

      expect(info.attempts).toBe(0);
      expect(info.remainingAttempts).toBe(5);
      expect(info.isLocked).toBe(false);
      expect(info.lockedUntil).toBeNull();
    });

    it('should return correct info after failed attempts', async () => {
      const identifier = 'test-user-10';

      await lockout.recordFailedAttempt(identifier);
      await lockout.recordFailedAttempt(identifier);

      const info = await lockout.getLockoutInfo(identifier);

      expect(info.attempts).toBe(2);
      expect(info.remainingAttempts).toBe(3);
      expect(info.isLocked).toBe(false);
    });

    it('should return correct info when locked', async () => {
      const identifier = 'test-user-11';

      // Lock account
      for (let i = 0; i < 5; i++) {
        await lockout.recordFailedAttempt(identifier);
      }

      const info = await lockout.getLockoutInfo(identifier);

      expect(info.attempts).toBe(5);
      expect(info.remainingAttempts).toBe(0);
      expect(info.isLocked).toBe(true);
      expect(info.lockedUntil).toBeGreaterThan(Date.now());
    });
  });

  describe('reset', () => {
    it('should reset attempt count', async () => {
      const identifier = 'test-user-12';

      await lockout.recordFailedAttempt(identifier);
      await lockout.recordFailedAttempt(identifier);
      await lockout.reset(identifier);

      const info = await lockout.getLockoutInfo(identifier);
      expect(info.attempts).toBe(0);
      expect(info.remainingAttempts).toBe(5);
    });

    it('should unlock locked account', async () => {
      const identifier = 'test-user-13';

      // Lock account
      for (let i = 0; i < 5; i++) {
        await lockout.recordFailedAttempt(identifier);
      }

      await lockout.reset(identifier);

      const locked = await lockout.isLocked(identifier);
      expect(locked).toBe(false);
    });
  });

  describe('recordSuccessfulAuth', () => {
    it('should reset attempts on successful auth', async () => {
      const identifier = 'test-user-14';

      await lockout.recordFailedAttempt(identifier);
      await lockout.recordFailedAttempt(identifier);
      await lockout.recordSuccessfulAuth(identifier);

      const info = await lockout.getLockoutInfo(identifier);
      expect(info.attempts).toBe(0);
    });
  });

  describe('middleware', () => {
    let middleware: any;
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
      middleware = lockout.middleware();
      mockReq = {
        ip: '192.168.1.1',
        socket: {
          remoteAddress: '192.168.1.1'
        } as any,
        method: 'POST',
        path: '/api/auth/login'
      };
      mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };
      mockNext = vi.fn();
    });

    it('should allow request when not locked', async () => {
      await middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should block request when locked', async () => {
      const identifier = mockReq.ip!;

      // Lock the IP
      for (let i = 0; i < 5; i++) {
        await lockout.recordFailedAttempt(identifier);
      }

      await middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(429);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Too Many Requests',
          message: expect.stringContaining('locked'),
          retryAfter: expect.any(Number),
          lockedUntil: expect.any(String)
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should attach lockout info to request', async () => {
      await middleware(mockReq, mockRes, mockNext);

      expect((mockReq as any).authLockoutInfo).toBeDefined();
      expect((mockReq as any).authLockoutInfo).toHaveProperty('attempts');
      expect((mockReq as any).authLockoutInfo).toHaveProperty('isLocked');
    });
  });

  describe('IP-based tracking', () => {
    it('should track by IP address', async () => {
      const mockReq1 = {
        ip: '192.168.1.100',
        socket: { remoteAddress: '192.168.1.100' } as any
      };

      const mockReq2 = {
        ip: '192.168.1.200',
        socket: { remoteAddress: '192.168.1.200' } as any
      };

      // Lock first IP
      for (let i = 0; i < 5; i++) {
        await lockout.recordFailedAttempt('192.168.1.100');
      }

      const locked1 = await lockout.isLocked('192.168.1.100');
      const locked2 = await lockout.isLocked('192.168.1.200');

      expect(locked1).toBe(true);
      expect(locked2).toBe(false);
    });
  });

  describe('time window', () => {
    it('should count attempts within time window', async () => {
      const identifier = 'test-user-15';

      await lockout.recordFailedAttempt(identifier);
      await lockout.recordFailedAttempt(identifier);

      const info = await lockout.getLockoutInfo(identifier);
      expect(info.attempts).toBe(2);
    });
  });

  describe('lockout duration', () => {
    it('should set correct lockout duration', async () => {
      const identifier = 'test-user-16';

      // Lock account
      for (let i = 0; i < 5; i++) {
        await lockout.recordFailedAttempt(identifier);
      }

      const info = await lockout.getLockoutInfo(identifier);
      const lockoutDuration = info.lockedUntil! - Date.now();

      // Should be approximately 15 minutes (within 1 second tolerance)
      expect(lockoutDuration).toBeGreaterThan(14 * 60 * 1000);
      expect(lockoutDuration).toBeLessThan(16 * 60 * 1000);
    });
  });
});

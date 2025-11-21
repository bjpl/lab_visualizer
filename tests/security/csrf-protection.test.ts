/**
 * CSRF Protection Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CSRFProtection, getCSRFProtection, resetCSRFProtection } from '@/lib/security/csrf-protection';
import type { Request, Response, NextFunction } from 'express';

describe('CSRF Protection', () => {
  let csrf: CSRFProtection;

  beforeEach(() => {
    resetCSRFProtection();
    csrf = getCSRFProtection({
      secret: 'test-secret-key-for-csrf-protection',
      tokenLength: 32,
      cookieOptions: {
        httpOnly: true,
        secure: false, // Test mode
        sameSite: 'strict',
        maxAge: 60000, // 1 minute for testing
        path: '/'
      }
    });
  });

  afterEach(() => {
    resetCSRFProtection();
  });

  describe('generateToken', () => {
    it('should generate valid CSRF token', () => {
      const token = csrf.generateToken();

      expect(token).toHaveProperty('token');
      expect(token).toHaveProperty('signature');
      expect(token).toHaveProperty('timestamp');
      expect(typeof token.token).toBe('string');
      expect(token.token.length).toBeGreaterThan(0);
      expect(typeof token.signature).toBe('string');
      expect(token.timestamp).toBeGreaterThan(0);
    });

    it('should generate unique tokens', () => {
      const token1 = csrf.generateToken();
      const token2 = csrf.generateToken();

      expect(token1.token).not.toBe(token2.token);
      expect(token1.signature).not.toBe(token2.signature);
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token', () => {
      const token = csrf.generateToken();
      const valid = csrf.verifyToken(token.token, token.signature, token.timestamp);

      expect(valid).toBe(true);
    });

    it('should reject token with wrong signature', () => {
      const token = csrf.generateToken();
      const valid = csrf.verifyToken(token.token, 'wrong-signature', token.timestamp);

      expect(valid).toBe(false);
    });

    it('should reject expired token', () => {
      const token = csrf.generateToken();
      const oldTimestamp = Date.now() - 120000; // 2 minutes ago (expired)

      const valid = csrf.verifyToken(token.token, token.signature, oldTimestamp);
      expect(valid).toBe(false);
    });

    it('should reject tampered token', () => {
      const token = csrf.generateToken();
      const tamperedToken = token.token + 'tampered';

      const valid = csrf.verifyToken(tamperedToken, token.signature, token.timestamp);
      expect(valid).toBe(false);
    });
  });

  describe('middleware', () => {
    let middleware: any;
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
      middleware = csrf.middleware();
      mockReq = {
        method: 'POST',
        path: '/api/test',
        cookies: {},
        headers: {},
        body: {}
      };
      mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };
      mockNext = vi.fn();
    });

    it('should allow GET requests without token', () => {
      mockReq.method = 'GET';
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should allow HEAD requests without token', () => {
      mockReq.method = 'HEAD';
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should allow OPTIONS requests without token', () => {
      mockReq.method = 'OPTIONS';
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should reject POST without CSRF token', () => {
      mockReq.method = 'POST';
      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'CSRF token missing'
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should accept valid CSRF token from header', () => {
      const token = csrf.generateToken();
      mockReq.cookies = {
        _csrf: JSON.stringify(token)
      };
      mockReq.headers = {
        'x-csrf-token': token.token
      };

      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should accept valid CSRF token from body', () => {
      const token = csrf.generateToken();
      mockReq.cookies = {
        _csrf: JSON.stringify(token)
      };
      mockReq.body = {
        _csrf: token.token
      };

      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should reject mismatched tokens', () => {
      const token1 = csrf.generateToken();
      const token2 = csrf.generateToken();

      mockReq.cookies = {
        _csrf: JSON.stringify(token1)
      };
      mockReq.headers = {
        'x-csrf-token': token2.token
      };

      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'CSRF token mismatch'
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject invalid token format', () => {
      mockReq.cookies = {
        _csrf: 'invalid-json'
      };
      mockReq.headers = {
        'x-csrf-token': 'some-token'
      };

      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Invalid CSRF token'
        })
      );
    });

    it('should reject expired token signature', () => {
      const token = csrf.generateToken();
      token.timestamp = Date.now() - 120000; // Expired

      mockReq.cookies = {
        _csrf: JSON.stringify(token)
      };
      mockReq.headers = {
        'x-csrf-token': token.token
      };

      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should skip excluded paths', () => {
      mockReq.path = '/api/auth/callback';
      mockReq.method = 'POST';

      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe('setTokenCookie', () => {
    it('should set CSRF token cookie', () => {
      const mockRes = {
        cookie: vi.fn()
      } as any;

      const token = csrf.setTokenCookie(mockRes);

      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
      expect(mockRes.cookie).toHaveBeenCalledWith(
        '_csrf',
        expect.any(String),
        expect.objectContaining({
          httpOnly: true,
          path: '/'
        })
      );
    });
  });

  describe('getToken', () => {
    it('should retrieve token from request cookie', () => {
      const tokenData = csrf.generateToken();
      const mockReq = {
        cookies: {
          _csrf: JSON.stringify(tokenData)
        }
      } as any;

      const token = csrf.getToken(mockReq);
      expect(token).toBe(tokenData.token);
    });

    it('should return null if no cookie present', () => {
      const mockReq = {
        cookies: {}
      } as any;

      const token = csrf.getToken(mockReq);
      expect(token).toBeNull();
    });

    it('should return null if cookie is invalid JSON', () => {
      const mockReq = {
        cookies: {
          _csrf: 'invalid-json'
        }
      } as any;

      const token = csrf.getToken(mockReq);
      expect(token).toBeNull();
    });
  });

  describe('tokenEndpoint', () => {
    it('should generate and return new token', () => {
      const endpoint = csrf.tokenEndpoint();
      const mockReq = {} as any;
      const mockRes = {
        cookie: vi.fn(),
        json: vi.fn()
      } as any;

      endpoint(mockReq, mockRes);

      expect(mockRes.cookie).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          csrfToken: expect.any(String)
        })
      );
    });
  });

  describe('clearToken', () => {
    it('should clear CSRF cookie', () => {
      const mockRes = {
        clearCookie: vi.fn()
      } as any;

      csrf.clearToken(mockRes);

      expect(mockRes.clearCookie).toHaveBeenCalledWith('_csrf', {
        path: '/'
      });
    });
  });

  describe('double-submit cookie pattern', () => {
    it('should implement double-submit cookie pattern correctly', () => {
      const token = csrf.generateToken();
      const mockReq = {
        method: 'POST',
        path: '/api/test',
        cookies: {
          _csrf: JSON.stringify(token)
        },
        headers: {
          'x-csrf-token': token.token
        },
        body: {}
      } as any;

      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      } as any;

      const mockNext = vi.fn();
      const middleware = csrf.middleware();

      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });
});

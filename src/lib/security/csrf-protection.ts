/**
 * CSRF Protection Utility
 *
 * Implements CSRF token generation and validation
 * Using double-submit cookie pattern with cryptographic signatures
 */

import { randomBytes, createHmac, timingSafeEqual } from 'crypto';
import type { Request, Response, NextFunction } from 'express';

// Enforce CSRF_SECRET in production
if (process.env.NODE_ENV === 'production' && !process.env.CSRF_SECRET) {
  throw new Error('CSRF_SECRET environment variable is required in production. Generate with: openssl rand -hex 32');
}

export interface CSRFConfig {
  secret: string;
  tokenLength: number;
  cookieName: string;
  headerName: string;
  cookieOptions: {
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'strict' | 'lax' | 'none';
    maxAge: number;
    path: string;
  };
  excludedMethods: string[];
  excludedPaths: RegExp[];
}

export interface CSRFToken {
  token: string;
  signature: string;
  timestamp: number;
}

/**
 * CSRF Protection Service
 */
export class CSRFProtection {
  private config: CSRFConfig;

  constructor(config?: Partial<CSRFConfig>) {
    this.config = {
      secret: process.env.CSRF_SECRET || this.generateSecret(),
      tokenLength: 32,
      cookieName: '_csrf',
      headerName: 'x-csrf-token',
      cookieOptions: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        path: '/'
      },
      excludedMethods: ['GET', 'HEAD', 'OPTIONS'],
      excludedPaths: [
        /^\/api\/auth\/callback/,
        /^\/api\/webhooks/,
        /^\/health/
      ],
      ...config
    };
  }

  /**
   * Generate a secure random secret
   */
  private generateSecret(): string {
    return randomBytes(64).toString('base64');
  }

  /**
   * Generate a new CSRF token
   */
  public generateToken(): CSRFToken {
    const token = randomBytes(this.config.tokenLength).toString('base64');
    const timestamp = Date.now();
    const signature = this.signToken(token, timestamp);

    return {
      token,
      signature,
      timestamp
    };
  }

  /**
   * Sign a CSRF token
   */
  private signToken(token: string, timestamp: number): string {
    const payload = `${token}:${timestamp}`;
    const hmac = createHmac('sha256', this.config.secret);
    hmac.update(payload);
    return hmac.digest('base64');
  }

  /**
   * Verify a CSRF token
   */
  public verifyToken(token: string, signature: string, timestamp: number): boolean {
    try {
      // Check token age
      const maxAge = this.config.cookieOptions.maxAge;
      if (Date.now() - timestamp > maxAge) {
        return false;
      }

      // Verify signature
      const expectedSignature = this.signToken(token, timestamp);
      const tokenBuffer = Buffer.from(signature, 'base64');
      const expectedBuffer = Buffer.from(expectedSignature, 'base64');

      if (tokenBuffer.length !== expectedBuffer.length) {
        return false;
      }

      return timingSafeEqual(tokenBuffer, expectedBuffer);
    } catch {
      return false;
    }
  }

  /**
   * Create CSRF middleware for Express
   */
  public middleware() {
    return (req: Request, res: Response, next: NextFunction): void => {
      // Skip excluded methods
      if (this.config.excludedMethods.includes(req.method)) {
        return next();
      }

      // Skip excluded paths
      if (this.config.excludedPaths.some(pattern => pattern.test(req.path))) {
        return next();
      }

      // Verify CSRF token
      const cookieToken = req.cookies?.[this.config.cookieName];
      const headerToken = req.headers[this.config.headerName] as string;
      const bodyToken = req.body?._csrf;

      // Try to get token from header or body
      const submittedToken = headerToken || bodyToken;

      if (!cookieToken || !submittedToken) {
        res.status(403).json({
          error: 'CSRF token missing',
          message: 'CSRF token is required for this request'
        });
        return;
      }

      // Parse cookie token
      let csrfData: CSRFToken;
      try {
        csrfData = JSON.parse(cookieToken);
      } catch {
        res.status(403).json({
          error: 'Invalid CSRF token',
          message: 'CSRF token format is invalid'
        });
        return;
      }

      // Verify tokens match
      if (csrfData.token !== submittedToken) {
        res.status(403).json({
          error: 'CSRF token mismatch',
          message: 'CSRF token validation failed'
        });
        return;
      }

      // Verify signature
      if (!this.verifyToken(csrfData.token, csrfData.signature, csrfData.timestamp)) {
        res.status(403).json({
          error: 'CSRF token invalid',
          message: 'CSRF token signature validation failed'
        });
        return;
      }

      next();
    };
  }

  /**
   * Set CSRF token cookie
   */
  public setTokenCookie(res: Response): string {
    const csrfData = this.generateToken();
    const cookieValue = JSON.stringify(csrfData);

    res.cookie(this.config.cookieName, cookieValue, this.config.cookieOptions);

    return csrfData.token;
  }

  /**
   * Get CSRF token from request
   */
  public getToken(req: Request): string | null {
    const cookieToken = req.cookies?.[this.config.cookieName];

    if (!cookieToken) {
      return null;
    }

    try {
      const csrfData: CSRFToken = JSON.parse(cookieToken);
      return csrfData.token;
    } catch {
      return null;
    }
  }

  /**
   * Generate token endpoint middleware
   */
  public tokenEndpoint() {
    return (req: Request, res: Response): void => {
      const token = this.setTokenCookie(res);
      res.json({ csrfToken: token });
    };
  }

  /**
   * Clear CSRF token
   */
  public clearToken(res: Response): void {
    res.clearCookie(this.config.cookieName, {
      path: this.config.cookieOptions.path
    });
  }
}

// Singleton instance
let csrfProtection: CSRFProtection;

/**
 * Get or create singleton instance
 */
export function getCSRFProtection(config?: Partial<CSRFConfig>): CSRFProtection {
  if (!csrfProtection) {
    csrfProtection = new CSRFProtection(config);
  }
  return csrfProtection;
}

/**
 * Reset singleton (for testing)
 */
export function resetCSRFProtection(): void {
  csrfProtection = undefined as any;
}

/**
 * Express middleware factory
 */
export function createCSRFMiddleware(config?: Partial<CSRFConfig>) {
  const protection = getCSRFProtection(config);
  return protection.middleware();
}

/**
 * Express token endpoint factory
 */
export function createCSRFTokenEndpoint(config?: Partial<CSRFConfig>) {
  const protection = getCSRFProtection(config);
  return protection.tokenEndpoint();
}

export default getCSRFProtection;

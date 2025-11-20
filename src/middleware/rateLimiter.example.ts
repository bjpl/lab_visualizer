/**
 * Rate Limiter Usage Examples
 *
 * Comprehensive examples for different use cases
 */

import express, { Request, Response } from 'express';
import createRateLimiter, { rateLimiter } from './rateLimiter';
import { RateLimitTier } from '../types/rateLimit.types';

const app = express();

// ============================================================================
// BASIC EXAMPLES
// ============================================================================

/**
 * Example 1: Basic Rate Limiting
 * Apply simple rate limiting to all routes
 */
export function basicRateLimiting() {
  app.use(createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100
  }));

  app.get('/api/data', (req, res) => {
    res.json({ message: 'Data retrieved successfully' });
  });
}

/**
 * Example 2: Tier-Based Rate Limiting
 * Different limits for different user tiers
 */
export function tierBasedRateLimiting() {
  // Free tier - limited access
  app.use('/api/free', createRateLimiter({
    tier: RateLimitTier.FREE
  }));

  // Pro tier - higher limits
  app.use('/api/pro', createRateLimiter({
    tier: RateLimitTier.PRO
  }));

  // Enterprise tier - maximum limits
  app.use('/api/enterprise', createRateLimiter({
    tier: RateLimitTier.ENTERPRISE
  }));

  app.get('/api/free/data', (req, res) => {
    res.json({ tier: 'free', data: 'Limited data' });
  });

  app.get('/api/pro/data', (req, res) => {
    res.json({ tier: 'pro', data: 'Enhanced data' });
  });

  app.get('/api/enterprise/data', (req, res) => {
    res.json({ tier: 'enterprise', data: 'Full data access' });
  });
}

// ============================================================================
// ADVANCED EXAMPLES
// ============================================================================

/**
 * Example 3: API Key Based Limiting
 * Rate limits based on API key tier
 */
export function apiKeyRateLimiting() {
  app.use(createRateLimiter());

  app.get('/api/data', (req, res) => {
    const apiKey = req.headers['x-api-key'] as string;
    const tier = apiKey?.startsWith('pro_') ? 'pro' : 'free';

    res.json({
      tier,
      message: 'Request processed',
      apiKey: apiKey?.substring(0, 10) + '...'
    });
  });
}

/**
 * Example 4: Custom Key Generator
 * Use user ID from authentication
 */
export function customKeyGenerator() {
  interface AuthRequest extends Request {
    user?: { id: string; email: string };
  }

  app.use(createRateLimiter({
    keyGenerator: (req: AuthRequest) => {
      // Use authenticated user ID if available
      if (req.user?.id) {
        return `user:${req.user.id}`;
      }

      // Fall back to IP address
      return `ip:${req.ip}`;
    }
  }));

  app.get('/api/profile', (req: AuthRequest, res) => {
    res.json({ user: req.user });
  });
}

/**
 * Example 5: Per-Endpoint Custom Limits
 * Different limits for different endpoints
 */
export function perEndpointLimits() {
  // Strict limit on login
  app.post('/api/auth/login',
    createRateLimiter({
      windowMs: 15 * 60 * 1000,
      maxRequests: 5
    }),
    (req, res) => {
      res.json({ message: 'Login successful' });
    }
  );

  // Moderate limit on registration
  app.post('/api/auth/register',
    createRateLimiter({
      windowMs: 60 * 60 * 1000,
      maxRequests: 3
    }),
    (req, res) => {
      res.json({ message: 'Registration successful' });
    }
  );

  // Higher limit on data endpoints
  app.get('/api/data',
    createRateLimiter({
      windowMs: 15 * 60 * 1000,
      maxRequests: 1000
    }),
    (req, res) => {
      res.json({ data: [] });
    }
  );
}

/**
 * Example 6: Custom Error Handler
 * Provide custom response when rate limit exceeded
 */
export function customErrorHandler() {
  app.use(createRateLimiter({
    handler: (req, res) => {
      res.status(429).json({
        error: 'Too Many Requests',
        message: 'You have exceeded the rate limit. Please upgrade your plan for higher limits.',
        upgradeUrl: 'https://example.com/pricing',
        retryAfter: res.getHeader('Retry-After'),
        support: 'contact@example.com'
      });
    }
  }));
}

/**
 * Example 7: Monitoring and Callbacks
 * Track and monitor rate limit events
 */
export function monitoringCallbacks() {
  const violations: Record<string, number> = {};

  app.use(createRateLimiter({
    onLimitReached: (req, identifier) => {
      // Increment violation counter
      violations[identifier] = (violations[identifier] || 0) + 1;

      // Log violation
      console.warn(`[RateLimit] Violation #${violations[identifier]} for ${identifier}`);

      // Alert on repeated violations
      if (violations[identifier] > 10) {
        console.error(`[RateLimit] High violation count for ${identifier}`);
        // Send alert to monitoring service
        // alertService.send({ identifier, count: violations[identifier] });
      }

      // Log request details
      console.log({
        timestamp: new Date().toISOString(),
        identifier,
        path: req.path,
        method: req.method,
        ip: req.ip
      });
    }
  }));
}

// ============================================================================
// INTEGRATION EXAMPLES
// ============================================================================

/**
 * Example 8: Next.js API Routes
 * Integration with Next.js
 */
export function nextjsIntegration() {
  const rateLimitMiddleware = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    maxRequests: 100
  });

  // Wrap Next.js API handler
  function withRateLimit(handler: any) {
    return async (req: any, res: any) => {
      return new Promise((resolve, reject) => {
        rateLimitMiddleware(req, res, (result: any) => {
          if (result instanceof Error) {
            return reject(result);
          }
          return resolve(handler(req, res));
        });
      });
    };
  }

  // Usage in Next.js API route
  const apiHandler = withRateLimit((req: Request, res: Response) => {
    res.json({ message: 'Success' });
  });

  return apiHandler;
}

/**
 * Example 9: Multi-Tier Application
 * Complete application with multiple tiers
 */
export function multiTierApplication() {
  // Middleware to determine user tier
  const determineTier = (req: Request, res: Response, next: any) => {
    const apiKey = req.headers['x-api-key'] as string;

    if (apiKey?.startsWith('admin_')) {
      (req as any).tier = RateLimitTier.ADMIN;
    } else if (apiKey?.startsWith('ent_')) {
      (req as any).tier = RateLimitTier.ENTERPRISE;
    } else if (apiKey?.startsWith('pro_')) {
      (req as any).tier = RateLimitTier.PRO;
    } else {
      (req as any).tier = RateLimitTier.FREE;
    }

    next();
  };

  app.use(determineTier);

  // Apply tier-specific rate limiting
  app.use((req: any, res: Response, next: any) => {
    const limiter = createRateLimiter({
      tier: req.tier
    });
    return limiter(req, res, next);
  });

  app.get('/api/data', (req: any, res) => {
    res.json({
      tier: req.tier,
      message: 'Data access granted'
    });
  });
}

/**
 * Example 10: Admin Endpoints
 * Manage rate limits via admin API
 */
export function adminEndpoints() {
  // Reset rate limit for a user
  app.post('/admin/rate-limit/reset', async (req, res) => {
    const { identifier } = req.body;

    if (!identifier) {
      return res.status(400).json({ error: 'Identifier required' });
    }

    await rateLimiter.reset(identifier);
    res.json({ success: true, identifier });
  });

  // Get metrics for a user
  app.get('/admin/rate-limit/metrics/:identifier', async (req, res) => {
    const { identifier } = req.params;
    const since = req.query.since ? parseInt(req.query.since as string) : undefined;

    const metrics = await rateLimiter.getMetrics(identifier, since);
    res.json({ identifier, metrics });
  });

  // Health check
  app.get('/admin/rate-limit/health', async (req, res) => {
    try {
      await rateLimiter.checkRateLimit('health-check', 60000, 1);
      res.json({ status: 'healthy', redis: 'connected' });
    } catch (error) {
      res.status(503).json({ status: 'unhealthy', redis: 'disconnected' });
    }
  });
}

/**
 * Example 11: Gradual Rollout
 * Gradually enable rate limiting for users
 */
export function gradualRollout() {
  const rolloutPercentage = 50; // 50% of users

  app.use((req, res, next) => {
    const ip = req.ip || '';
    const hash = ip.split('.').reduce((acc, val) => acc + parseInt(val), 0);
    const shouldRateLimit = (hash % 100) < rolloutPercentage;

    if (shouldRateLimit) {
      const limiter = createRateLimiter();
      return limiter(req, res, next);
    }

    next();
  });
}

/**
 * Example 12: Dynamic Limits Based on Load
 * Adjust limits based on system load
 */
export function dynamicLimits() {
  function getSystemLoad(): number {
    // Simulate system load check
    return Math.random();
  }

  app.use((req, res, next) => {
    const load = getSystemLoad();

    // Reduce limits under high load
    const maxRequests = load > 0.8 ? 50 : load > 0.5 ? 100 : 200;

    const limiter = createRateLimiter({
      windowMs: 15 * 60 * 1000,
      maxRequests
    });

    return limiter(req, res, next);
  });
}

// ============================================================================
// EXPORT ALL EXAMPLES
// ============================================================================

export default {
  basicRateLimiting,
  tierBasedRateLimiting,
  apiKeyRateLimiting,
  customKeyGenerator,
  perEndpointLimits,
  customErrorHandler,
  monitoringCallbacks,
  nextjsIntegration,
  multiTierApplication,
  adminEndpoints,
  gradualRollout,
  dynamicLimits
};

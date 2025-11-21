# Security Configuration Guide

## Overview

This guide covers the comprehensive security implementation for the LAB Visualization Platform, including:

- HMAC Cache Signing
- XSS Protection with DOMPurify
- CSRF Token Validation
- Authentication Lockout Mechanism
- Redis-based Rate Limiting

## Table of Contents

1. [HMAC Cache Signing](#hmac-cache-signing)
2. [XSS Protection](#xss-protection)
3. [CSRF Protection](#csrf-protection)
4. [Authentication Lockout](#authentication-lockout)
5. [Rate Limiting](#rate-limiting)
6. [Environment Variables](#environment-variables)
7. [Production Deployment](#production-deployment)

---

## HMAC Cache Signing

### Purpose
Prevents cache poisoning and tampering attacks by cryptographically signing all cache entries.

### Features
- SHA-256/SHA-512 HMAC signatures
- Automatic key rotation (configurable interval)
- Multi-key support for zero-downtime rotation
- Timing-safe verification to prevent timing attacks

### Configuration

```typescript
import { getCacheSigning } from '@/lib/security/hmac-cache-signing';

const cacheSigning = getCacheSigning({
  algorithm: 'sha256',                    // 'sha256' or 'sha512'
  keyRotationIntervalMs: 24 * 60 * 60 * 1000,  // 24 hours
  maxKeyAge: 48 * 60 * 60 * 1000,        // 48 hours
  encoding: 'base64'                      // 'hex' or 'base64'
});
```

### Usage

#### Sign Cache Data
```typescript
const signed = cacheSigning.sign({ userId: '123', sessionData: {...} });
// Returns: { data, signature, keyId, timestamp }
```

#### Verify Signed Data
```typescript
const result = cacheSigning.verify(signedData);
if (result.valid) {
  console.log('Data is authentic:', result.data);
} else {
  console.error('Tampering detected:', result.error);
}
```

#### Cache Entry Helpers
```typescript
// Sign cache entry
const { key, signedValue } = cacheSigning.signCacheEntry('user:123', userData);
await redis.set(key, signedValue);

// Verify cache entry
const signedValue = await redis.get('user:123');
const result = cacheSigning.verifyCacheEntry('user:123', signedValue);
if (result.valid) {
  return result.value;
}
```

### Key Rotation

Keys automatically rotate based on `keyRotationIntervalMs`. Old keys are kept for `maxKeyAge` to verify data signed with previous keys.

```typescript
// Manual key rotation (if needed)
cacheSigning.rotateKeys();

// View key information
const keyInfo = cacheSigning.getKeyInfo();
console.log(keyInfo);
// { currentKeyId, activeKeys, keys: [...] }
```

---

## XSS Protection

### Purpose
Prevents Cross-Site Scripting (XSS) attacks by sanitizing user-generated HTML content.

### Features
- DOMPurify-based sanitization
- Multiple security presets (strict, moderate, permissive)
- React-compatible output
- URL sanitization
- Detailed sanitization reports

### Configuration

```typescript
import { XSSSanitizer, SanitizationPresets } from '@/lib/security/xss-sanitizer';

// Default sanitizer
const sanitizer = new XSSSanitizer();

// Strict preset (minimal HTML)
const strictSanitizer = new XSSSanitizer(SanitizationPresets.strict);

// Custom configuration
const customSanitizer = new XSSSanitizer({
  allowedTags: ['p', 'strong', 'em', 'a'],
  allowedAttributes: {
    'a': ['href', 'title']
  },
  allowedSchemes: ['http', 'https'],
  stripComments: true
});
```

### Usage

#### Basic Sanitization
```typescript
import { sanitize } from '@/lib/security/xss-sanitizer';

const userInput = '<p>Safe text</p><script>alert("XSS")</script>';
const clean = sanitize(userInput);
// Returns: '<p>Safe text</p>' (script removed)
```

#### React Component Integration
```typescript
import { sanitizeForReact } from '@/lib/security/xss-sanitizer';

function MyComponent({ content }) {
  return (
    <div dangerouslySetInnerHTML={sanitizeForReact(content)} />
  );
}
```

#### Detailed Sanitization Report
```typescript
const result = sanitizer.sanitizeWithReport(htmlContent);
console.log(result);
// {
//   sanitized: "clean HTML",
//   removed: ["Element: <script>", "Attribute: onclick"],
//   safe: false
// }
```

#### URL Sanitization
```typescript
const url = sanitizer.sanitizeURL(userProvidedUrl);
// Rejects javascript:, data:, and invalid URLs
```

### Presets

| Preset | Allowed Tags | Use Case |
|--------|--------------|----------|
| **Strict** | p, br, strong, em, u | User comments, minimal formatting |
| **Moderate** | + headings, lists, links | Blog posts, articles |
| **Permissive** | + images, tables, code blocks | Rich content editors |

---

## CSRF Protection

### Purpose
Prevents Cross-Site Request Forgery attacks using cryptographically signed tokens and the double-submit cookie pattern.

### Features
- HMAC-signed tokens
- Double-submit cookie pattern
- Configurable token expiration
- Automatic token rotation
- Path and method exclusions

### Configuration

```typescript
import { getCSRFProtection } from '@/lib/security/csrf-protection';

const csrf = getCSRFProtection({
  secret: process.env.CSRF_SECRET,
  tokenLength: 32,
  cookieName: '_csrf',
  headerName: 'x-csrf-token',
  cookieOptions: {
    httpOnly: true,
    secure: true,  // HTTPS only
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000,  // 24 hours
    path: '/'
  },
  excludedMethods: ['GET', 'HEAD', 'OPTIONS'],
  excludedPaths: [/^\/api\/auth\/callback/, /^\/webhooks/]
});
```

### Express Middleware Setup

```typescript
import express from 'express';
import { createCSRFMiddleware, createCSRFTokenEndpoint } from '@/lib/security/csrf-protection';

const app = express();

// Token generation endpoint
app.get('/api/csrf-token', createCSRFTokenEndpoint());

// CSRF protection middleware
app.use(createCSRFMiddleware());
```

### Client-Side Integration

#### Fetch CSRF Token
```typescript
const response = await fetch('/api/csrf-token');
const { csrfToken } = await response.json();
```

#### Include in Requests

**Option 1: Header**
```typescript
fetch('/api/protected', {
  method: 'POST',
  headers: {
    'x-csrf-token': csrfToken,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(data)
});
```

**Option 2: Body**
```typescript
fetch('/api/protected', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    _csrf: csrfToken,
    ...data
  })
});
```

---

## Authentication Lockout

### Purpose
Prevents brute force attacks by locking accounts after multiple failed authentication attempts.

### Features
- IP-based tracking
- Redis-backed with in-memory fallback
- Configurable attempt limits and lockout duration
- Progressive lockout (optional)
- Integration with Express middleware

### Configuration

```typescript
import { getAuthLockout } from '@/lib/security/auth-lockout';

const authLockout = getAuthLockout({
  maxAttempts: 5,                        // 5 failed attempts
  windowMs: 15 * 60 * 1000,              // 15 minutes
  lockoutDurationMs: 15 * 60 * 1000,     // 15 minutes lockout
  progressiveLockout: true,              // Double lockout on repeat violations
  redisKeyPrefix: 'auth_lockout:',
  enableLogging: true
});
```

### Express Middleware

```typescript
import { createAuthLockoutMiddleware } from '@/lib/security/auth-lockout';

// Apply to authentication routes
app.post('/api/auth/login', createAuthLockoutMiddleware(), async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await authenticate(email, password);

    // Success - reset lockout
    await authLockout.recordSuccessfulAuth(req.ip);

    res.json({ success: true, user });
  } catch (error) {
    // Failed - record attempt
    const result = await authLockout.recordFailedAttempt(req.ip);

    if (result.lockoutInfo.isLocked) {
      return res.status(429).json({
        error: 'Account locked',
        retryAfter: Math.ceil((result.lockoutInfo.lockedUntil! - Date.now()) / 1000)
      });
    }

    res.status(401).json({
      error: 'Invalid credentials',
      remainingAttempts: result.lockoutInfo.remainingAttempts
    });
  }
});
```

### Manual Operations

```typescript
// Check if IP is locked
const isLocked = await authLockout.isLocked('192.168.1.1');

// Get lockout information
const info = await authLockout.getLockoutInfo('192.168.1.1');
console.log(info);
// {
//   attempts: 3,
//   remainingAttempts: 2,
//   isLocked: false,
//   lockedUntil: null
// }

// Reset lockout (admin action)
await authLockout.reset('192.168.1.1');

// Record successful authentication
await authLockout.recordSuccessfulAuth('192.168.1.1');
```

---

## Rate Limiting

### Configuration

Authentication endpoints have enhanced rate limiting:

```typescript
// src/config/rateLimit.config.ts

export const ENDPOINT_LIMITS: EndpointRateLimit[] = [
  {
    path: '/api/auth/login',
    method: 'POST',
    config: {
      windowMs: 15 * 60 * 1000,  // 15 minutes
      maxRequests: 5,             // 5 attempts per 15 minutes
      message: 'Too many login attempts. Please try again in 15 minutes.'
    }
  },
  {
    path: '/api/auth/signin',
    method: 'POST',
    config: {
      windowMs: 15 * 60 * 1000,
      maxRequests: 5,
      message: 'Too many sign-in attempts. Please try again in 15 minutes.'
    }
  }
];
```

### Usage

```typescript
import { createRateLimiter } from '@/middleware/rateLimiter';

// Global rate limiting
app.use(createRateLimiter());

// Endpoint-specific (automatically applied based on config)
app.post('/api/auth/login', loginHandler);
```

---

## Environment Variables

Add these to your `.env` file:

```bash
# CSRF Protection
CSRF_SECRET=your-256-bit-secret-key-here-change-in-production

# Redis Configuration (for rate limiting and auth lockout)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
REDIS_DB=0

# Rate Limiting
RATE_LIMIT_KEY_PREFIX=rl:

# Security Settings
NODE_ENV=production
```

### Generating Secrets

```bash
# Generate CSRF secret
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

---

## Production Deployment

### Checklist

- [ ] Set strong `CSRF_SECRET` (64+ bytes)
- [ ] Enable Redis for distributed rate limiting
- [ ] Configure HTTPS (required for secure cookies)
- [ ] Set `NODE_ENV=production`
- [ ] Enable security logging
- [ ] Configure firewall rules
- [ ] Set up monitoring for lockout events
- [ ] Test CSRF protection on all forms
- [ ] Verify XSS sanitization on user content
- [ ] Test auth lockout mechanism
- [ ] Review rate limit thresholds

### Security Headers

Add these headers to your Express app:

```typescript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

### Monitoring

Monitor these metrics:

- Auth lockout events (by IP)
- CSRF token validation failures
- XSS sanitization removals
- Rate limit violations
- Cache signature verification failures

---

## Security Testing

Run security tests:

```bash
# All security tests
npm test tests/security/

# Specific feature tests
npm test tests/security/hmac-signing.test.ts
npm test tests/security/xss-sanitizer.test.ts
npm test tests/security/csrf-protection.test.ts
npm test tests/security/auth-lockout.test.ts
```

---

## Support

For security issues, please report to security@example.com (DO NOT create public issues).

For configuration help, see the main documentation or create an issue on GitHub.

---

**Last Updated**: 2025-11-21
**Version**: 1.0.0

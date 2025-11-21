# Security Implementation

Production-grade security utilities for the LAB Visualization Platform.

## Features

- **HMAC Cache Signing** - Cryptographic signing with automatic key rotation
- **XSS Protection** - DOMPurify-based HTML sanitization
- **CSRF Protection** - Double-submit cookie pattern with HMAC signatures
- **Auth Lockout** - IP-based brute force protection

## Quick Start

```typescript
import {
  getCacheSigning,
  sanitizeForReact,
  getCSRFProtection,
  getAuthLockout
} from '@/lib/security';
```

## Usage Examples

### XSS Protection in React

```tsx
import { sanitizeForReact } from '@/lib/security';

function MyComponent({ userContent }) {
  return <div dangerouslySetInnerHTML={sanitizeForReact(userContent)} />;
}
```

### CSRF Protection in Express

```typescript
import { createCSRFMiddleware } from '@/lib/security';

app.use(createCSRFMiddleware());
```

### Auth Lockout

```typescript
import { getAuthLockout } from '@/lib/security';

const lockout = getAuthLockout();
const result = await lockout.recordFailedAttempt(req.ip);

if (result.lockoutInfo.isLocked) {
  return res.status(429).json({ error: 'Account locked' });
}
```

### Cache Signing

```typescript
import { getCacheSigning } from '@/lib/security';

const signer = getCacheSigning();

// Sign
const signed = signer.sign(data);
await redis.set(key, JSON.stringify(signed));

// Verify
const result = signer.verify(JSON.parse(await redis.get(key)));
if (result.valid) {
  return result.data;
}
```

## Documentation

- [Full Configuration Guide](/docs/security-config.md)
- [Security Audit Report](/docs/security-audit.md)

## Tests

Run security tests:

```bash
npm test tests/security/
```

## Security

For security issues, please report privately to security@example.com.

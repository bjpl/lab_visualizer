/**
 * Security Utilities - Central Export
 *
 * Comprehensive security implementation for LAB Visualization Platform
 */

// HMAC Cache Signing
export {
  HMACCacheSigning,
  getCacheSigning,
  resetCacheSigning
} from './hmac-cache-signing';

export type {
  CacheSigningConfig,
  SignedCacheEntry,
  SignatureVerificationResult
} from './hmac-cache-signing';

// XSS Sanitization
export {
  XSSSanitizer,
  sanitize,
  sanitizeStrict,
  sanitizeModerate,
  sanitizePermissive,
  sanitizeForReact,
  SanitizationPresets
} from './xss-sanitizer';

export type {
  SanitizationConfig,
  SanitizationResult
} from './xss-sanitizer';

// CSRF Protection
export {
  CSRFProtection,
  getCSRFProtection,
  resetCSRFProtection,
  createCSRFMiddleware,
  createCSRFTokenEndpoint
} from './csrf-protection';

export type {
  CSRFConfig,
  CSRFToken
} from './csrf-protection';

// Authentication Lockout
export {
  AuthLockoutManager,
  getAuthLockout,
  resetAuthLockout,
  createAuthLockoutMiddleware
} from './auth-lockout';

export type {
  LockoutConfig,
  LockoutInfo,
  AttemptResult
} from './auth-lockout';

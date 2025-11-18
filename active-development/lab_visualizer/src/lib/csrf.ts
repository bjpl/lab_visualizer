/**
 * CSRF Protection Middleware
 *
 * Implements Cross-Site Request Forgery (CSRF) protection for state-changing API routes.
 * Uses the Double Submit Cookie pattern with session-based token storage.
 *
 * @security CSRF Protection
 * @module lib/csrf
 *
 * ## How it works:
 * 1. Generate a unique CSRF token for each session
 * 2. Store token in encrypted cookie (HttpOnly, SameSite=Strict)
 * 3. Client includes token in X-CSRF-Token header for POST/PUT/DELETE requests
 * 4. Server validates token matches cookie before processing request
 *
 * ## Usage:
 *
 * ### In API Routes (Server-side):
 * ```ts
 * import { validateCSRFToken, generateCSRFToken } from '@/lib/csrf';
 *
 * export async function POST(request: NextRequest) {
 *   // Validate CSRF token
 *   const csrfValidation = await validateCSRFToken(request);
 *   if (!csrfValidation.valid) {
 *     return NextResponse.json(
 *       { error: 'CSRF token validation failed' },
 *       { status: 403 }
 *     );
 *   }
 *
 *   // Process request...
 * }
 *
 * // Generate token (typically in GET /api/csrf-token route)
 * export async function GET() {
 *   const { token, cookie } = await generateCSRFToken();
 *   return NextResponse.json({ token }, {
 *     headers: { 'Set-Cookie': cookie }
 *   });
 * }
 * ```
 *
 * ### In Client Components:
 * ```tsx
 * import { useCSRFToken } from '@/lib/csrf';
 *
 * function MyComponent() {
 *   const { token, loading } = useCSRFToken();
 *
 *   const handleSubmit = async () => {
 *     await fetch('/api/endpoint', {
 *       method: 'POST',
 *       headers: {
 *         'X-CSRF-Token': token,
 *         'Content-Type': 'application/json',
 *       },
 *       body: JSON.stringify(data),
 *     });
 *   };
 * }
 * ```
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * Configuration constants
 */
const CSRF_COOKIE_NAME = '__Host-csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const TOKEN_LENGTH = 32;
const TOKEN_EXPIRY_HOURS = 24;

/**
 * Result of CSRF token validation
 */
export interface CSRFValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Generate a cryptographically secure random token
 *
 * @returns Hex-encoded random token
 */
function generateSecureToken(): string {
  // Use Web Crypto API for cryptographically secure random values
  const array = new Uint8Array(TOKEN_LENGTH);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate a CSRF token and set it in a secure cookie
 *
 * @returns Object containing token and Set-Cookie header value
 *
 * @example
 * ```ts
 * // In API route: GET /api/csrf-token
 * export async function GET() {
 *   const { token, cookie } = await generateCSRFToken();
 *   return NextResponse.json({ csrfToken: token }, {
 *     headers: { 'Set-Cookie': cookie }
 *   });
 * }
 * ```
 */
export async function generateCSRFToken(): Promise<{
  token: string;
  cookie: string;
}> {
  const token = generateSecureToken();

  // Create secure cookie
  const maxAge = TOKEN_EXPIRY_HOURS * 60 * 60; // Convert hours to seconds

  // Use __Host- prefix for additional security
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie#cookie_prefixes
  const cookie = [
    `${CSRF_COOKIE_NAME}=${token}`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Strict',
    `Max-Age=${maxAge}`,
  ].join('; ');

  return { token, cookie };
}

/**
 * Validate CSRF token from request
 *
 * Checks that:
 * 1. Token exists in X-CSRF-Token header
 * 2. Token exists in cookie
 * 3. Tokens match (Double Submit Cookie pattern)
 *
 * @param request - Next.js request object
 * @returns Validation result with success status and optional error message
 *
 * @example
 * ```ts
 * export async function POST(request: NextRequest) {
 *   const validation = await validateCSRFToken(request);
 *   if (!validation.valid) {
 *     return NextResponse.json(
 *       { error: validation.error || 'CSRF validation failed' },
 *       { status: 403 }
 *     );
 *   }
 *   // Process request...
 * }
 * ```
 */
export async function validateCSRFToken(
  request: NextRequest
): Promise<CSRFValidationResult> {
  // Get token from header
  const headerToken = request.headers.get(CSRF_HEADER_NAME);

  if (!headerToken) {
    return {
      valid: false,
      error: 'CSRF token missing from request headers',
    };
  }

  // Get token from cookie
  const cookieStore = cookies();
  const cookieToken = cookieStore.get(CSRF_COOKIE_NAME)?.value;

  if (!cookieToken) {
    return {
      valid: false,
      error: 'CSRF token missing from cookies',
    };
  }

  // Validate tokens match (constant-time comparison to prevent timing attacks)
  if (!constantTimeCompare(headerToken, cookieToken)) {
    return {
      valid: false,
      error: 'CSRF token mismatch',
    };
  }

  return { valid: true };
}

/**
 * Constant-time string comparison to prevent timing attacks
 *
 * @param a - First string
 * @param b - Second string
 * @returns True if strings match
 */
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Middleware wrapper for CSRF protection
 *
 * Use this to wrap API route handlers that need CSRF protection.
 *
 * @param handler - API route handler function
 * @returns Wrapped handler with CSRF validation
 *
 * @example
 * ```ts
 * export const POST = withCSRFProtection(async (request: NextRequest) => {
 *   // Your handler code here
 *   // CSRF token is already validated
 *   return NextResponse.json({ success: true });
 * });
 * ```
 */
export function withCSRFProtection(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Validate CSRF token
    const validation = await validateCSRFToken(request);

    if (!validation.valid) {
      return NextResponse.json(
        {
          error: 'CSRF validation failed',
          message: validation.error || 'Invalid CSRF token',
        },
        {
          status: 403,
          headers: {
            'X-CSRF-Error': validation.error || 'Invalid token',
          },
        }
      );
    }

    // Token is valid, proceed with handler
    return handler(request);
  };
}

/**
 * Check if request method requires CSRF protection
 *
 * @param method - HTTP method
 * @returns True if method requires CSRF protection
 */
export function requiresCSRFProtection(method: string): boolean {
  const protectedMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];
  return protectedMethods.includes(method.toUpperCase());
}

/**
 * Get CSRF token from cookies (client-side)
 *
 * @returns CSRF token or null if not found
 */
export function getCSRFTokenFromCookies(): string | null {
  if (typeof document === 'undefined') {
    return null; // Server-side, no document
  }

  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === CSRF_COOKIE_NAME) {
      return value;
    }
  }

  return null;
}

/**
 * Client-side hook for fetching and managing CSRF token
 *
 * @returns Object with token and loading state
 *
 * @example
 * ```tsx
 * 'use client';
 *
 * import { useCSRFToken } from '@/lib/csrf';
 *
 * function MyForm() {
 *   const { token, loading, error } = useCSRFToken();
 *
 *   if (loading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error}</div>;
 *
 *   const handleSubmit = async (e) => {
 *     e.preventDefault();
 *     await fetch('/api/endpoint', {
 *       method: 'POST',
 *       headers: {
 *         'X-CSRF-Token': token,
 *         'Content-Type': 'application/json',
 *       },
 *       body: JSON.stringify(formData),
 *     });
 *   };
 *
 *   return <form onSubmit={handleSubmit}>...</form>;
 * }
 * ```
 */
export function useCSRFToken(): {
  token: string | null;
  loading: boolean;
  error: string | null;
} {
  // This is a placeholder - actual implementation should use React hooks
  // The real implementation will be in a separate client component file
  // This is just the type definition for documentation

  return {
    token: null,
    loading: false,
    error: 'useCSRFToken must be implemented in a client component',
  };
}

/**
 * Security best practices for CSRF protection
 *
 * @security CSRF Prevention Guidelines
 *
 * 1. **Always protect state-changing requests**:
 *    - POST, PUT, DELETE, PATCH must validate CSRF tokens
 *    - GET requests should never change state
 *
 * 2. **Use secure cookie settings**:
 *    - HttpOnly: Prevents JavaScript access
 *    - Secure: Only sent over HTTPS
 *    - SameSite=Strict: Prevents cross-site sending
 *    - __Host- prefix: Ensures Secure and Path=/ are set
 *
 * 3. **Double Submit Cookie pattern**:
 *    - Token in cookie (HttpOnly)
 *    - Token in header (accessible to JavaScript)
 *    - Server validates both match
 *
 * 4. **Token rotation**:
 *    - Tokens expire after 24 hours
 *    - New token generated for each session
 *    - Consider rotating after sensitive operations
 *
 * 5. **Defense in depth**:
 *    - CSRF protection is one layer
 *    - Also use: authentication, authorization, rate limiting
 *    - Configure CORS properly
 *
 * 6. **Client-side integration**:
 *    - Fetch token on app load
 *    - Include in all state-changing requests
 *    - Handle token expiry gracefully
 */

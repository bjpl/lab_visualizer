/**
 * API Route: GET /api/csrf-token
 * Generate and return CSRF token for client-side use
 *
 * @security CSRF Protection
 */

import { NextResponse } from 'next/server';
import { generateCSRFToken } from '@/lib/csrf';

export const dynamic = 'force-dynamic';

/**
 * GET /api/csrf-token
 * Generates a new CSRF token and sets it in a secure cookie
 *
 * Returns:
 * - csrfToken: Token to include in X-CSRF-Token header
 * - Set-Cookie: Secure HttpOnly cookie with token for validation
 */
export async function GET() {
  try {
    const { token, cookie } = await generateCSRFToken();

    return NextResponse.json(
      {
        csrfToken: token,
        expiresIn: 86400, // 24 hours in seconds
      },
      {
        status: 200,
        headers: {
          'Set-Cookie': cookie,
        },
      }
    );
  } catch (error) {
    console.error('Error generating CSRF token:', error);

    return NextResponse.json(
      {
        error: 'Failed to generate CSRF token',
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

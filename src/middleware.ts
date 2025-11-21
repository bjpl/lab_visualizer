/**
 * Next.js Middleware for Authentication and Route Protection
 * Handles token refresh and redirects for protected routes
 * Supports demo mode without Supabase
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Database } from '@/types/database';

// Check if we're in demo mode
const isDemoMode = () => process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

// Routes that require authentication
const PROTECTED_ROUTES = [
  '/dashboard',
  '/structures',
  '/simulations',
  '/learning',
  '/collections',
  '/profile',
  '/settings',
];

// Routes that are only for unauthenticated users
const AUTH_ROUTES = ['/auth/login', '/auth/signup'];

// Public routes that don't require authentication
const PUBLIC_ROUTES = ['/', '/explore', '/about', '/help'];

/**
 * Check if a path matches any protected route
 */
function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
}

/**
 * Check if a path is an auth route
 */
function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some((route) => pathname.startsWith(route));
}

/**
 * Check if a path is a public route
 */
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname === route);
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const pathname = req.nextUrl.pathname;

  // Skip middleware for static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname.startsWith('/favicon')
  ) {
    return res;
  }

  // In demo mode, skip all auth checks and allow access
  if (isDemoMode()) {
    // Add security headers even in demo mode
    const response = res;
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'origin-when-cross-origin');
    response.headers.set(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=()'
    );
    return response;
  }

  try {
    // Create a Supabase client configured to use cookies
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return req.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            res.cookies.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            res.cookies.set({ name, value: '', ...options });
          },
        },
      }
    );

    // Refresh session if expired - required for Server Components
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('Session error:', sessionError);
    }

    // Check if route requires authentication
    if (isProtectedRoute(pathname)) {
      if (!session) {
        // Redirect to login with return URL
        const redirectUrl = new URL('/auth/login', req.url);
        redirectUrl.searchParams.set('redirectTo', pathname);
        return NextResponse.redirect(redirectUrl);
      }

      // Check if user profile exists
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, username, role')
        .eq('id', session.user.id)
        .single();

      if (profileError || !profile) {
        // Profile doesn't exist, redirect to profile setup
        const setupUrl = new URL('/auth/setup-profile', req.url);
        return NextResponse.redirect(setupUrl);
      }

      // Update last login timestamp
      await supabase
        .from('user_profiles')
        .update({ last_login: new Date().toISOString() })
        .eq('id', session.user.id);

      // Check admin-only routes
      if (pathname.startsWith('/admin') && profile.role !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    }

    // Redirect authenticated users away from auth pages
    if (isAuthRoute(pathname) && session) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // Handle auth callback
    if (pathname === '/auth/callback') {
      const code = req.nextUrl.searchParams.get('code');
      const next = req.nextUrl.searchParams.get('next') || '/dashboard';

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
          return NextResponse.redirect(new URL(next, req.url));
        }
      }

      // If there's an error or no code, redirect to login
      return NextResponse.redirect(new URL('/auth/login', req.url));
    }

    // Add security headers
    const response = res;
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'origin-when-cross-origin');
    response.headers.set(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=()'
    );

    return response;
  } catch (error) {
    console.error('Middleware error:', error);
    return res;
  }
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

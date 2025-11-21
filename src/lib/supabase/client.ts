import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// Cache for singleton instances
let cachedSupabaseClient: SupabaseClient<Database> | null = null;
let cachedMockClient: SupabaseClient<Database> | null = null;

/**
 * Check if demo mode is enabled
 * Demo mode can be enabled via:
 * - NEXT_PUBLIC_DEMO_MODE=true environment variable
 * - Missing Supabase credentials (automatic fallback)
 */
export function isDemoMode(): boolean {
  // Explicit demo mode
  if (process.env['NEXT_PUBLIC_DEMO_MODE'] === 'true') {
    return true;
  }

  // Check for browser-side demo mode flag
  if (typeof window !== 'undefined') {
    const windowWithDemo = window as Window & { DEMO_MODE?: boolean };
    if (windowWithDemo.DEMO_MODE === true) {
      return true;
    }
  }

  return false;
}

/**
 * Check if Supabase credentials are available
 */
export function hasSupabaseCredentials(): boolean {
  return !!(
    process.env['NEXT_PUBLIC_SUPABASE_URL'] &&
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']
  );
}

/**
 * Check if we should use the mock client
 * Returns true if:
 * - Demo mode is explicitly enabled
 * - Supabase credentials are missing (automatic fallback)
 */
export function shouldUseMockClient(): boolean {
  // Explicit demo mode always uses mock
  if (isDemoMode()) {
    return true;
  }

  // Fallback to mock if credentials are missing
  if (!hasSupabaseCredentials()) {
    console.warn(
      '[Supabase] Missing credentials. Falling back to demo mode. ' +
      'Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY for production.'
    );
    return true;
  }

  return false;
}

/**
 * Creates a mock Supabase client for demo mode
 * Dynamically imports to avoid bundling mock code in production
 */
async function createMockClientAsync(): Promise<SupabaseClient<Database>> {
  if (cachedMockClient) {
    return cachedMockClient;
  }

  const { createTypedMockClient } = await import('@/mocks/services');
  cachedMockClient = createTypedMockClient();

  console.log('[Supabase] Using mock client (demo mode)');
  return cachedMockClient;
}

/**
 * Creates a mock client synchronously (for compatibility)
 * Note: This requires the mock module to be pre-loaded
 */
function createMockClientSync(): SupabaseClient<Database> {
  if (cachedMockClient) {
    return cachedMockClient;
  }

  // Dynamic require for synchronous loading
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mockServices = require('@/mocks/services');
  const client = mockServices.createTypedMockClient() as SupabaseClient<Database>;
  cachedMockClient = client;

  console.log('[Supabase] Using mock client (demo mode)');
  return client;
}

/**
 * Creates a real Supabase client
 */
function createRealClient(): SupabaseClient<Database> {
  if (cachedSupabaseClient) {
    return cachedSupabaseClient;
  }

  const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL'];
  const supabaseAnonKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  cachedSupabaseClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
  return cachedSupabaseClient;
}

/**
 * Creates a Supabase client for use in client-side components
 *
 * In demo mode (NEXT_PUBLIC_DEMO_MODE=true) or when Supabase credentials
 * are missing, returns a mock client that stores data in localStorage.
 *
 * Otherwise, returns a real Supabase client using @supabase/ssr.
 *
 * @example
 * ```typescript
 * import { createClient } from '@/lib/supabase/client';
 *
 * const supabase = createClient();
 * const { data, error } = await supabase.from('users').select('*');
 * ```
 */
export function createClient(): SupabaseClient<Database> {
  if (shouldUseMockClient()) {
    return createMockClientSync();
  }

  return createRealClient();
}

/**
 * Creates a Supabase client asynchronously
 * Preferred method for code-splitting and lazy loading mock client
 *
 * @example
 * ```typescript
 * import { createClientAsync } from '@/lib/supabase/client';
 *
 * const supabase = await createClientAsync();
 * const { data, error } = await supabase.from('users').select('*');
 * ```
 */
export async function createClientAsync(): Promise<SupabaseClient<Database>> {
  if (shouldUseMockClient()) {
    return createMockClientAsync();
  }

  return createRealClient();
}

/**
 * Get the current client mode
 */
export function getClientMode(): 'demo' | 'production' | 'unconfigured' {
  if (isDemoMode()) return 'demo';
  if (hasSupabaseCredentials()) return 'production';
  return 'unconfigured';
}

/**
 * Clear cached clients (useful for testing or mode switching)
 */
export function clearClientCache(): void {
  cachedSupabaseClient = null;
  cachedMockClient = null;
}

// Re-export for convenience
export type { Database };

/**
 * Mock Services Index
 * Exports all mock services and provides a unified mock client factory
 * for demo mode operation without Supabase connection
 */

// Export individual mock services
export {
  MockAuthService,
  mockAuthService,
  createMockAuth,
  type MockUser,
  type MockAuthResponse,
  type MockAuthStateChangeCallback,
} from './mock-auth';

export {
  MockDatabaseService,
  MockQueryBuilder,
  mockDatabaseService,
  createMockDatabase,
  initializeDemoData,
  type MockQueryResult,
  type MockDatabaseError,
} from './mock-database';

export {
  MockStorageService,
  MockStorageFileApi,
  mockStorageService,
  createMockStorage,
  clearMockStorage,
  getMockStorageStats,
  type MockStorageError,
  type MockFileObject,
  type MockUploadResponse,
  type MockDownloadResponse,
  type MockRemoveResponse,
  type MockListResponse,
  type MockUrlResponse,
  type MockSignedUrlResponse,
} from './mock-storage';

export {
  MockRealtimeService,
  MockRealtimeChannel,
  MockRealtimeSimulator,
  mockRealtimeService,
  createMockRealtime,
  createMockRealtimeSimulator,
  getMockChannel,
  type MockRealtimeEvent,
  type MockPresenceEvent,
  type MockBroadcastEvent,
  type MockRealtimeCallback,
  type MockPresenceCallback,
  type MockBroadcastCallback,
  type MockPostgresChangesCallback,
} from './mock-realtime';

import { MockAuthService } from './mock-auth';
import { MockDatabaseService, initializeDemoData } from './mock-database';
import { MockStorageService } from './mock-storage';
import { MockRealtimeService } from './mock-realtime';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

/**
 * Mock Supabase Client Interface
 * Provides the same interface as the real Supabase client
 */
export interface MockSupabaseClient {
  auth: MockAuthService;
  from: MockDatabaseService['from'];
  storage: MockStorageService;
  channel: MockRealtimeService['channel'];
  removeChannel: MockRealtimeService['removeChannel'];
  removeAllChannels: MockRealtimeService['removeAllChannels'];
  rpc: MockDatabaseService['rpc'];
}

/**
 * Create a mock Supabase client
 * This client mimics the Supabase JS client interface but works entirely offline
 * using localStorage for persistence
 */
export function createMockClient(): MockSupabaseClient {
  const authService = new MockAuthService();
  const databaseService = new MockDatabaseService();
  const storageService = new MockStorageService();
  const realtimeService = new MockRealtimeService();

  // Initialize demo data on first load
  if (typeof window !== 'undefined') {
    initializeDemoData();
  }

  // Create a client object that matches Supabase's interface
  const mockClient: MockSupabaseClient = {
    auth: authService,
    from: databaseService.from.bind(databaseService),
    storage: storageService,
    channel: realtimeService.channel.bind(realtimeService),
    removeChannel: realtimeService.removeChannel.bind(realtimeService),
    removeAllChannels: realtimeService.removeAllChannels.bind(realtimeService),
    rpc: databaseService.rpc.bind(databaseService),
  };

  return mockClient;
}

/**
 * Type-safe mock client that can be used as SupabaseClient
 * This casts the mock client to be compatible with Supabase's types
 */
export function createTypedMockClient(): SupabaseClient<Database> {
  const mockClient = createMockClient();

  // Cast to SupabaseClient type for compatibility
  // The mock client implements the same interface, so this is safe
  return mockClient as unknown as SupabaseClient<Database>;
}

/**
 * Check if running in demo mode
 */
export function isDemoMode(): boolean {
  if (typeof window === 'undefined') {
    // Server-side: check process.env
    return process.env['NEXT_PUBLIC_DEMO_MODE'] === 'true';
  }

  // Client-side: check window or process.env
  return (
    process.env['NEXT_PUBLIC_DEMO_MODE'] === 'true' ||
    (typeof window !== 'undefined' && (window as Window & { DEMO_MODE?: boolean }).DEMO_MODE === true)
  );
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
 * Demo mode status and utilities
 */
export const demoMode = {
  /**
   * Check if currently in demo mode
   */
  isActive: isDemoMode,

  /**
   * Check if Supabase is configured
   */
  hasCredentials: hasSupabaseCredentials,

  /**
   * Get a descriptive status
   */
  getStatus(): 'demo' | 'configured' | 'unconfigured' {
    if (isDemoMode()) return 'demo';
    if (hasSupabaseCredentials()) return 'configured';
    return 'unconfigured';
  },

  /**
   * Get demo user credentials for testing
   */
  getDemoCredentials(): { email: string; password: string }[] {
    return [
      { email: 'demo@example.com', password: 'demo123' },
      { email: 'researcher@example.com', password: 'research123' },
      { email: 'educator@example.com', password: 'educate123' },
    ];
  },
};

// Storage key constants (for external access if needed)
export const MOCK_STORAGE_KEYS = {
  AUTH_USERS: 'mock_auth_users',
  AUTH_SESSION: 'mock_auth_session',
  AUTH_CURRENT_USER: 'mock_auth_current_user',
  DB_PREFIX: 'mock_db_',
  STORAGE_PREFIX: 'mock_storage_',
  STORAGE_META_PREFIX: 'mock_storage_meta_',
} as const;

/**
 * Clear all mock data from localStorage
 * Useful for resetting demo state
 */
export function clearAllMockData(): void {
  if (typeof window === 'undefined') return;

  const keysToRemove: string[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      const prefixes = [
        'mock_auth_',
        'mock_db_',
        'mock_storage_',
      ];

      if (prefixes.some((prefix) => key.startsWith(prefix))) {
        keysToRemove.push(key);
      }
    }
  }

  keysToRemove.forEach((key) => localStorage.removeItem(key));
  console.log(`[MockServices] Cleared ${keysToRemove.length} items from mock storage`);
}

/**
 * Reset mock data to defaults
 * Clears everything and reinitializes demo data
 */
export function resetMockData(): void {
  clearAllMockData();
  initializeDemoData();
  console.log('[MockServices] Mock data reset to defaults');
}

// Default export
export default {
  createMockClient,
  createTypedMockClient,
  isDemoMode,
  hasSupabaseCredentials,
  demoMode,
  clearAllMockData,
  resetMockData,
};

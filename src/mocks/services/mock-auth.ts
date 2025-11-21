/**
 * Mock Authentication Service
 * Mirrors Supabase Auth interface for demo mode
 */

import type { User, Session, AuthError, Subscription } from '@supabase/supabase-js';

// Storage keys
const MOCK_USERS_KEY = 'mock_auth_users';
const MOCK_SESSION_KEY = 'mock_auth_session';
const MOCK_CURRENT_USER_KEY = 'mock_auth_current_user';

// Type definitions
export interface MockUser {
  id: string;
  email: string;
  password: string; // Stored as plain text for demo purposes
  user_metadata: {
    username: string;
    display_name: string;
    role: 'student' | 'educator' | 'researcher' | 'admin';
  };
  created_at: string;
  updated_at: string;
  email_confirmed_at: string | null;
  last_sign_in_at: string | null;
}

export interface MockAuthResponse {
  data: {
    user: User | null;
    session: Session | null;
  };
  error: AuthError | null;
}

export interface MockAuthStateChangeCallback {
  (event: string, session: Session | null): void;
}

// Default demo users
const DEFAULT_DEMO_USERS: MockUser[] = [
  {
    id: 'demo-user-001',
    email: 'demo@example.com',
    password: 'demo123',
    user_metadata: {
      username: 'demo_user',
      display_name: 'Demo User',
      role: 'student',
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    email_confirmed_at: new Date().toISOString(),
    last_sign_in_at: null,
  },
  {
    id: 'demo-researcher-001',
    email: 'researcher@example.com',
    password: 'research123',
    user_metadata: {
      username: 'dr_smith',
      display_name: 'Dr. Jane Smith',
      role: 'researcher',
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    email_confirmed_at: new Date().toISOString(),
    last_sign_in_at: null,
  },
  {
    id: 'demo-educator-001',
    email: 'educator@example.com',
    password: 'educate123',
    user_metadata: {
      username: 'prof_jones',
      display_name: 'Prof. Michael Jones',
      role: 'educator',
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    email_confirmed_at: new Date().toISOString(),
    last_sign_in_at: null,
  },
];

// Helper to check if we're in browser environment
const isBrowser = typeof window !== 'undefined';

// Helper functions for localStorage
function getStoredUsers(): MockUser[] {
  if (!isBrowser) return DEFAULT_DEMO_USERS;

  const stored = localStorage.getItem(MOCK_USERS_KEY);
  if (!stored) {
    localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(DEFAULT_DEMO_USERS));
    return DEFAULT_DEMO_USERS;
  }
  return JSON.parse(stored);
}

function saveUsers(users: MockUser[]): void {
  if (!isBrowser) return;
  localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
}

function getStoredSession(): Session | null {
  if (!isBrowser) return null;

  const stored = localStorage.getItem(MOCK_SESSION_KEY);
  if (!stored) return null;

  try {
    const session = JSON.parse(stored) as Session;
    // Check if session has expired
    if (session.expires_at && session.expires_at * 1000 < Date.now()) {
      localStorage.removeItem(MOCK_SESSION_KEY);
      localStorage.removeItem(MOCK_CURRENT_USER_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

function saveSession(session: Session | null): void {
  if (!isBrowser) return;

  if (session) {
    localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(MOCK_SESSION_KEY);
    localStorage.removeItem(MOCK_CURRENT_USER_KEY);
  }
}

function getStoredUser(): User | null {
  if (!isBrowser) return null;

  const stored = localStorage.getItem(MOCK_CURRENT_USER_KEY);
  if (!stored) return null;

  try {
    return JSON.parse(stored) as User;
  } catch {
    return null;
  }
}

function saveCurrentUser(user: User | null): void {
  if (!isBrowser) return;

  if (user) {
    localStorage.setItem(MOCK_CURRENT_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(MOCK_CURRENT_USER_KEY);
  }
}

// Generate a mock UUID
function generateMockId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Convert MockUser to Supabase User
function mockUserToSupabaseUser(mockUser: MockUser): User {
  // Build user object explicitly to avoid exactOptionalPropertyTypes issues
  return {
    id: mockUser.id,
    email: mockUser.email,
    user_metadata: mockUser.user_metadata,
    app_metadata: {},
    aud: 'authenticated',
    created_at: mockUser.created_at,
    updated_at: mockUser.updated_at,
    role: 'authenticated',
    identities: [],
    is_anonymous: false,
    ...(mockUser.email_confirmed_at && { email_confirmed_at: mockUser.email_confirmed_at }),
    ...(mockUser.last_sign_in_at && { last_sign_in_at: mockUser.last_sign_in_at }),
    ...(mockUser.email_confirmed_at && { confirmed_at: mockUser.email_confirmed_at }),
  } as User;
}

// Create a mock session
function createMockSession(user: User): Session {
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = 3600; // 1 hour

  return {
    access_token: `mock_access_token_${generateMockId()}`,
    refresh_token: `mock_refresh_token_${generateMockId()}`,
    expires_in: expiresIn,
    expires_at: now + expiresIn,
    token_type: 'bearer',
    user,
  };
}

// Create a mock auth error
function createMockAuthError(message: string, status: number = 400): AuthError {
  const error = new Error(message) as AuthError;
  error.name = 'AuthError';
  error.status = status;
  return error;
}

// Auth state change listeners
const authStateListeners = new Set<MockAuthStateChangeCallback>();

function notifyAuthStateChange(event: string, session: Session | null): void {
  authStateListeners.forEach((callback) => {
    try {
      callback(event, session);
    } catch (error) {
      console.error('Auth state change callback error:', error);
    }
  });
}

/**
 * Mock Auth Service Class
 */
export class MockAuthService {
  /**
   * Sign in with email and password
   */
  async signInWithPassword(credentials: {
    email: string;
    password: string;
  }): Promise<MockAuthResponse> {
    const { email, password } = credentials;

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    const users = getStoredUsers();
    const user = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );

    if (!user) {
      return {
        data: { user: null, session: null },
        error: createMockAuthError('Invalid login credentials', 401),
      };
    }

    // Update last sign in
    user.last_sign_in_at = new Date().toISOString();
    saveUsers(users);

    const supabaseUser = mockUserToSupabaseUser(user);
    const session = createMockSession(supabaseUser);

    saveSession(session);
    saveCurrentUser(supabaseUser);

    notifyAuthStateChange('SIGNED_IN', session);

    return {
      data: { user: supabaseUser, session },
      error: null,
    };
  }

  /**
   * Sign up with email and password
   */
  async signUp(credentials: {
    email: string;
    password: string;
    options?: {
      data?: {
        username?: string;
        display_name?: string;
        role?: 'student' | 'educator' | 'researcher';
      };
      emailRedirectTo?: string;
    };
  }): Promise<MockAuthResponse> {
    const { email, password, options } = credentials;

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    const users = getStoredUsers();

    // Check if user already exists
    const existingUser = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );

    if (existingUser) {
      return {
        data: { user: null, session: null },
        error: createMockAuthError('User already registered', 400),
      };
    }

    // Validate password
    if (password.length < 6) {
      return {
        data: { user: null, session: null },
        error: createMockAuthError('Password must be at least 6 characters', 400),
      };
    }

    // Create new user
    const emailPrefix = email.split('@')[0] || 'user';
    const newUser: MockUser = {
      id: generateMockId(),
      email,
      password,
      user_metadata: {
        username: options?.data?.username || emailPrefix,
        display_name: options?.data?.display_name || emailPrefix,
        role: options?.data?.role || 'student',
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      email_confirmed_at: new Date().toISOString(), // Auto-confirm for demo
      last_sign_in_at: new Date().toISOString(),
    };

    users.push(newUser);
    saveUsers(users);

    const supabaseUser = mockUserToSupabaseUser(newUser);
    const session = createMockSession(supabaseUser);

    saveSession(session);
    saveCurrentUser(supabaseUser);

    notifyAuthStateChange('SIGNED_IN', session);

    return {
      data: { user: supabaseUser, session },
      error: null,
    };
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<{ error: AuthError | null }> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    saveSession(null);
    saveCurrentUser(null);

    notifyAuthStateChange('SIGNED_OUT', null);

    return { error: null };
  }

  /**
   * Get current session
   */
  async getSession(): Promise<{
    data: { session: Session | null };
    error: AuthError | null;
  }> {
    const session = getStoredSession();
    return {
      data: { session },
      error: null,
    };
  }

  /**
   * Get current user
   */
  async getUser(): Promise<{
    data: { user: User | null };
    error: AuthError | null;
  }> {
    const user = getStoredUser();
    return {
      data: { user },
      error: null,
    };
  }

  /**
   * Refresh session
   */
  async refreshSession(): Promise<{
    data: { session: Session | null; user: User | null };
    error: AuthError | null;
  }> {
    const currentSession = getStoredSession();
    const currentUser = getStoredUser();

    if (!currentSession || !currentUser) {
      return {
        data: { session: null, user: null },
        error: createMockAuthError('No session to refresh', 401),
      };
    }

    // Create new session with extended expiry
    const newSession = createMockSession(currentUser);
    saveSession(newSession);

    notifyAuthStateChange('TOKEN_REFRESHED', newSession);

    return {
      data: { session: newSession, user: currentUser },
      error: null,
    };
  }

  /**
   * Update user data
   */
  async updateUser(attributes: {
    email?: string;
    password?: string;
    data?: Record<string, unknown>;
  }): Promise<{
    data: { user: User | null };
    error: AuthError | null;
  }> {
    const currentUser = getStoredUser();

    if (!currentUser) {
      return {
        data: { user: null },
        error: createMockAuthError('No user logged in', 401),
      };
    }

    const users = getStoredUsers();
    const userIndex = users.findIndex((u) => u.id === currentUser.id);

    if (userIndex === -1) {
      return {
        data: { user: null },
        error: createMockAuthError('User not found', 404),
      };
    }

    const userToUpdate = users[userIndex];
    if (!userToUpdate) {
      return {
        data: { user: null },
        error: createMockAuthError('User not found', 404),
      };
    }

    // Update user
    if (attributes.email) {
      userToUpdate.email = attributes.email;
    }
    if (attributes.password) {
      userToUpdate.password = attributes.password;
    }
    if (attributes.data) {
      userToUpdate.user_metadata = {
        ...userToUpdate.user_metadata,
        ...attributes.data,
      } as MockUser['user_metadata'];
    }
    userToUpdate.updated_at = new Date().toISOString();
    users[userIndex] = userToUpdate;

    saveUsers(users);

    const updatedSupabaseUser = mockUserToSupabaseUser(userToUpdate);
    saveCurrentUser(updatedSupabaseUser);

    // Update session with new user data
    const currentSession = getStoredSession();
    if (currentSession) {
      currentSession.user = updatedSupabaseUser;
      saveSession(currentSession);
    }

    notifyAuthStateChange('USER_UPDATED', currentSession);

    return {
      data: { user: updatedSupabaseUser },
      error: null,
    };
  }

  /**
   * Send password reset email (mock - just logs)
   */
  async resetPasswordForEmail(
    email: string,
    _options?: { redirectTo?: string }
  ): Promise<{ data: object; error: AuthError | null }> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    const users = getStoredUsers();
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      // Don't reveal if user exists - return success anyway
      console.log('[MockAuth] Password reset requested for:', email);
    } else {
      console.log('[MockAuth] Password reset email would be sent to:', email);
    }

    return { data: {}, error: null };
  }

  /**
   * Sign in with magic link (mock)
   */
  async signInWithOtp(credentials: {
    email: string;
    options?: { emailRedirectTo?: string };
  }): Promise<{ data: object; error: AuthError | null }> {
    console.log('[MockAuth] Magic link would be sent to:', credentials.email);
    return { data: {}, error: null };
  }

  /**
   * Sign in with OAuth (mock - not functional)
   */
  async signInWithOAuth(_credentials: {
    provider: 'google' | 'github';
    options?: { redirectTo?: string; queryParams?: Record<string, string> };
  }): Promise<{ data: { url: string | null }; error: AuthError | null }> {
    console.log('[MockAuth] OAuth not available in demo mode');
    return {
      data: { url: null },
      error: createMockAuthError('OAuth not available in demo mode', 400),
    };
  }

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange(
    callback: MockAuthStateChangeCallback
  ): { data: { subscription: Subscription } } {
    authStateListeners.add(callback);

    // Immediately call with current session
    const session = getStoredSession();
    if (session) {
      setTimeout(() => callback('INITIAL_SESSION', session), 0);
    }

    return {
      data: {
        subscription: {
          id: generateMockId(),
          callback,
          unsubscribe: () => {
            authStateListeners.delete(callback);
          },
        } as Subscription,
      },
    };
  }
}

// Export singleton instance
export const mockAuthService = new MockAuthService();

// Export helper to create mock auth object compatible with Supabase client
export function createMockAuth(): MockAuthService {
  return new MockAuthService();
}

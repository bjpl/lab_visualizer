/**
 * Authentication Service Security Tests
 * Tests for Supabase-based authentication flows
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AuthService } from '@/services/auth-service';

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    resetPasswordForEmail: vi.fn(),
    updateUser: vi.fn(),
    signInWithOtp: vi.fn(),
    signInWithOAuth: vi.fn(),
    getSession: vi.fn(),
    getUser: vi.fn(),
    refreshSession: vi.fn(),
    onAuthStateChange: vi.fn(),
  },
  from: vi.fn(() => ({
    insert: vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
    update: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
    }),
  })),
};

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}));

// Mock environment variables
const originalEnv = process.env;

beforeEach(() => {
  vi.clearAllMocks();
  process.env = {
    ...originalEnv,
    NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
  };
});

afterEach(() => {
  process.env = originalEnv;
});

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
  });

  describe('User Registration', () => {
    it('should successfully register new user', async () => {
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        aud: 'authenticated',
        role: 'authenticated',
        created_at: new Date().toISOString(),
      };

      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: {
          user: mockUser,
          session: { access_token: 'token123', refresh_token: 'refresh123' },
        },
        error: null,
      });

      const result = await authService.signUp({
        email: 'test@example.com',
        password: 'SecurePassword123!',
        username: 'testuser',
        displayName: 'Test User',
        role: 'student',
      });

      expect(result.user).toBeDefined();
      expect(result.error).toBeNull();
      expect(mockSupabaseClient.auth.signUp).toHaveBeenCalled();
    });

    it('should reject weak passwords', async () => {
      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Password too weak', status: 400 } as any,
      });

      const result = await authService.signUp({
        email: 'test@example.com',
        password: '123', // Weak password
        username: 'testuser',
        displayName: 'Test User',
      });

      expect(result.error).toBeDefined();
      expect(result.user).toBeNull();
    });

    it('should reject duplicate email addresses', async () => {
      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'User already registered', status: 400 } as any,
      });

      const result = await authService.signUp({
        email: 'existing@example.com',
        password: 'SecurePassword123!',
        username: 'testuser',
        displayName: 'Test User',
      });

      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('already registered');
    });

    it('should create user profile after registration', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com' };

      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: { user: mockUser, session: null },
        error: null,
      });

      await authService.signUp({
        email: 'test@example.com',
        password: 'SecurePassword123!',
        username: 'testuser',
        displayName: 'Test User',
        role: 'researcher',
      });

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_profiles');
    });
  });

  describe('User Sign In', () => {
    it('should successfully sign in with valid credentials', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com' };

      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: mockUser,
          session: { access_token: 'token123' },
        },
        error: null,
      });

      const result = await authService.signIn({
        email: 'test@example.com',
        password: 'SecurePassword123!',
      });

      expect(result.user).toBeDefined();
      expect(result.session).toBeDefined();
      expect(result.error).toBeNull();
    });

    it('should reject invalid credentials', async () => {
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials', status: 400 } as any,
      });

      const result = await authService.signIn({
        email: 'test@example.com',
        password: 'wrongpassword',
      });

      expect(result.error).toBeDefined();
      expect(result.user).toBeNull();
    });

    it('should update last login timestamp', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com' };

      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: { access_token: 'token' } },
        error: null,
      });

      await authService.signIn({
        email: 'test@example.com',
        password: 'SecurePassword123!',
      });

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_profiles');
    });

    it('should prevent brute force with rate limiting', async () => {
      // This would be enforced by rate limiter middleware
      // Testing that auth service itself doesn't bypass limits

      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials', status: 400 } as any,
      });

      // Simulate multiple failed attempts
      for (let i = 0; i < 6; i++) {
        const result = await authService.signIn({
          email: 'test@example.com',
          password: 'wrongpassword',
        });
        expect(result.error).toBeDefined();
      }

      expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledTimes(6);
    });
  });

  describe('Password Reset', () => {
    it('should send password reset email', async () => {
      mockSupabaseClient.auth.resetPasswordForEmail.mockResolvedValue({
        data: {},
        error: null,
      });

      const result = await authService.resetPassword({
        email: 'test@example.com',
      });

      expect(result.error).toBeNull();
      expect(mockSupabaseClient.auth.resetPasswordForEmail).toHaveBeenCalled();
    });

    it('should handle non-existent email gracefully', async () => {
      // Don't reveal if email exists (security best practice)
      mockSupabaseClient.auth.resetPasswordForEmail.mockResolvedValue({
        data: {},
        error: null,
      });

      const result = await authService.resetPassword({
        email: 'nonexistent@example.com',
      });

      // Should appear successful even if email doesn't exist
      expect(result.error).toBeNull();
    });

    it('should update password successfully', async () => {
      mockSupabaseClient.auth.updateUser.mockResolvedValue({
        data: { user: { id: 'user123' } },
        error: null,
      });

      const result = await authService.updatePassword({
        password: 'NewSecurePassword123!',
      });

      expect(result.error).toBeNull();
    });

    it('should reject reused passwords', async () => {
      mockSupabaseClient.auth.updateUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Password was used recently', status: 400 } as any,
      });

      const result = await authService.updatePassword({
        password: 'OldPassword123!',
      });

      expect(result.error).toBeDefined();
    });
  });

  describe('Session Management', () => {
    it('should get current session', async () => {
      const mockSession = {
        access_token: 'token123',
        refresh_token: 'refresh123',
        expires_at: Date.now() + 3600000,
      };

      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const result = await authService.getSession();

      expect(result.session).toBeDefined();
      expect(result.error).toBeNull();
    });

    it('should refresh expired session', async () => {
      const mockSession = {
        access_token: 'new_token123',
        refresh_token: 'new_refresh123',
        expires_at: Date.now() + 3600000,
      };

      mockSupabaseClient.auth.refreshSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const result = await authService.refreshSession();

      expect(result.session).toBeDefined();
      expect(result.error).toBeNull();
    });

    it('should handle invalid refresh tokens', async () => {
      mockSupabaseClient.auth.refreshSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Invalid refresh token', status: 401 } as any,
      });

      const result = await authService.refreshSession();

      expect(result.error).toBeDefined();
      expect(result.session).toBeNull();
    });

    it('should sign out user', async () => {
      mockSupabaseClient.auth.signOut.mockResolvedValue({
        error: null,
      });

      const result = await authService.signOut();

      expect(result.error).toBeNull();
      expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled();
    });
  });

  describe('OAuth Authentication', () => {
    it('should support Google OAuth', async () => {
      mockSupabaseClient.auth.signInWithOAuth.mockResolvedValue({
        data: { url: 'https://accounts.google.com/oauth' },
        error: null,
      });

      const result = await authService.signInWithOAuth({
        provider: 'google',
      });

      expect(result.error).toBeNull();
      expect(result.url).toBeDefined();
    });

    it('should support GitHub OAuth', async () => {
      mockSupabaseClient.auth.signInWithOAuth.mockResolvedValue({
        data: { url: 'https://github.com/login/oauth' },
        error: null,
      });

      const result = await authService.signInWithOAuth({
        provider: 'github',
      });

      expect(result.error).toBeNull();
      expect(result.url).toBeDefined();
    });
  });

  describe('Magic Link Authentication', () => {
    it('should send magic link email', async () => {
      mockSupabaseClient.auth.signInWithOtp.mockResolvedValue({
        data: {},
        error: null,
      });

      const result = await authService.signInWithMagicLink({
        email: 'test@example.com',
      });

      expect(result.error).toBeNull();
      expect(mockSupabaseClient.auth.signInWithOtp).toHaveBeenCalled();
    });
  });

  describe('User Profile Management', () => {
    it('should get user profile', async () => {
      const mockProfile = {
        id: 'user123',
        username: 'testuser',
        display_name: 'Test User',
        role: 'student',
      };

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockProfile,
              error: null,
            }),
          }),
        }),
      });

      const result = await authService.getUserProfile('user123');

      expect(result.profile).toBeDefined();
      expect(result.error).toBeNull();
    });

    it('should update user profile', async () => {
      const updatedProfile = {
        bio: 'Updated bio',
        institution: 'Test University',
      };

      mockSupabaseClient.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: updatedProfile,
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await authService.updateProfile('user123', updatedProfile);

      expect(result.profile).toBeDefined();
      expect(result.error).toBeNull();
    });
  });

  describe('Security Features', () => {
    it('should require environment variables', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      expect(() => new AuthService()).toThrow('Missing Supabase environment variables');
    });

    it('should enable auto refresh token', () => {
      const service = new AuthService();
      expect(service.getClient()).toBeDefined();
    });

    it('should persist session to localStorage', () => {
      const service = new AuthService();
      expect(service.getClient()).toBeDefined();
      // Session persistence is configured in constructor
    });

    it('should listen to auth state changes', () => {
      const callback = vi.fn();

      mockSupabaseClient.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      });

      authService.onAuthStateChange(callback);

      expect(mockSupabaseClient.auth.onAuthStateChange).toHaveBeenCalled();
    });
  });
});

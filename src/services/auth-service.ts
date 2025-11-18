/**
 * Authentication Service - Supabase Auth Wrapper
 * Handles all authentication operations for LAB Visualization Platform
 */

import { createClient, SupabaseClient, User, Session, AuthError } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

interface SignUpData {
  email: string;
  password: string;
  username: string;
  displayName: string;
  role?: 'student' | 'educator' | 'researcher';
}

interface SignInData {
  email: string;
  password: string;
}

interface ResetPasswordData {
  email: string;
}

interface UpdatePasswordData {
  password: string;
}

interface MagicLinkData {
  email: string;
  redirectTo?: string;
}

interface OAuthProvider {
  provider: 'google' | 'github';
  redirectTo?: string;
}

interface AuthResponse {
  user: User | null;
  session: Session | null;
  error: AuthError | null;
}

interface ProfileData {
  username: string;
  display_name: string;
  bio?: string;
  avatar_url?: string;
  role?: 'student' | 'educator' | 'researcher';
  institution?: string;
  department?: string;
  research_interests?: string[];
}

export class AuthService {
  private supabase: SupabaseClient<Database>;

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables');
    }

    this.supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      },
    });
  }

  /**
   * Sign up new user with email and password
   */
  async signUp(data: SignUpData): Promise<AuthResponse> {
    try {
      const { email, password, username, displayName, role = 'student' } = data;

      // Create auth user
      const { data: authData, error: authError } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            display_name: displayName,
            role,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (authError) {
        return { user: null, session: null, error: authError };
      }

      // Create user profile (handled by database trigger or separate call)
      if (authData.user) {
        const { error: profileError } = await this.supabase
          .from('user_profiles')
          .insert({
            id: authData.user.id,
            username,
            display_name: displayName,
            role,
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
          // Continue anyway as auth user was created
        }
      }

      return {
        user: authData.user,
        session: authData.session,
        error: null,
      };
    } catch (error) {
      return {
        user: null,
        session: null,
        error: error as AuthError,
      };
    }
  }

  /**
   * Sign in with email and password
   */
  async signIn(data: SignInData): Promise<AuthResponse> {
    try {
      const { email, password } = data;

      const { data: authData, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { user: null, session: null, error };
      }

      // Update last login timestamp
      if (authData.user) {
        await this.supabase
          .from('user_profiles')
          .update({ last_login: new Date().toISOString() })
          .eq('id', authData.user.id);
      }

      return {
        user: authData.user,
        session: authData.session,
        error: null,
      };
    } catch (error) {
      return {
        user: null,
        session: null,
        error: error as AuthError,
      };
    }
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await this.supabase.auth.signOut();
      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  }

  /**
   * Send password reset email
   */
  async resetPassword(data: ResetPasswordData): Promise<{ error: AuthError | null }> {
    try {
      const { email } = data;

      const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password/confirm`,
      });

      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  }

  /**
   * Update user password
   */
  async updatePassword(data: UpdatePasswordData): Promise<{ error: AuthError | null }> {
    try {
      const { password } = data;

      const { error } = await this.supabase.auth.updateUser({
        password,
      });

      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  }

  /**
   * Sign in with magic link
   */
  async signInWithMagicLink(data: MagicLinkData): Promise<{ error: AuthError | null }> {
    try {
      const { email, redirectTo } = data;

      const { error } = await this.supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectTo || `${window.location.origin}/auth/callback`,
        },
      });

      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  }

  /**
   * Sign in with OAuth provider (Google, GitHub)
   */
  async signInWithOAuth(data: OAuthProvider): Promise<{ error: AuthError | null; url?: string }> {
    try {
      const { provider, redirectTo } = data;

      const { data: authData, error } = await this.supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectTo || `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      return { error, url: authData.url };
    } catch (error) {
      return { error: error as AuthError };
    }
  }

  /**
   * Get current session
   */
  async getSession(): Promise<{ session: Session | null; error: AuthError | null }> {
    try {
      const { data, error } = await this.supabase.auth.getSession();
      return { session: data.session, error };
    } catch (error) {
      return { session: null, error: error as AuthError };
    }
  }

  /**
   * Get current user
   */
  async getUser(): Promise<{ user: User | null; error: AuthError | null }> {
    try {
      const { data, error } = await this.supabase.auth.getUser();
      return { user: data.user, error };
    } catch (error) {
      return { user: null, error: error as AuthError };
    }
  }

  /**
   * Get user profile data
   */
  async getUserProfile(userId: string) {
    try {
      const { data, error } = await this.supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      return { profile: data, error };
    } catch (error) {
      return { profile: null, error };
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, profileData: Partial<ProfileData>) {
    try {
      const { data, error } = await this.supabase
        .from('user_profiles')
        .update(profileData)
        .eq('id', userId)
        .select()
        .single();

      return { profile: data, error };
    } catch (error) {
      return { profile: null, error };
    }
  }

  /**
   * Refresh session token
   */
  async refreshSession(): Promise<{ session: Session | null; error: AuthError | null }> {
    try {
      const { data, error } = await this.supabase.auth.refreshSession();
      return { session: data.session, error };
    } catch (error) {
      return { session: null, error: error as AuthError };
    }
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return this.supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
  }

  /**
   * Get Supabase client instance
   */
  getClient(): SupabaseClient<Database> {
    return this.supabase;
  }
}

// Singleton instance
export const authService = new AuthService();

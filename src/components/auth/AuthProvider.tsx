/**
 * Authentication Context Provider
 * Manages global auth state and provides auth functions to components
 */

'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { authService } from '@/services/auth-service';
import type { Database } from '@/types/database';

type UserProfile = Database['public']['Tables']['user_profiles']['Row'];

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (data: {
    email: string;
    password: string;
    username: string;
    displayName: string;
    role?: 'student' | 'educator' | 'researcher';
  }) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signInWithGithub: () => Promise<{ error: any }>;
  signInWithMagicLink: (email: string) => Promise<{ error: any }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Load user profile data
   */
  const loadProfile = useCallback(async (userId: string) => {
    const { profile: profileData, error } = await authService.getUserProfile(userId);
    if (!error && profileData) {
      setProfile(profileData);
    }
  }, []);

  /**
   * Refresh profile data
   */
  const refreshProfile = useCallback(async () => {
    if (user) {
      await loadProfile(user.id);
    }
  }, [user, loadProfile]);

  /**
   * Initialize auth state
   */
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { session: currentSession } = await authService.getSession();
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          await loadProfile(currentSession.user.id);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [loadProfile]);

  /**
   * Listen to auth state changes
   */
  useEffect(() => {
    const {
      data: { subscription },
    } = authService.onAuthStateChange(async (event, currentSession) => {
      console.log('Auth event:', event);

      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        await loadProfile(currentSession.user.id);
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  /**
   * Sign in with email/password
   */
  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await authService.signIn({ email, password });
    return { error };
  }, []);

  /**
   * Sign up new user
   */
  const signUp = useCallback(
    async (data: {
      email: string;
      password: string;
      username: string;
      displayName: string;
      role?: 'student' | 'educator' | 'researcher';
    }) => {
      const { error } = await authService.signUp(data);
      return { error };
    },
    []
  );

  /**
   * Sign out
   */
  const signOut = useCallback(async () => {
    await authService.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  }, []);

  /**
   * Request password reset
   */
  const resetPassword = useCallback(async (email: string) => {
    const { error } = await authService.resetPassword({ email });
    return { error };
  }, []);

  /**
   * Update password
   */
  const updatePassword = useCallback(async (password: string) => {
    const { error } = await authService.updatePassword({ password });
    return { error };
  }, []);

  /**
   * Sign in with Google
   */
  const signInWithGoogle = useCallback(async () => {
    const { error } = await authService.signInWithOAuth({
      provider: 'google',
    });
    return { error };
  }, []);

  /**
   * Sign in with GitHub
   */
  const signInWithGithub = useCallback(async () => {
    const { error } = await authService.signInWithOAuth({
      provider: 'github',
    });
    return { error };
  }, []);

  /**
   * Sign in with magic link
   */
  const signInWithMagicLink = useCallback(async (email: string) => {
    const { error } = await authService.signInWithMagicLink({ email });
    return { error };
  }, []);

  const value: AuthContextType = {
    user,
    session,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    signInWithGoogle,
    signInWithGithub,
    signInWithMagicLink,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Default auth context for SSR/build time
 */
const defaultAuthContext: AuthContextType = {
  user: null,
  session: null,
  profile: null,
  loading: true,
  signIn: async () => ({ error: new Error('AuthProvider not available') }),
  signUp: async () => ({ error: new Error('AuthProvider not available') }),
  signOut: async () => {},
  resetPassword: async () => ({ error: new Error('AuthProvider not available') }),
  updatePassword: async () => ({ error: new Error('AuthProvider not available') }),
  signInWithGoogle: async () => ({ error: new Error('AuthProvider not available') }),
  signInWithGithub: async () => ({ error: new Error('AuthProvider not available') }),
  signInWithMagicLink: async () => ({ error: new Error('AuthProvider not available') }),
  refreshProfile: async () => {},
};

/**
 * Hook to access auth context
 * Returns safe defaults during SSR/build time when AuthProvider is not available
 */
export function useAuth() {
  const context = useContext(AuthContext);

  // Return safe defaults during SSR or when context is not available
  if (context === undefined) {
    // Only warn in development
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
      console.warn('useAuth must be used within an AuthProvider - using default values');
    }
    return defaultAuthContext;
  }

  return context;
}

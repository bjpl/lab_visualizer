/**
 * Authentication Context Provider
 * Manages global auth state and provides auth functions to components
 */

'use client';

import type { User, Session } from '@supabase/supabase-js';
import type React from 'react';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';

import { authService } from '@/services/auth-service';
import type { Database } from '@/types/database';
import type { AuthError, AuthResponse } from '@/types/auth';

type UserProfile = Database['public']['Tables']['user_profiles']['Row'];

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AuthResponse>;
  signUp: (data: {
    email: string;
    password: string;
    username: string;
    displayName: string;
    role?: 'student' | 'educator' | 'researcher';
  }) => Promise<AuthResponse>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<AuthResponse>;
  updatePassword: (password: string) => Promise<AuthResponse>;
  signInWithGoogle: () => Promise<AuthResponse>;
  signInWithGithub: () => Promise<AuthResponse>;
  signInWithMagicLink: (email: string) => Promise<AuthResponse>;
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
 * Hook to access auth context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

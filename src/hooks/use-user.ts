/**
 * useUser Hook
 * Provides user profile data and update functions
 */

'use client';

import { useCallback } from 'react';
import { useAuth } from './use-auth';
import { authService } from '@/services/auth-service';
import type { Database } from '@/types/database';

type UserProfile = Database['public']['Tables']['user_profiles']['Row'];
type UserProfileUpdate = Database['public']['Tables']['user_profiles']['Update'];

export function useUser() {
  const { user, profile, refreshProfile, loading } = useAuth();

  /**
   * Update user profile
   */
  const updateProfile = useCallback(
    async (updates: UserProfileUpdate) => {
      if (!user) {
        return { profile: null, error: new Error('Not authenticated') };
      }

      const result = await authService.updateProfile(user.id, updates);

      if (!result.error) {
        // Refresh profile in context
        await refreshProfile();
      }

      return result;
    },
    [user, refreshProfile]
  );

  /**
   * Update avatar URL
   */
  const updateAvatar = useCallback(
    async (avatarUrl: string) => {
      return updateProfile({ avatar_url: avatarUrl });
    },
    [updateProfile]
  );

  /**
   * Update preferences
   */
  const updatePreferences = useCallback(
    async (preferences: any) => {
      return updateProfile({ preferences });
    },
    [updateProfile]
  );

  /**
   * Update notification settings
   */
  const updateNotificationSettings = useCallback(
    async (notificationSettings: any) => {
      return updateProfile({ notification_settings: notificationSettings });
    },
    [updateProfile]
  );

  /**
   * Check if user has a specific role
   */
  const hasRole = useCallback(
    (role: 'student' | 'educator' | 'researcher' | 'admin') => {
      return profile?.role === role;
    },
    [profile]
  );

  /**
   * Check if user is admin
   */
  const isAdmin = useCallback(() => {
    return profile?.role === 'admin';
  }, [profile]);

  /**
   * Check if user is educator or admin
   */
  const canCreateContent = useCallback(() => {
    return profile?.role === 'educator' || profile?.role === 'admin';
  }, [profile]);

  return {
    user,
    profile,
    loading,
    updateProfile,
    updateAvatar,
    updatePreferences,
    updateNotificationSettings,
    refreshProfile,
    hasRole,
    isAdmin,
    canCreateContent,
  };
}

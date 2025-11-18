/**
 * User-related Type Definitions
 * Defines structured types for user preferences, settings, and profiles
 */

import type { Database } from './database';

export type UserProfile = Database['public']['Tables']['user_profiles']['Row'];
export type UserProfileUpdate = Database['public']['Tables']['user_profiles']['Update'];

/**
 * User preferences structure
 * Used for storing user customization options
 */
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  defaultVisualization: 'cartoon' | 'ball-and-stick' | 'spacefill' | 'surface';
  defaultColorScheme: 'element-symbol' | 'chain-id' | 'secondary-structure';
  autoSave: boolean;
  performanceMode: 'auto' | 'high-quality' | 'balanced' | 'performance';
  keyboardShortcuts: boolean;
  showTips: boolean;
}

/**
 * Notification settings structure
 * Controls what notifications the user receives
 */
export interface NotificationSettings {
  email: {
    jobComplete: boolean;
    jobFailed: boolean;
    weeklyDigest: boolean;
    newContent: boolean;
    collaborationInvites: boolean;
  };
  inApp: {
    jobComplete: boolean;
    jobFailed: boolean;
    newContent: boolean;
    collaborationInvites: boolean;
    mentions: boolean;
  };
  pushNotifications: {
    enabled: boolean;
    jobComplete: boolean;
    jobFailed: boolean;
  };
}

/**
 * Default user preferences
 */
export const defaultUserPreferences: UserPreferences = {
  theme: 'system',
  language: 'en',
  defaultVisualization: 'cartoon',
  defaultColorScheme: 'element-symbol',
  autoSave: true,
  performanceMode: 'auto',
  keyboardShortcuts: true,
  showTips: true,
};

/**
 * Default notification settings
 */
export const defaultNotificationSettings: NotificationSettings = {
  email: {
    jobComplete: true,
    jobFailed: true,
    weeklyDigest: false,
    newContent: true,
    collaborationInvites: true,
  },
  inApp: {
    jobComplete: true,
    jobFailed: true,
    newContent: true,
    collaborationInvites: true,
    mentions: true,
  },
  pushNotifications: {
    enabled: false,
    jobComplete: false,
    jobFailed: false,
  },
};

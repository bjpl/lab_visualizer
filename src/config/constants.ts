/**
 * Application-wide constants and configuration values
 */

export const APP_CONFIG = {
  name: 'LAB Visualizer',
  version: process.env.NEXT_PUBLIC_APP_VERSION || '0.1.0',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
} as const;

export const PAGINATION = {
  defaultPageSize: 20,
  maxPageSize: 100,
  pageSizeOptions: [10, 20, 50, 100],
} as const;

export const CACHE = {
  revalidate: {
    default: 60, // 1 minute
    short: 30, // 30 seconds
    medium: 300, // 5 minutes
    long: 3600, // 1 hour
  },
} as const;

export const ROUTES = {
  home: '/',
  dashboard: '/dashboard',
  auth: {
    signIn: '/auth/signin',
    signUp: '/auth/signup',
    signOut: '/auth/signout',
    resetPassword: '/auth/reset-password',
  },
  api: {
    auth: '/api/auth',
    data: '/api/data',
  },
} as const;

export const FEATURE_FLAGS = {
  enableAnalytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
  enableDebug: process.env.NEXT_PUBLIC_ENABLE_DEBUG === 'true',
} as const;

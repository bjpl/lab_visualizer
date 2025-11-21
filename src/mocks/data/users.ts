/**
 * Mock User Data Fixtures
 * Demo mode user accounts and profiles for testing
 */

import type { Database } from '../../types/database';

type UserProfile = Database['public']['Tables']['user_profiles']['Row'];

/**
 * Mock user credentials for demo login
 */
export interface MockCredentials {
  email: string;
  password: string;
}

/**
 * Extended user data with auth credentials for demo mode
 */
export interface MockUser extends UserProfile {
  credentials: MockCredentials;
}

/**
 * Demo user - Standard access for demonstration purposes
 */
export const DEMO_USER: MockUser = {
  id: 'demo-user-001',
  username: 'demo_user',
  display_name: 'Demo User',
  bio: 'A demonstration account for exploring the LAB Visualizer platform. Feel free to experiment with all features!',
  avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
  role: 'student',
  institution: 'Demo University',
  department: 'Biochemistry',
  research_interests: ['protein folding', 'molecular dynamics', 'drug discovery'],
  preferences: {
    theme: 'light',
    defaultView: 'cartoon',
    autoRotate: true,
    showLabels: true,
    quality: 'medium',
    notifications: {
      email: true,
      push: true,
      jobCompletion: true,
    },
  },
  notification_settings: {
    emailNotifications: true,
    collaborationInvites: true,
    jobUpdates: true,
    learningReminders: true,
    weeklyDigest: false,
  },
  total_structures: 12,
  total_annotations: 34,
  total_sessions: 8,
  created_at: '2024-01-15T10:30:00Z',
  updated_at: '2025-11-20T14:22:00Z',
  last_login: '2025-11-21T09:00:00Z',
  credentials: {
    email: 'demo@labviz.com',
    password: 'demo123',
  },
};

/**
 * Admin user - Full access for administration
 */
export const ADMIN_USER: MockUser = {
  id: 'admin-user-001',
  username: 'admin',
  display_name: 'Administrator',
  bio: 'Platform administrator with full access to all features and administrative functions.',
  avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
  role: 'admin',
  institution: 'LAB Visualizer Inc.',
  department: 'Platform Operations',
  research_interests: ['platform development', 'user experience', 'bioinformatics'],
  preferences: {
    theme: 'dark',
    defaultView: 'ball-and-stick',
    autoRotate: false,
    showLabels: true,
    quality: 'high',
    notifications: {
      email: true,
      push: true,
      jobCompletion: true,
    },
    adminSettings: {
      showDebugPanel: true,
      enableBetaFeatures: true,
    },
  },
  notification_settings: {
    emailNotifications: true,
    collaborationInvites: true,
    jobUpdates: true,
    learningReminders: false,
    weeklyDigest: true,
    systemAlerts: true,
    usageReports: true,
  },
  total_structures: 156,
  total_annotations: 423,
  total_sessions: 89,
  created_at: '2023-06-01T08:00:00Z',
  updated_at: '2025-11-21T08:30:00Z',
  last_login: '2025-11-21T08:30:00Z',
  credentials: {
    email: 'admin@labviz.com',
    password: 'admin123',
  },
};

/**
 * Educator user - For teaching and course creation
 */
export const EDUCATOR_USER: MockUser = {
  id: 'educator-user-001',
  username: 'dr_smith',
  display_name: 'Dr. Sarah Smith',
  bio: 'Professor of Structural Biology with 15 years of experience teaching protein structure and function.',
  avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
  role: 'educator',
  institution: 'Stanford University',
  department: 'Structural Biology',
  research_interests: ['protein structure', 'enzyme mechanisms', 'structural bioinformatics', 'science education'],
  preferences: {
    theme: 'light',
    defaultView: 'cartoon',
    autoRotate: false,
    showLabels: true,
    quality: 'high',
    notifications: {
      email: true,
      push: false,
      jobCompletion: true,
    },
    teachingSettings: {
      defaultClassSize: 30,
      showStudentProgress: true,
    },
  },
  notification_settings: {
    emailNotifications: true,
    collaborationInvites: true,
    jobUpdates: true,
    learningReminders: true,
    weeklyDigest: true,
    studentActivity: true,
  },
  total_structures: 78,
  total_annotations: 234,
  total_sessions: 156,
  created_at: '2023-09-01T12:00:00Z',
  updated_at: '2025-11-19T16:45:00Z',
  last_login: '2025-11-20T14:30:00Z',
  credentials: {
    email: 'sarah.smith@stanford.edu',
    password: 'educator123',
  },
};

/**
 * Researcher user - For advanced research features
 */
export const RESEARCHER_USER: MockUser = {
  id: 'researcher-user-001',
  username: 'dr_chen',
  display_name: 'Dr. Michael Chen',
  bio: 'Computational biologist specializing in molecular dynamics simulations and drug-protein interactions.',
  avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=michael',
  role: 'researcher',
  institution: 'MIT',
  department: 'Computational Biology',
  research_interests: ['molecular dynamics', 'drug discovery', 'machine learning', 'protein-ligand docking'],
  preferences: {
    theme: 'dark',
    defaultView: 'surface',
    autoRotate: false,
    showLabels: false,
    quality: 'ultra',
    notifications: {
      email: true,
      push: true,
      jobCompletion: true,
    },
    researchSettings: {
      defaultSimulationPreset: 'production',
      autoSaveInterval: 5,
    },
  },
  notification_settings: {
    emailNotifications: true,
    collaborationInvites: true,
    jobUpdates: true,
    learningReminders: false,
    weeklyDigest: false,
    computeQuotaAlerts: true,
  },
  total_structures: 342,
  total_annotations: 567,
  total_sessions: 45,
  created_at: '2023-03-15T09:00:00Z',
  updated_at: '2025-11-21T07:15:00Z',
  last_login: '2025-11-21T07:15:00Z',
  credentials: {
    email: 'michael.chen@mit.edu',
    password: 'researcher123',
  },
};

/**
 * All mock users for easy iteration
 */
export const MOCK_USERS: MockUser[] = [
  DEMO_USER,
  ADMIN_USER,
  EDUCATOR_USER,
  RESEARCHER_USER,
];

/**
 * Validate credentials against mock users
 */
export function validateMockCredentials(email: string, password: string): MockUser | null {
  const user = MOCK_USERS.find(
    (u) => u.credentials.email === email && u.credentials.password === password
  );
  return user || null;
}

/**
 * Get mock user by ID
 */
export function getMockUserById(userId: string): MockUser | null {
  return MOCK_USERS.find((u) => u.id === userId) || null;
}

/**
 * Get mock user by email
 */
export function getMockUserByEmail(email: string): MockUser | null {
  return MOCK_USERS.find((u) => u.credentials.email === email) || null;
}

/**
 * Generate a mock session token for demo mode
 */
export function generateMockSessionToken(userId: string): string {
  const timestamp = Date.now();
  const payload = btoa(JSON.stringify({ userId, timestamp, type: 'demo' }));
  return `demo_session_${payload}`;
}

/**
 * Collaboration user colors for real-time sessions
 */
export const USER_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#96CEB4', // Green
  '#FFEAA7', // Yellow
  '#DDA0DD', // Plum
  '#98D8C8', // Mint
  '#F7DC6F', // Gold
];

/**
 * Get a consistent color for a user based on their ID
 */
export function getUserColor(userId: string): string {
  const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return USER_COLORS[hash % USER_COLORS.length];
}

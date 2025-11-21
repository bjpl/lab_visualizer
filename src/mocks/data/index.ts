/**
 * Mock Data Fixtures - Central Export
 * Aggregates all mock data for LAB Visualizer demo mode
 */

// Import for internal use in initialization function
import { MOCK_USERS as _MOCK_USERS } from './users';
import { MOCK_STRUCTURES as _MOCK_STRUCTURES } from './structures';
import { MOCK_SESSIONS as _MOCK_SESSIONS } from './sessions';
import { MOCK_JOBS as _MOCK_JOBS } from './jobs';
import { MOCK_MODULES as _MOCK_MODULES, MOCK_PATHWAYS as _MOCK_PATHWAYS } from './learning';

// User data exports
export {
  // Types
  type MockCredentials,
  type MockUser,
  // Users
  DEMO_USER,
  ADMIN_USER,
  EDUCATOR_USER,
  RESEARCHER_USER,
  MOCK_USERS,
  // Functions
  validateMockCredentials,
  getMockUserById,
  getMockUserByEmail,
  generateMockSessionToken,
  getUserColor,
  USER_COLORS,
} from './users';

// Structure data exports
export {
  // Types
  type MockStructure,
  // Structures
  HEMOGLOBIN_1HHO,
  INSULIN_1ZNI,
  GFP_1EMA,
  LYSOZYME_1LYZ,
  MYOGLOBIN_1MBO,
  DNA_1BNA,
  ATP_SYNTHASE_5ARA,
  SPIKE_6VXX,
  MOCK_STRUCTURES,
  STRUCTURE_CATEGORIES,
  // Functions
  getFeaturedStructures,
  getStructuresByCategory,
  getMockStructureById,
  searchMockStructures,
} from './structures';

// Session data exports
export {
  // Session data
  DEFAULT_SESSION_SETTINGS,
  DEMO_TEACHING_SESSION,
  DEMO_RESEARCH_SESSION,
  DEMO_STUDY_SESSION,
  ARCHIVED_SESSION,
  MOCK_SESSIONS,
  // Users in sessions
  TEACHING_SESSION_USERS,
  RESEARCH_SESSION_USERS,
  // Annotations and activities
  MOCK_ANNOTATIONS,
  MOCK_ACTIVITIES,
  MOCK_CAMERA_STATES,
  // Functions
  getMockSessionUsers,
  getMockAnnotations,
  getMockActivities,
  getMockSessionById,
  getMockSessionByInviteCode,
  getMockUserSessions,
  generateInviteCode,
} from './sessions';

// Job queue data exports
export {
  // Jobs
  COMPLETED_JOB_1,
  COMPLETED_JOB_2,
  RUNNING_JOB,
  QUEUED_JOB,
  PENDING_JOB,
  FAILED_JOB,
  CANCELLED_JOB,
  MOCK_JOBS,
  // Results and analysis
  MOCK_JOB_RESULT,
  MOCK_ENERGY_DATA,
  MOCK_ANALYSIS,
  MOCK_QUEUE_STATS,
  MOCK_CAPABILITIES,
  DEMO_PRESETS,
  // Functions
  getMockJobsByUser,
  getMockJobsByStatus,
  getMockJobById,
  estimateMockWaitTime,
  simulateJobProgress,
} from './jobs';

// Learning content exports
export {
  // Modules
  MODULE_INTRO_PROTEIN,
  MODULE_HEMOGLOBIN_GUIDE,
  MODULE_VISUALIZATION_TUTORIAL,
  MODULE_PROTEIN_QUIZ,
  MODULE_ENZYME_MECHANISMS,
  MOCK_MODULES,
  // Pathways
  PATHWAY_FUNDAMENTALS,
  MOCK_PATHWAYS,
  // User progress
  MOCK_USER_PROGRESS,
  // Functions
  getMockModuleById,
  getMockPathwayById,
  getMockUserProgress,
  getMockUserAllProgress,
  searchMockModules,
  getMockModulesByDifficulty,
  getRecommendedModules,
} from './learning';

/**
 * Demo mode configuration
 */
export const DEMO_MODE_CONFIG = {
  /** Whether demo mode is active */
  enabled: true,

  /** Demo user credentials */
  credentials: {
    demo: { email: 'demo@labviz.com', password: 'demo123' },
    admin: { email: 'admin@labviz.com', password: 'admin123' },
  },

  /** Feature flags for demo mode */
  features: {
    enableAuth: true,
    enableCollaboration: true,
    enableSimulations: true,
    enableLearning: true,
    enableExport: true,
  },

  /** Demo mode limitations */
  limits: {
    maxStructureSize: 10000, // atoms
    maxSimulationTime: 60, // seconds
    maxSessionDuration: 3600, // 1 hour
    maxAnnotations: 50,
  },

  /** Demo mode messages */
  messages: {
    welcome: 'Welcome to LAB Visualizer Demo Mode! Explore all features with sample data.',
    limitations: 'Some features are limited in demo mode. Sign up for full access.',
    sessionExpiry: 'Demo sessions expire after 1 hour. Your progress will not be saved.',
  },
};

/**
 * Initialize mock data for testing/demo mode
 * Call this function to reset mock data to initial state
 */
export function initializeMockData(): void {
  console.log('[Mock Data] Initializing demo mode with mock data fixtures');
  console.log(`[Mock Data] Loaded ${_MOCK_USERS.length} users`);
  console.log(`[Mock Data] Loaded ${_MOCK_STRUCTURES.length} structures`);
  console.log(`[Mock Data] Loaded ${_MOCK_SESSIONS.length} sessions`);
  console.log(`[Mock Data] Loaded ${_MOCK_JOBS.length} jobs`);
  console.log(`[Mock Data] Loaded ${_MOCK_MODULES.length} learning modules`);
  console.log(`[Mock Data] Loaded ${_MOCK_PATHWAYS.length} learning pathways`);
}

/**
 * Check if running in demo mode
 */
export function isDemoMode(): boolean {
  // Check for demo mode environment variable or flag
  if (typeof window !== 'undefined') {
    return (
      window.location.hostname === 'localhost' ||
      window.location.hostname === 'demo.labviz.com' ||
      localStorage.getItem('labviz_demo_mode') === 'true'
    );
  }
  return process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
}

/**
 * Get demo mode banner message
 */
export function getDemoModeBanner(): string | null {
  if (!isDemoMode()) return null;
  return DEMO_MODE_CONFIG.messages.welcome;
}

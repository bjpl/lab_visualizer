/**
 * Mock Collaboration Session Data Fixtures
 * Demo mode collaboration sessions and related data
 */

import type {
  CollaborationSession,
  CollaborationUser,
  SessionSettings,
  Annotation,
  ActivityEvent,
  CameraState,
  ActivityType,
  UserRole,
  PresenceStatus,
} from '../../types/collaboration';
import { DEMO_USER, EDUCATOR_USER, RESEARCHER_USER, getUserColor } from './users';

/**
 * Default session settings
 */
export const DEFAULT_SESSION_SETTINGS: SessionSettings = {
  allowAnnotations: true,
  allowCameraControl: true,
  requireApproval: false,
  maxUsers: 10,
  cameraFollowMode: false,
  cameraLeaderId: undefined,
};

/**
 * Demo collaboration session - Active teaching session
 */
export const DEMO_TEACHING_SESSION: CollaborationSession = {
  id: 'session-demo-001',
  name: 'Introduction to Protein Structure',
  ownerId: EDUCATOR_USER.id,
  createdAt: Date.now() - 3600000, // 1 hour ago
  expiresAt: Date.now() + 7200000, // 2 hours from now
  isActive: true,
  structureId: '1HHO',
  inviteCode: 'LABVIZ-DEMO-2024',
  settings: {
    ...DEFAULT_SESSION_SETTINGS,
    cameraFollowMode: true,
    cameraLeaderId: EDUCATOR_USER.id,
    maxUsers: 30,
  },
};

/**
 * Demo collaboration session - Research collaboration
 */
export const DEMO_RESEARCH_SESSION: CollaborationSession = {
  id: 'session-demo-002',
  name: 'Drug Binding Site Analysis',
  ownerId: RESEARCHER_USER.id,
  createdAt: Date.now() - 1800000, // 30 minutes ago
  expiresAt: Date.now() + 14400000, // 4 hours from now
  isActive: true,
  structureId: '1LYZ',
  inviteCode: 'RES-COLLAB-2024',
  settings: {
    ...DEFAULT_SESSION_SETTINGS,
    allowCameraControl: true,
    maxUsers: 5,
  },
};

/**
 * Demo collaboration session - Student study group
 */
export const DEMO_STUDY_SESSION: CollaborationSession = {
  id: 'session-demo-003',
  name: 'Hemoglobin Study Group',
  ownerId: DEMO_USER.id,
  createdAt: Date.now() - 900000, // 15 minutes ago
  expiresAt: Date.now() + 10800000, // 3 hours from now
  isActive: true,
  structureId: '1HHO',
  inviteCode: 'STUDY-HEM-2024',
  settings: {
    ...DEFAULT_SESSION_SETTINGS,
    requireApproval: true,
    maxUsers: 8,
  },
};

/**
 * Archived session for history
 */
export const ARCHIVED_SESSION: CollaborationSession = {
  id: 'session-archived-001',
  name: 'GFP Structure Review',
  ownerId: EDUCATOR_USER.id,
  createdAt: Date.now() - 86400000 * 3, // 3 days ago
  expiresAt: Date.now() - 86400000 * 2, // 2 days ago (expired)
  isActive: false,
  structureId: '1EMA',
  inviteCode: 'GFP-REVIEW-OLD',
  settings: DEFAULT_SESSION_SETTINGS,
};

/**
 * All mock sessions
 */
export const MOCK_SESSIONS: CollaborationSession[] = [
  DEMO_TEACHING_SESSION,
  DEMO_RESEARCH_SESSION,
  DEMO_STUDY_SESSION,
  ARCHIVED_SESSION,
];

/**
 * Create a collaboration user from profile
 */
function createCollaborationUser(
  userId: string,
  name: string,
  role: UserRole,
  status: PresenceStatus = 'active'
): CollaborationUser {
  return {
    id: userId,
    name,
    color: getUserColor(userId),
    role,
    status,
    lastActivity: Date.now() - Math.random() * 60000, // Random recent activity
    cursor: status === 'active' ? {
      x: Math.random() * 800,
      y: Math.random() * 600,
    } : undefined,
  };
}

/**
 * Mock users in teaching session
 */
export const TEACHING_SESSION_USERS: CollaborationUser[] = [
  createCollaborationUser(EDUCATOR_USER.id, 'Dr. Sarah Smith', 'owner', 'active'),
  createCollaborationUser('student-001', 'Alice Johnson', 'viewer', 'active'),
  createCollaborationUser('student-002', 'Bob Williams', 'viewer', 'active'),
  createCollaborationUser('student-003', 'Carol Davis', 'viewer', 'idle'),
  createCollaborationUser('student-004', 'David Brown', 'viewer', 'active'),
  createCollaborationUser('student-005', 'Emma Wilson', 'viewer', 'offline'),
];

/**
 * Mock users in research session
 */
export const RESEARCH_SESSION_USERS: CollaborationUser[] = [
  createCollaborationUser(RESEARCHER_USER.id, 'Dr. Michael Chen', 'owner', 'active'),
  createCollaborationUser('researcher-002', 'Dr. Lisa Park', 'presenter', 'active'),
  createCollaborationUser('researcher-003', 'James Miller', 'viewer', 'active'),
];

/**
 * Get users for a session
 */
export function getMockSessionUsers(sessionId: string): CollaborationUser[] {
  switch (sessionId) {
    case DEMO_TEACHING_SESSION.id:
      return TEACHING_SESSION_USERS;
    case DEMO_RESEARCH_SESSION.id:
      return RESEARCH_SESSION_USERS;
    case DEMO_STUDY_SESSION.id:
      return [createCollaborationUser(DEMO_USER.id, 'Demo User', 'owner', 'active')];
    default:
      return [];
  }
}

/**
 * Mock annotations for teaching session
 */
export const MOCK_ANNOTATIONS: Annotation[] = [
  {
    id: 'annotation-001',
    userId: EDUCATOR_USER.id,
    userName: 'Dr. Sarah Smith',
    content: 'Notice how the alpha subunits (A and C) are structurally similar to the beta subunits (B and D).',
    position: { x: 25.3, y: 12.5, z: -8.2 },
    target: {
      type: 'chain',
      id: 'A',
      label: 'Chain A (Alpha)',
    },
    color: '#FF6B6B',
    createdAt: Date.now() - 2400000,
    updatedAt: Date.now() - 2400000,
    isPinned: true,
  },
  {
    id: 'annotation-002',
    userId: EDUCATOR_USER.id,
    userName: 'Dr. Sarah Smith',
    content: 'The heme group is located in a hydrophobic pocket. Iron atom coordinates oxygen binding.',
    position: { x: 18.7, y: -5.2, z: 14.3 },
    target: {
      type: 'residue',
      id: 'HEM-147',
      label: 'Heme (HEM 147)',
    },
    color: '#FF6B6B',
    createdAt: Date.now() - 2100000,
    updatedAt: Date.now() - 2100000,
    isPinned: true,
  },
  {
    id: 'annotation-003',
    userId: 'student-001',
    userName: 'Alice Johnson',
    content: 'Is this the proximal histidine that bonds to the iron?',
    position: { x: 20.1, y: -3.8, z: 13.7 },
    target: {
      type: 'residue',
      id: 'HIS-87',
      label: 'His 87',
    },
    color: '#4ECDC4',
    createdAt: Date.now() - 1800000,
    updatedAt: Date.now() - 1800000,
    isPinned: false,
  },
  {
    id: 'annotation-004',
    userId: EDUCATOR_USER.id,
    userName: 'Dr. Sarah Smith',
    content: 'Correct! His87 (F8) is the proximal histidine. It directly coordinates with the iron.',
    position: { x: 20.5, y: -4.0, z: 13.5 },
    target: {
      type: 'residue',
      id: 'HIS-87',
      label: 'His 87',
    },
    color: '#FF6B6B',
    createdAt: Date.now() - 1500000,
    updatedAt: Date.now() - 1500000,
    isPinned: false,
  },
  {
    id: 'annotation-005',
    userId: 'student-002',
    userName: 'Bob Williams',
    content: 'The salt bridge between chains looks important for stability.',
    position: { x: 30.2, y: 8.9, z: -2.1 },
    target: {
      type: 'atom',
      id: '1234',
      label: 'Arg 141 - Asp 126',
    },
    color: '#45B7D1',
    createdAt: Date.now() - 1200000,
    updatedAt: Date.now() - 1200000,
    isPinned: false,
  },
];

/**
 * Get annotations for a session
 */
export function getMockAnnotations(sessionId: string): Annotation[] {
  if (sessionId === DEMO_TEACHING_SESSION.id) {
    return MOCK_ANNOTATIONS;
  }
  return [];
}

/**
 * Mock activity events
 */
export const MOCK_ACTIVITIES: ActivityEvent[] = [
  {
    id: 'activity-001',
    type: 'session-created',
    userId: EDUCATOR_USER.id,
    userName: 'Dr. Sarah Smith',
    timestamp: Date.now() - 3600000,
    message: 'Dr. Sarah Smith created the session',
    data: { sessionName: DEMO_TEACHING_SESSION.name },
  },
  {
    id: 'activity-002',
    type: 'structure-change',
    userId: EDUCATOR_USER.id,
    userName: 'Dr. Sarah Smith',
    timestamp: Date.now() - 3500000,
    message: 'Dr. Sarah Smith loaded Hemoglobin (1HHO)',
    data: { structureId: '1HHO', structureName: 'Hemoglobin' },
  },
  {
    id: 'activity-003',
    type: 'user-join',
    userId: 'student-001',
    userName: 'Alice Johnson',
    timestamp: Date.now() - 3000000,
    message: 'Alice Johnson joined the session',
  },
  {
    id: 'activity-004',
    type: 'user-join',
    userId: 'student-002',
    userName: 'Bob Williams',
    timestamp: Date.now() - 2800000,
    message: 'Bob Williams joined the session',
  },
  {
    id: 'activity-005',
    type: 'annotation-add',
    userId: EDUCATOR_USER.id,
    userName: 'Dr. Sarah Smith',
    timestamp: Date.now() - 2400000,
    message: 'Dr. Sarah Smith added an annotation on Chain A',
    data: { annotationId: 'annotation-001' },
  },
  {
    id: 'activity-006',
    type: 'user-join',
    userId: 'student-003',
    userName: 'Carol Davis',
    timestamp: Date.now() - 2200000,
    message: 'Carol Davis joined the session',
  },
  {
    id: 'activity-007',
    type: 'annotation-add',
    userId: EDUCATOR_USER.id,
    userName: 'Dr. Sarah Smith',
    timestamp: Date.now() - 2100000,
    message: 'Dr. Sarah Smith added an annotation on Heme group',
    data: { annotationId: 'annotation-002' },
  },
  {
    id: 'activity-008',
    type: 'annotation-add',
    userId: 'student-001',
    userName: 'Alice Johnson',
    timestamp: Date.now() - 1800000,
    message: 'Alice Johnson asked a question about His 87',
    data: { annotationId: 'annotation-003' },
  },
  {
    id: 'activity-009',
    type: 'camera-move',
    userId: EDUCATOR_USER.id,
    userName: 'Dr. Sarah Smith',
    timestamp: Date.now() - 1600000,
    message: 'Dr. Sarah Smith moved the camera to focus on the heme pocket',
  },
  {
    id: 'activity-010',
    type: 'annotation-add',
    userId: EDUCATOR_USER.id,
    userName: 'Dr. Sarah Smith',
    timestamp: Date.now() - 1500000,
    message: 'Dr. Sarah Smith replied to Alice\'s question',
    data: { annotationId: 'annotation-004' },
  },
];

/**
 * Get activities for a session
 */
export function getMockActivities(sessionId: string): ActivityEvent[] {
  if (sessionId === DEMO_TEACHING_SESSION.id) {
    return MOCK_ACTIVITIES;
  }
  return [];
}

/**
 * Mock camera states for saved views
 */
export const MOCK_CAMERA_STATES: Record<string, CameraState> = {
  'overview': {
    position: [0, 0, 100],
    target: [0, 0, 0],
    zoom: 1.0,
    rotation: [0, 0, 0],
    fov: 50,
  },
  'heme-pocket': {
    position: [20, -5, 30],
    target: [18, -4, 14],
    zoom: 2.5,
    rotation: [15, 30, 0],
    fov: 40,
  },
  'interface': {
    position: [30, 10, 50],
    target: [25, 5, 0],
    zoom: 1.5,
    rotation: [0, 45, 0],
    fov: 50,
  },
  'allosteric-site': {
    position: [-25, 15, 40],
    target: [-20, 10, 5],
    zoom: 2.0,
    rotation: [-10, -30, 0],
    fov: 45,
  },
};

/**
 * Get session by ID
 */
export function getMockSessionById(sessionId: string): CollaborationSession | null {
  return MOCK_SESSIONS.find((s) => s.id === sessionId) || null;
}

/**
 * Get session by invite code
 */
export function getMockSessionByInviteCode(code: string): CollaborationSession | null {
  return MOCK_SESSIONS.find((s) => s.inviteCode === code && s.isActive) || null;
}

/**
 * Get active sessions for a user
 */
export function getMockUserSessions(userId: string): CollaborationSession[] {
  return MOCK_SESSIONS.filter(
    (s) => s.ownerId === userId || getMockSessionUsers(s.id).some((u) => u.id === userId)
  );
}

/**
 * Generate a new invite code
 */
export function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'LAB-';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

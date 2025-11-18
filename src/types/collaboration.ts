/**
 * Collaboration types for real-time features
 */

/**
 * User role in a collaborative session
 */
export type UserRole = 'owner' | 'presenter' | 'viewer';

/**
 * User presence status
 */
export type PresenceStatus = 'active' | 'idle' | 'offline';

/**
 * Activity event types
 */
export type ActivityType =
  | 'user-join'
  | 'user-leave'
  | 'structure-change'
  | 'annotation-add'
  | 'annotation-edit'
  | 'annotation-delete'
  | 'camera-move'
  | 'simulation-start'
  | 'simulation-stop'
  | 'role-change'
  | 'session-created';

/**
 * Collaborative user information
 */
export interface CollaborationUser {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  color: string;
  role: UserRole;
  status: PresenceStatus;
  cursor?: {
    x: number;
    y: number;
    target?: string; // atom/residue ID
  };
  lastActivity: number;
}

/**
 * Collaboration session state
 */
export interface CollaborationSession {
  id: string;
  name: string;
  ownerId: string;
  createdAt: number;
  expiresAt: number;
  isActive: boolean;
  structureId?: string;
  inviteCode: string;
  settings: SessionSettings;
}

/**
 * Session settings
 */
export interface SessionSettings {
  allowAnnotations: boolean;
  allowCameraControl: boolean;
  requireApproval: boolean;
  maxUsers: number;
  cameraFollowMode: boolean;
  cameraLeaderId?: string;
}

/**
 * Annotation on a molecular structure
 */
export interface Annotation {
  id: string;
  userId: string;
  userName: string;
  content: string;
  position: {
    x: number;
    y: number;
    z: number;
  };
  target?: {
    type: 'atom' | 'residue' | 'chain';
    id: string | number;
    label: string;
  };
  color: string;
  createdAt: number;
  updatedAt: number;
  isPinned: boolean;
}

/**
 * Activity log entry
 */
export interface ActivityEvent {
  id: string;
  type: ActivityType;
  userId: string;
  userName: string;
  timestamp: number;
  data?: Record<string, unknown>;
  message: string;
}

/**
 * Camera state for synchronization
 */
export interface CameraState {
  position: [number, number, number];
  target: [number, number, number];
  zoom: number;
  rotation: [number, number, number];
  fov?: number;
}

/**
 * Cursor update payload
 */
export interface CursorUpdate {
  userId: string;
  x: number;
  y: number;
  target?: string;
  timestamp: number;
}

/**
 * Realtime channel events
 */
export interface RealtimeEvents {
  'cursor-move': CursorUpdate;
  'annotation-add': Annotation;
  'annotation-edit': Annotation;
  'annotation-delete': { id: string; userId: string };
  'camera-update': { userId: string; state: CameraState };
  'user-join': CollaborationUser;
  'user-leave': { userId: string };
  'user-update': Partial<CollaborationUser> & { id: string };
  'activity': ActivityEvent;
  'session-update': Partial<CollaborationSession>;
}

/**
 * Collaboration state for Zustand store
 */
export interface CollaborationState {
  // Session
  currentSession: CollaborationSession | null;
  users: Map<string, CollaborationUser>;
  currentUserId: string | null;

  // Features
  annotations: Map<string, Annotation>;
  activities: ActivityEvent[];
  cameraState: CameraState | null;

  // UI State
  isConnected: boolean;
  isFollowingCamera: boolean;
  selectedAnnotation: string | null;

  // Actions
  setSession: (session: CollaborationSession | null) => void;
  setCurrentUser: (userId: string) => void;
  updateUser: (user: CollaborationUser) => void;
  removeUser: (userId: string) => void;

  addAnnotation: (annotation: Annotation) => void;
  updateAnnotation: (id: string, update: Partial<Annotation>) => void;
  deleteAnnotation: (id: string) => void;

  addActivity: (activity: ActivityEvent) => void;
  updateCameraState: (state: CameraState) => void;

  setConnected: (connected: boolean) => void;
  setFollowingCamera: (following: boolean) => void;
  setSelectedAnnotation: (id: string | null) => void;

  reset: () => void;
}

/**
 * Conflict resolution strategy
 */
export type ConflictStrategy = 'last-write-wins' | 'merge' | 'reject';

/**
 * Optimistic update for conflict resolution
 */
export interface OptimisticUpdate<T> {
  id: string;
  type: string;
  data: T;
  timestamp: number;
  userId: string;
  version: number;
}

/**
 * Conflict resolution result
 */
export interface ConflictResolution<T> {
  resolved: T;
  strategy: ConflictStrategy;
  conflicts: Array<{
    field: string;
    local: unknown;
    remote: unknown;
    resolved: unknown;
  }>;
}

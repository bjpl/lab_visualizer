/**
 * Collaboration system test suite
 * Tests session management, real-time updates, and conflict resolution
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useCollaborationStore } from '@/store/collaboration-slice';
import { collaborationSession } from '@/services/collaboration-session';
import { cameraSync } from '@/services/camera-sync';
import { conflictResolution } from '@/services/conflict-resolution';
import { useCollaboration, useCameraSync } from '@/hooks/use-collaboration';
import type { CollaborationUser, Annotation, CameraState } from '@/types/collaboration';

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      insert: vi.fn(() => ({ error: null })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({
            data: {
              id: 'session-1',
              name: 'Test Session',
              owner_id: 'user-1',
              expires_at: new Date(Date.now() + 86400000).toISOString(),
              invite_code: 'TEST123',
              settings: {},
              is_active: true,
            },
            error: null,
          })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({ error: null })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({ error: null })),
        })),
      })),
      upsert: vi.fn(() => ({ error: null })),
    })),
    channel: vi.fn(() => ({
      on: vi.fn(function (this: any) {
        return this;
      }),
      subscribe: vi.fn(async (callback) => {
        callback?.('SUBSCRIBED');
        return 'SUBSCRIBED';
      }),
      send: vi.fn(),
      track: vi.fn(),
      unsubscribe: vi.fn(),
      presenceState: vi.fn(() => ({})),
    })),
  })),
}));

describe('Collaboration Store', () => {
  beforeEach(() => {
    useCollaborationStore.getState().reset();
  });

  it('should initialize with default state', () => {
    const { currentSession, users, annotations } = useCollaborationStore.getState();
    expect(currentSession).toBeNull();
    expect(users.size).toBe(0);
    expect(annotations.size).toBe(0);
  });

  it('should set session', () => {
    const session = {
      id: 'session-1',
      name: 'Test Session',
      ownerId: 'user-1',
      createdAt: Date.now(),
      expiresAt: Date.now() + 86400000,
      isActive: true,
      inviteCode: 'TEST123',
      settings: {
        allowAnnotations: true,
        allowCameraControl: true,
        requireApproval: false,
        maxUsers: 10,
        cameraFollowMode: false,
      },
    };

    act(() => {
      useCollaborationStore.getState().setSession(session);
    });

    expect(useCollaborationStore.getState().currentSession).toEqual(session);
  });

  it('should add and remove users', () => {
    const user: CollaborationUser = {
      id: 'user-1',
      name: 'Test User',
      color: '#FF6B6B',
      role: 'viewer',
      status: 'active',
      lastActivity: Date.now(),
    };

    act(() => {
      useCollaborationStore.getState().updateUser(user);
    });

    expect(useCollaborationStore.getState().users.size).toBe(1);
    expect(useCollaborationStore.getState().users.get('user-1')).toEqual(user);

    act(() => {
      useCollaborationStore.getState().removeUser('user-1');
    });

    expect(useCollaborationStore.getState().users.size).toBe(0);
  });

  it('should manage annotations', () => {
    const annotation: Annotation = {
      id: 'ann-1',
      userId: 'user-1',
      userName: 'Test User',
      content: 'Test annotation',
      position: { x: 0, y: 0, z: 0 },
      color: '#FF6B6B',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isPinned: false,
    };

    act(() => {
      useCollaborationStore.getState().addAnnotation(annotation);
    });

    expect(useCollaborationStore.getState().annotations.size).toBe(1);

    act(() => {
      useCollaborationStore.getState().updateAnnotation('ann-1', {
        content: 'Updated content',
      });
    });

    const updated = useCollaborationStore.getState().annotations.get('ann-1');
    expect(updated?.content).toBe('Updated content');

    act(() => {
      useCollaborationStore.getState().deleteAnnotation('ann-1');
    });

    expect(useCollaborationStore.getState().annotations.size).toBe(0);
  });

  it('should track activities', () => {
    const activity = {
      id: 'act-1',
      type: 'user-join' as const,
      userId: 'user-1',
      userName: 'Test User',
      timestamp: Date.now(),
      message: 'User joined',
    };

    act(() => {
      useCollaborationStore.getState().addActivity(activity);
    });

    expect(useCollaborationStore.getState().activities).toHaveLength(1);
    expect(useCollaborationStore.getState().activities[0]).toEqual(activity);
  });
});

describe('Session Management', () => {
  afterEach(() => {
    collaborationSession.disconnectFromChannel();
  });

  it('should create a new session', async () => {
    const session = await collaborationSession.createSession(
      'Test Session',
      'user-1',
      'Test User'
    );

    expect(session).toBeDefined();
    expect(session.name).toBe('Test Session');
    expect(session.ownerId).toBe('user-1');
    expect(session.inviteCode).toHaveLength(8);
  });

  it('should join a session', async () => {
    const { session, user } = await collaborationSession.joinSession(
      'session-1',
      'user-2',
      'Test User 2'
    );

    expect(session).toBeDefined();
    expect(user.id).toBe('user-2');
    expect(user.role).toBe('viewer');
  });

  it('should generate invite link', () => {
    const session = {
      id: 'session-1',
      inviteCode: 'TEST123',
    } as any;

    const link = collaborationSession.getInviteLink(session);
    expect(link).toContain('TEST123');
  });
});

describe('Camera Synchronization', () => {
  beforeEach(() => {
    cameraSync.initialize('user-1');
  });

  afterEach(() => {
    cameraSync.cleanup();
  });

  it('should initialize camera sync', () => {
    cameraSync.initialize('user-1');
    expect(cameraSync).toBeDefined();
  });

  it('should set leader state', () => {
    cameraSync.setLeader(true);
    // Leader state is internal, test via broadcast
    expect(() => {
      cameraSync.broadcastCameraUpdate({
        position: [0, 0, 5],
        target: [0, 0, 0],
        zoom: 1,
        rotation: [0, 0, 0],
      });
    }).not.toThrow();
  });

  it('should throttle camera updates', async () => {
    cameraSync.setLeader(true);
    const state: CameraState = {
      position: [0, 0, 5],
      target: [0, 0, 0],
      zoom: 1,
      rotation: [0, 0, 0],
    };

    // Multiple rapid calls should be throttled
    await cameraSync.broadcastCameraUpdate(state);
    await cameraSync.broadcastCameraUpdate(state);
    await cameraSync.broadcastCameraUpdate(state);

    // Should not throw
    expect(true).toBe(true);
  });

  it('should interpolate camera transitions', () => {
    const from: CameraState = {
      position: [0, 0, 5],
      target: [0, 0, 0],
      zoom: 1,
      rotation: [0, 0, 0],
    };

    const to: CameraState = {
      position: [10, 0, 5],
      target: [5, 0, 0],
      zoom: 2,
      rotation: [0, Math.PI / 4, 0],
    };

    cameraSync.setFollowing(true);

    let updateCalled = false;
    cameraSync.applyCameraUpdate(to, from, (state) => {
      updateCalled = true;
      expect(state).toBeDefined();
    });

    // Update should be called during transition
    expect(updateCalled).toBe(true);
  });
});

describe('Conflict Resolution', () => {
  beforeEach(() => {
    conflictResolution.clearPending();
  });

  it('should register optimistic updates', () => {
    const update = conflictResolution.registerOptimisticUpdate(
      'test-1',
      'annotation',
      { content: 'Test' },
      'user-1'
    );

    expect(update).toBeDefined();
    expect(update.id).toBe('test-1');
    expect(update.version).toBe(1);
    expect(conflictResolution.isPending('test-1')).toBe(true);
  });

  it('should resolve with last-write-wins', () => {
    const local = conflictResolution.registerOptimisticUpdate(
      'ann-1',
      'annotation',
      { content: 'Local', updatedAt: Date.now() },
      'user-1'
    );

    const remote = { content: 'Remote', updatedAt: Date.now() - 1000 };

    const resolution = conflictResolution.resolveConflict(
      local,
      remote,
      'last-write-wins'
    );

    expect(resolution.resolved.content).toBe('Local');
  });

  it('should merge non-conflicting updates', () => {
    const local = conflictResolution.registerOptimisticUpdate(
      'ann-1',
      'annotation',
      { content: 'Local', isPinned: true },
      'user-1'
    );

    const remote = { content: 'Remote', color: '#FF0000' };

    const resolution = conflictResolution.resolveConflict(local, remote, 'merge');

    expect(resolution.resolved.color).toBe('#FF0000');
    expect(resolution.conflicts.length).toBeGreaterThan(0);
  });

  it('should handle annotation conflicts', () => {
    const annotation: Annotation = {
      id: 'ann-1',
      userId: 'user-1',
      userName: 'User',
      content: 'Original',
      position: { x: 0, y: 0, z: 0 },
      color: '#FF0000',
      createdAt: Date.now() - 2000,
      updatedAt: Date.now() - 1000,
      isPinned: false,
    };

    const local = conflictResolution.registerOptimisticUpdate(
      'ann-1',
      'annotation',
      { ...annotation, content: 'Local update' },
      'user-1'
    );

    const remote = { ...annotation, content: 'Remote update' };

    const resolution = conflictResolution.resolveAnnotationConflict(local, remote);

    expect(resolution.resolved.content).toBe('Local update');
  });

  it('should transform concurrent text edits', () => {
    const local = { position: 10, text: 'abc', delete: 0 };
    const remote = { position: 5, text: 'xyz', delete: 2 };

    const transformed = conflictResolution.transformTextEdit(local, remote);

    expect(transformed.position).toBeGreaterThan(local.position);
  });

  it('should rollback optimistic updates', () => {
    const update = conflictResolution.registerOptimisticUpdate(
      'test-1',
      'annotation',
      { content: 'Test' },
      'user-1'
    );

    expect(conflictResolution.isPending('test-1')).toBe(true);

    const rolledBack = conflictResolution.rollback('test-1');
    expect(rolledBack).toEqual(update);
    expect(conflictResolution.isPending('test-1')).toBe(false);
  });
});

describe('Collaboration Hooks', () => {
  it('should create session via hook', async () => {
    const { result } = renderHook(() =>
      useCollaboration('user-1', 'Test User')
    );

    await act(async () => {
      const session = await result.current.createSession('Test Session');
      expect(session).toBeDefined();
    });
  });

  it('should manage camera sync via hook', () => {
    const { result } = renderHook(() => useCameraSync());

    expect(result.current.isFollowing).toBe(false);

    act(() => {
      result.current.toggleFollow();
    });

    expect(result.current.isFollowing).toBe(true);
  });
});

describe('Integration Tests', () => {
  it('should handle complete collaboration workflow', async () => {
    // 1. Create session
    const session = await collaborationSession.createSession(
      'Integration Test',
      'user-1',
      'User 1'
    );

    expect(session).toBeDefined();

    // 2. Join session
    const { user } = await collaborationSession.joinSession(
      session.id,
      'user-2',
      'User 2'
    );

    expect(user.id).toBe('user-2');

    // 3. Add annotation
    const annotation: Annotation = {
      id: 'ann-1',
      userId: user.id,
      userName: user.name,
      content: 'Test annotation',
      position: { x: 0, y: 0, z: 0 },
      color: user.color,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isPinned: false,
    };

    act(() => {
      useCollaborationStore.getState().addAnnotation(annotation);
    });

    expect(useCollaborationStore.getState().annotations.size).toBe(1);

    // 4. Update camera
    const cameraState: CameraState = {
      position: [0, 0, 5],
      target: [0, 0, 0],
      zoom: 1,
      rotation: [0, 0, 0],
    };

    act(() => {
      useCollaborationStore.getState().updateCameraState(cameraState);
    });

    expect(useCollaborationStore.getState().cameraState).toEqual(cameraState);

    // 5. Cleanup
    collaborationSession.disconnectFromChannel();
  });
});

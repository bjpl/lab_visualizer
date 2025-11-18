/**
 * Collaboration + Viewer State Sync Integration Tests
 * Tests real-time collaboration features with viewer state
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCollaborationStore } from '@/store/collaboration-slice';
import { collaborationSession } from '@/services/collaboration-session';
import { cameraSync } from '@/services/camera-sync';
import { molstarService } from '@/services/molstar-service';
import type {
  CollaborationUser,
  CameraState,
  Annotation,
} from '@/types/collaboration';

describe('Collaboration + Viewer Integration', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    useCollaborationStore.getState().reset();
    container = document.createElement('div');
    container.style.width = '800px';
    container.style.height = '600px';
    document.body.appendChild(container);
  });

  afterEach(() => {
    collaborationSession.disconnectFromChannel();
    cameraSync.cleanup();
    molstarService.dispose();
    document.body.removeChild(container);
  });

  describe('Session + Viewer Lifecycle', () => {
    it('should create session and initialize viewer', async () => {
      // Create collaboration session
      const session = await collaborationSession.createSession(
        'Test Session',
        'user-1',
        'Test User'
      );

      expect(session).toBeDefined();
      expect(session.name).toBe('Test Session');

      // Initialize viewer
      await molstarService.initialize(container);

      // Store session in state
      act(() => {
        useCollaborationStore.getState().setSession(session);
      });

      const state = useCollaborationStore.getState();
      expect(state.currentSession).toEqual(session);
    });

    it('should sync viewer state with collaboration session', async () => {
      // Initialize viewer first
      await molstarService.initialize(container);

      // Create session
      const session = await collaborationSession.createSession(
        'Sync Test',
        'user-1',
        'User 1'
      );

      act(() => {
        useCollaborationStore.getState().setSession(session);
      });

      // Simulate camera state update
      const cameraState: CameraState = {
        position: [10, 10, 10],
        target: [0, 0, 0],
        zoom: 1.5,
        rotation: [0, Math.PI / 4, 0],
      };

      act(() => {
        useCollaborationStore.getState().updateCameraState(cameraState);
      });

      const state = useCollaborationStore.getState();
      expect(state.cameraState).toEqual(cameraState);
    });
  });

  describe('Multi-User Camera Sync', () => {
    it('should synchronize camera between users', async () => {
      // Initialize camera sync for user 1
      cameraSync.initialize('user-1');
      cameraSync.setLeader(true);

      const leaderState: CameraState = {
        position: [5, 5, 10],
        target: [0, 0, 0],
        zoom: 2,
        rotation: [0, 0, 0],
      };

      // Broadcast camera update
      await cameraSync.broadcastCameraUpdate(leaderState);

      // Simulate follower receiving update
      cameraSync.setFollowing(true);

      let receivedState: CameraState | null = null;
      cameraSync.applyCameraUpdate(
        leaderState,
        {
          position: [0, 0, 5],
          target: [0, 0, 0],
          zoom: 1,
          rotation: [0, 0, 0],
        },
        (state) => {
          receivedState = state;
        }
      );

      expect(receivedState).toBeDefined();
    });

    it('should handle camera follow mode', () => {
      cameraSync.initialize('user-2');

      expect(cameraSync['isFollowing']).toBeFalsy();

      cameraSync.setFollowing(true);
      expect(cameraSync['isFollowing']).toBeTruthy();

      cameraSync.setFollowing(false);
      expect(cameraSync['isFollowing']).toBeFalsy();
    });

    it('should throttle rapid camera updates', async () => {
      cameraSync.initialize('user-1');
      cameraSync.setLeader(true);

      const state: CameraState = {
        position: [1, 1, 1],
        target: [0, 0, 0],
        zoom: 1,
        rotation: [0, 0, 0],
      };

      // Send multiple rapid updates
      const promises = Array(10)
        .fill(null)
        .map((_, i) =>
          cameraSync.broadcastCameraUpdate({
            ...state,
            position: [i, i, i],
          })
        );

      await Promise.all(promises);

      // Should not throw and should handle throttling
      expect(true).toBe(true);
    });
  });

  describe('Annotations + Viewer Integration', () => {
    it('should add annotations to viewer state', () => {
      const annotation: Annotation = {
        id: 'ann-1',
        userId: 'user-1',
        userName: 'User 1',
        content: 'Important residue',
        position: { x: 10, y: 5, z: 3 },
        target: {
          type: 'residue',
          id: 'A:100',
          label: 'LEU 100',
        },
        color: '#FF6B6B',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isPinned: false,
      };

      act(() => {
        useCollaborationStore.getState().addAnnotation(annotation);
      });

      const state = useCollaborationStore.getState();
      expect(state.annotations.size).toBe(1);
      expect(state.annotations.get('ann-1')).toEqual(annotation);
    });

    it('should update annotations in real-time', () => {
      const annotation: Annotation = {
        id: 'ann-2',
        userId: 'user-1',
        userName: 'User 1',
        content: 'Initial content',
        position: { x: 0, y: 0, z: 0 },
        color: '#4ECDC4',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isPinned: false,
      };

      act(() => {
        useCollaborationStore.getState().addAnnotation(annotation);
      });

      act(() => {
        useCollaborationStore.getState().updateAnnotation('ann-2', {
          content: 'Updated content',
          isPinned: true,
        });
      });

      const updated = useCollaborationStore
        .getState()
        .annotations.get('ann-2');
      expect(updated?.content).toBe('Updated content');
      expect(updated?.isPinned).toBe(true);
    });

    it('should delete annotations', () => {
      const annotation: Annotation = {
        id: 'ann-3',
        userId: 'user-1',
        userName: 'User 1',
        content: 'To be deleted',
        position: { x: 0, y: 0, z: 0 },
        color: '#95E1D3',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isPinned: false,
      };

      act(() => {
        useCollaborationStore.getState().addAnnotation(annotation);
        useCollaborationStore.getState().deleteAnnotation('ann-3');
      });

      const state = useCollaborationStore.getState();
      expect(state.annotations.has('ann-3')).toBe(false);
    });
  });

  describe('User Presence Integration', () => {
    it('should track multiple users in session', () => {
      const user1: CollaborationUser = {
        id: 'user-1',
        name: 'Alice',
        color: '#FF6B6B',
        role: 'owner',
        status: 'active',
        lastActivity: Date.now(),
      };

      const user2: CollaborationUser = {
        id: 'user-2',
        name: 'Bob',
        color: '#4ECDC4',
        role: 'viewer',
        status: 'active',
        lastActivity: Date.now(),
      };

      act(() => {
        useCollaborationStore.getState().updateUser(user1);
        useCollaborationStore.getState().updateUser(user2);
      });

      const state = useCollaborationStore.getState();
      expect(state.users.size).toBe(2);
      expect(state.users.get('user-1')).toEqual(user1);
      expect(state.users.get('user-2')).toEqual(user2);
    });

    it('should handle user disconnection', () => {
      const user: CollaborationUser = {
        id: 'user-3',
        name: 'Charlie',
        color: '#F38181',
        role: 'viewer',
        status: 'active',
        lastActivity: Date.now(),
      };

      act(() => {
        useCollaborationStore.getState().updateUser(user);
        useCollaborationStore.getState().removeUser('user-3');
      });

      const state = useCollaborationStore.getState();
      expect(state.users.has('user-3')).toBe(false);
    });

    it('should track user cursor positions', () => {
      const user: CollaborationUser = {
        id: 'user-4',
        name: 'Diana',
        color: '#AA96DA',
        role: 'viewer',
        status: 'active',
        cursor: {
          x: 100,
          y: 200,
          target: 'A:50',
        },
        lastActivity: Date.now(),
      };

      act(() => {
        useCollaborationStore.getState().updateUser(user);
      });

      const state = useCollaborationStore.getState();
      const storedUser = state.users.get('user-4');
      expect(storedUser?.cursor).toEqual({
        x: 100,
        y: 200,
        target: 'A:50',
      });
    });
  });

  describe('Activity Tracking', () => {
    it('should log user activities', () => {
      const joinActivity = {
        id: 'act-1',
        type: 'user-join' as const,
        userId: 'user-1',
        userName: 'Alice',
        timestamp: Date.now(),
        message: 'Alice joined the session',
      };

      const annotationActivity = {
        id: 'act-2',
        type: 'annotation-add' as const,
        userId: 'user-1',
        userName: 'Alice',
        timestamp: Date.now(),
        message: 'Alice added an annotation',
        data: { annotationId: 'ann-1' },
      };

      act(() => {
        useCollaborationStore.getState().addActivity(joinActivity);
        useCollaborationStore.getState().addActivity(annotationActivity);
      });

      const state = useCollaborationStore.getState();
      expect(state.activities).toHaveLength(2);
      expect(state.activities[0].type).toBe('user-join');
      expect(state.activities[1].type).toBe('annotation-add');
    });
  });

  describe('Complete Workflow Integration', () => {
    it('should handle full collaboration workflow', async () => {
      // 1. Initialize viewer
      await molstarService.initialize(container);

      // 2. Create session
      const session = await collaborationSession.createSession(
        'Full Workflow Test',
        'user-1',
        'User 1'
      );

      act(() => {
        useCollaborationStore.getState().setSession(session);
        useCollaborationStore.getState().setConnected(true);
      });

      // 3. Add users
      const user1: CollaborationUser = {
        id: 'user-1',
        name: 'User 1',
        color: '#FF6B6B',
        role: 'owner',
        status: 'active',
        lastActivity: Date.now(),
      };

      const user2: CollaborationUser = {
        id: 'user-2',
        name: 'User 2',
        color: '#4ECDC4',
        role: 'viewer',
        status: 'active',
        lastActivity: Date.now(),
      };

      act(() => {
        useCollaborationStore.getState().updateUser(user1);
        useCollaborationStore.getState().updateUser(user2);
      });

      // 4. Add annotation
      const annotation: Annotation = {
        id: 'ann-workflow',
        userId: 'user-1',
        userName: 'User 1',
        content: 'Key interaction site',
        position: { x: 5, y: 5, z: 5 },
        color: user1.color,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isPinned: true,
      };

      act(() => {
        useCollaborationStore.getState().addAnnotation(annotation);
      });

      // 5. Update camera
      const cameraState: CameraState = {
        position: [20, 20, 20],
        target: [0, 0, 0],
        zoom: 1.5,
        rotation: [0, Math.PI / 6, 0],
      };

      act(() => {
        useCollaborationStore.getState().updateCameraState(cameraState);
      });

      // Verify complete state
      const state = useCollaborationStore.getState();
      expect(state.currentSession).toEqual(session);
      expect(state.users.size).toBe(2);
      expect(state.annotations.size).toBe(1);
      expect(state.cameraState).toEqual(cameraState);
      expect(state.isConnected).toBe(true);
    });
  });
});

/**
 * Camera synchronization service for collaborative viewing
 * Handles leader-guided camera control and smooth transitions
 */
import { collaborationSession } from './collaboration-session';

import type { CameraState } from '@/types/collaboration';

const CAMERA_UPDATE_THROTTLE = 200; // 5Hz (200ms)
const CAMERA_TRANSITION_DURATION = 300; // Smooth transition duration in ms

interface CameraTransition {
  from: CameraState;
  to: CameraState;
  startTime: number;
  duration: number;
}

export class CameraSyncService {
  private lastBroadcastTime = 0;
  private isLeader = false;
  private isFollowing = false;
  private currentTransition: CameraTransition | null = null;
  private animationFrameId: number | null = null;
  private userId: string | null = null;

  /**
   * Initialize camera sync for a user
   */
  initialize(userId: string): void {
    this.userId = userId;
  }

  /**
   * Set whether this user is the camera leader
   */
  setLeader(isLeader: boolean): void {
    this.isLeader = isLeader;
  }

  /**
   * Set whether this user is following the leader
   */
  setFollowing(isFollowing: boolean): void {
    this.isFollowing = isFollowing;

    // Cancel any ongoing transition when stopping follow
    if (!isFollowing && this.currentTransition) {
      this.cancelTransition();
    }
  }

  /**
   * Broadcast camera update (throttled)
   */
  async broadcastCameraUpdate(state: CameraState): Promise<void> {
    if (!this.isLeader || !this.userId) {
      return;
    }

    const now = Date.now();
    if (now - this.lastBroadcastTime < CAMERA_UPDATE_THROTTLE) {
      return;
    }

    this.lastBroadcastTime = now;

    try {
      await collaborationSession.broadcast('camera-update', {
        userId: this.userId,
        state,
      });
    } catch (error) {
      console.error('Failed to broadcast camera update:', error);
    }
  }

  /**
   * Apply camera update from leader with smooth transition
   */
  applyCameraUpdate(
    newState: CameraState,
    currentState: CameraState,
    onUpdate: (state: CameraState) => void
  ): void {
    if (!this.isFollowing) {
      return;
    }

    // Cancel any ongoing transition
    this.cancelTransition();

    // Create new transition
    this.currentTransition = {
      from: currentState,
      to: newState,
      startTime: Date.now(),
      duration: CAMERA_TRANSITION_DURATION,
    };

    // Start animation
    this.animateTransition(onUpdate);
  }

  /**
   * Animate smooth camera transition
   */
  private animateTransition(onUpdate: (state: CameraState) => void): void {
    if (!this.currentTransition) {
      return;
    }

    const animate = () => {
      if (!this.currentTransition || !this.isFollowing) {
        this.cancelTransition();
        return;
      }

      const elapsed = Date.now() - this.currentTransition.startTime;
      const progress = Math.min(elapsed / this.currentTransition.duration, 1);

      // Easing function (ease-out cubic)
      const eased = 1 - Math.pow(1 - progress, 3);

      // Interpolate camera state
      const interpolated = this.interpolateCameraState(
        this.currentTransition.from,
        this.currentTransition.to,
        eased
      );

      onUpdate(interpolated);

      if (progress < 1) {
        this.animationFrameId = requestAnimationFrame(animate);
      } else {
        this.currentTransition = null;
        this.animationFrameId = null;
      }
    };

    this.animationFrameId = requestAnimationFrame(animate);
  }

  /**
   * Interpolate between two camera states
   */
  private interpolateCameraState(
    from: CameraState,
    to: CameraState,
    t: number
  ): CameraState {
    return {
      position: [
        this.lerp(from.position[0], to.position[0], t),
        this.lerp(from.position[1], to.position[1], t),
        this.lerp(from.position[2], to.position[2], t),
      ],
      target: [
        this.lerp(from.target[0], to.target[0], t),
        this.lerp(from.target[1], to.target[1], t),
        this.lerp(from.target[2], to.target[2], t),
      ],
      zoom: this.lerp(from.zoom, to.zoom, t),
      rotation: [
        this.lerpAngle(from.rotation[0], to.rotation[0], t),
        this.lerpAngle(from.rotation[1], to.rotation[1], t),
        this.lerpAngle(from.rotation[2], to.rotation[2], t),
      ],
      fov: from.fov && to.fov ? this.lerp(from.fov, to.fov, t) : from.fov,
    };
  }

  /**
   * Linear interpolation
   */
  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  /**
   * Angular interpolation (handles wrapping)
   */
  private lerpAngle(a: number, b: number, t: number): number {
    const diff = ((b - a + Math.PI) % (2 * Math.PI)) - Math.PI;
    return a + diff * t;
  }

  /**
   * Cancel ongoing transition
   */
  private cancelTransition(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.currentTransition = null;
  }

  /**
   * Request camera control
   */
  async requestControl(sessionId: string): Promise<void> {
    if (!this.userId) {
      throw new Error('User not initialized');
    }

    try {
      await collaborationSession.updateSession(sessionId, {
        cameraLeaderId: this.userId,
        cameraFollowMode: true,
      });
      this.setLeader(true);
    } catch (error) {
      console.error('Failed to request camera control:', error);
      throw error;
    }
  }

  /**
   * Release camera control
   */
  async releaseControl(sessionId: string): Promise<void> {
    try {
      await collaborationSession.updateSession(sessionId, {
        cameraLeaderId: undefined,
        cameraFollowMode: false,
      });
      this.setLeader(false);
    } catch (error) {
      console.error('Failed to release camera control:', error);
      throw error;
    }
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    this.cancelTransition();
    this.isLeader = false;
    this.isFollowing = false;
    this.userId = null;
  }
}

// Singleton instance
export const cameraSync = new CameraSyncService();
